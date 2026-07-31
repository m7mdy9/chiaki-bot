const { basename, OverwriteType } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms, channelTypeNumToName, checkmarkEmoji, crossEmoji } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");
const prettyMs = require("pretty-ms")

module.exports = {
    name: "channelUpdate",
    once: false,
    /** 
     * @param {import('discord.js').Channel} oldChannel
     * @param {import('discord.js').Channel} newChannel
    */
    async execute(oldChannel, newChannel){
        const guild = newChannel.guild
        const guildId = guild.id;

        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;
        
        try {
            const modlogChannel = await guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, newChannel)) return;
            
            const isTurnedOn = await checkModlogSettings("channelAction", guildId)
            if(!isTurnedOn) return;

            const channelTypeName = channelTypeNumToName(newChannel.type)
            const isCategory = channelTypeName == "Category"

            const embedDescription = isCategory ? `\`${newChannel.name}\` category was updated.` : `<#${newChannel.id}> was updated.`

            const embed = embed_builder(`${channelTypeName} Update`, embedDescription)
            .setFooter({ text: `ID: ${newChannel.id}` }).setTimestamp()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) })
            
            const isSynced = newChannel.permissionsLocked
            const nameChange = oldChannel.name !== newChannel.name;
            const topicChange = oldChannel.topic !== newChannel.topic;
            const categoryChanged = oldChannel.parentId !== newChannel.parentId;
            const syncChange = oldChannel.permissionsLocked !== newChannel.permissionsLocked;
            const slowmodeChange = oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser;
            
            const bitrateChanged = oldChannel.bitrate !== newChannel.bitrate;
            const userLimitChanged = oldChannel.userLimit !== newChannel.userLimit;
            
            
            const oldOverwrites = oldChannel.permissionOverwrites.cache;
            const newOverwrites = newChannel.permissionOverwrites.cache;
            let isRealSyncChange = syncChange ? false : true;
            
            if(oldOverwrites.size !== newOverwrites.size && !isRealSyncChange){
                isRealSyncChange = true;
            } else if(!isRealSyncChange){
                newOverwrites.forEach((newObj, id)=>{
                    const oldObj = oldOverwrites.get(id);

                    if(!oldObj || !oldObj.allow.equals(newObj.allow) || !oldObj.deny.equals(newObj.deny)){
                        isRealSyncChange = true;
                    }
                })
            }

            if(nameChange){
                embed.addFields({ name: 'Name Updated', value:`**Before:** ${oldChannel.name}\n**After:** ${newChannel.name}`, inline: true })
            }
            if(topicChange){
                const oldTopic = oldChannel.topic ? oldChannel.topic : "None"
                const newTopic = newChannel.topic ? newChannel.topic : "None"

                embed.addFields({ name: "Description Updated", value:`**Before:** ${oldTopic}\n**After:** ${newTopic}`, inline: true })
            }
            if(categoryChanged){
                const oldCategory = oldChannel?.parentId ? `**${oldChannel.parent.name}** category` : `**None**`
                const newCategory = newChannel?.parentId ? `**${newChannel.parent.name}** category` : `**None**`

                embed.addFields({ name: "Category Updated", value:`Moved from ${oldCategory} to ${newCategory}.`, inline: true })
            }
            if(syncChange && isRealSyncChange){
                embed.addFields({ name: "Permissions Sync Updated", value:`Permissions Sync is now set to: **${newChannel.permissionsLocked ? `On` : `Off`}**`, inline: true })
            }
            if(slowmodeChange){
                const oldRateLimit = oldChannel.rateLimitPerUser ? prettyMs(oldChannel.rateLimitPerUser*1000, { verbose: true }) : "None"
                const newRateLimit = newChannel.rateLimitPerUser ? prettyMs(newChannel.rateLimitPerUser*1000, { verbose: true }) : "None"

                embed.addFields({ name: "Slowmode Updated", value: `**Before:** ${oldRateLimit}\n**After:** ${newRateLimit}`, inline: true })
            }
            if(bitrateChanged){
                const oldBitrate = `${oldChannel.bitrate / 1000}kbps`  
                const newBitrate = `${newChannel.bitrate / 1000}kbps`  

                embed.addFields({ name: "Bitrate Updated", value:`**Before:** ${oldBitrate}\n**After:** ${newBitrate}`, inline: true })
            }
            if(userLimitChanged){
                const oldLimit = oldChannel.userLimit === 0 ? "Unlimited" : `${oldChannel.userLimit} user(s)`
                const newLimit = newChannel.userLimit === 0 ? "Unlimited" : `${newChannel.userLimit} user(s)`
            
                embed.addFields({ name: "User Limit Updated", value:`**Before:** ${oldLimit}\n**After:** ${newLimit}`, inline: true })
            }

            if(embed.data.fields?.length % 3 == 0 && embed.data.fields?.length > 3){
                while(embed.data.fields?.length % 3 == 0){
                    embed.addFields({ name: "\u200b", value: "\u200b", inline: true })
                }
            }

            
            let formattedPermChanges = []

            if((!isSynced && isRealSyncChange) || isCategory){
                newOverwrites.forEach((newOverwrite, id)=>{
                    const oldOverwrite = oldOverwrites.get(id);
                    
                    let targetName = newOverwrite.type === OverwriteType.Role ? 
                    `<@&${id}>` : `<@!${id}>`;
    
                    if(id == newChannel.guildId){
                        targetName = `@everyone`
                    }

                    if(!oldOverwrite){
                        const addedPermissions = `${checkmarkEmoji} **Added Permissions:** ${newOverwrite.allow.toArray().map(el => `\`${el}\``).join(", ")}\n`
                         || "";
                        
                         const removedPermissions = `${crossEmoji} **Removed Permissions:** ${newOverwrite.deny.toArray().map(el => `\`${el}\``).join(", ")}\n`
                         || "";
    
                        formattedPermChanges.push(
                            `- **${targetName}:-** ${addedPermissions}${removedPermissions}`
                        )
                        return;
                    }
    
                    if(!oldOverwrite.allow.equals(newOverwrite.allow) || !oldOverwrite.deny.equals(newOverwrite.deny)){

                        const addedAllows = newOverwrite.allow.toArray().filter(perm => !oldOverwrite.allow.has(perm)).map(el => `\`${el}\``).join(", ") || null
                        const removedAllows = oldOverwrite.allow.toArray().filter(perm => !newOverwrite.allow.has(perm)).map(el => `\`${el}\``).join(", ") || ""

                        const addedDenies = newOverwrite.deny.toArray().filter(perm => !oldOverwrite.deny.has(perm)).map(el => `\`${el}\``).join(", ") || null
                        const removedDenies = oldOverwrite.deny.toArray().filter(perm => !newOverwrite.deny.has(perm)).map(el => `\`${el}\``).join(", ") || ""

                        const formattedAllows = addedAllows ? `   - ${checkmarkEmoji} **Added Permissions Overwrites:** ${addedAllows}\n` : ""
                        const formattedDenies = addedDenies ? `   - ${crossEmoji} **Removed Permissions Overwrites:** ${addedDenies}\n` : ""
                        
                        const filteredRevertArray = 
                        [
                            removedAllows?.split(", ")?.filter(el => !addedDenies?.split(", ").includes(el))?.join(", "),
                            removedDenies?.split(", ")?.filter(el => !addedAllows?.split(", ").includes(el))?.join(", ")
                        ].filter(Boolean)
                        const revertedPermissions = filteredRevertArray[0] ? `   - ⏮️ **Reverted Overwrites**: ${filteredRevertArray.join(", ")}\n` : ""
                        
                        formattedPermChanges.push(
                            `- **${targetName}:-**\n${formattedAllows}${formattedDenies}${revertedPermissions}`
                        )
                        return;
                    }
                })

                oldOverwrites.forEach((oldOverwrite, id)=>{
                    if(newOverwrites.has(id)) {
                        return;
                    }

                    let targetName = oldOverwrite.type === OverwriteType.Role ? 
                    `<@&${id}>` : `<@!${id}>`;

                    if(id == newChannel.guildId){
                        targetName = `@everyone`
                    }

                    formattedPermChanges.push(
                        `${crossEmoji} **Overwrite Deleted** for ${targetName}`
                    )
                    return;
                })
            }

            if(formattedPermChanges.length > 0){
                embed.addFields({ name: "Permission Overwrites Update", value:`${formattedPermChanges.join("\n")}`, inline: false})
            }

            const embedLength = embed?.data?.fields?.length || 0;

            if(embedLength < 1){
                return;
            }

            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}