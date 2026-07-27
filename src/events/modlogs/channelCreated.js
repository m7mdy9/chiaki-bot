const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms, channelTypeNumToName } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "channelCreate",
    once: false,
    /** @param {import('discord.js').Channel} channel */
    async execute(channel){
        const guild = channel.guild
        const guildId = guild.id;

        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;
        
        try {
            const modlogChannel = await guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, channel)) return;
            
            const isTurnedOn = await checkModlogSettings("channelAction", guildId)
            if(!isTurnedOn) return;

            const channelTypeName = channelTypeNumToName(channel.type)

            const embed = embed_builder(`${channelTypeName} Created`, `**<#${channel.id}> was created.**`)
            .setFooter({ text: `ID: ${channel.id}` }).setTimestamp()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) })

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}