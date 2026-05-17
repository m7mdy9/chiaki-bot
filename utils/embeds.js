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

function embed_info(ownerId, client, result, time){
    try{
    const embed1 = embed_builder("Information", 
        `The bot was developed and made by <@!${ownerId}>
        \n\nCurrent Ping: **${client.ws.ping}ms**
        \n\nUptime: **${result} ${time}**
        \n\n**[Check Chiaki Bot Github Page!](https://github.com/m7mdy9/chiaki-bot)**`,
        "#ffdcfc"
    )
    return embed1
    } catch(error){
        console.error(error)
    }    
}

module.exports = {
    embed_info,
    embed_builder,
}