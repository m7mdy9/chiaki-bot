const { basename } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms, channelTypeNumToName, checkmarkEmoji, crossEmoji } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "roleUpdate",
    once: false,
    /** 
     * @param {import('discord.js').Role} oldRole 
     * @param {import('discord.js').Role} newRole 
    */
    async execute(oldRole, newRole){
        const guild = newRole.guild
        const guildId = guild.id;

        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;
        
        try {
            const modlogChannel = await guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, guild)) return;
            
            const isTurnedOn = await checkModlogSettings("roleActions", guildId)
            if(!isTurnedOn) return;

            const oldRolePosition = oldRole.position;
            oldRole.position = newRole.position
            if(oldRole.equals(newRole)) return;

            const isEveryone = newRole.id === guildId;

            const embedTitle = isEveryone ? `@everyone Updated` : "Role Update"
            const embedDescription = isEveryone ? `**@everyone** was edited.` : `**<@&${newRole.id}>** was edited.`
            const embedColor = isEveryone ? undefined : newRole.hexColor

            const embed = embed_builder(embedTitle, embedDescription, embedColor)
            .setFooter({ text: `ID: ${newRole.id}` }).setTimestamp()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) })

            const nameChanged = oldRole.name !== newRole.name;
            const colorChanged = oldRole.hexColor !== newRole.hexColor;
            const hoistChanged = oldRole.hoist !== newRole.hoist;
            const mentionableChanged = oldRole.mentionable !== newRole.mentionable;
            const iconChanged = oldRole.icon !== newRole.icon;
            const permissionsChanged = !oldRole.permissions.equals(newRole.permissions)

            if(nameChanged){
                embed.addFields({ name: 'Name Updated', value:`**Before:** ${oldRole.name}\n**After:** ${newRole.name}`, inline: true})
            }

            if(colorChanged){
                embed.addFields({ name: 'Color Updated', value:`**Before: \`${oldRole.hexColor}\`**\n**After: \`${newRole.hexColor}\`**`, inline: true, })
            }

            if(nameChanged && colorChanged && hoistChanged && mentionableChanged){
                embed.addFields({ name: "\u200b", value: "\u200b", inline: true })
            }
            
            if(hoistChanged){
                embed.addFields({ name: "Show online members seperately", value:`Changed to: **${newRole.hoist ? "On" : "Off"}**`, inline: true})
            }

            if(mentionableChanged){
                embed.addFields({ name: "Can be mentioned by everyone", value:`Changed to: **${newRole.mentionable ? "On" : "Off"}**`, inline: true})
            }

            if(iconChanged){
                const oldIconUrl = oldRole.iconURL({forceStatic: false, size: 256}) || null;
                const newIconUrl = newRole.iconURL({forceStatic: false, size: 256});

                embed.addFields({ name: "Role Icon Updated", value: `**Before:** ${oldIconUrl ? `**[Icon Link](${oldIconUrl})**`: "None"}\n**After:** **[Icon Link](${oldIconUrl})**` , inline: true})
            }

            if(embed.data.fields?.length % 3 == 0 && embed.data.fields?.length > 3){
                while(embed.data.fields?.length % 3 == 0){
                    embed.addFields({ name: "\u200b", value: "\u200b", inline: true })
                }
            }

            if(permissionsChanged){
                const oldPermissions = oldRole.permissions.toArray();
                const newPermissions = newRole.permissions.toArray();
                
                const addedPermissions = newPermissions.filter(perm => !oldRole.permissions.has(perm));
                const removedPermissions = oldPermissions.filter(perm => !newRole.permissions.has(perm));

                let formattedAddedPerms = "";
                let formattedRemovedPerms = "";

                if(addedPermissions.length > 0){
                    formattedAddedPerms = `${checkmarkEmoji} **Added Permission(s):** ${addedPermissions.map(perm => `**\`${perm}\`**`).join(", ")}`
                    + "\n";
                }
                if(removedPermissions.length > 0){
                    formattedRemovedPerms = `${crossEmoji} **Removed Permission(s):** ${removedPermissions.map(perm => `**\`${perm}\`**`).join(", ")}`
                    + "\n";
                }

                if(formattedAddedPerms || formattedRemovedPerms){
                    embed.addFields({ name: `Permissions Updated`, value:`${formattedAddedPerms}${formattedRemovedPerms}` ,inline: false })
                }
            }

            if(embed?.data?.fields?.length < 1){
                return;
            }
            
            await modlogChannel.send({ embeds:[embed] });
        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}