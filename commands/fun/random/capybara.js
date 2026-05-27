const { embed_builder } = require("../../../utils/utils.js")

// thanks to capy.lol for the cool api!!
module.exports = {
    name: "capybara",
    description: "Get a random Capybara Image (provided by capy.lol)",
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const capyAPI = `https://api.capy.lol/v1`
        const altImage = "https://hertfordshirezoo.com/wp-content/uploads/2024/06/sDSC_8312-Enhanced-NR-copy-1024x1024.jpg"

        const response = await (await fetch(`${capyAPI}/capybara?json=true&random=true`))?.json()
        const capybaraFact = await (await fetch(`${capyAPI}/fact?json=true&random=true`))?.json()

        const image = response?.data?.url || altImage
        const embed = embed_builder("Random Capybara Image", `Random capy-fact: ${capybaraFact?.data?.fact || "No facts for today :("}`).setImage(image).setFooter({text: "Powered by capy.lol"})
        return interaction.editReply({embeds:[embed]})
    }
}