const { logModAction } = require("../../utils/modlogs")
const { getPermissionNum, getOptionNum } = require("../../utils/utils")

module.exports = {
    name: "unban",
    description: "Unban a user from this discord server.",
    permissions: getPermissionNum("BanMembers"),
    options: [
        {
            name: "user",
            description: "User to unban.",
            type: getOptionNum("USER"),
            required: true,
        }
    ],
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const editReply = (content)=>{interaction.editReply(content)}
        try {
            const botPerms = interaction.appPermissions.has("BanMembers")
            
            const targetUser = interaction.options.get('user')
            const targetId = targetUser.user.id
    
            const isBanned = await interaction.guild.bans.fetch(targetId).catch(()=>null)
            if(!botPerms){
                return await editReply("I do not possess permissions to unban members.\nPlease add the `ManangeBans` permissions to me if you would like to run this command once more.")
            } else if(!isBanned){
                return await editReply("This user is not banned")
            } else {
                await interaction.guild.bans.remove(targetId)
                logModAction(interaction, "unban", interaction.member, targetUser)
                await interaction.editReply(`Successfully removed the ban for **${targetUser.user.username}**`)
            }
        } catch(err){
            console.error("Error in the Unban command: ",err)
            interaction.editReply("An error has occured, please report this to my developer.")
        }
    }
}