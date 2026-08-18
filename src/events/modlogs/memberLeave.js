const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms, redHex } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

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
            if(!botHasBasicPerms(modlogChannel, member)) return;

            const isTurnedOn = await checkModlogSettings("memberJoinLeave", guildId)
            if(!isTurnedOn) return;

            let embedDescription = `<@!${member.id}> left the server`;

            const embed = embed_builder(null,embedDescription, redHex)
            .setTimestamp().setAuthor({ name:`${member.user.username} left` })
            .setThumbnail(member.displayAvatarURL({ size: 64 })).setFooter({ text: `ID: ${member.id}`});
            
            if(member?.joinedTimestamp){
                const discordTimestamp = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                embed.addFields( { name:`Joined`,value:`${discordTimestamp}` } )
            }


            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}