const { getOptionNum, embed_builder, pinkSquareId, blackSquareId} = require('../../utils/utils.js')
const { danganronpav3_characters } = require("../../utils/misc.json")
const  formattedList = danganronpav3_characters.map(el => ({name:el, value:el}))
module.exports = {
    name: "howdangv3areyou",
    description: "How chosen Danganronpa V3 character are you?",
    options :[
        {
            name:"character",
            description: "Choose a Danganronpa V3 Character. Leave empty for a random character.",
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
        const charChoice = interaction.options.getString("character") || danganronpav3_characters[Math.floor(Math.random() * danganronpav3_characters.length)]
        const targetUser = interaction.options.getUser("user") || interaction.user
        const isUser = targetUser.id != interaction.user.id
        if((targetUser.id === process.env.OWNER_ID && charChoice.toLowerCase() == "kaede akamatsu")){
            RNG = (100.00).toFixed(2)
        }
        const roundNum = Math.round(RNG / 10)
        const ChiakiSquare = `<:pink_square:${pinkSquareId}>`.repeat(roundNum)
        const BlackSquare = `<:black_square:${blackSquareId}>`.repeat(10-roundNum)
        const output = ChiakiSquare + BlackSquare
        const embed = embed_builder(
            `How ${charChoice} ${isUser ? `is ${targetUser.username}?` : `are you?`}`,
            `${isUser ? `${targetUser.username} is` : `You are`} **${RNG}%** **${charChoice}**\n\n${output} **${RNG}%**`
        ).setFooter({ text:`${targetUser.username}`, iconURL:targetUser.displayAvatarURL() })

        return interaction.editReply({embeds:[embed]})
    }
}