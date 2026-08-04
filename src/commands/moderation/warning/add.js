const { getOptionNum, getPermissionNum, embed_builder, checkMemberPermissions } = require("../../../utils/utils.js")
const { warningModel } = require("../../../database/models/warnings.js")
const { logModAction } = require("../../../utils/modlogs.js")

module.exports = {
    name:"add",
    description: "Warn a student within this virtual world.",
    options:[
        {
            name: "member",
            description: "Student to warn",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "reason",
            description: "Reaosning behind the warning.",
            type: getOptionNum("STRING"),
            required: true,
        },
    ],
    permissions: getPermissionNum("ModerateMembers"),
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const userHasCorrectPerms = checkMemberPermissions(interaction.member, "ModerateMembers")
        if(!userHasCorrectPerms){
            interaction.editReply("You do not have permissions to **Moderate Members**.")
            return; 
        }

        const editReply = (content)=>{interaction.editReply(content)}
        const targetMember = interaction.options.getMember("member");
        const reason = interaction.options.getString("reason")
        const guildId = interaction.guildId

        const targetRolePos = targetMember?.roles?.highest?.rawPosition
        const executorRolePos = interaction?.member?.roles?.highest?.rawPosition
        
        const guildOwner = interaction.guild.ownerId
        const isOwner = interaction.member.id === guildOwner

        if(!targetMember){
            editReply("This student is not participating within this virtual world.")
        } else if(interaction.member.id === targetMember.id && interaction.member.id != process.env.ownerId){
            return await editReply("You can not warn yourself.")
        } else if(interaction.client.user.id === targetMember.id){
            return await editReply("I can not do this...")
        } else if(executorRolePos <= targetRolePos && !isOwner){
            return await editReply("You can not warn someone with a roles higher than or equal to yours.")
        } else if(targetMember.id === guildOwner && !isOwner){
            return await editReply("You can not warn the administrator of this world.")
        } else if(targetMember.user.bot){
            return await editReply("I can not warn NPCs of the New World Program.")
        } else {
            try {
                const currentCase = await warningModel.countDocuments({guildId, userId: targetMember.id})
                await warningModel.create({
                    guildId,
                    userId: targetMember.id,
                    modId: interaction.member.id,
                    reason: reason,
                    caseNum: (currentCase+1),
                    timestamp: Date.now(),
                })
                await interaction.editReply({
                    embeds:[embed_builder(null, `Successfully warned **${targetMember.user.username}** for **${reason}**`)]
                })
                logModAction(interaction, "warnAdd", interaction.member, targetMember, reason)
                try {
                    targetMember.send({
                    embeds:[embed_builder(null, `You have been warned in **${interaction.guild.name}** for **${reason}**`, '#ff9494').setTimestamp()]
                })
                } catch(err){
                    console.error(`Couldn't message user in warning add.js`,err)
                }
            } catch(err){
                console.error("Error in warning add: ",err)
                editReply("Couldn't warn this student, they most likely left the server.\n-# If you believe this is an error please report it to my developer.")
            }
        }
    }
}