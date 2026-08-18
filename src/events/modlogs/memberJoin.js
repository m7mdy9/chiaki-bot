const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms, greenHex } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

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
            if(!botHasBasicPerms(modlogChannel, member)) return;

            const isTurnedOn = await checkModlogSettings("memberJoinLeave", guildId)
            if(!isTurnedOn) return;

            const discordTimestamp = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`
            const embed = embed_builder(null,`**<@!${member.id}> joined the server**`, greenHex)
            .addFields( { name: `Account Created`, value:`${discordTimestamp}` } )
            .setTimestamp().setAuthor({ name:`${member.user.username} joined` })
            .setThumbnail(member.displayAvatarURL({ size: 64 })).setFooter({ text: `ID: ${member.id}`});

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}