const { embed_builder, getOptionNum } = require("../../../utils/utils.js")

module.exports = {
    name: "cat",
    description: "Get a random Cat Image or Gif! (provided by thecatapi.com and catfact.ninja)",
    options:[
        {
            name: "gif",
            description: "Choose if you want a cat gif (random between images and gifs by default)",
            type: getOptionNum("BOOLEAN"),
            required: false,
        }
    ],
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        let isGif = interaction.options.getBoolean("gif")
        switch(isGif){
            case false:
                isGif = false
                break;
            case null:
                isGif = "random"
                break;
            case true:
                isGif = true;
        }
        if(isGif == "random"){
            Math.random() >= 0.7 ? isGif = true : isGif = false
        }
        let catAPI = `https://api.thecatapi.com/v1/images/search?size=med`
        catAPI = isGif ? catAPI+"&mime_types=gif" : catAPI
        const catFactAPI = "https://catfact.ninja/fact?max_length=200"
        const altImage = "https://static.wikia.nocookie.net/silly-cat/images/5/59/Milly.png/revision/latest?cb=20231001194804"
        
        const response = await (await fetch(catAPI))?.json()
        const catFact = await (await fetch(catFactAPI))?.json()
        
        const image = response[0]?.url || altImage 
        const embed = embed_builder("Random Cat Image", `Random cat fact: ${catFact?.fact || "No facts for today :("}`).setImage(image).setFooter({text: "Powered by thecatapi.com and catfact.ninja"})
        return interaction.editReply({embeds:[embed]})
    }
}