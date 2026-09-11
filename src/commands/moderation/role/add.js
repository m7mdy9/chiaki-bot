const { getOptionNum, getPermissionNum, embed_builder, checkMemberPermissions } = require("../../../utils/utils.js")

module.exports = {
    name: "add",
    description: "Adds specified role to the selected member.",
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
        const userHasCorrectPerms = checkMemberPermissions(interaction.member, "ManageRoles")
        if(!userHasCorrectPerms){
            interaction.editReply("You do not have permissions to **Manage Roles**.")
            return; 
        }

        const editReply = (content)=>{interaction.editReply(content)}
        const botPerms = interaction.appPermissions.has("ManageRoles")
        if(!botPerms){
            return await editReply("I do not possess permissions to add roles.\nGrant me the `Manage ROles` permission if you would like to run this command again.")
        }
        
        const targetRole = interaction.options.getRole('role')
       
        const isOwner = interaction.member.id == interaction.guild.ownerId
        const targetUser = interaction.options.getMember('member') 
        const targetHasRole = targetUser.roles.cache.has(targetRole.id)
        
        const botHighestRolePos = interaction.guild.members.me.roles.highest.rawPosition
        const targetRolePos = targetRole?.rawPosition
        const userHighestRolePos = interaction.member.roles.highest.rawPosition
        const targetHighestRolePos = targetUser.roles.highest.rawPosition

        const checkList = [
            { check: !targetUser, 
                returnMessage: "This user is not in the server." },
            { check: targetRolePos >= userHighestRolePos && !isOwner,
                returnMessage: "You may not add a role higher than yours." },
            { check: targetHighestRolePos > userHighestRolePos && !isOwner && targetUser?.id != interaction.member.id,
                returnMessage: "You may not add a role to someone with higher roles than you." },
            { check: targetRolePos >= botHighestRolePos,
                returnMessage: "I can not add a role higher or equal to my highest role." },
            { check: targetRole?.id == interaction.guild.id,
                returnMessage: "The everyone role can not be added as it belongs to anyone in the server." },
            { check: targetHasRole,
                returnMessage: "This member already has that role." },
        ]

        const failedCheck = checkList.find(rule => rule.check)?.returnMessage
        if (failedCheck) return editReply(failedCheck)

        try {
            await targetUser.roles.add(targetRole.id)
            await interaction.editReply({embeds:[
                embed_builder(null, `**${targetUser.user.username}** is now the Ultimate **${targetRole.name}**`)
            ]})
        } catch(err){
            editReply("Could not add role to user.\n-#if you think there's an error please use \`/report bug\`")
            console.error(`Couldn't add role in role/add.js: `,err)
        }
    }
}