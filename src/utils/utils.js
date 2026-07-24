const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags, ActivityType, ActionRowBuilder, AttachmentBuilder, ChannelType} = require("discord.js")
const { resolve } = require('path') 
const Piscina = require("piscina")
const { dark_red, RED, YELLOW, RESET, DARK_GREY } = process.env
const chrono = require("chrono-node")

/**
 * @param {'SUB_COMMAND' | 'SUB_COMMAND_GROUP' | 'STRING' | 
 * 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' 
 * | 'ROLE' | 'MENTIONABLE' | 'NUMBER' | 'ATTACHMENT'} type
 * @returns {Number} Integer that corresponds to the type of the Discord given option
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

    if(output == 0 || !discordOptionTypes.includes(type)){
        return 3
    }

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
 * @returns {string} Stringified Permission Bitfield
*/
function getPermissionNum(type){
    return PermissionFlagsBits[type].toString();
}

/**
 * @param {'GuildText' | 'DM' | 'GuildVoice' 
 * | 'GroupDM' | 'GuildCategory' | 'GuildAnnouncement' 
 * | 'AnnouncementThread' | 'PublicThread' | 'PrivateThread' 
 * | 'GuildStageVoice' | 'GuildDirectory' | 'GuildForum' | 'GuildMedia'} type - The string name of the channel type.
 * @returns {import('discord.js').ChannelType} Channel Type via `discord.js`
 */
function getChannelType(type){
    return ChannelType[type];
}

/**
 * @typedef {'GuildText' | 'DM' | 'GuildVoice' | 'GroupDM' | 'GuildCategory' | 'GuildAnnouncement' | 'AnnouncementThread' | 'PublicThread' | 'PrivateThread' | 'GuildStageVoice' | 'GuildDirectory' | 'GuildForum' | 'GuildMedia'} DiscordChannelTypeString
 */

/**
 * @type {Record<DiscordChannelTypeString, number>}
 */
const ChannelTypesNum = {
    GuildText: 0,
    DM: 1,
    GuildVoice: 2,
    GroupDM: 3,
    GuildCategory: 4,
    GuildAnnouncement: 5,
    AnnouncementThread: 10,
    PublicThread: 11,
    PrivateThread: 12,
    GuildStageVoice: 13,
    GuildDirectory: 14,
    GuildForum: 15,
    GuildMedia: 16
};

/**
 * @param {DiscordChannelTypeString} type
 * @returns {number} Raw API number! 
 */
function getChannelTypeNum(type){
    return ChannelTypesNum[type]
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

/** @param {import("discord.js").Client} client - Client of the Discord Bot*/
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
 * @param {import('discord.js').Message} message - The Discord Message which you would like to fetch its Embeds.
 * @returns {import('discord.js').EmbedBuilder[]} Array of embeds that belong to the chosen `message`.
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

// gifWorker that is used in the makeExecutionGif() function
const gifWorker = new Piscina({
    filename: resolve(process.cwd(), "src/workers/gifWorker.js")
})

/**
 * Details of the function:
 * 1. Fetches the uptime of the node process.
 * 2. Runs the gifWorker with the given parameters
 * 3. Converts the gifBuffer from Uint8Array into Buffer
 * 4. Creates a discord AttachmentBuilder from the Buffer, with the name `execute-avatar.gif`
 * 5. Measures the current uptime and subtracts the uptime fetched at the beginning from it (approximated to nearest 2 decimals)
 * 6. Logs how long it took to finish the process
 * 7. Finally, it returns an array of [gifAttachment, timeTakenToExecute]
 * @param {URL} avatarURL - The URL of the avatar that will be displayed on the execution gif.
 * @param {String} username - Username of the user that will be animated on the execution gif.
 * @returns {[import('discord.js').AttachmentBuilder, String]} Returns discordjs AttachmentBuilder of newly made gif and the time taken in the order as follows [gifAttachment, time]
 */
async function makeExecutionGif(avatarURL, username){
    // measuring how long it has been since the process started
    const startTime = performance.now()

    // running our gifWorker.js as a threaded gifWorker to avoid blocking and performance drops and it returns a Uint8Array Buffer
    const gifBuffer = await gifWorker.run({avatarURL, username})

    // transfers the gifBuffer into the Buffer class so discord actually doesnt break the gif!
    const formattedGifBuffer = Buffer.from(gifBuffer)

    // creating the gif attachment that will be sent in discord
    const gifAttachment = new AttachmentBuilder(formattedGifBuffer, { name: 'execute-avatar.gif'})
    
    // measuring how long it took for the process in seconds and allowing 2 decimal points 
    const timeTakenToExecute = ((performance.now() - startTime)/1000).toFixed(2)

    console.log(DARK_GREY+`Time taken to finish execution gif: ${timeTakenToExecute}s`+RESET)

    return [gifAttachment, timeTakenToExecute]
}

function createAttachment(buffer, name){
    if(!name){
        name = 'output.png'
    }
    return new AttachmentBuilder(buffer, {name})
}

/**
 * @param {import('discord.js').Interaction} mainInt 
 * @param {import('discord.js').Interaction} secondaryInt 
 */
function intAuthorValidate(mainInt, secondaryInt){
    if(mainInt.user.id === secondaryInt.user.id){
        return true
    } else {
        secondaryInt.reply({content:"You didn't initiate this interaction.", flags:[hiddenFlag]})
        return false
    }
}


function formatDate(input){
    
    const parsedDate = chrono.en.GB.parseDate(input) // formats in DD/MM/YYYY (usually default is MM/DD/YYYY)
    
    if(!parsedDate) return null;

    const month = parsedDate.toLocaleString('en-US', { month: "long" }) 

    const day = parsedDate.getDate()

    let suffix = "th"
    if(day < 11 || day > 13){
        switch(day % 10){
            case 1: suffix = "st"; break;
            case 2: suffix = "nd"; break;
            case 3: suffix = "rd"; break;
        }
    }

    return `${month} ${day}${suffix}` // returns stuff like 'April 28th'
}

/**

 * @param {String} name - Channel Name 
 * @param {import('discord.js').CategoryChannel} category - Discord Category
 * @param {String} reason - Reason for channel creation
 * @returns {import('discord.js').TextChannel} Discord Channel
 */
async function createChannelInCategory(channelName, category, reason=null){
    try {
        const createdChannel = await category.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            reason,
        })
        return createdChannel
    } catch(err){
        console.error(`Couldn't create channel in category: ${category?.name}\nError: `,err)
    }
}

module.exports = {
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
    createAttachment,
    intAuthorValidate,
    formatDate,
    createChannelInCategory,
    getChannelType,
    getChannelTypeNum,
}