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
                interaction.editReply("You do not have permissions to **Ban/Unban Members**.")
                return; 
            }

            const editReply = (content)=>{interaction.editReply(content)}
            const botPerms = interaction.appPermissions.has("BanMembers")
            
            const userToBan = interaction.options.get("member")
            const userId = userToBan.user.id
            const executor = interaction.member

            const executorRolePos = executor.roles?.highest?.rawPosition || 0;
            const userRolePos = userToBan?.member?.roles?.highest?.rawPosition || 0;
            
            const reasonOption = interaction.options.getString("reason")
            const reason = `${reasonOption ?? "No reason provided."}\nBanned by ${executor.user.username}`
            
            const memberBannable = userToBan?.member?.bannable || true
            const isInServer = await interaction.guild.members.fetch(userId).catch(()=>false)
            const isBanned = await interaction.guild.bans.fetch(userId).catch(()=> false)

            if (!botPerms){
                return await editReply("I do not possess permissions to ban. If you would like to execute the ban command please add the Ban Members my permissions.")
            } else if(userId === executor.id){
                return await editReply("You may not ban yourself.")
            }else if (executorRolePos <= userRolePos && executor.id != interaction.guild.ownerId) {
                return await editReply("You may not ban another student with an equivelent or higher rank to yours!")
            } else if (!memberBannable) {
                return await editReply("I can not ban this student.")
            } else if (isBanned){
                return await editReply("This user is already banned.")
            } else if (userId === interaction.client.user.id){
                return await editReply("I can not do this...")
            }
            let banText = `You have been banned from **${interaction.guild.name}**`
            if (reasonOption) banText += ` | ${reasonOption}`
            const embed = embed_builder(null, banText, "#ff8d8d")
            try {
                if (!userToBan.user.bot && isInServer) {
                    await userToBan.user.send({ embeds: [embed] })
                }
            } catch (err) {
                console.error("Error in sending ban dm", err)
            }
            await interaction.guild.members.ban(userId, {
                deleteMessageSeconds: interaction.options.get("delmessages") ? 60 * 60 * 24 * 7 : 0,
                reason
            })
            logModAction(interaction, "ban", interaction.member, userToBan, reasonOption)
            let outputMessage = `Banned **${userToBan.user.username}**`
            if (reasonOption) { outputMessage += ` for \`${reasonOption}\`` }
            await interaction.editReply(outputMessage)
        } catch (err) {
            console.error("Error in ban command: ", err)
            return await interaction.editReply("An error has occured, the member most likely left the server.")
        }
    }
}