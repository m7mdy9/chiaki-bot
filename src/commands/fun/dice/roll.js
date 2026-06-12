const { getOptionNum, embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name:"roll",
    description:"Roll a six-sided dice!",
    options: [
        {
            name:'rolls',
            description: 'Number of times to roll the dice.',
            type: getOptionNum("INTEGER"),
            required: false,
        },
    ],
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const writtenNumbers = ["One","Two","Three","Four","Five","Six",]
        const rollNum = interaction.options.getInteger('rolls') || null
        let output;
        const diceRoll = ()=>{
            const numberRolled = Math.floor(Math.random() * 6)
            return writtenNumbers[numberRolled]
        }
        if (rollNum && rollNum > 1){
            let results = []
            for (let i = 0; i < rollNum; i++) {    
                results.push(diceRoll())
            }
            output = `🎲 Rolled a dice **${rollNum}** times: **${results.join(", ")}**`
        } else  {
            output = `🎲 Rolled a **${diceRoll()}**`
        }
        return interaction.editReply({ embeds:[
            embed_builder("Result",output).setTimestamp()
        ]})
    }
}