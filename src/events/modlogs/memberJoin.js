const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder } = require("../../utils/utils");

module.exports = {
    name: "guildMemberAdd",
    once: false,
    /** @param {import('discord.js').GuildMember} member */
    async execute(member){
        const client = member.client;
        const guildId = member.guild.id;

        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;

        try {
            const modlogChannel = await member.guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;

            const discordTimestamp = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`
            const embed = embed_builder(`${member.user.username} joined the Server`,`Account Created: ${discordTimestamp}`, process.env.green)
            .setTimestamp().setThumbnail(member.displayAvatarURL({ size: 64 })).setFooter({ text: `ID: ${member.id}`});

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}