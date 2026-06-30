const { getOptionNum, getPermissionNum, embed_builder } = require("../../utils/utils.js")

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
            const targetUser = interaction.options.getMember('member')
            const editReply = (content)=>{interaction.editReply(content)}
            
            const botPerms = interaction.appPermissions.has("KickMembers")
            const reason = interaction.options.getString('reason')

            const executorRolePos = interaction.member.roles?.highest?.rawPosition || 0;
            const targetUserRolePos = targetUser?.roles?.highest?.rawPosition || 0;

            const reasonOutput = (reason ?? `No reason provided.`)+`\nKicked by ${interaction.user.username}` 
            let msgOutput = `Successfully kicked **${targetUser?.user?.username}**`
            let kickMsg = `You have been kicked from **${interaction?.guild?.name}**`
            if(reason){
                msgOutput += ` for ${reason}`
                kickMsg += ` | ${reason}`
            } 
            
            if(!botPerms){
                return await editReply("I do not possess permissions to kick members.\nGrant me `Kick Members` permissions, if you would like to run this command once more.")
            } else if(!targetUser){
                return await editReply("This user is not in the server.")
            } else if (targetUser.id === interaction.user.id){
                return await editReply("You may not kick yourself.")
            } else if(executorRolePos <= targetUserRolePos && interaction.member.id != interaction.guild.ownerId){
                return await editReply("You can not kick someone who has a role higher or equal to yours.")
            } else if(targetUser.id == interaction.guild.ownerId){
                return await editReply("You can not kick the owner of this server.")
            } else if (targetUser.id === interaction.client.user.id){
                return await editReply("I can not do it...")
            } else if (!targetUser?.kickable){
                return await editReply("I can not kick this user.") 
            } else {
                const isInServer = await interaction.guild.members.fetch(targetUser.user.id).catch(()=>null)

                if(!targetUser.user.bot && isInServer){
                    await targetUser.send({embeds:[embed_builder(null, kickMsg,'#ff8d8d')]})
                }
                await targetUser.kick(reasonOutput)
                await interaction.editReply({content: msgOutput})
            }
        } catch(err){
            console.error("Error in the kick command: ", err)
            interaction.editReply({embeds:[embed_builder('Error!', "An error has occured, the member is most likely not in the server.", "#ff3939")]})
        }
    }
}