const { basename } = require('discord.js');
const { modlogsModel, modlogSettingsModel } = require('../database/models');
const { botHasBasicPerms, embed_builder } = require('./utils');

/** 
 * @param { 'modAction' | 'ban' | 'unban' | 'kick' | 'warnAdd' | 'warnRemove' | 'warnClear' | 'timeoutAdd' | 'timeoutRemove' |
 *   'channelAction' | 'channelCreate' | 'channelDelete' | 'channelUpdate' |
 *   'memberJoinLeave' | 'memberJoin' | 'memberLeave' | 'guildMemberAdd' | 'guildMemberRemove' |
 *   'memberRoleUpdate' | 'guildMemberUpdate' | 'messageDeletion' |
 *   'messageDelete' | 'messageDeleteBulk' | 'roleUpdate' |
 *   'messageEdits' | 'messageUpdate' | 'messageEdit' |
 *   'roleActions' | 'roleCreate' | 'roleDelete' |
 *   'modlogChanges' | 'modlogUpdate' | 'modlogEdit' |
 *   'autoroleChanges' | 'autoroleUpdate' | 'autoroleEdit'} action
 * @param {String} guildId 
 */
async function checkModlogSettings(action, guildId){
    let settingsDoc = await modlogSettingsModel.findOne({ guildId });

    if(!settingsDoc){
        settingsDoc = await modlogSettingsModel.create({ guildId });
        return true;
    }
    let actionCategory;

    const actions = {
        moderativeActions: ["modAction","ban", "unban", "kick", "warnAdd", "warnRemove", "warnClear", "timeoutAdd", "timeoutRemove"],
        channelActions: ["channelAction","channelCreate", "channelDelete", "channelUpdate"],
        memberJoinLeave: ["memberJoinLeave","memberJoin", "memberLeave", "guildMemberAdd", "guildMemberRemove"],
        memberRoleUpdate: ["memberRoleUpdate", "guildMemberUpdate"],
        messageDeletion: ["messageDeletion","messageDelete", "messageDeleteBulk"],
        messageEdits: ["messageEdits","messageUpdate", "messageEdit"],
        roleActions: ["roleActions","roleCreate", "roleDelete", "roleUpdate"],
        modlogChanges: ["modlogChanges","modlogUpdate", "modlogEdit"],
        autoroleChanges: ["autoroleChanges","autoroleUpdate", "autoroleEdit"],
    }

    if(Object.keys(actions).includes(action)){
        actionCategory = action
    } else {
        actionCategory = (Object.entries(actions).find(([_, list]) => list.includes(action)))?.[0]
    }

    if(!actionCategory) throw new Error(`You somehow chose an incorrect action in checkModlogSettings\nIncorrent action: ${action}`);

    const isTurnedOn = settingsDoc.get(actionCategory)
    
    if(isTurnedOn == undefined){
        return true;
    }

    return isTurnedOn;
}

module.exports = {
    /**
     * @param {import('discord.js').Interaction} interaction 
     * @param {'ban' | 'unban' | 'kick' | 'warnAdd' | 'warnRemove' | 'warnClear' | 'timeoutAdd' | 'timeoutRemove' | 'specialOverride'} action 
     * @param {import('discord.js').User | import('discord.js').GuildMember} executor 
     * @param {import('discord.js').User | import('discord.js').GuildMember} target 
     */
    async logModAction(interaction, action, executor, target, reason=null, extras="", trueActionName){
        const guild = interaction.guild;
        const client = interaction.client;

        const modlogDoc = await modlogsModel.findOne({ guildId: guild.id });
        if(!modlogDoc || !modlogDoc?.channelId) return;

        try {

            const modlogChannel = await guild.channels.fetch(modlogDoc.channelId)
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, interaction)) return;
            const isTurnedOn = await checkModlogSettings(trueActionName ? trueActionName : action, guild.id);
            console.log(isTurnedOn)
            if(!isTurnedOn) return;

            let targetUsername = target?.username || target?.user?.username
            let targetAvatar = target?.displayAvatarURL({ size: 64 });
            let targetId = target?.id;

            let actionTitle, actionPast;

            // IF we are doing a special action, extras MUST be an array of two strings
            // The first String contains the title, meanwhile the second contains the description.

            const isSpecialAction = action === 'specialOverride'
            if(isSpecialAction){
                targetUsername = executor?.username || executor.user.username;
                targetAvatar = executor.displayAvatarURL({ size: 64 });
                targetId = executor.id;
            } else {
                switch (action) {
                    case "ban":
                        actionTitle = "Member Banned";
                        actionPast = "banned";
                        break;
                    case "unban":
                        actionTitle = "Member Unbanned";
                        actionPast = "unbanned";
                        break;
                    case "kick":
                        actionTitle = "Member Kicked";
                        actionPast = "kicked";
                        break;
                    case "warnAdd":
                        actionTitle = "Member Warned";
                        actionPast = "warned";
                        break;
                    case "warnRemove":
                        actionTitle = "Warning Removed";
                         actionPast = "removed warning for";
                        break;
                    case "warnClear":
                        actionTitle = "Warnings Cleared";
                        actionPast = "cleared warnings for";
                        break;
                    case "timeoutAdd":
                        actionTitle = "Member Timed Out";
                        actionPast = "timed out";
                        break;
                    case "timeoutRemove":
                        actionTitle = "Timeout Removed";
                        actionPast = "removed timeout for"
                        break;
                }
            }
            
            let embedDescription;
            if(isSpecialAction){
                actionTitle = extras[0];
                embedDescription = extras[1];
            } else {
                embedDescription = `**<@!${executor.id}> ${actionPast} <@!${target.id}>**${extras ? ` ${extras}`: "\n"}`
            }
            
            const logEmbed = embed_builder(actionTitle, embedDescription)
            .setAuthor({ name: targetUsername, iconURL: targetAvatar })
            .setFooter({ text:`UserID: ${targetId}` }).setTimestamp()

            if(reason && reason != "No reason provided." && !isSpecialAction){
                logEmbed.setDescription(`${embedDescription}\n**Reason:** ${reason}`)
            }

            await modlogChannel.send({ embeds:[logEmbed]} )
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `, err)
        }
    },
    checkModlogSettings
}