const { reportUserModel, reportCardBLModel, reportCardModel, reportUserBLModel } = require("../../database/models/index.js");
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

        // .addButton(`reportUserStrikeAbuser:${caseNum}`, 'Strike Abuser',"Danger", null, "✅")
        // .addButton(`reportUserMessageReporter:${caseNum}`, 'Message Reporter', "Secondary", null, "🗣️")
        // .addButton(`reportUserStrikeReporter:${caseNum}`, 'Strike/BL Reporter', "Danger", null, "⚠️")
        // .addButton(`reportUserDismiss:${caseNum}`, `Dismiss`, `Secondary`, null, '❌');
        const prefixes = ['reportUserStrikeAbuser', 'reportUserMessageReporter','reportUserStrikeReporter', "reportUserDismiss"]
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
            await fetchedOriginalMsg.channel.setParent(process.env.USER_REPORT_ARCHIVE_CATEGORY_ID)
            const updatedRows = disableAllComponents(fetchedOriginalMsg)
            fetchedOriginalMsg.edit({ content:text, embeds, components:updatedRows })
            interaction.channel.send(`**Channel Successfully Archived in \`${interaction.channel.parent.name}\`.**`)
        }

        if(customIdPrefix == 'reportUserStrikeAbuser'){
            const messageModal = new modalBuilder(interaction, 'strikeAbuserModal', "Fix Message")
            const strikeAbuserInput = messageModal.createTextInput("strikeAbuserInput", "Input the message to the user", "Paragraph", "Message goes here!", true, null, [5,2000]);
            messageModal.addComponents(strikeAbuserInput)
            messageModal.showModal(null, async (allFields, modalInteraction)=>{
                if(!interaction.memberPermissions?.has("Administrator")) return;

                const textGiven = allFields.strikeAbuserInput

                const reportDoc = await reportUserModel.findOne({ caseNum: customIdCaseNum })
                if(!reportDoc) return console.error(RedAscii+`The User Report of caseNum ${customIdCaseNum} is not found. STUPID`+ResetAscii);
                
                const abuserId = reportDoc.abuserId;
                const abuserReportCard = await reportCardModel.findOne({ userId: abuserId })
                if(!abuserReportCard){
                    modalInteraction.reply({ content: `Couldn't find report card of userId: ${abuserId}`})
                    return;
                }
                reportDoc.checked = true;
                await abuserReportCard.deleteOne();
                await reportDoc.save();

                fetchedOriginalMsg.components[0].components.forEach(el=>{
                    el.data.disabled = true
                })

                const embeds = fetchedOriginalMsg.embeds.map(el =>{
                    el.data.color = parseInt("97ff94", 16)
                    return el;
                })

                try {
                    const userDM = await interaction.client.users.fetch(abuserId)
                    
                    const fixEmbed = embed_builder(`Results of User Report Case: ${customIdCaseNum}`, `**The user has been striked, and their profile has been reset.**`,greenHex)
                      .setFooter({ text: "Thank you greatly for your report and attempting to keep the community safe!" })
                    await userDM.send({ embeds:[fixEmbed] })
                    
                    modalInteraction.reply({content: `Successfully sent message to reporter \`${userDM.username}\``, flags:[hiddenFlag]})
                } catch(err){
                    console.error(`Couldn't send DM in ${__filename}, err: `, err)
                    modalInteraction.reply({content: `Couldn't send message to reporter of id: \`${abuserId}\``})
                }

                const blacklistedDoc = await reportCardBLModel.findOne({ userId: abuserId })?.sort({ _id: -1 })
                const blacklistCaseNum = blacklistedDoc?.caseNum;
                if(!blacklistedDoc){
                    await reportCardBLModel.create({ userId: abuserId, caseNum: 1, blacklistedBy: interaction.user.id,reason: textGiven})
                    
                    try {
                        const userDM = await interaction.client.users.fetch(abuserId)
                    
                    const blacklistEmbed = embed_builder('Report Card Flagged', `Your \`/report card\` profile has been flagged and removed.\n**Reason:** ${textGiven}\n\nIf you input offensive/inappropriate content again in your report card profile, you will be blacklisted from using \`/report card\` command.`, redHex)
                    
                    await userDM.send({ embeds: [blacklistEmbed]})
                    const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                    interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                    modalInteraction.followUp({content: `Successfully sent message to \`${userDM.username}\`\nUser was added to the reportCard blacklist database on strike 1.`})
                    } catch(err){
                        console.error(`Couldn't send DM in ${__filename}, err: `, err)
                        modalInteraction.followUp({content: `Couldn't send message to user of id: \`${abuserId}\`\nUser was added to the reportCard blacklist database on strike 1.`})
                    }
                }
                
                if(blacklistCaseNum == 1){
                    const expiryDate = Date.now() + 6*30*24*60*60*1000
                    const expiryDateDiscordTS = Math.floor(expiryDate / 1000)
                    const newBlacklistDoc = await reportCardBLModel.create({
                        userId: abuserId, 
                        caseNum: blacklistCaseNum+1, 
                        blacklistedBy: interaction.user.id,
                        reason: textGiven,
                        expiryDate,
                        timestamp: Date.now()
                    });
                    try {
                        const userDM = await interaction.client.users.fetch(abuserId)
                    
                        const blacklistEmbed = embed_builder('Report Card Flagged', `Your \`/report card\` profile has been flagged and removed.\n**Reason:** ${textGiven}\n\nSince this is your second infraction, you are blacklisted from running \`/report card\` for the next 6 months.\nExpiry Date: <t:${expiryDateDiscordTS}>`, redHex)
                        
                        await userDM.send({ embeds: [blacklistEmbed]})
                        const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                        interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                        modalInteraction.followUp({content: `Successfully sent message to \`${userDM.username}\`\nUser was blacklisted from using \`/report card\` for 6 months. (expires on <t:${expiryDateDiscordTS}>)`})
                    } catch(err){
                        console.error(`Couldn't send DM in ${__filename}, err: `, err)
                        modalInteraction.followUp({content: `Couldn't send message to user of id: \`${abuserId}\`\nUser was blacklisted from using \`/report card\` for 6 months. (expires on <t:${expiryDateDiscordTS}>)`})
                    };
                }

                if(blacklistCaseNum == 2){
                    const expiryDate = new Date("2099")
                    
                    const newBlacklistDoc = await reportCardBLModel.create({
                        userId: abuserId, 
                        caseNum: blacklistCaseNum+1, 
                        blacklistedBy: interaction.user.id,
                        reason: textGiven,
                        expiryDate,
                        timestamp: Date.now()
                    });
                    try {
                        const userDM = await interaction.client.users.fetch(abuserId)

                        const blacklistEmbed = embed_builder('Report Card Flagged', `Your \`/report card\` profile has been flagged and removed.\n**Reason:** ${textGiven}\n\nSince this is your third infraction, you are blacklisted from running **\`/report card\` permanently**.\nYou may use other features or bot commands.`, redHex)

                        await userDM.send({ embeds: [blacklistEmbed] })
                        const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                        interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                        modalInteraction.followUp({ content: `Successfully sent message to \`${userDM.username}\`\nUser was blacklisted from using **\`/report card\` permanently**.`, flags:[hiddenFlag]})
                    } catch (err) {
                        console.error(`Couldn't send DM in ${__filename}, err: `, err)
                        modalInteraction.followUp({ content: `Couldn't send message to user of id: \`${abuserId}\`\nUser was blacklisted from using **\`/report card\` permanently**.` })
                    };
                }

                archiveReport(`Report closed by <@!${interaction.user.id}>`, "97ff94")
            })
        }

        if(customIdPrefix == 'reportUserMessageReporter'){

            const messageModal = new modalBuilder(interaction, 'replyReportUserMessageModal', "Fix Message")
            const replyReportUserMesageInput = messageModal.createTextInput("replyReportUserMesageInput", "Input the message to the user", "Paragraph", "Message goes here!", true, null, [5,2000]);
            messageModal.addComponents(replyReportUserMesageInput)

            messageModal.showModal(null, async (allFields, modalInteraction) => {
                if(!interaction.memberPermissions?.has("Administrator")) return;

                const textGiven = allFields.replyReportUserMesageInput
                
                const reportDoc = await reportUserModel.findOne({caseNum: customIdCaseNum})
                if(!reportDoc) return console.error(RedAscii+`The User Report of caseNum ${customIdCaseNum} is not found. STUPID`+ResetAscii)
                
                const userId = reportDoc.reporterId
                try {
                    const userDM = await interaction.client.users.fetch(userId)

                    const messageEmbed = embed_builder(`Follow up on User Report Case: ${customIdCaseNum}`,`**Message from us:**\n${textGiven}`)

                    const replyButton = new buttonBuilder(modalInteraction)
                      .addButton(`replyReportUser:${customIdCaseNum}:${fetchedOriginalMsg.channelId}:${fetchedOriginalMsg.id}`,"Reply to us", "Secondary", null, "🗣️")
                    const components = [replyButton.getRow()]

                    const inChannelMessageEmbed = embed_builder("Message sent:", textGiven)
                    interaction.channel.send({content:`Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                    await userDM.send({ embeds:[messageEmbed], components})
                    return modalInteraction.reply({content: `Successfully sent message to \`${userDM.username}\``, flags:[hiddenFlag]})
                } catch(err){
                    console.error(`Couldn't send DM in ${__filename}, err: `, err)
                    return modalInteraction.reply({content: `Couldn't send message to user of id: \`${userId}\``})
                }
            })
        }

        if(customIdPrefix == 'reportUserStrikeReporter'){
            const messageModal = new modalBuilder(interaction, 'reportUserBlacklistModal', "Blacklist Reason")
            const reportUserBlacklistInput = messageModal.createTextInput("reportUserBlacklistInput", "Input reason/message to the blacklisted user.", "Paragraph", "Message goes here!", true, null, [5,2000]);
            messageModal.addComponents(reportUserBlacklistInput)

            messageModal.showModal(null, async (allFields, modalInteraction) => {
                if(!interaction.memberPermissions?.has("Administrator")) return;
                
                const textGiven = allFields.reportUserBlacklistInput;
                
                const reportDoc = await reportUserModel.findOne({caseNum: customIdCaseNum})
                if(!reportDoc) return console.error(RedAscii+`The User Report of caseNum ${customIdCaseNum} is not found. STUPID`+ResetAscii)
                
                const userId = reportDoc.reporterId;

                const blacklistedDoc = await reportUserBLModel.findOne({ userId, })?.sort({ _id: -1 })
                if(!blacklistedDoc){
                    await reportUserBLModel.create({ userId, caseNum: 1, blacklistedBy: interaction.user.id,reason: textGiven})
                    
                    try {
                        const userDM = await interaction.client.users.fetch(userId)
                    
                    const blacklistEmbed = embed_builder(`Report User Flagged, Case: ${customIdCaseNum}`, `Your User Report of case **${customIdCaseNum}** has been flagged.\n**Reason:** ${textGiven}\n\nIf you create a troll/inappropriate user report again you will be blacklisted from using \`/report user\` command.`, redHex)
                    
                    await userDM.send({ embeds: [blacklistEmbed]})
                    const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                    interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                    modalInteraction.reply({content: `Successfully sent message to \`${userDM.username}\`\nUser was added to the report user blacklist database on strike 1.`})
                    } catch(err){
                        console.error(`Couldn't send DM in ${__filename}, err: `, err)
                        modalInteraction.reply({content: `Couldn't send message to user of id: \`${userId}\`\nUser was added to the report user blacklist database on strike 1.`})
                    }
                    return archiveReport(`Closed by <@!${interaction.user.id}>`, redHex.slice(1))
                }
                const blacklistCaseNum = blacklistedDoc?.caseNum;
                
                if(blacklistCaseNum == 1){
                    const expiryDate = Date.now() + 6*30*24*60*60*1000
                    const expiryDateDiscordTS = Math.floor(expiryDate / 1000)
                    const newBlacklistDoc = await reportUserBLModel.create({
                        userId, 
                        caseNum: blacklistCaseNum+1, 
                        blacklistedBy: interaction.user.id,
                        reason: textGiven,
                        expiryDate,
                        timestamp: Date.now()
                    });
                    try {
                        const userDM = await interaction.client.users.fetch(userId)
                    
                        const blacklistEmbed = embed_builder(`Report User Flagged, Case: ${customIdCaseNum}`, `Your User Report of case **${customIdCaseNum}** has been flagged.\n**Reason:** ${textGiven}\n\nSince this is your second infraction, you are blacklisted from running \`/report user\` for the next 6 months.\nExpiry Date: <t:${expiryDateDiscordTS}>`, redHex)
                        
                        await userDM.send({ embeds: [blacklistEmbed]})
                        const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                        interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                        modalInteraction.reply({content: `Successfully sent message to \`${userDM.username}\`\nUser was blacklisted from using \`/report user\` for 6 months. (expires on <t:${expiryDateDiscordTS}>)`})
                    } catch(err){
                        console.error(`Couldn't send DM in ${__filename}, err: `, err)
                        modalInteraction.reply({content: `Couldn't send message to user of id: \`${userId}\`\nUser was blacklisted from using \`/report user\` for 6 months. (expires on <t:${expiryDateDiscordTS}>)`})
                    };
                    return archiveReport(`Closed by <@!${interaction.user.id}>`, redHex.slice(1))
                }

                if(blacklistCaseNum == 2){
                    const expiryDate = new Date("2099")
                    
                    const newBlacklistDoc = await reportUserBLModel.create({
                        userId, 
                        caseNum: blacklistCaseNum+1, 
                        blacklistedBy: interaction.user.id,
                        reason: textGiven,
                        expiryDate,
                        timestamp: Date.now()
                    });
                    try {
                        const userDM = await interaction.client.users.fetch(userId)

                        const blacklistEmbed = embed_builder(`Report User Flagged, Case: ${customIdCaseNum}`, `Your User Report of case **${customIdCaseNum}** has been flagged.\n**Reason:** ${textGiven}\n\nSince this is your third infraction, you are blacklisted from running **\`/report user\` permanently**.\nYou may use other features or bot commands.`, redHex)

                        await userDM.send({ embeds: [blacklistEmbed] })
                        const inChannelMessageEmbed = embed_builder("Blacklist Message sent:", textGiven).setFooter({ text: `Strike ${blacklistCaseNum ? blacklistCaseNum+1: 0}`}).setTimestamp();
                        interaction.channel.send({content:`Blacklist Message sent by **<@!${interaction.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                        modalInteraction.reply({ content: `Successfully sent message to \`${userDM.username}\`\nUser was blacklisted from using **\`/report user\` permanently**.`, flags:[hiddenFlag]})
                    } catch (err) {
                        console.error(`Couldn't send DM in ${__filename}, err: `, err)
                        modalInteraction.reply({ content: `Couldn't send message to user of id: \`${userId}\`\nUser was blacklisted from using **\`/report user\` permanently**.` })
                    };
                    return archiveReport(`Closed by <@!${interaction.user.id}>`, redHex.slice(1))
                }
                
            })
        }

        if(customIdPrefix == "reportUserDismiss"){
            
            const dismissEmbed = embed_builder(`Dismiss User Report Case: ${customIdCaseNum}`, "Would you like to dismiss the report with or without notifying the user who reported?");

            const dismissEmbedButtons = new buttonBuilder(interaction)
                .addButton("userReport_dismissWithMessage", "Message & Dismiss", "Primary")
                .addButton("userReport_dismissOnly", "Dismiss Only", "Secondary")

            const dismissRows = [dismissEmbedButtons.getRow()]

            const dismissEmbedResponse = await interaction.reply({ embeds:[dismissEmbed], components:dismissRows, flags:[hiddenFlag], withResponse: true})
            const dismissEmbedMessage = dismissEmbedResponse.resource.message

            dismissEmbedButtons.startListener(dismissEmbedMessage, null,
                /** @param {import('discord.js').ButtonInteraction} buttonInt */
                async (buttonInt) => {
                    const reportDoc = await reportUserModel.findOneAndUpdate({ caseNum: customIdCaseNum }, { checked: true })

                    if (buttonInt.customId == "userReport_dismissWithMessage") {
                        const messageModal = new modalBuilder(buttonInt, 'replyUserMessageModal', "Fix Message")
                        const dismissReportUserMessage = messageModal.createTextInput("dismissReportUserMessage", "Input dismiss message to user", "Paragraph", "Message goes here!", true, null, [5, 2000]);
                        messageModal.addComponents(dismissReportUserMessage)

                        if (!reportDoc) { console.error(RedAscii + `The User Report of caseNum ${customIdCaseNum} is not found. STUPID` + ResetAscii) }

                        messageModal.showModal(null, async (allFields, modalInteraction) => {
                            if(!interaction.memberPermissions?.has("Administrator")) return;

                            const textGiven = allFields.dismissReportUserMessage
                            if (!reportDoc) return;
                            const userId = reportDoc.reporterId;
                            try {
                                const userDM = await interaction.client.users.fetch(userId)

                                const dismissEmbedToUser = embed_builder('User Report Dismissed', `Your User Report of case **${customIdCaseNum}** has been dismissed.\n**Reason:** ${textGiven}.`, greenHex).setFooter({ text: 'Thank you for your report regardless!' })
                                const inChannelMessageEmbed = embed_builder("Message sent:", textGiven)
                                buttonInt.channel.send({content:`Message sent by **<@!${buttonInt.user.id}>** to **${userDM.username}**`,embeds: [inChannelMessageEmbed]})

                                await userDM.send({ embeds: [dismissEmbedToUser] })
                                modalInteraction.reply({ content: `Successfully sent message to \`${userDM.username}\``, flags:[hiddenFlag] })
                            } catch (err) {
                                console.error(`Couldn't send DM in ${__filename}, err: `, err)
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