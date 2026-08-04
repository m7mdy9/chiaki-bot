const { WebhookClient } = require("discord.js");
const { embed_builder, redHex, RedAscii, ResetAscii } = require("./utils");
const { stripVTControlCharacters } = require("node:util")

const currentBranch = process.currentBranch;

const webhook = new WebhookClient({ url: process.env.MAIN_ERR_WEBHOOK })

const botName = "Chiaki Bot"
const iconURL = "https://images-ext-1.discordapp.net/external/ljpqgpRph_hDsvuoiseOpu14JjR_MoHy8H5Yo9WlMhE/%3Fsize%3D512/https/cdn.discordapp.com/avatars/1502713354936914080/2b58262a2b3e6f7112ef4b7785b248a9.webp?format=webp"

async function handleError(text, ...args){
    let err = args.join(" ")
    
    const redText = `${RedAscii}${stripVTControlCharacters(text)}${ResetAscii}`
    console.originalError(redText, err)
    
    if(!err){
        err = text;
        text = ""
    }
    const formattedText = text ? stripVTControlCharacters(text) : "Chiaki Bot Error";
    const formattedError = err ? stripVTControlCharacters(err) : "";

    if(currentBranch !== "main"){
        return;
    }

    try {
        const errorEmbed = embed_builder(formattedText,formattedError, "#e60000").setTimestamp()
        .setAuthor({ name: botName, iconURL:iconURL })

        await webhook.send({
            embeds:[errorEmbed]
        })
    } catch(secondError){
        console.originalError("VITAL ERROR: FAILED TO LOG ERROR, INFO:\n",secondError)
        
    }
}

async function webhookLog(text){
    const formattedText = text ? stripVTControlCharacters(text) : "";
    if(currentBranch !== "main"){
        return;
    }
    try {
        const logEmbed = embed_builder("Chiaki Bot Log",formattedText, "#58ff8a").setTimestamp()
            .setAuthor({ name: botName, iconURL:iconURL })

        await webhook.send({
            embeds:[logEmbed]
        })
    } catch(err){
        console.originalError("VITAL ERROR: FAILED TO LOG ERROR, INFO:\n",err)
    }
}

module.exports = { handleError, webhookLog }