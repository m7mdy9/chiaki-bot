const { modlogSettingsModel, modlogsModel } = require("../../../database/models");
const { selectorTextBuilder, buttonBuilder, selectorChannelBuilder } = require("../../../utils/builders");
const { embed_builder, hiddenFlag, checkmarkEmoji, crossEmoji } = require("../../../utils/utils");

const modlogFields =
    [
        "moderativeActions",
        "channelActions",
        "memberJoinLeave",
        "memberRoleUpdate",
        "messageDeletion",
        "messageEdits",
        "roleActions",
        "modlogChanges",
        "autoroleChanges",
    ]
const modlogObj = {
    moderativeActions: "Moderative Actions",
    channelActions: "Channels Audit",
    memberJoinLeave: "Member Joins/Leaves",
    memberRoleUpdate: "Member Role",
    messageDeletion: "Deleted Messages",
    messageEdits: "Message Edits",
    roleActions: "Roles Audit",
    modlogChanges: "Modlog Settings Changes",
    autoroleChanges: "Autorole Settings Changes",
}

const isOnEmoji = (boolean) =>{
    return boolean ? `${checkmarkEmoji}` : `${crossEmoji}`
}

module.exports = {
    name: "settings",
    description: "Adjust logging settings. To set a log channel, run /set modlogs",
    /** @param {import("discord.js").ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const guildId = interaction.guild.id;

        const modLogChannel = (await modlogsModel.findOne({ guildId }))?.channelId || null
        let settingsDoc = await modlogSettingsModel.findOne({ guildId })

        if(!settingsDoc){
            settingsDoc = await modlogSettingsModel.create({ guildId })
        }

        /**
         * @param { 'moderativeActions' | 'channelActions' | 'memberJoinLeave' | 
         * 'memberRoleUpdate' | 'messageDeletion' | 'messageEdits' |
         * 'roleActions' | 'modlogChanges' | 'autoroleChanges' | 'ignoredChannelIds' } setting 
         */
        const changeSettings = async (setting, option) => {
            settingsDoc[setting] = option;
            settingsDoc.timestamp = Date.now();

            await settingsDoc.save();
        }

        const resetSettings = async () => {
            modlogFields.forEach(field => {
                settingsDoc[field] = true;
            })
            settingsDoc.ignoredChannelIds = [];

            await settingsDoc.save();
        }

        const returnFormattedSettings = () =>{
            let resultString =
            `**Current Logging Channel: ${modLogChannel ? `<#${modLogChannel}>` : `\`none\``}**\n\n`
            
            for(const modlogField in modlogObj){
                resultString += `${isOnEmoji(settingsDoc[modlogField])} ${modlogObj[modlogField]}\n`
            }

            if(settingsDoc.ignoredChannelIds?.length > 0){
                resultString += `\n**Ignored Channels/Categories:** ${settingsDoc.ignoredChannelIds.map(el => `**<#${el}>**`).join("")}`
            } else {
                resultString += `\n**Ignored Channels/Categories:** None.`                
            }
            resultString+= `\n*__(Doesn't apply to commands)__*`

            return resultString
        }

        const settingsEmbed = embed_builder("Mod Log Settings", returnFormattedSettings())
        .setFooter({ text: "Last Edited" }).setTimestamp(settingsDoc.timestamp);

        
        const settingSelector = new selectorTextBuilder(interaction);
        settingSelector.createSelector("settingSelector", "Toggle Setting", 1,1)
        for (const modlogField in modlogObj){
            settingSelector.addOption(modlogObj[modlogField], modlogField, null, null, false)
        }
        
        const resetButton = new buttonBuilder(interaction)
        .addButton('resetSettings', "Reset to Defaults", "Danger", null, "⏮️")
        
        const buttonRow = resetButton.getRow();
        const selectorRow = settingSelector.getRow(); 
        
        const channelSelector = new selectorChannelBuilder(interaction)
        .createChannelSelect("ignoreChannelSelect", "Select Ignored Channels/Categories", [0, 25], settingsDoc.ignoredChannelIds || [])

        const getChannelRow = ()=>{
            if(settingsDoc.ignoredChannelIds?.length > 0){
                channelSelector.selector.setDefaultChannels(...settingsDoc.ignoredChannelIds)
            } else {
                channelSelector.selector.setDefaultChannels([])
            }

            return channelSelector.getRow()
        }

        const initialResponse = await interaction.editReply({ embeds:[settingsEmbed], components: [selectorRow, getChannelRow(), buttonRow]})
        
        const updateEmbed = async ()=>{
            settingsEmbed.setDescription(returnFormattedSettings())
            .setTimestamp(Date.now());
            
            await initialResponse.edit({ embeds:[settingsEmbed], components: [selectorRow, getChannelRow(), buttonRow] })
        }

        resetButton.startListener(initialResponse, 300_000, 
            /** @param {import('discord.js').Interaction} btnInt */
            async (btnInt)=>{
                await resetSettings();
                await updateEmbed();
                await btnInt.reply({ content:"The settings have been reset to defaults.", flags:[hiddenFlag]});
                return;
        })

        settingSelector.startListener(initialResponse, 300_000, 
            /** @param {import('discord.js').Interaction} selectorInt */
            async (selectorInt)=>{
                const selectedValue = selectorInt.values[0];
                const targetBoolean = !settingsDoc[selectedValue]

                const formattedValue = modlogObj[selectedValue]
                const formattedBoolean = targetBoolean ? "On" : "Off"

                await changeSettings(selectedValue, targetBoolean);
                await updateEmbed();
                await selectorInt.reply({ content:`Successfully set **${formattedValue}** to **${formattedBoolean}**`, flags:[hiddenFlag]});
                return;
        })

        channelSelector.startListener(initialResponse, 300_000, 
            /** @param {import('discord.js').Interaction} channelInt */            
            async (channelInt)=>{
                const selectedValues = channelInt.values;
                const formattedValue = channelInt.values?.length > 0 ? selectedValues.map(el => `**<#${el}>**`).join("") : "None";

                await changeSettings("ignoredChannelIds", selectedValues);
                await updateEmbed();
                await channelInt.reply({ content:`Successfully set **Ignored Channels/Categories** to: ${formattedValue}`, flags:[hiddenFlag]});
                return;
        })
    }
}