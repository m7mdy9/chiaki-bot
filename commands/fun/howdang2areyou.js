const { getOptionNum, embed_builder} = require('../../utils/utils.js')
const { danganronpa2_characters, secretUser} = require("../../utils/config.json")
const  formattedList = danganronpa2_characters.map(el => ({name:el, value:el}))
module.exports = {
    name: "howdang2areyou",
    description: "How chosen Danganronpa 2 character are you?",
    options :[
        {
            name:"character",
            description: "Choose a Danganronpa 2 Character. Leave empty for a random character.",
            type: getOptionNum("STRING"),
            required: false,
            choices: formattedList
        },
        {
            name:"user",
            description: "Student that you would like to run this command on.",
            type: getOptionNum("USER"),
            required: false,
        }
    ],
    /**
    * @param {import('discord.js').ChatInputCommandInteraction} interaction 
    */
    async execute(interaction){
        let RNG = (Math.random() * 100).toFixed(2)
        const charChoice = interaction.options.getString("character") || danganronpa2_characters[Math.floor(Math.random() * danganronpa2_characters.length)]
        const targetUser = interaction.options.getUser("user") || interaction.user
        const isUser = targetUser.id != interaction.user.id
        if((targetUser.id === process.env.ownerId && charChoice.toLowerCase() == "chiaki nanami") || (targetUser.id === process.env.secretUser && charChoice.toLowerCase() == "nagito komaeda")){
            RNG = 100.00
        } else if(targetUser.id === process.env.secretUser && charChoice.toLowerCase() == "chiaki nanami"){
            RNG = 0.00
        }
        const roundNum = Math.round(RNG / 10)
        const ChiakiSquare = "<:pink_square:1508908743822414074>".repeat(roundNum)
        const BlackSquare = "<:black_square:1508910237518794843>".repeat(10-roundNum)
        const output = ChiakiSquare + BlackSquare
        const embed = embed_builder(
            `How ${charChoice} ${isUser ? `is ${targetUser.username}?` : `are you?`}`,
            `${isUser ? `${targetUser.username} is` : `You are`} **${RNG}%** **${charChoice}**\n
            ${output} **${RNG}%**`
        ).setFooter({ text:`${targetUser.username}`, iconURL:targetUser.displayAvatarURL() })

        return interaction.editReply({embeds:[embed]})
    }
}