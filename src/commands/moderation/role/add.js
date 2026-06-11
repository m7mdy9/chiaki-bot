const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name: "add",
    description: "Adds a role to the selected member.",
    options:[
        {
            name: "member",
            description: "Member to gain the role",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "role",
            description: "Select the role to be added",
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

        if(!botPerms){
            return await editReply("I do not possess permissions to add roles.\nGrant me the `Manage ROles` permission if you would like to run this command again.")
        } else if(targetRolePos >= userHighestRolePos && !isOwner){
            return await editReply("You may not add a role higher than yours.")
        } else if(targetHighestRolePos > userHighestRolePos && !isOwner && targetUser.id != interaction.member.id){
            return await editReply("You may not add a role to someone with higher roles than you.")
        } else if(targetRolePos >= botHighestRolePos){
            return await editReply("I can not add a role higher or equal to my highest role.")
        } else if(targetRole.id == interaction.guild.id){
            return await editReply("The everyone role can not be added as it belongs to anyone in the server.")
        } else if(targetHasRole){
            return await editReply("This member already has that role.")
        } else {
            await targetUser.roles.add(targetRole.id)
            await interaction.editReply({embeds:[
                embed_builder(null, `**${targetUser.user.username}** is now the Ultimate **${targetRole.name}**`)
            ]})
        }
    }
}