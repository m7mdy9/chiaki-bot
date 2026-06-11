const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags, ActivityType, ActionRowBuilder, AttachmentBuilder} = require("discord.js")
const { resolve } = require('path') 
const Piscina = require("piscina")
const { dark_red, RED, YELLOW, RESET, DARK_GREY } = process.env

async function retry(fn, maxRetries = 3, delayMs = 2000) {
    let attempts = 0;
    let lastError;

    while (attempts < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            attempts++;
            const waitTime = delayMs * Math.pow(2, attempts); // Exponential backoff (power cause im stupid and dont know what exponential means)
            console.error(`Attempt ${attempts} failed. Retrying in ${waitTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError; // Rethrow the last error after max retries
} 
/**
 * @param {'SUB_COMMAND' | 'SUB_COMMAND_GROUP' | 'STRING' | 
 * 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' 
 * | 'ROLE' | 'MENTIONABLE' | 'NUMBER' | 'ATTACHMENT'} type 
 */
function getOptionNum(type="STRING"){
    // console.log(type)
    const discordOptionTypes = [
        "SUB_COMMAND",       // 1
        "SUB_COMMAND_GROUP", // 2
        "STRING",            // 3
        "INTEGER",           // 4
        "BOOLEAN",           // 5
        "USER",              // 6
        "CHANNEL",           // 7
        "ROLE",              // 8
        "MENTIONABLE",       // 9
        "NUMBER",            // 10
        "ATTACHMENT"         // 11
    ];
    let output = discordOptionTypes.indexOf(type) + 1
    // console.log(output)
    if(output == 0 || !discordOptionTypes.includes(type)){
        return 3
    }
    // console.log(output)
    return parseInt(output)
}
/**
 * 
 * @param {'CreateInstantInvite' | 'KickMembers' | 'BanMembers' 
 * |'Administrator' | 'ManageChannels' | 'ManageGuild' | 'AddReactions' 
 * | 'ViewAuditLog' | 'PrioritySpeaker' | 'Stream' | 'ViewChannel' 
 * | 'SendMessages' | 'SendTTSMessages' | 'ManageMessages' | 'EmbedLinks' 
 * | 'AttachFiles' | 'ReadMessageHistory' | 'MentionEveryone' | 'UseExternalEmojis' 
 * | 'ViewGuildInsights' | 'Connect' | 'Speak' | 'MuteMembers' 
 * | 'DeafenMembers' | 'MoveMembers' | 'UseVAD' | 'ChangeNickname' 
 * | 'ManageNicknames' | 'ManageRoles' | 'ManageWebhooks' | 'ManageGuildExpressions' 
 * | 'UseApplicationCommands' | 'RequestToSpeak' | 'ManageEvents' | 'ManageThreads' 
 * | 'CreatePublicThreads' | 'CreatePrivateThreads' | 'UseExternalStickers' | 'SendMessagesInThreads'
 * | 'ModerateMembers'} type 
 */
function getPermissionNum(type){
    return PermissionFlagsBits[type].toString();
}
function embed_builder(title=null, description=null, color ='#ffdcfc'){
    try {
        if (!title && !description) throw new Error("You must include a title or a description.");
        const embed = new EmbedBuilder()
        if (title) {
            embed.setTitle(title.toString())
        }
        if (description) {
            embed.setDescription(description.toString())
        }
        if (color) {
            embed.setColor(color)
        }
        return embed
    } catch (error) {
        return console.error(error)
    }
}

function embed_info(ownerId, client, result, time){
    try{
    const embed1 = embed_builder("Information", 
        `The bot was developed and made by <@!${ownerId}>
        \nCurrent Ping: **${client.ws.ping}ms**
        \nUptime: **${result} ${time}**
        \n**[Check Chiaki Bot Github Page!](https://github.com/m7mdy9/chiaki-bot)**
        \n**[Bot Invite Link](${process.env.INVITE})**`,
        "#ffdcfc"
    )
    return embed1
    } catch(error){
        console.error(error)
    }    
}

const rng_activity = (dict) => {
    const keys = Object.keys(dict)
    const randKey = keys[Math.floor(Math.random() * keys.length)]
    const value = dict[randKey]
    const randValue = value[Math.floor(Math.random() * value.length)]
    return [randKey, randValue]
}

/** @param {import("discord.js").Client} client  */
function startActivity(client){
    const activity_list = {
        Playing:[
            "Danganronpa: Trigger Happy Havoc",
            "Danganronpa 2: Goodbye Despair",
            "Danganronpa V3: Killing Harmony"
        ],
        Watching:[
            "Danganronpa 3: The End of Hope's Peak High School Despair Arc",
            "Danganronpa 3: The End of Hope's Peak High School Future Arc",
            "Danganronpa 3: The End of Hope's Peak High School Hope Arc",
            "Danganronpa 2.5: Nagito Komaeda and the World Destroyer"
        ],
        Listening:[
            "Danganronpa 1 OST",
            "Danganronpa 2 OST",
            "Danganronpa V3 OST",
        ]
    }

    setInterval(()=>{
        let selected_array = rng_activity(activity_list)
        eval(`client.user.setActivity(\"${selected_array[1]}\", {type: ActivityType.${selected_array[0]}})`)
        // console.log(selected_array)
    }, 90_000)
    client.user.setActivity('New World Order', { type:ActivityType.Listening})
}

const hiddenFlag = MessageFlags.Ephemeral 

/**
 * @param {import('discord.js').Message} message 
 * @returns Array of components of a message you have sent but they are all *disabled*. 
 */
function disableAllComponents(message) {
    if(!message.components || message.components.length === 0){
        return [];
    }

    const updatedRows = message.components.map(row =>{

        const newRow = ActionRowBuilder.from(row)

        newRow.components.forEach(component =>{
            component.setDisabled(true)
        })

        return newRow
    })
    return updatedRows
}

/**
 * @param {import('discord.js').Message} message 
 * @returns Array of embeds of the chosen ('message'). 
 */
function extractEmbedsFromMessage(message){
    if (!message.embeds || message.embeds.length === 0){
        return []
    }
    const constructedEmbeds = message.embeds.map(embed =>{
        return EmbedBuilder.from(embed)
    })

    return constructedEmbeds;
}


const gifWorker = new Piscina({
    filename: resolve(process.cwd(), "src/workers/gifWorker.js")
})

async function makeExecutionGif(avatarPath, username){
    // measuring how long it has been since the process started
    const startTime = performance.now()

    // running our gifWorker.js as a threaded gifWorker to avoid blocking and performance drops and it returns a Uint8Array Buffer
    const gifBuffer = await gifWorker.run({avatarPath, username})

    // transfers the gifBuffer into the Buffer class so discord actually doesnt break the gif!
    const formattedGifBuffer = Buffer.from(gifBuffer)

    // creating the gif attachment that will be sent in discord
    const gifAttachment = new AttachmentBuilder(formattedGifBuffer, { name: 'execute-avatar.gif'})
    
    // measuring how long it took for the process in seconds and allowing 2 decimal points 
    const timeTakenToExecute = ((performance.now() - startTime)/1000).toFixed(2)

    console.log(DARK_GREY+`Time taken to finish execution gif: ${timeTakenToExecute}s`+RESET)

    return [gifAttachment, timeTakenToExecute]
}
module.exports = {
    retry,
    getOptionNum,
    getPermissionNum,
    embed_info,
    embed_builder,
    hiddenFlag,
    rng_activity,
    startActivity,
    disableAllComponents,
    extractEmbedsFromMessage,
    gifWorker,
    makeExecutionGif,
}