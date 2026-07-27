const { logModAction } = require("../../../utils/modlogs.js")
const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")

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
        const editReply = (content)=>{interaction.editReply(content)}
        const botPerms = interaction.appPermissions.has("ModerateMembers")
        const targetMember = interaction.options.getMember('member')

        let timeoutMsg = `Your timeout has been removed in **${interaction.guild.name}**`

        const targetRolePos = targetMember.roles.highest.rawPosition
        const executorRolePos = interaction.member.roles.highest.rawPosition
        
        const guildOwner = interaction.guild.ownerId
        const isOwner = interaction.member.id === guildOwner
        const timedOut = targetMember.isCommunicationDisabled()

        if(!botPerms){
            return await editReply("I do not have permissions to remove timeouts from students.")
        } else if(!targetMember){
            return await editReply("The student is not in this virtual world.")
        } else if(!timedOut){
            return await editReply("This student is not timed out.")
        } else if(executorRolePos <= targetRolePos && !isOwner){
            return await editReply("You can remove the timeout for someone with a roles higher than or equal to yours.")
        } else if(targetRolePos >= interaction.guild.members.me.roles.highest.rawPosition){
            return await editReply("I can not remove the timeout for someone with higher or equal roles to mine.")
        } else {
            try{
                await targetMember.timeout(null)
                await targetMember.send({embeds:[embed_builder(null, timeoutMsg, "#9bffa8")]})
                logModAction(interaction, "timeoutRemove", interaction.member, targetMember)
                await interaction.editReply({
                    embeds:[
                        embed_builder(
                            null,
                            `Successfully removed the timeout for **${targetMember.user.username}**`
                            )
                        ]
                })
            } catch(err){
                console.error("Error in timeout: ",err)
                return await editReply("I could remove the timeout of this student.\nIf you believe this an error report it to my developer.")
            }
        }
    }
}