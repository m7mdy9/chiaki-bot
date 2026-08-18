const { embed_builder } = require("../../../utils/utils.js")
const { chiaki_half_body_sprites, chiaki_quotes } = require("../../../utils/misc.json")

module.exports = {
    name: "chiaki",
    description: "Get a random chiaki sprite and quote!",
    /** @param {import("discord.js").ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const site = `https://m7mdy9.github.io/images/chiaki_half_body_sprites/`
        const randomChiaki = chiaki_half_body_sprites[Math.floor(Math.random() * chiaki_half_body_sprites.length)]
        const randomQuote = chiaki_quotes[Math.floor(Math.random() * chiaki_quotes.length)]
        const ChiakiSprite = `${site}${randomChiaki}`

        const embed = embed_builder("Random Chiaki Image!",
        `"${randomQuote}"\n**\\- Chiaki Nanami**`
        ).setImage(ChiakiSprite).setFooter({text:"Images from danganronpa.fandom.com"})
        return interaction.editReply({embeds:[embed]})
    }
}