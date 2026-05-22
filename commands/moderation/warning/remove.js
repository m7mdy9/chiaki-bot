const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")
const { warningModel } = require("../../../database/models/warnings.js")

module.exports = {
    name:"remove",
    description: "Remove the warning of a student within this virtual world.",
    options:[
        {
            name: "member",
            description: "Student whose warning is to be remmoved.",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "case",
            description: "Provide a warning case number. (e.g, '1' or 'all')",
            type: getOptionNum("STRING"),
            required: true,
        },
    ],
    permissions: getPermissionNum("ModerateMembers"),
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const editReply = (content)=>{interaction.editReply(content)}
        const targetMember = interaction.options.get("member");
        const caseNum = interaction.options.getString("case").trim();
        const guildId = interaction.guildId

        const targetRolePos = targetMember?.member?.roles?.highest?.rawPosition || 0
        const executorRolePos = interaction?.member?.roles?.highest?.rawPosition
        
        const guildOwner = interaction.guild.ownerId
        const isOwner = interaction.member.id === guildOwner
        const isAll = caseNum.toLowerCase() == "all"

        const warningsNum = await warningModel.countDocuments({guildId, userId: targetMember.user.id})
        if(!targetMember){
            editReply("This student is not participating within this virtual world.")
        } else if(interaction.member.id === targetMember.user.id && !interaction.member.permissions.has("Administrator")){
            return await editReply("You can not remove your own warnings unless you have `Administrator` permissions.")
        } else if(interaction.client.user.id === targetMember.id){
            return await editReply("I can not do this...")
        } else if(executorRolePos <= targetRolePos && !isOwner){
            return await editReply("You can not remove the warning of a student with a roles higher than or equal to yours.")
        } else if(targetMember.id === guildOwner && !isOwner){
            return await editReply("You can not remove warnings belonging to the administrator of this world.")
        } else if(targetMember.user.bot){
            return await editReply("NPCs of the New World Program do not belong to the warning registry.")
        } else if(warningsNum < 1){
            return await editReply("This student has no warnings.")
        } else if(isNaN(caseNum) && !isAll){
            return await editReply("Please provide a correct caseNum (e.g. '1' or 'all')")
        } else if(Number(caseNum) > warningsNum && !isAll){
            return await editReply("This is an invalid case number.\nRefer to `/warning view <member>` in order to view case numbers.")
        } else {
            try {
                const currentCase = await warningModel.countDocuments({guildId, userId: targetMember.id})
                let deletedWarning;
                if(!isAll){
                    deletedWarning = await warningModel.findOneAndDelete({
                        guildId,
                        userId: targetMember.user.id,
                        caseNum: Number(caseNum),
                    })
                    
                    try{
                        await targetMember?.member?.send({
                            embeds:[embed_builder(null, `Your warning in **${interaction.guild.name}** for **${deletedWarning.reason}** has been cleared.`, '#97ff94').setTimestamp()]
                        })
                    } catch(err) {
                        console.error(`Couldn't message user in warning remove.js`,err)
                    }
                } else {
                    deletedWarning = await warningModel.deleteMany({
                        guildId,
                        userId: targetMember.user.id,     
                    })
                    try{
                        await targetMember?.member?.send({
                            embeds:[embed_builder(null, `Your warnings in **${interaction.guild.name}** have been cleared.`, '#97ff94').setTimestamp()]
                        })
                    } catch(err) {
                        console.error(`Couldn't message user in warning remove.js`,err)
                    }
                }
                await interaction.editReply({
                    embeds:[embed_builder(null, `Successfully removed the warning${isAll?"s":""} for **${targetMember.user.username}**`)]
                })
            } catch(err){
                console.error("Error in warning remove: ",err)
                editReply("Couldn't remove the warnings of this student.\n-# If you believe this is an error please report it to my developer.")
            }
        }
    }
}