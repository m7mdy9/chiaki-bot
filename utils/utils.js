require('dotenv').config({ path: '../.env' })
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require("discord.js")

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

function parseDuration(duration) {
    const regex = /^(\d+)([dhm])$/; // Matches formats like "1d", "3h", "15m"
    const match = duration.match(regex);

    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000; // Days to milliseconds
        case 'h': return value * 60 * 60 * 1000;      // Hours to milliseconds
        case 'm': return value * 60 * 1000;          // Minutes to milliseconds
        default: return null;
    }
}
function makedurationbigger(duration) {
    const regex = /^(\d+)([dhm])$/; // Matches formats like "1d", "3h", "15m"
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
        case 'd': return value + " day(s)" // Days to milliseconds
        case 'h': return value +  " hour(s)"   // Hours to milliseconds
        case 'm': return value + " minute(s)"        // Minutes to milliseconds
        default: throw new Error("Invalid usage");
    }
    
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
    console.log(output)
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
function embed_builder(title=null, description=null, color = null){
    try {
    if(!title && !description) throw new Error("You must include a title or a description.");
    const embed = new EmbedBuilder()
    if(title){
        embed.setTitle(title.toString())
    }
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
        \n\n**[Check Chiaki Bot Github Page!](https://github.com/m7mdy9/chiaki-bot)**
        \n\n**[Bot Invite Link](https://discord.com/oauth2/authorize?client_id=1502713354936914080&permissions=8&integration_type=0&scope=bot+applications.commands)**`,
        "#ffdcfc"
    )
    return embed1
    } catch(error){
        console.error(error)
    }    
}
module.exports = {
    retry,
    parseDuration,
    makedurationbigger,
    getOptionNum,
    getPermissionNum,
    embed_info,
    embed_builder,
}