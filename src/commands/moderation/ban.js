const { logModAction } = require("../../utils/modlogs.js")
const { getPermissionNum, getOptionNum, checkMemberPermissions } = require("../../utils/utils")
const { embed_builder } = require("../../utils/utils.js")

module.exports = {
    name: "ban",
    description: "Ban a member from this discord server.",
    options: [
        {
            name: "member",
            description: "Choose the member to be banned.",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "reason",
            description: "Provide reasoning for the removal.",
            type: getOptionNum("STRING"),
            required: false,
        },
        {
            name: "delmessages",
            description: "Delete messages sent by user in the past 7 days.",
            type: getOptionNum("BOOLEAN"),
            required: false,
        }
    ],
    permissions: getPermissionNum("BanMembers"),
    /**
     * 
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        try {
            const userHasCorrectPerms = checkMemberPermissions(interaction.member, "BanMembers")
            if(!userHasCorrectPerms){
                interaction.editReply({content: "You do not have permissions to **Ban/Unban Members**."})
                return; 
            }

            const editReply = (content)=>{interaction.editReply({content})}
            const botPerms = interaction.appPermissions.has("BanMembers")
            
            const targetUser = interaction.options.get("member")
            const targetId = targetUser.user.id
            const executor = interaction.member
            const isExecutorGuildOwner = executor.id === interaction.guild.ownerId
            const isTargetGuildOwner = targetId === interaction.guild.ownerId

            const executorRolePos = executor.roles?.highest?.rawPosition || 0;
            const userRolePos = targetUser?.member?.roles?.highest?.rawPosition || 0;

            const reasonOption = interaction.options.getString("reason")
            const reason = `${reasonOption ?? "No reason provided."}\nBanned by ${executor.user.username}`
            
            const memberBannable = targetUser?.member?.bannable ?? true
            const isInServer = await interaction.guild.members.fetch(targetId).catch(()=>false)
            const isBanned = await interaction.guild.bans.fetch(targetId).catch(()=> false)

            const checkList = [
                { check: !botPerms,
                    returnMessage: "I do not possess permissions to ban members. If you would like to execute the ban command please add the Ban Members my permissions."},
                { check: targetId === executor.id,
                    returnMessage: "You may not ban yourself."},
                { check: executorRolePos <= userRolePos && !isExecutorGuildOwner,
                    returnMessage: "You may not ban another student with a higher role or equivelent role to yours!"},
                { check: isTargetGuildOwner,
                    returnMessage: "You can not ban the owner of this server!"},
                { check: targetId === interaction.client.user.id,
                    returnMessage: "I can't do it..."},
                { check: !memberBannable,
                    returnMessage: "I can not ban this student."},
                { check: isBanned,
                    returnMessage: "This user is already banned."},
            ]

            const failedCheck = checkList.find(rule => rule.check)?.returnMessage
            if(failedCheck) return editReply(failedCheck);

            let banText = `You have been banned from **${interaction.guild.name}**`
            if (reasonOption) banText += ` | ${reasonOption}`
            const banEmbed = embed_builder(null, banText, "#ff8d8d")

            if (!targetUser.user.bot && isInServer) {
                targetUser.user.send({ embeds: [banEmbed] }).catch(err => console.error("Error in sending ban dm", err))
            }

            await interaction.guild.members.ban(targetId, {
                deleteMessageSeconds: interaction.options.get("delmessages") ? 60 * 60 * 24 * 7 : 0,
                reason
            })
            logModAction(interaction, "ban", interaction.member, targetUser, reasonOption)
            
            let outputMessage = `Banned **${targetUser.user.username}**`
            if (reasonOption) { outputMessage += ` for \`${reasonOption}\`` }
            await interaction.editReply(outputMessage)
        } catch (err) {
            console.error("Error in ban command: ", err)
            return await interaction.editReply("An error has occured, the member was not banned.")
        }
    }
}