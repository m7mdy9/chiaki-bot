const { embed_info } = require("../../utils/utils.js");

const RED = process.env.RED
const RESET = process.env.RESET
const ownerId = process.env.ownerId
module.exports = {
    name: "info",
    description: "View information about Chiaki Bot, its developr and its Github Page.",
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const client = interaction.client
        try {
            let botUptime = Math.round(interaction.client.uptime / 60000) // starting up suffix as minutes
            let suffix = "minutes"
            if (botUptime >= 60) {
                botUptime = (botUptime / 60).toFixed(1) // change to hours
                if (botUptime >= 24) {
                    botUptime = (botUptime / 24).toFixed(1) // change to days
                    suffix = "days" // change suffix to days
                } else {
                    suffix = "hours" // change suffix to hours if it isnt more than 24h and is more than 60min
                }
            }
            const embed = embed_info(ownerId, client, botUptime, suffix)
            return interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error(`${RED}Error in info: ${RESET}`, error)
        }
    }
}