module.exports = {
    name:"cf",
    description:"Flips a coin!",
    options: [
        {
            name:'N',
            description: 'Number of times to flip the coin.',
            type: getOptionNum("INTEGER"),
            required: true,
        },
    ],

    async execute(interaction){
        const numFlips = interaction.options.getInteger('N')
        let results = []
        for (let i = 0; i < numFlips; i++) {
            results.push(Math.random() >= 0.5 ? "Heads" : "Tails")
        }
        await interaction.reply({ content: `Flipped a coin ${numFlips} times: ${results.join(", ")}` })
    }
}