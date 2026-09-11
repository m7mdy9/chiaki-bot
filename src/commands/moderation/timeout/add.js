const { logModAction } = require("../../../utils/modlogs.js")
const { getOptionNum, getPermissionNum, embed_builder, checkMemberPermissions } = require("../../../utils/utils.js")
const ms = require('ms')

module.exports = {
    name:"add",
    description:"Timeout a student for a selected period of time.",
    options:[
        {
            name:'member',
            description: "Student to timeout",
            type: getOptionNum("USER"),
            required: true
        },
        {
            name:'duration',
            description: "Timeout duration, max duration is 28d (e.g 5h, 7d)",
            type: getOptionNum("STRING"),
            required: true,
        },
        {
            name: "reason",
            description: "Provide reasoning for the timeout.",
            type: getOptionNum("STRING"),
            required: false,
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
            return await editReply("I do not have permissions to timeout students.")
        }

        const targetMember = interaction.options.getMember('member')
        const rawReason = interaction.options.getString('reason') || null
        const duration = ms(interaction.options.getString('duration'))

        const reason = rawReason || 'No reason provided.'
        const reasonOutput = reason + `\nTimed out by ${interaction.user.username}`
        let timeoutMsg = `You have been timed out in **${interaction.guild.name}**`
        let expiry_date

        if (duration){
            expiry_date = Math.floor((Date.now()+duration)/1000)
            timeoutMsg += ` expires **<t:${expiry_date}:R>**`
        }
        if(rawReason){
            timeoutMsg += `with the reason: **${rawReason}**`
        }


        const targetRolePos = targetMember.roles.highest.rawPosition
        const executorRolePos = interaction.member.roles.highest.rawPosition
        
        const guildOwner = interaction.guild.ownerId
        const isOwner = interaction.member.id === guildOwner
        const timeoutable = targetMember.moderatable

        const checkList = [
            { check: !targetMember,
                returnMessage: "The student is not in this virtual world." },
            { check: !duration || duration > ms("28d") || duration < ms("30s"),
                returnMessage: "Provide a valid duration for the timeout that doesn't go over 28 days.\nE.g. 10h, 7 days" },
            { check: interaction.member.id === targetMember?.id,
                returnMessage: "You can not time yourself out." },
            { check: interaction.client.user.id === targetMember?.id,
                returnMessage: "I can not do this..." },
            { check: executorRolePos <= targetRolePos && !isOwner,
                returnMessage: "You can not timeout someone with a roles higher than or equal to yours." },
            { check: targetRolePos >= interaction.guild.members.me.roles.highest.rawPosition,
                returnMessage: "I can not timeout someone with higher or equal roles to mine." },
            { check: targetMember?.id === guildOwner,
                returnMessage: "You can not timeout the administrator of this world." },
            { check: targetMember?.user.bot || !timeoutable,
                returnMessage: "I can not timeout fellow observers." },
        ]

        const failedCheck = checkList.find(rule => rule.check)?.returnMessage
        if (failedCheck) return editReply(failedCheck)

        try{
            await targetMember.timeout(duration, reasonOutput)
            targetMember.send({embeds:[embed_builder(null, timeoutMsg, "#ff8d8d")]}).catch( err => {
                console.error(`Error in sending timeout add dm`, err)
            })
            logModAction(interaction, "timeoutAdd", interaction.member, targetMember, rawReason, `\n**Duration:** ${ms(duration, { long: true })}`)
            await interaction.editReply({
                embeds:[
                    embed_builder(
                        null,
                        `Successfully timed out **${targetMember.user.username}**, expires **<t:${expiry_date}:R>**`
                        )
                    ]
            })
        } catch(err){
            console.error("Error in timeout: ",err)
            return editReply("I could not timeout this student.\nIf you believe this an error report it to my developer.")
        }
    }
}