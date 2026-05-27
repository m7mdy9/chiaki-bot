const { embed_builder } = require("../../../utils/utils.js")
const { all_chiaki_lines,chiaki_half_body_sprites } = require("../../../utils/config.json")

module.exports = {
    name: "chiaki-line",
    description: "Get a random chiaki line from almost all her lines within Danganronpa 2: Goodbye Despair.",
    /** @param {import("discord.js").ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const site = `https://m7mdy9.github.io/images/chiaki_half_body_sprites/`
        const chiakiLine = all_chiaki_lines[Math.floor(Math.random() * all_chiaki_lines.length)]
        const chiakiSprite = chiaki_half_body_sprites[Math.floor(Math.random() * chiaki_half_body_sprites.length)]
    
        const embed = embed_builder("Random Chiaki Line!", `"${chiakiLine}"\n**\\- Chiaki Nanami**`)
            .setThumbnail(site+chiakiSprite)
            .setFooter({text: "Powered by voicelines.fandom.com\nFor more filtered quotes, do /random chiaki"})
        return interaction.editReply({embeds:[embed]})
    }
}