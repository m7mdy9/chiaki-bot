const { getOptionNum, embed_builder, pinkSquareId, blackSquareId} = require('../../utils/utils.js')
const { danganronpa1_characters } = require("../../utils/misc.json")
const  formattedList = danganronpa1_characters.map(el => ({name:el, value:el}))
module.exports = {
    name: "howdang1areyou",
    description: "How chosen Danganronpa 1 character are you?",
    options :[
        {
            name:"character",
            description: "Choose a Danganronpa 1 Character. Leave empty for a random character.",
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
        const charChoice = interaction.options.getString("character") || danganronpa1_characters[Math.floor(Math.random() * danganronpa1_characters.length)]
        const targetUser = interaction.options.getUser("user") || interaction.user
        const isUser = targetUser.id != interaction.user.id
        if((targetUser.id === process.env.OWNER_ID && charChoice.toLowerCase() == "kyoko kirigiri") || (targetUser.id === process.env.RIGGED_USER_ID && charChoice.toLowerCase() == "chihiro fujisaki")){
            RNG = 100.00
        } else if(targetUser.id === process.env.RIGGED_USER_ID && charChoice.toLowerCase() == "kyoko kirigiri"){
            RNG = 0.00
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