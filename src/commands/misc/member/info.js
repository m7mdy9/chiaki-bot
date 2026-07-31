const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name: "info",
    description: "View the information of a student within this virutal world.",
    options:[
        {
            name: "member",
            description: "The student whose info you would like to view.",
            type: getOptionNum("USER"),
            required: true,
        }
    ],
    isServerOnly: true,
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const targetMember = interaction.options.getMember("member")
        if(!targetMember){
            return await interaction.editReply("Chosen student is not a member of this virtual world.")
        }
        const memberRoles = targetMember.roles.cache.keys()
        const memberRolesFormatted = Array.from(memberRoles).map(el => {
            return el == interaction.guild.id ? null : `<@&${el}>` 
        })?.filter(Boolean)?.join(",") || "None";

        const memberPermissions = targetMember?.permissions?.toArray()?.map(el => `\`${el}\``)?.join(",") || "None";
        const isOwner = targetMember.id === interaction.guild.ownerId 

        const creationTimestamp = Math.floor(targetMember.user.createdTimestamp / 1000)
        const joinedTimestamp = Math.floor(targetMember.joinedTimestamp / 1000)


        let fields = [
            {name:`Mention`, value:`<@!${targetMember.id}>`, inline:true},
            isOwner ? {name:`Is Owner?`, value:"Yes" , inline:true} : null,
            isOwner ? {name:`\u200b`, value: `\u200b`, inline:true} : null,
            {name:`Created account:`, value:`<t:${creationTimestamp}>`, inline:true},
            {name:`Joined server:`, value:`<t:${joinedTimestamp}>`, inline:true},
            {name:`Roles:`, value:memberRolesFormatted , inline:false},
            {name:`Permissions:`, value:memberPermissions, inline:true},
        ].filter(Boolean)
        const embed = embed_builder(`${targetMember.user.username}'s server information.`)
        .addFields(...fields)
        .setThumbnail(targetMember.displayAvatarURL()).setTimestamp().setFooter({ text: `User ID: ${targetMember.id}`})
        
        await interaction.editReply({embeds:[embed]})
    }
}