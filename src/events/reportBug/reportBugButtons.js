const { reportBugBLModel, reportsModel } = require("../../database/models/index.js");
const { selectorTextBuilder, modalBuilder, buttonBuilder } = require("../../utils/builders.js");
const { hiddenFlag, embed_builder, disableAllComponents, redHex, greenHex, RedAscii, ResetAscii } = require("../../utils/utils.js");

module.exports = {
    name:"interactionCreate",
    /** @param {import('discord.js').ButtonInteraction} interaction */
    async execute(interaction){
        
        if (interaction.isChatInputCommand()) return;
        if(!interaction.isButton()) return;

        if(!interaction.memberPermissions?.has("Administrator")) return;

        const customId = interaction.customId;
        const originalMsgId = interaction.message.id
        let fetchedOriginalMsg;

        const prefixes = ['reportBugFixed', 'reportBugMesssage','reportBugBL', "reportBugDismiss"]
        const customIdPrefix = customId.split(":")[0]
        const customIdCaseNum = customId.split(":")[1]
        
        if(!prefixes.includes(customIdPrefix)){
            return;
        } else {
            fetchedOriginalMsg = interaction.message
        }
        
        async function archiveReport(text, embedColor=null){
            let embeds = fetchedOriginalMsg.embeds;    
            if(embedColor){
                    embeds = fetchedOriginalMsg.embeds.map(el =>{
                        el.data.color = parseInt(embedColor, 16)
                        return el;
                    })
            }
            await fetchedOriginalMsg.channel.setParent(process.env.BUG_REPORT_ARCHIVE_CATEGORY_ID)
            const updatedRows = disableAllComponents(fetchedOriginalMsg)
            fetchedOriginalMsg.edit({ content:text, embeds, components:updatedRows })
            interaction.channel.send(`**Channel Successfully Archived in \`${interaction.channel.parent.name}\`.**`)
        }

        if(customIdPrefix == 'reportBugFixed'){
            const messageModal = new modalBuilder(interaction, 'fixModal', "Fix Message")
            const bugFixInput = messageModal.createTextInput("bugFixInput", "Input the message to the user", "Paragraph", "Message goes here!", true, null, [5,2000]);
            messageModal.addComponents(bugFixInput)
            messageModal.showModal(null, async (allFields, modalInteraction)=>{
                if(!interaction.memberPermissions?.has("Administrator")) return;

                const textGiven = allFields.bugFixInput
                const reportDoc = await reportsModel.findOneAndUpdate({ caseNum: customIdCaseNum },
                    { fixed: true }
                )
                if(!reportDoc) return console.error(RedAscii+`The report of caseNum ${customIdCaseNum} is not found. STUPID`+ResetAscii)

                fetchedOriginalMsg.components[0].components.forEach(el=>{
                    el.data.disabled = true
                })

                const embeds = fetchedOriginalMsg.embeds.map(el =>{
                    el.data.color = parseInt("97ff94", 16)
                    return el;
                })

                const userId = reportDoc.userId
                try {
                    const userDM = await interaction.client.users.fetch(userId)
                    
                    const fixEmbed = embed_builder(`Results of Bug Report Case: ${customIdCaseNum}`, `**Bug Fixed!**\n\n**Message from us:**\n${textGiven}`,greenHex)
                    
                    await userDM.send({ embeds:[fixEmbed] })

                    const inChannelMessageEmbed = embed_builder("Message sent:", textGiven)
                    interaction.channel.send({content:`Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                    modalInteraction.reply({content: `Successfully sent message to \`${userDM.username}\``, flags:[hiddenFlag]})
                } catch(err){
                    console.error(`Couldn't send DM in reportBugButtons.js, err: `, err)
                    modalInteraction.reply({content: `Couldn't send message to user of id: \`${userId}\``})
                }
                archiveReport(`Issue fixed by <@!${interaction.user.id}>`, "97ff94")
            })
        }

        if(customIdPrefix == 'reportBugMesssage'){

            const messageModal = new modalBuilder(interaction, 'replyMessageModal', "Fix Message")
            const replyBugMessageInput = messageModal.createTextInput("replyBugMessageInput", "Input the message to the user", "Paragraph", "Message goes here!", true, null, [5,2000]);
            messageModal.addComponents(replyBugMessageInput)

            messageModal.showModal(null, async (allFields, modalInteraction) => {
                if(!interaction.memberPermissions?.has("Administrator")) return;

                const textGiven = allFields.replyBugMessageInput
                
                const reportDoc = await reportsModel.findOne({caseNum: customIdCaseNum})
                if(!reportDoc) return console.error(RedAscii+`The report of caseNum ${customIdCaseNum} is not found. STUPID`+ResetAscii)
                
                const userId = reportDoc.userId
                try {
                    const userDM = await interaction.client.users.fetch(userId)

                    const messageEmbed = embed_builder(`Follow up on Report Case: ${customIdCaseNum}`,`**Message from us:**\n${textGiven}`)

                    const replyButton = new buttonBuilder(modalInteraction)
                      .addButton(`replyBug:${customIdCaseNum}:${fetchedOriginalMsg.channelId}:${fetchedOriginalMsg.id}`,"Reply to us", "Secondary", null, "🗣️")
                    const components = [replyButton.getRow()]

                    const inChannelMessageEmbed = embed_builder("Message sent:", textGiven)
                    interaction.channel.send({content:`Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                    await userDM.send({ embeds:[messageEmbed], components})
                    return modalInteraction.reply({content: `Successfully sent message to \`${userDM.username}\``, flags:[hiddenFlag]})
                } catch(err){
                    console.error(`Couldn't send DM in reportBugButtons.js, err: `, err)
                    return modalInteraction.reply({content: `Couldn't send message to user of id: \`${userId}\``})
                }
            })
        }

        if(customIdPrefix == 'reportBugBL'){
            const messageModal = new modalBuilder(interaction, 'reportBugBlacklist', "Blacklist Reason")
            const reportBugBlacklistInput = messageModal.createTextInput("reportBugBlacklistInput", "Input reason/message to the blacklisted user.", "Paragraph", "Message goes here!", true, null, [5,2000]);
            messageModal.addComponents(reportBugBlacklistInput)

            messageModal.showModal(null, async (allFields, modalInteraction) => {
                if(!interaction.memberPermissions?.has("Administrator")) return;
                
                const textGiven = allFields.reportBugBlacklistInput
                
                const reportDoc = await reportsModel.findOne({caseNum: customIdCaseNum})
                if(!reportDoc) return console.error(RedAscii+`The report of caseNum ${customIdCaseNum} is not found. STUPID`+ResetAscii)
                
                const userId = reportDoc.userId

                const blacklistedDoc = await reportBugBLModel.findOne({ userId, })?.sort({ _id: -1 })
                const blacklistCaseNum = blacklistedDoc?.caseNum;
                if(!blacklistedDoc){
                    await reportBugBLModel.create({ userId, caseNum: 1, blacklistedBy: interaction.user.id,reason: textGiven})
                    
                    try {
                        const userDM = await interaction.client.users.fetch(userId)
                    
                    const blacklistEmbed = embed_builder('Bug Report Flagged', `Your bug report of case **${customIdCaseNum}** got flagged.\n**Reason:** ${textGiven}\n\nIf you create a troll/inappropriate bug report again you will be blacklisted from using \`/report bug\` command.`, redHex)
                    
                    await userDM.send({ embeds: [blacklistEmbed]})
                    const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                    interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                    modalInteraction.reply({content: `Successfully sent message to \`${userDM.username}\`\nUser was added to the report blacklist database on strike 1.`})
                    } catch(err){
                        console.error(`Couldn't send DM in reportBugButtons.js, err: `, err)
                        modalInteraction.reply({content: `Couldn't send message to user of id: \`${userId}\`\nUser was added to the report blacklist database on strike 1.`})
                    }
                    return archiveReport(`Closed by <@!${interaction.user.id}>`, redHex.slice(1))
                }
                
                if(blacklistCaseNum == 1){
                    const expiryDate = Date.now() + 6*30*24*60*60*1000
                    const expiryDateDiscordTS = Math.floor(expiryDate / 1000)
                    const newBlacklistDoc = await reportBugBLModel.create({
                        userId, 
                        caseNum: blacklistCaseNum+1, 
                        blacklistedBy: interaction.user.id,
                        reason: textGiven,
                        expiryDate,
                        timestamp: Date.now()
                    });
                    try {
                        const userDM = await interaction.client.users.fetch(userId)
                    
                        const blacklistEmbed = embed_builder('Bug Report Flagged', `Your bug report of case **${customIdCaseNum}** got flagged.\n**Reason:** ${textGiven}\n\nSince this is your second infraction, you are blacklisted from running \`/report bug\` for the next 6 months.\nExpiry Date: <t:${expiryDateDiscordTS}>`, redHex)
                        
                        await userDM.send({ embeds: [blacklistEmbed]})
                        const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                        interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                        modalInteraction.reply({content: `Successfully sent message to \`${userDM.username}\`\nUser was blacklisted from using \`/report bug\` for 6 months. (expires on <t:${expiryDateDiscordTS}>)`})
                    } catch(err){
                        console.error(`Couldn't send DM in reportBugButtons.js, err: `, err)
                        modalInteraction.reply({content: `Couldn't send message to user of id: \`${userId}\`\nUser was blacklisted from using \`/report bug\` for 6 months. (expires on <t:${expiryDateDiscordTS}>)`})
                    };
                    return archiveReport(`Closed by <@!${interaction.user.id}>`, redHex.slice(1))
                }

                if(blacklistCaseNum == 2){
                    const expiryDate = new Date("2099")
                    
                    const newBlacklistDoc = await reportBugBLModel.create({
                        userId, 
                        caseNum: blacklistCaseNum+1, 
                        blacklistedBy: interaction.user.id,
                        reason: textGiven,
                        expiryDate,
                        timestamp: Date.now()
                    });
                    try {
                        const userDM = await interaction.client.users.fetch(userId)

                        const blacklistEmbed = embed_builder('Bug Report Flagged', `Your bug report of case **${customIdCaseNum}** got flagged.\n**Reason:** ${textGiven}\n\nSince this is your third infraction, you are blacklisted from running **\`/report bug\` permanently**.\nYou may use other features or bot commands.`, redHex)

                        await userDM.send({ embeds: [blacklistEmbed] })
                        const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                        interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                        modalInteraction.reply({ content: `Successfully sent message to \`${userDM.username}\`\nUser was blacklisted from using **\`/report bug\` permanently**.`, flags:[hiddenFlag]})
                    } catch (err) {
                        console.error(`Couldn't send DM in reportBugButtons.js, err: `, err)
                        modalInteraction.reply({ content: `Couldn't send message to user of id: \`${userId}\`\nUser was blacklisted from using **\`/report bug\` permanently**.` })
                    };
                    return archiveReport(`Closed by <@!${interaction.user.id}>`, redHex.slice(1))
                }
                
            })
        }

        if(customIdPrefix == "reportBugDismiss"){
            
            const dismissEmbed = embed_builder(`Dismiss Report Case: ${customIdCaseNum}`, "Would you like to dismiss the report with or without notifying the user who reported?");

            const dismissEmbedButtons = new buttonBuilder(interaction)
                .addButton("bugReport_dismissWithMessage", "Message & Dismiss", "Primary")
                .addButton("bugReport_dismissOnly", "Dismiss Only", "Secondary")

            const dismissRows = [dismissEmbedButtons.getRow()]

            const dismissEmbedResponse = await interaction.reply({ embeds:[dismissEmbed], components:dismissRows, flags:[hiddenFlag], withResponse: true})
            const dismissEmbedMessage = dismissEmbedResponse.resource.message

            dismissEmbedButtons.startListener(dismissEmbedMessage, null,
                /** @param {import('discord.js').ButtonInteraction} buttonInt */
                async (buttonInt) => {
                    const reportDoc = await reportsModel.findOneAndUpdate({ caseNum: customIdCaseNum }, { fixed: true })

                    if (buttonInt.customId == "bugReport_dismissWithMessage") {
                        const messageModal = new modalBuilder(buttonInt, 'replyMessageModal', "Fix Message")
                        const dismissBugMessage = messageModal.createTextInput("dismissBugMessage", "Input dismiss message to user", "Paragraph", "Message goes here!", true, null, [5, 2000]);
                        messageModal.addComponents(dismissBugMessage)

                        if (!reportDoc) { console.error(RedAscii + `The report of caseNum ${customIdCaseNum} is not found. STUPID` + ResetAscii) }

                        messageModal.showModal(null, async (allFields, modalInteraction) => {
                            if(!interaction.memberPermissions?.has("Administrator")) return;

                            const textGiven = allFields.dismissBugMessage
                            if (!reportDoc) return;
                            const userId = reportDoc.userId;
                            try {
                                const userDM = await interaction.client.users.fetch(userId)

                                const dismissEmbedToUser = embed_builder('Bug Report Dismissed', `Your bug report of case **${customIdCaseNum}** has been dismissed.\n**Reason:** ${textGiven}.`, greenHex).setFooter({ text: 'Thank you for your report regardless!' })
                                const inChannelMessageEmbed = embed_builder("Message sent:", textGiven)
                                buttonInt.channel.send({content:`Message sent by **<@!${buttonInt.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                                await userDM.send({ embeds: [dismissEmbedToUser] })
                                modalInteraction.reply({ content: `Successfully sent message to \`${userDM.username}\``, flags:[hiddenFlag] })
                            } catch (err) {
                                console.error(`Couldn't send DM in reportBugButtons.js, err: `, err)
                                modalInteraction.reply({ content: `Couldn't send message to user of id: \`${userId}\`` })
                            };
                            interaction.deleteReply();
                            archiveReport(`Dismissed by <@!${interaction.user.id}>`);
                        })
                    } else {
                        buttonInt.deferUpdate();
                        interaction.deleteReply();
                        archiveReport(`Dismissed by <@!${interaction.user.id}>`);
                    }
                })

        }
    },
};