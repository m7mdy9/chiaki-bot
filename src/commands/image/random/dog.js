const { embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name: "dog",
    description: "Get a random dog image (provided by thedogapi.com and rapidapi.com)",
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const altImage = "https://rimage.gnst.jp/livejapan.com/public/article/detail/a/00/01/a0001799/img/basic/a0001799_main.jpg"
        headers = {
            "x-api-key": process.env.DOG_API_KEY,
            'x-rapidapi-key': process.env.DOGFACT_API_KEY
        }
        const response = await (await fetch(`https://api.thedogapi.com/v1/images/search`, {headers}))?.json()
        const dogFact = await (await fetch(`https://random-dog-facts.p.rapidapi.com/api/dogs`,{headers}))?.json()

        const image = response[0]?.url || altImage
        const embed = embed_builder("Random Dog Image", `Random dog fact: ${dogFact?.fact || "No facts for today :("}`).setImage(image).setFooter({text: "Powered by thedogapi.com and rapidapi.com"})
        return interaction.editReply({embeds:[embed]})
    }
}