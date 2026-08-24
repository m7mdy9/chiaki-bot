const { embed_builder, TopggPage, DBLPage } = require("../../utils/utils")

module.exports = {
    name: "vote",
    description: "Check out our botlist pages and support us by a vote/review!",
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const votingEmbed = embed_builder(null,
            `**[Upvote us on Top.gg](${TopggPage}/vote)**`+
            `\n**[Upvote us on discordbotlist](${DBLPage}/upvote)**`+
            `\n\n**[Our Top.gg Page](${TopggPage})**`+
            `\n**[Our discordbotlist Page](${DBLPage})**`+
            `\n\n*If you like Chiaki Bot, please consider upvoting us!*\n*All your support is greatly appreciated!*`
        ).setAuthor({ name: `Chiaki Bot`, iconURL: interaction.client.user.displayAvatarURL({ size: 128 })})
        // .setFooter({ text: `If you like Chiaki Bot, consider upvoting us! All your support is greatly appreciated!` })

        return interaction.editReply({ embeds:[votingEmbed] });
    }
}