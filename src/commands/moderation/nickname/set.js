const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name: "set",
    description: "Set a nickname for a student within this virtual world.",
    options:[
        {
            name:"member",
            description: "Student that will have their nickname changed.",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "nickname",
            description: "The nickname that you would like the user to acquire.",
            type: getOptionNum("STRING"),
            required: true,
        },
    ],
    permissions: getPermissionNum("ManageNicknames"),
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const editReply = (content)=>{interaction.editReply({content})}
        const botPerms = interaction.appPermissions.has("ManageNicknames");
        const targetMember = interaction.options.getMember("member")
        const newNick = interaction.options.getString("nickname")
        const nickLength = [...newNick]?.length
        
        // mangable
        const mangable = targetMember.manageable
        
        const memberRolePos = targetMember?.roles?.highest?.rawPosition
        const botRolePos = interaction.guild.members.me.roles.highest.rawPosition
        const userRolePos = interaction.member.roles.highest.rawPosition
        const ownerId = interaction.guild.ownerId
        const isOwner = interaction.member.id === ownerId

        if(!botPerms){
            return await editReply("I do not have permissions to edit student nicknames.")
        } else if(!targetMember){
            return await editReply("The member is not in the server.")
        }else if(!isOwner && targetMember.id === ownerId){
            return await editReply("I can not change the nickname of the observer of this virtual world.")
        } else if(botRolePos <= memberRolePos && targetMember.id != interaction.client.user.id){
            return await editReply("I can not edit the nickname of an observer with higher or equal roles to me.")
        } else if(userRolePos <= memberRolePos && !isOwner){
            return await editReply("You can not change the nickname of a student with higher or equal roles to you.")
        } else if(!mangable){
            return await editReply("I can not change the nickname of this student.")
        } else if(nickLength > 32 || nickLength < 1){
            return await editReply("The chosen nickname must be 1-32 characters.")
        } else {
            try {
                await targetMember.setNickname(newNick)
                await interaction.editReply({
                    embeds:[
                        embed_builder(null, 
                            `Successfully changed the nickname of **${targetMember.user.username}** to **${newNick}**`
                        )
                    ]
                })
            } catch(error){
                // chiaki nanami error catching!!
                console.error("Error in nickname set: ",error)
                editReply("Chiaki Nanami couldn't do it!\n If you believe that an error has occured please contact my developer.")
            }
        }
    }
}