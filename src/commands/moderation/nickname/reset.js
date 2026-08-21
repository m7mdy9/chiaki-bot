const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name: "reset",
    description: "Reset the nickname for a student in this virtual world.",
    options:[
        {
            name:"member",
            description: "The student who will have their json files removed",
            type: getOptionNum("USER"),
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
        if(!botPerms){
            return await editReply("I do not have permissions to change student nicknames.")
        }

        const targetMember = interaction.options.getMember("member");
        
        // mangable
        const mangable = targetMember.manageable;
        
        const memberRolePos = targetMember?.roles?.highest?.rawPosition
        const botRolePos = interaction.guild.members.me.roles.highest.rawPosition
        const userRolePos = interaction.member.roles.highest.rawPosition
        const ownerId = interaction.guild.ownerId
        const isOwner = interaction.member.id === ownerId

        if(!targetMember){
            return await editReply("The member is not in the server.")
        }else if(!isOwner && targetMember.id === ownerId){
            return await editReply("I can not reset the nickname of the observer of this virtual world.")
        } else if(botRolePos <= memberRolePos){
            return await editReply("I can not reset the nickname of an observer with higher or equal roles to me.")
        } else if(userRolePos <= memberRolePos && !isOwner){
            return await editReply("You can not reset the nickname of a student with higher or equal roles to you.")
        } else if(!mangable){
            return await editReply("I can not reset the nickname of this student.")
        } else {
            try {
                await targetMember.setNickname(null)
                await interaction.editReply({
                    embeds:[
                        embed_builder(null, 
                            `Successfully reset the nickname of **${targetMember.user.username}**`
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