const { basename, AuditLogEvent, Collection } = require("discord.js");
const { modlogsModel } = require("../../database/models");
const { embed_builder, botHasBasicPerms } = require("../../utils/utils");
const { checkModlogSettings } = require("../../utils/modlogs");

module.exports = {
    name: "guildMemberUpdate",
    once: false,
    /** 
     * @param {import('discord.js').GuildMember} oldMember 
     * @param {import('discord.js').GuildMember} newMember 
     */
    async execute(oldMember, newMember){
        let addedRoles = new Collection();
        let removedRoles = new Collection();
        const client = newMember.client;
        const guildId = newMember.guild.id;
                
        if(oldMember.roles.cache.size === newMember.roles.cache.size && 
            oldMember.roles.cache.every(role => newMember.roles.cache.has(role.id))) return;
        const modlogDoc = await modlogsModel.findOne({ guildId });
        if(!modlogDoc || !modlogDoc?.channelId) return;
        

        if(!oldMember || oldMember?.roles?.cache?.size <= 1){
            try {
                const fetchedLogs = await newMember.guild.fetchAuditLogs({
                    limit: 1,
                    type: AuditLogEvent.MemberRoleUpdate,
                });
                const roleLogs = fetchedLogs.entries.first();
                
                if(roleLogs && roleLogs.target.id == newMember.id){
                    const roleChanges = roleLogs.changes[0]
                    const fetchedRole = await newMember.guild.roles.fetch(roleChanges.new[0].id)
                    
                    if(!fetchedRole) return;

                    if(roleChanges.key == "$add"){
                        addedRoles.set(fetchedRole.id, fetchedRole)
                    } else if(roleChanges.key == "$remove"){
                        removedRoles.set(fetchedRole.id, fetchedRole)
                    }

                } else return;
            } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
            return;
            }
        } else {
            addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        }
        
        try {
            const modlogChannel = await newMember.guild.channels.fetch(modlogDoc.channelId);
            if(!modlogChannel) return;
            if(!botHasBasicPerms(modlogChannel, oldMember)) return;

            const isTurnedOn = await checkModlogSettings("memberRoleUpdate", guildId)
            if(!isTurnedOn) return;

            if(addedRoles?.size > 0 && addedRoles){
                const mainDescription = `<@!${newMember.id}>'s roles were updated`;
                const addEmbed = embed_builder(null,mainDescription, process.env.green)
                .setTimestamp().setAuthor({ name:"Member Roles Updated" })
                .setThumbnail(newMember.displayAvatarURL({ size: 64 })).setFooter({ text: `ID: ${newMember.id}`});
                addedRoles.forEach(role => {
                    addEmbed.setDescription(`${mainDescription}\n\nAdded **\`${role.name}\`** (<@&${role.id}>)`)
                    modlogChannel.send({ embeds: [addEmbed] }).catch(console.error)
                })
            }
             if(removedRoles?.size > 0 && removedRoles){
                const mainDescription = `<@!${newMember.id}>'s roles were updated`;
                const removeEmbed = embed_builder(null,mainDescription, process.env.red)
                .setTimestamp().setAuthor({ name:"Member Roles Updated" })
                .setThumbnail(newMember.displayAvatarURL({ size: 64 })).setFooter({ text: `ID: ${newMember.id}`});
                removedRoles.forEach(role => {
                   removeEmbed.setDescription(`${mainDescription}\n\nRemoved **\`${role.name}\`** (<@&${role.id}>)`)
                    modlogChannel.send({ embeds: [removeEmbed] }).catch(console.error)
                })
            }

        } catch(err){
            console.error(`Error in ${basename(__filename)}: `,err)
        }
    }
}