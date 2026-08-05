const { kofiLink, embed_builder, kofiLogo} = require("../../utils/utils.js");

module.exports = {
    name: "donate",
    description: "Support me to help me in general and for me to keep working on ChiakiBot and make it better!",
    async execute(interaction){
        const inviteEmbed = embed_builder("Donation Link", `Enjoying the bot so far and you would like to support me to help keep improve ChiakiBot and keep it up n' running?\n**[Consider giving me a tip!](${kofiLink})\n${kofiLink} ${kofiLogo}**`)
        .setURL(kofiLink).setFooter({ text: "You don't need to donate, however your support and donations are greatly appreciated!" });

        return interaction.editReply({ embeds:[inviteEmbed] })
    }
}