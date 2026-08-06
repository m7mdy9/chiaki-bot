const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "messageUpdate",
    once: false,
    /** 
     * @param {import('discord.js').Message} oldMessage 
     * @param {import('discord.js').Message} newMessage 
    */
    async execute(oldMessage, newMessage){
        if(newMessage.author?.bot) return;

        const guild = newMessage.guild
        const guildId = newMessage.guild.id;


        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;

        try {
            const modlogChannel = await guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, guild)) return;

            const isTurnedOn = await checkModlogSettings("messageUpdate", guildId, newMessage.channelId, newMessage.channel.parentId)
            if(!isTurnedOn) return;

            const oldContent = oldMessage.content
            const newContent = newMessage.content
            if((!oldContent || !newContent) || oldContent === newContent) return;

            const formattedOld = oldContent.length > 1010 ? `${oldContent.slice(0,1007)}......` : oldContent
            const formattedNew = newContent.length > 1010 ? `${newContent.slice(0,1007)}......` : newContent

            const embed = embed_builder("Message Edited", `**[Jump to Message](${newMessage.url})** in <#${newMessage.channelId}>`)
            .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL({ size: 64 })})
            .setFooter({ text: `UserID: ${newMessage.author.id}`}).setTimestamp()
            .addFields( 
                { name: "Before", value: `${formattedOld}`, inline: false },
                { name: "After", value: `${formattedNew}`, inline: false },
            )

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}