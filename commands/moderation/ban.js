const { getPermissionNum, getOptionNum } = require("../../utils/utils")
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

            const userToBan = interaction.options.get("member")
            const userId = userToBan.user.id
            const executor = interaction.member
            const executorRolePos = executor.roles.highest.rawPosition;
        const userRolePos = userToBan?.member?.roles?.highest?.rawPosition || 0 ;
        const memberBannable = userToBan?.member?.bannable || true

        const reasonOption = interaction.options.getString("reason")
        const reason = `${reasonOption ?? "No reason provided."}\nBanned by ${executor.user.username}` 
        if (executorRolePos <= userRolePos && executor.id != interaction.guild.ownerId){
            return await interaction.editReply("You may not ban another student with an equivelent or higher rank to yours!")
        } else if(!memberBannable){
            return await interaction.editReply("I can not ban this student.")
        }
        console.log(executor.permissions)
        let banText = `You have been banned from **${interaction.guild.name}**`
        if(reasonOption) banText += ` | ${reasonOption}`
        const embed = embed_builder(null, banText, "#ff8d8d")
        try {
            if(!userToBan.user.bot){
                await userToBan.user.send({ embeds:[embed]})
            }
        } catch (err){
            console.error("Error in sending ban dm", err)
        }
        await interaction.guild.members.ban(userId,{
            deleteMessageSeconds: interaction.options.get("delmessages") ? 60 * 60 * 24 * 7 : 0,
            reason
        })
        let outputMessage = `Banned **${userToBan.user.username}**`
        if(reasonOption){outputMessage+= ` for \`${reasonOption}\``}
        await interaction.editReply(outputMessage)
    } catch (err){
        console.error("Error in ban command: ",err)
        return await interaction.editReply("An error has occured, the member most likely left the server.")
    }
    }
}