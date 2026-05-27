const { getOptionNum, embed_builder } = require("../../utils/utils.js")

module.exports = {
    name:"coinflip",
    description:"Flips a coin!",
    options: [
        {
            name:'flips',
            description: 'Number of times to flip the coin.',
            type: getOptionNum("INTEGER"),
            required: false,
        },
    ],
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const numFlips = interaction.options.getInteger('flips') || null
        let output;
        if (numFlips && numFlips > 1){
            let results = []
            for (let i = 0; i < numFlips; i++) {    
                results.push(Math.random() >= 0.5 ? "Heads" : "Tails")
            }
            output = `🪙 Flipped a coin **${numFlips}** times: **${results.join(", ")}**`
        } else  {
            output = `🪙 **${Math.random() >= 0.5 ? "Heads" : "Tails"}**`
        }
        await interaction.editReply({ embeds:[
            embed_builder("Result",output).setTimestamp()
        ]})
    }
}
