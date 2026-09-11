const { getOptionNum, getPermissionNum, embed_builder, checkMemberPermissions } = require("../../../utils/utils.js")
const { warningModel } = require("../../../database/models/warnings.js")
const { logModAction } = require("../../../utils/modlogs.js")

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
        const userHasCorrectPerms = checkMemberPermissions(interaction.member, "ModerateMembers")
            if(!userHasCorrectPerms){
            interaction.editReply("You do not have permissions to **Moderate Members**.")
            return; 
        }

        const editReply = (content)=>{return interaction.editReply(content)}
        const targetMember = interaction.options.get("member");
        const caseNum = interaction.options.getString("case").trim();
        const guildId = interaction.guildId

        const targetRolePos = targetMember?.member?.roles?.highest?.rawPosition || 0
        const executorRolePos = interaction?.member?.roles?.highest?.rawPosition
        
        const guildOwner = interaction.guild.ownerId
        const isOwner = interaction.member.id === guildOwner
        const isAll = caseNum.toLowerCase() == "all"
        
        if(!targetMember){
            return await editReply("This student is not participating within this virtual world.")
        } 
        
        const warningsNum = await warningModel.countDocuments({guildId, userId: targetMember.user.id})

        const checkList = [
            { check: interaction.member.id === targetMember?.user.id && !interaction.member.permissions.has("Administrator"),
                returnMessage: "You can not remove your own warnings unless you have `Administrator` permissions." },
            { check: interaction.client.user.id === targetMember?.id,
                returnMessage: "I can not do this..." },
            { check: executorRolePos <= targetRolePos && !isOwner,
                returnMessage: "You can not remove the warning of a student with a roles higher than or equal to yours." },
            { check: targetMember?.id === guildOwner && !isOwner,
                returnMessage: "You can not remove warnings belonging to the administrator of this world." },
            { check: targetMember?.user.bot,
                returnMessage: "NPCs of the New World Program do not belong to the warning registry." },
            { check: warningsNum < 1,
                returnMessage: "This student has no warnings." },
            { check: isNaN(caseNum) && !isAll,
                returnMessage: "Please provide a correct caseNum (e.g. '1' or 'all')" },
            { check: Number(caseNum) > warningsNum && !isAll, 
                returnMessage: "This is an invalid case number.\nRefer to `/warning view <member>` in order to view case numbers." },
        ]

        const failedCheck = checkList.find(rule => rule.check)?.returnMessage
        if (failedCheck) return editReply(failedCheck);

        try {
            let deletedWarning;
            let dmMessage;

            if(!isAll){
                await handleAllSelection()
            } else {
                await handleSpecifiedSelection()
            }
            await interaction.editReply({
                embeds:[embed_builder(null, `Successfully removed the warning${isAll?"s":""} for **${targetMember.user.username}**`)]
            })

            async function handleAllSelection(){
                deletedWarning = await warningModel.findOneAndDelete({
                    guildId,
                    userId: targetMember.user.id,
                    caseNum: Number(caseNum),
                })
                if(!deletedWarning) {
                    return editReply(`Couldn't delete Case #${caseNum} for ${targetMember.user.username}.
                        \nAnother observer might have already deleted it, please check with \`/warning view\` if it still exists.`)
                }
                logModAction(interaction, "warnRemove", interaction.member, targetMember)
                dmMessage = `Your warning in **${interaction.guild.name}** for **${deletedWarning.reason}** has been cleared.`;
            }

            async function handleSpecifiedSelection(){
                deletedWarning = await warningModel.deleteMany({
                    guildId,
                    userId: targetMember.user.id,     
                })
                if(deletedWarning.deletedCount == 0) {
                    return editReply(`Couldn't delete Warnings for ${targetMember.user.username}.
                        \nAnother observer might have already deleted it, please check with \`/warning view\` if it still exists.`)
                    }
                logModAction(interaction, "warnClear", interaction.member, targetMember)
                dmMessage = `Your warnings in **${interaction.guild.name}** have been cleared.`;
            }

            targetMember?.member?.send({
                embeds: [embed_builder(null, dmMessage, '#97ff94').setTimestamp()]
            }).catch(err => console.error(`Couldn't message user in warning remove.js`, err))

        } catch(err){
            console.error("Error in warning remove: ",err)
            editReply("Couldn't remove the warnings of this student.\n-# If you believe this is an error please report it to my developer.")
        }
    }
}