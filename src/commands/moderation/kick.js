const { logModAction } = require("../../utils/modlogs.js")
const { getOptionNum, getPermissionNum, embed_builder, checkMemberPermissions } = require("../../utils/utils.js")

module.exports = {
    name: "kick",
    description: "Kick a member from this discord server.",
    permissions: getPermissionNum("KickMembers"),
    options: [
        {
            name: "member",
            description: "Member to kick",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "reason",
            description: "Provide reasoning for the kick.",
            type: getOptionNum("STRING"),
            required: false,
        },
    ],
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        try {
            const userHasCorrectPerms = checkMemberPermissions(interaction.member, "KickMembers")
            if(!userHasCorrectPerms){
                interaction.editReply({content: "You do not have permissions to **Kick Members**."})
                return;
            }
            
            const targetMember = interaction.options.getMember('member')
            const editReply = (content)=>{interaction.editReply({ content })}
            
            const botPerms = interaction.appPermissions.has("KickMembers")
            const reason = interaction.options.getString('reason')

            const executorRolePos = interaction.member.roles?.highest?.rawPosition || 0;
            const targetMemberRolePos = targetMember?.roles?.highest?.rawPosition || 0;

            const isExecutorGuildOwner = interaction.member.id === interaction.guild.ownerId
            const isTargetGuildOWner = targetMember?.id === interaction.guild.ownerId

            const reasonOutput = (reason ?? `No reason provided.`)+`\nKicked by ${interaction.user.username}` 
            let msgOutput = `Successfully kicked **${targetMember?.user?.username}**`
            let kickMsg = `You have been kicked from **${interaction?.guild?.name}**`
            if(reason){
                msgOutput += ` for ${reason}`
                kickMsg += ` | ${reason}`
            } 

            const checkList = [
                { check: !botPerms,
                    returnMessage: "I do not possess permissions to kick members.\nGrant me `Kick Members` permissions, if you would like to run this command once more."},
                { check: !targetMember,
                    returnMessage: "This user is not in the server."},
                { check: targetMember?.id === interaction.user.id,
                    returnMessage: "You may not kick yourself."},
                { check: executorRolePos <= targetMemberRolePos && !isExecutorGuildOwner,
                    returnMessage: "You can not kick someone who has a role higher or equal to yours."},
                { check: isTargetGuildOWner,
                    returnMessage: "You can not kick the owner of this server."},
                { check: targetMember?.id === interaction.client.user.id,
                    returnMessage: "I can't do it..."},
                { check: !targetMember?.kickable,
                    returnMessage: "I can not kick this user."},
            ]

            const failedCheck = checkList.find(rule => rule.check)?.returnMessage
            if(failedCheck) return editReply(failedCheck);
            
            const isInServer = await interaction.guild.members.fetch(targetMember.user.id).catch(()=>null)

            if(!targetMember.user.bot && isInServer){
                targetMember.send({embeds:[embed_builder(null, kickMsg,'#ff8d8d')]}).catch(err => {
                    console.err("Failed to send kick DM", err)});
            }
            await targetMember.kick(reasonOutput)
            logModAction(interaction, "kick", interaction.member, targetMember, reason)
            await interaction.editReply({content: msgOutput})

        } catch(err){
            console.error("Error in the kick command: ", err)
            interaction.editReply({embeds:[embed_builder('Error!', "An error has occured, the member is most likely not in the server.", "#ff3939")]})
        }
    }
}