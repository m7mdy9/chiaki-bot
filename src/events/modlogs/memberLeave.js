const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder } = require("../../utils/utils");

module.exports = {
    name: "guildMemberRemove",
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

            let embedDescription = null;
            if(member?.joinedTimestamp){
                const discordTimestamp = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                embedDescription = `Joined: ${discordTimestamp}`
            }

            const embed = embed_builder(`${member.user.username} left the Server`,embedDescription, process.env.red)
            .setTimestamp().setThumbnail(member.displayAvatarURL({ size: 64 })).setFooter({ text: `ID: ${member.id}`});

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}