require('dotenv').config({ path: '../.env' })
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags} = require("discord.js")

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
const hiddenFlag = MessageFlags.Ephemeral 

module.exports = {
    retry,
    getOptionNum,
    getPermissionNum,
    embed_info,
    embed_builder,
    hiddenFlag,
}