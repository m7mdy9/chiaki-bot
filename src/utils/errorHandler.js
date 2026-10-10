const { WebhookClient } = require("discord.js");
const { embed_builder, RedAscii, ResetAscii, YellowAscii } = require("./utils");
const { stripVTControlCharacters } = require("node:util")

const currentBranch = "main";

const webhook = new WebhookClient({ url: process.env.MAIN_ERR_WEBHOOK })
const warnWebhook = new WebhookClient({ url: process.env.WARNING_WEBHOOK })

const botName = "Chiaki Bot"
const iconURL = "https://images-ext-1.discordapp.net/external/ljpqgpRph_hDsvuoiseOpu14JjR_MoHy8H5Yo9WlMhE/%3Fsize%3D512/https/cdn.discordapp.com/avatars/1502713354936914080/2b58262a2b3e6f7112ef4b7785b248a9.webp?format=webp"

async function handleError(text, ...args){
    const resultOfArgs = handleLogArgs("error", text, args)
    if(!resultOfArgs) return;
    
    const { formattedText, formattedLog } = resultOfArgs

    try {
        const errorEmbed = embed_builder(formattedText,formattedLog, "#e60000").setTimestamp()
        .setAuthor({ name: botName, iconURL:iconURL })

        await webhook.send({
            embeds:[errorEmbed]
        })
    } catch(secondError){
        console.originalError("VITAL ERROR: FAILED TO LOG ERROR, INFO:\n",secondError.stack)
        
    }
}

async function handleWarn(text, ...args){
    const resultOfArgs = handleLogArgs("warn", text, args)
    if(!resultOfArgs) return;
    
    const { formattedText, formattedLog } = resultOfArgs

    try {
        const errorEmbed = embed_builder(formattedText,formattedLog, "#ffda37").setTimestamp()
        .setAuthor({ name: botName, iconURL:iconURL })

        await warnWebhook.send({
            embeds:[errorEmbed]
        })
    } catch(secondError){
        console.originalError("VITAL ERROR: FAILED TO LOG ERROR, INFO:\n",secondError.stack)
        
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
            embeds:[logEmbed],
            username: "Happy Not Error Guy",
            avatarURL: "https://cdn.discordapp.com/attachments/1502727509261942884/1537528714047393802/image.png?ex=6a7f5eb3&is=6a7e0d33&hm=2ce08289f62b0218a8925cfab0996a81304622de55ed0d947e74e7f2c984eec2&"
        })
    } catch(err){
        console.originalError("VITAL ERROR: FAILED TO LOG ERROR, INFO:\n",err.stack)
    }
}

module.exports = { handleError, handleWarn, webhookLog }

/**
 * @param {"warn" | "error"} logType 
 */
function handleLogArgs(logType = "warn", text, args){
    let originalLog, consoleColor;
    if(logType == "error"){
        originalLog = console.originalError;
        consoleColor = RedAscii;
    } else {
        originalLog = console.originalWarn;
        consoleColor = YellowAscii;
    }

    if(currentBranch !== "main"){
        originalLog(text, ...args)
        return;
    }

    const rawError = args.find(arg => arg instanceof Error) || args[0] || text;

    let detailedLog = ""
    if(rawError instanceof Error){
        detailedLog = rawError.stack || rawError.message
    } else if(typeof rawError == "object"){
        detailedLog = JSON.stringify(rawError, null, 2)
    } else {
        detailedLog = args.map(arg => (typeof arg == "object" ? JSON.stringify(arg) : String(arg))).join(" ");
    }

    let logForConsole = rawError === text ? "" : rawError
    if(typeof text == 'string'){
        const coloredText = `${consoleColor}${stripVTControlCharacters(text)}${ResetAscii}`
        originalLog(coloredText, logForConsole)
    } else {
        originalLog(text, logForConsole)
    }
    
    if(args.length < 1 && !detailedLog){
        detailedLog = rawError;
        text = "";
    }
    const formattedText = text ? stripVTControlCharacters(text) : `Chiaki Bot ${logType.toUpperCase()}`;
    let formattedLog;
    if(detailedLog){
        formattedLog = formattedLog > 3989 ? stripVTControlCharacters(detailedLog).slice(0, 3990) + "...." : detailedLog;
    } else {
        formattedLog = ""
    }

    return { formattedText, formattedLog }
}