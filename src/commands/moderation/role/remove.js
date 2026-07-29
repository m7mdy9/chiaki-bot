const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name: "remove",
    description: "Removes specified role from a selected member.",
    options:[
        {
            name: "member",
            description: "Member to lose the role",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "role",
            description: "Select the role to be removed",
            type: getOptionNum("ROLE"),
            required: true,
        },
    ],
    permissions: getPermissionNum("ManageRoles"),
    /**
     * 
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const editReply = (content)=>{interaction.editReply(content)}
        const botPerms = interaction.appPermissions.has("ManageRoles")
        const targetRole = interaction.options.getRole('role')
       
        const isOwner = interaction.member.id == interaction.guild.ownerId
        const targetUser = interaction.options.getMember('member') 
        const targetHasRole = targetUser.roles.cache.has(targetRole.id)
        
        const botHighestRolePos = interaction.guild.members.me.roles.highest.rawPosition
        const targetRolePos = targetRole?.rawPosition
        const userHighestRolePos = interaction.member.roles.highest.rawPosition
        const targetHighestRolePos = targetUser.roles.highest.rawPosition

        if(!targetUser){
            return await editReply("This user is not in the server.")
        }
        if(!botPerms){
            return await editReply("I do not possess permissions to remove roles.\nGrant me the `Manage ROles` permission if you would like to run this command again.")
        }
        if(targetRolePos >= userHighestRolePos && !isOwner){
            return await editReply("You may not remove a role higher or equal to yours.")
        }
        if(targetHighestRolePos > userHighestRolePos && !isOwner && targetUser.id != interaction.member.id){
            return await editReply("You may not remove a role to someone with higher roles than you.")
        }
        if(targetRolePos >= botHighestRolePos){
            return await editReply("I can not remove a role higher or equal to my highest role.")
        }if(targetRole.id == interaction.guild.id){
            return await editReply("The everyone role can not be removed as it belongs to anyone in the server.")
        }if(!targetHasRole){
            return await editReply("This member doesn't have that role.")
        }
        try {
            await targetUser.roles.remove(targetRole.id)
            await interaction.editReply({embeds:[
                embed_builder(null, `**${targetUser.user.username}** is no longer the Ultimate **${targetRole.name}**`)
            ]})
        } catch(err){
            await editReply("Could not remove role from user.\n-#if you think there's an error please use \`/report bug\`")
            console.error(`Couldn't remove role in role/remove.js: `,err)
        }
    }
}