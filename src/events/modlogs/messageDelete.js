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

            const isTurnedOn = await checkModlogSettings("messageDeletion", guildId)
            if(!isTurnedOn) return;

            const messageContent = message?.content || "Couldn't fetch message content";
            const formattedContent = messageContent > 1010 ? `${messageContent.splice(0,1007)}...` : messageContent

            const embedDescription = `**Message Deleted in <#${message.channelId}>**\n${formattedContent}`

            const embed = embed_builder(null, embedDescription, process.env.red)
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ size: 64 }) })
            .setTimestamp().setFooter({ text:`UserID: ${message.author.id}` });

            if(message.attachments.size > 0){
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