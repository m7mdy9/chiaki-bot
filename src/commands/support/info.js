const { kofiLink, supportServerInvite, embed_builder, kofiLogo, botInvite, pinkHex, RedAscii, ResetAscii } = require('../../utils/utils')

function embed_info(ownerId, client, result, time){
    try{
    const embed1 = embed_builder("Information", 
        `The bot is developed by <@!${ownerId}>`
        +`\nCurrent Ping: **${client.ws.ping}ms**`
        +`\nUptime: **${result} ${time}**`
        +`\nServers: **${client.guilds.cache.size}**`
        +`\n**[Check Chiaki Bot Github Page!](https://github.com/m7mdy9/chiaki-bot)**`
        +`\n**[[Bot Invite Link]](${botInvite})**\n**[[Support Server]](${supportServerInvite})**`
        +`\n\nLiking the bot so far? **[Consider tipping me on Ko-fi ${kofiLogo}](${kofiLink})**`,
        pinkHex
    )
    return embed1
    } catch(error){
        console.error(error)
    }    
}

const RED = RedAscii
const RESET = ResetAscii
const ownerId = process.env.OWNER_ID
module.exports = {
    name: "info",
    description: "View information about me, my developer and my Github Page!",
    isInstalled: true,
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
            console.error(`${RedAscii}Error in info: ${ResetAscii}`, error)
        }
    }
}