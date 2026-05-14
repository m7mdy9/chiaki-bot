const { EmbedBuilder } = require("discord.js")

function embed_builder(title, description = null, color = null){
    try {
    const embed = new EmbedBuilder()
        .setTitle(title.toString())
    if(description){
        embed.setDescription(description.toString())
    }
    if(color){
        embed.setColor(color)
    }
    return embed
    } catch (error){
    return  console.error(error)
    }
}
// function embed_rankchange(action, exevalue, exerole, usernamevalue, previousRank, currentRank, timestamp){
//     try {
//     const color1 = (action === 'Promotion' ? '#00d907' : "#ad0000")
//     const embed = embed_builder(`FGA ${action}`, null, color1)
//         embed.addFields(
//             { name: 'User Executing', value: exevalue, inline: true },
//             { name: 'User\'s Rank', value: exerole, inline: true },
//             { name: 'Date', value: timestamp, inline: true },
//             { name: '\u200b', value: '\u200b', inline:false},
//             { name: 'Unit Affected', value: usernamevalue, inline: true },
//             { name: 'Old Rank', value: previousRank, inline: true },
//             { name: 'New Rank', value: currentRank, inline: true }
//         );
//         return embed
//     } catch(error){
//         return console.error(error)
//     }
// }

function embed_info(ownerId, client, result, time){
    try{
    const embed1 = embed_builder("Information", 
        `The bot was developed and made by <@!${ownerId}> \n\nCurrent Ping: **${client.ws.ping}ms**\n\nUptime: **${result} ${time}**\n\n[Check Chiaki Bot Github Page!](https://github.com/m7mdy9/chiaki-bot)`,
        "DarkBlue"
    )
    return embed1
    } catch(error){
        console.error(error)
    }    
}

module.exports = {
    // embed_rankchange,
    embed_info,
    embed_builder
}