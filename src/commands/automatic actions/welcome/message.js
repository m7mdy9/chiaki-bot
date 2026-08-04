const { ChannelType } = require('discord.js');
const { welcomeMessageModel } = require('../../../database/models');
const { createWelcomeMsg } = require('../../../events/welcomeMessage');
const { selectorTextBuilder, buttonBuilder, selectorChannelBuilder, modalBuilder } = require('../../../utils/builders');
const { embed_builder, hiddenFlag, checkmarkEmoji, crossEmoji, botHasBasicPerms, userHasBasicPermissions, badWordsResponse, greenHex, checkMemberPermissions } = require('../../../utils/utils');
const { isSlurPresent } = require('../../../utils/slurfilter');
const { logModAction } = require('../../../utils/modlogs');

module.exports = {
    name: "message",
    description: "Set a welcome message whenever a new user joins! And sends an intro card which is like in /introcard",
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction  */
    async execute(interaction){
        const userHasCorrectPerms = checkMemberPermissions(interaction.member, "ManageGuild")
        if(!userHasCorrectPerms){
            interaction.editReply("You do not have permissions to **Manage Server**.")
            return; 
        }

        const guildId = interaction.guild.id;
        
        let welcomeDoc = await welcomeMessageModel.findOne({ guildId })
        if(!welcomeDoc){
            welcomeDoc = await welcomeMessageModel.create({ guildId })
        }
        let isEdited = false;
        
        const inputTags = [
            "**{user.tag}**: Member's Username",
            "**{user.mention}**: Member's Mention (doesn't work in intro card text)",
            "**{user.displayName}**: Member's Display Name",
            "**{server.name}**: Server's Name",
        ]
        const smallInputTags = [
            "{user.tag}",
            "{user.mention}",
            "{user.displayName}",
            "{server.name}",
        ]
        const formattedTags = inputTags.join("\n")
        
        const getFields = (selectedDoc) =>{
            const { toggle, channelId, welcomeMessage, introCardText } = selectedDoc
            const formattedToggle = toggle ?`On` : `Off`;
            const toggleEmoji = toggle ? `${checkmarkEmoji}` : `${crossEmoji}`;
            const warningToggle = channelId ? `` : `\n**(No welcome messages will be sent unless a channel is selected)**`;

            const formattedChannel = channelId ? `<#${channelId}>` : "None";
            const formattedMessage = welcomeMessage || "None";
            const formattedIntro = introCardText || "None";


            const fields = [
                { name: `State`, value: `Welcome Messages are set to ${toggleEmoji} **${formattedToggle}** ${warningToggle}`},
                { name: `Selected Channel`, value: formattedChannel },
                {
                    name: `\u200b`,
                    value: `**Primary Message:** ${formattedMessage}`
                        + `\n\n**Intro Card Text:** ${formattedIntro}`
                },
                {
                    name: "Input Tags",
                    value: `You can use these in the Primary and Intro Card Messages, though they must be **EXACT** matches.\n\n${formattedTags}`
                }
            ];

            return fields;
        }


        const initialEmbed = embed_builder(
            "Set a Welcome Message",
            "Set a welcome message sent in the specified channel whenever a new user joins!"
            +`\nThe welcome message also includes an intro card like in **\`/introcard\`**`
        ).setTimestamp()
        .setFields(
            getFields(welcomeDoc)
        ).setAuthor({ name: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ size: 64 }) })
        
        const selectionSelector = new selectorTextBuilder(interaction)
        .createSelector("welcomeMsg_selector", "Select a field", 1, 1);
        selectionSelector.addOption("Toggle State",'toggle', "Toggle the state (on/off)")
        .addOption("Edit Channel", "channelEdit", "Change the current channel selection")
        .addOption("Primary Message", "welcomeMessage", "Change the Primary Welcome Message Text")
        .addOption("Intro Card Text", "introCardText", "Change the Intro Card Text")

        const exampleButton = new buttonBuilder(interaction)
        .addButton("welcomeMsg_example", "View Example", "Secondary", null, "👀")
        .addButton("welcomeMsg_reset", "Reset to Defaults", "Danger", null, "⏮️")
        .addButton("welcomeMsg_done", "Done", "Success", null, "✅");

        const selectorRow = selectionSelector.getRow();
        const exampleBtnRow = exampleButton.getRow();
        
        const initialResponse = await interaction.editReply({ embeds: [initialEmbed], components:[selectorRow, exampleBtnRow] })
        
        /**
         * @param {'channelId' | 'welcomeMessage' | 'introCardText' | 'toggle'} setting 
        */
        const changeSetting = async (setting, value) =>{
            isEdited = true;

            welcomeDoc[setting] = value;
            welcomeDoc.timestamp = Date.now();
            await welcomeDoc.save()
        }
        const updateEmbed = async ()=>{
            initialEmbed.setTimestamp(welcomeDoc.timestamp)
            .setFields(getFields(welcomeDoc));

            await initialResponse.edit({ embeds:[initialEmbed], components:[selectorRow, exampleBtnRow]  })
        }
        const resetSettings = async ()=>{
            isEdited = true;

            await welcomeDoc.deleteOne();
            welcomeDoc = await welcomeMessageModel.create({ guildId })
        }
        
        exampleButton.startListener(initialResponse, 300_000, async (btnInt)=>{
            
            if(btnInt.customId == "welcomeMsg_example"){
                const intOptions = await createWelcomeMsg(interaction.member, welcomeDoc.welcomeMessage, welcomeDoc.introCardText)
                await btnInt.reply({ ...intOptions, flags:[hiddenFlag] });
                return;
            }
            
            if(btnInt.customId == "welcomeMsg_reset"){                
                await resetSettings();
                await updateEmbed();
                await btnInt.reply({ content:`Successfully reset settings to defaults`, flags:[hiddenFlag]});
                return;
            }

            if(btnInt.customId == "welcomeMsg_done"){
                const doneEmbed = embed_builder("Nice!", 
                    "You have finished editing the Welcome Message settings!\n\n*Note: this button actually does nothing, but having it be there is kinda cool, right?*",
                greenHex);
                
                await btnInt.update({ embeds:[doneEmbed], components: []});
                if(isEdited){
                    logModAction(btnInt, "specialOverride", interaction.member, null, null, 
                        ["Welcome Message Update", `**Welcome Message Settings** has been updated by <@!${interaction.member.id}>`]
                        , "welcomeMessageUpdate"
                    )
                }
            }
        })

        selectionSelector.startListener(initialResponse, 300_000, 
            /** @param {import('discord.js').AnySelectMenuInteraction} selectorInt */
            async (selectorInt)=>{
                const selection = selectorInt.values[0]

                if(selection == "toggle"){
                    await toggleState(selectorInt, welcomeDoc);
                    return;
                }
                if(selection == "channelEdit"){
                    await channelEdit(selectorInt, welcomeDoc);
                    return;
                }
                if(selection == "welcomeMessage"){
                    await welcomeMsgEdit(selectorInt, welcomeDoc);
                    return;
                }
                if(selection == "introCardText"){
                    await introTextEdit(selectorInt, welcomeDoc);
                    return;
                }
        })

        async function toggleState(int, selectedDoc){
            const newState = !selectedDoc.toggle;

            const formattedState = newState ? "On" : "Off";
            const stateEmoji = newState ? `${checkmarkEmoji}` : `${crossEmoji}`;

            await changeSetting("toggle", newState);
            await updateEmbed();
            await int.reply({ content:`Successfully set state to: **${stateEmoji} ${formattedState}**`, flags: [hiddenFlag]})
            return;
        }

        async function channelEdit(int, selectedDoc){
            const channelEditEmbed = embed_builder("Select a Channel", "This will be where welcome messages will be sent!");

            const channelSelector = new selectorChannelBuilder(int)
            channelSelector.createChannelSelect("welcomeMsg_channelSelector", "Select a Text Channel", [0, 1], [selectedDoc.channelId], [ChannelType.GuildText]);
            const channelSelectorRow = channelSelector.getRow();
            const intReply = await int.reply({ embeds:[channelEditEmbed], components:[channelSelectorRow], withResponse: true})
            const intResponse = intReply.resource.message;

            
            channelSelector.startListener(intResponse, 160_000, 
                /** @param {import('discord.js').ChannelSelectMenuInteraction} channelInt */
                async (channelInt)=>{
                    const selectedChannel = channelInt?.channels?.first();
                    const formattedChannel = selectedChannel ? `<#${selectedChannel.id}>` : "**none**"

                    if(selectedChannel){
                        if(!botHasBasicPerms(selectedChannel, interaction, true)){
                            await channelInt.reply({ content:`I do not have proper permissions to send messages in this channel.\nPlease make sure that I have **\`View Channel\`**, **\`Send Messages\`** and **\`Embed Links\`** permissions enabled in <#${selectedChannel.id}>`,flags:[hiddenFlag] })
                            return;
                        }
                        if(!userHasBasicPermissions(selectedChannel, channelInt.member)){
                            await channelInt.reply({ content:`You can not select a channel that you do not have basic permissions for.`,flags:[hiddenFlag] })
                            return;
                        }
                    }

                    await changeSetting("channelId", selectedChannel?.id);
                    await updateEmbed();
                    await int.deleteReply();
                    await channelInt.reply({ content:`Successfully set channel to ${formattedChannel}` ,flags:[hiddenFlag]})
                    return;
            })
        }

        async function welcomeMsgEdit(int, selectedDoc){
            const welcomeMsgModal = new modalBuilder(int, "welcomeMsgModal", "Welcome Message Edit");
            const modalComponent = welcomeMsgModal.createTextInput("welcomeMsgModal_textInput"
                ,`Edit the Welcome Message`,
                "Short", "stuff goes here", true, selectedDoc.welcomeMessage, [1, 1500]
            )
            welcomeMsgModal.addComponents(modalComponent);
            updateEmbed();
            await welcomeMsgModal.showModal(undefined, 
                /** @param {import('discord.js').ModalMessageModalSubmitInteraction} modalInteraction */
                async (fields, modalInteraction)=>{
                    const inputtedText = fields.welcomeMsgModal_textInput
                    
                    const { isSlur, censoredMatch } = isSlurPresent(inputtedText)
                    if(isSlur){
                        const textContent = badWordsResponse(censoredMatch);
                        await modalInteraction.reply({ content:textContent,flags:[hiddenFlag] })
                        return;
                    }

                    await changeSetting("welcomeMessage", inputtedText);
                    await updateEmbed();
                    await modalInteraction.reply({ content: `Successfully set the Welcome Message to: ${inputtedText}`,flags:[hiddenFlag]})
                    return;
            })
        }

        async function introTextEdit(int, selectedDoc){
            const introText = new modalBuilder(int, "introText", "Welcome Message Edit");
            const modalComponent = introText.createTextInput("introText_textInput"
                ,`Edit the Intro Card Text`,
                "Short", "stuff goes here", true, selectedDoc.introCardText, [1, 44]
            )
            introText.addComponents(modalComponent);
            updateEmbed();
            await introText.showModal(undefined, 
                /** @param {import('discord.js').ModalMessageModalSubmitInteraction} modalInteraction */
                async (fields, modalInteraction)=>{
                    const inputtedText = fields.introText_textInput
                    
                    const { isSlur, censoredMatch } = isSlurPresent(inputtedText)
                    if(isSlur){
                        const textContent = badWordsResponse(censoredMatch);
                        await modalInteraction.reply({ content:textContent,flags:[hiddenFlag] })
                        return;
                    }

                    await changeSetting("introCardText", inputtedText);
                    await updateEmbed();
                    await modalInteraction.reply({ content: `Successfully set the Intro Card Text to: ${inputtedText}`,flags:[hiddenFlag]})
                    return;
            })
        }
    }
}