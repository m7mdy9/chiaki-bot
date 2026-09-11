const { logModAction } = require("../../../utils/modlogs.js")
const { getOptionNum, getPermissionNum, embed_builder, checkMemberPermissions } = require("../../../utils/utils.js")

module.exports = {
    name:"remove",
    description:"Remove the timeout of a student.",
    options:[
        {
            name:'member',
            description: "Student to timeout",
            type: getOptionNum("USER"),
            required: true
        },
    ],
    permissions: getPermissionNum("ModerateMembers"),
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const userHasCorrectPerms = checkMemberPermissions(interaction.member, "ModerateMembers")
        if(!userHasCorrectPerms){
            interaction.editReply("You do not have permissions to **Moderate/Timeout Members**.")
            return; 
        }

        const editReply = (content)=>{interaction.editReply(content)}
        const botPerms = interaction.appPermissions.has("ModerateMembers")
        if(!botPerms){
            return await editReply("I do not have permissions to remove timeouts from students.")
        }

        const targetMember = interaction.options.getMember('member')

        let timeoutMsg = `Your timeout has been removed in **${interaction.guild.name}**`

        const targetRolePos = targetMember.roles.highest.rawPosition
        const executorRolePos = interaction.member.roles.highest.rawPosition
        
        const guildOwner = interaction.guild.ownerId
        const isOwner = interaction.member.id === guildOwner
        const timedOut = targetMember.isCommunicationDisabled()

        const checkList = [
            { check: !targetMember,
                returnMessage: "The student is not in this virtual world." },
            { check: !timedOut,
                returnMessage: "This student is not timed out." },
            { check: executorRolePos <= targetRolePos && !isOwner, 
                returnMessage: "You can remove the timeout for someone with a roles higher than or equal to yours." },
            { check: targetRolePos >= interaction.guild.members.me.roles.highest.rawPosition,
                returnMessage: "I can not remove the timeout for someone with higher or equal roles to mine." },
        ]

        const failedCheck = checkList.find(rule => rule.check)?.returnMessage
        if (failedCheck) return editReply(failedCheck)

        try {
            await targetMember.timeout(null)
            targetMember.send({ embeds: [embed_builder(null, timeoutMsg, "#9bffa8")] }).catch(err => {
                console.error(`Error in sending timeout remove dm`, err)
            })
            logModAction(interaction, "timeoutRemove", interaction.member, targetMember)
            await interaction.editReply({
                embeds: [
                    embed_builder(
                        null,
                        `Successfully removed the timeout for **${targetMember.user.username}**`
                    )
                ]
            })
        } catch (err) {
            console.error("Error in timeout: ", err)
            return editReply("I could remove the timeout of this student.\nIf you believe this an error report it to my developer.")
        }
    }
}