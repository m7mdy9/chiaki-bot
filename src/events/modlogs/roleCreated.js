const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "roleCreate",
    once: false,
    /** @param {import('discord.js').Role} role */
    async execute(role){
        const guild = role.guild
        const guildId = guild.id;

        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;

        try {
            const modlogChannel = await guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, role)) return;
            
            const isTurnedOn = await checkModlogSettings("roleActions", guildId)
            if(!isTurnedOn) return;

            const embed = embed_builder("Role Created", `**\`${role.name}\`(<@&${role.id}>) was created.**`)
            .setFooter({ text: `ID: ${role.id}` }).setTimestamp()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) })


            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}