const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "messageDelete",
    once: false,
    /** @param {import('discord.js').Message} message */
    async execute(message){
        if(message.author?.bot) return;

        const client = message.client;
        const guildId = message.guild.id;

        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;

        try {
            const modlogChannel = await message.guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, message)) return;

            const isTurnedOn = await checkModlogSettings("messageDeletion", guildId, message.channelId, message.channel.parentId)
            if(!isTurnedOn) return;

            const messageContent = message?.content || "- Couldn't fetch message content\n(usually caused by the message being old)";
            const formattedContent = messageContent.length > 1010 ? `${messageContent.slice(0,1007)}......` : messageContent

            const embedDescription = `**Message Deleted in <#${message.channelId}>**\n${formattedContent}`

            const embed = embed_builder(null, embedDescription, process.env.red)
            if(!message.partial){
                embed.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ size: 64 }) })
                embed.setTimestamp().setFooter({ text:`UserID: ${message.author.id}` });
            } else {
                embed.setTimestamp().setFooter({ text: `ChannelID: ${message.channelId}` })
            }

            if(message.attachments?.size > 0){
                const fileNames = message.attachments.map(el => `\`${el.name}\``).join(", ");
                embed.addFields(
                    {  name: "Attachments", value: `${fileNames}` }
                );
            }

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}