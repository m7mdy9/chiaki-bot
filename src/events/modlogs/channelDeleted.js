const { basename, ChannelType } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms, channelTypeNumToName } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "channelDelete",
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

            const isTurnedOn = await checkModlogSettings("channelAction", guildId, channel.id, channel.parentId)
            if(!isTurnedOn) return;

            const channelTypeName = channelTypeNumToName(channel.type)
            let prefix = "";
            if(channel.type != ChannelType.GuildCategory) prefix = "#"

            const embed = embed_builder(`${channelTypeName} Deleted`, `**\`${prefix + channel.name}\` was deleted.**`, process.env.red)
            .setFooter({ text: `ID: ${channel.id}` }).setTimestamp()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) })

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}