const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms, redHex } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "messageDeleteBulk",
    once: false,
    /** @param {import('discord.js').Channel} channel */
    async execute(messages, channel){
        const guild = channel.guild
        const guildId = channel.guild.id;


        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;

        try {
            const modlogChannel = await channel.guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, channel)) return;

            const isTurnedOn = await checkModlogSettings("messageDeletion", guildId, channel.id, channel.parentId)
            if(!isTurnedOn) return;

            const embed = embed_builder(`Bulk Message Deletion`, `**${messages.size} messages deleted in <#${channel.id}>**`, redHex)
            .setAuthor({ name: guild.name, iconURL: channel.guild.iconURL({ size: 64 }) })
            .setTimestamp().setFooter({ text:`ChannelID: ${channel.id}` });

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}