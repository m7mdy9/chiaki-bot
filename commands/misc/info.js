require('dotenv').config({ path: '../.env' })
const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const { logerror, logstuff } = require("../../utils/utils.js");
const { embed_info } = require("../../utils/embeds.js")

const ownerId = process.env.ownerId
module.exports = {
    name: "info",
    description: "Information.",
        async execute(interaction) {
            const client = interaction.client
            try {
                    let result = Math.round(interaction.client.uptime / 60000)
                    let time = "minutes"
                    if (result >= 60){
                        let result1 = result / 60
                        result = result1.toFixed(1)
                        if (result >= 24){
                        result1 = result / 24
                        result = result1.toFixed(1)
                        time = "days"
                        } else {
                                time = "hours"
                        }
                    }
                    const embed1 = embed_info(ownerId, client, result, time)
                        await interaction.editReply({ embeds: [embed1] });
                    } catch (error){
                        console.error(`Error in info: `, error)
                    }
        }
}