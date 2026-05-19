const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")

module.exports = {
    name: "info",
    description: "Get information regarding an ultiamte role!",
    options: [
        {
            name: "role",
            description: "Role information.",
            type: getOptionNum("ROLE"),
            required: true,
        },
    ],
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const targetRole = interaction.options.getRole("role")
        if (!targetRole){
            interaction.editReply("That role does not exist.")
        }
        const roleName = targetRole.name
        const roleId = targetRole.id
        const roleColor = targetRole.hexColor
        const roleTimeStamp = targetRole.createdAt
        const rolePos = targetRole.rawPosition
        
        const roleMentionable = targetRole.mentionable ? "Yes" : "No"
        const roleHoist = targetRole.hoist ? "Yes" : "No"
        const roleManaged = targetRole.managed ? "Yes" : "No"
        const rolePermissions = targetRole.permissions.toArray().map(el => `\`${el}\``)
        const roleMembers = targetRole?.members?.size || 0

        const embed = embed_builder(roleName, null, roleColor)
        embed.addFields(
            {name: `Role ID:`, value: `\`${roleId}\``, inline: true},
            {name: `Role Color:`, value: `\`${roleColor}\``, inline: true},
            {name: `Role Position:`, value: `\`${rolePos}\``, inline: true},
            {name: `Role Mentionable:`, value: `${roleMentionable}`, inline: true},
            {name: `Role Hoist:`, value: `${roleHoist}`, inline: true},
            {name: `Role Managed:`, value: `${roleManaged}`, inline: true},
            {name: `Mention:`, value: `<@&${roleId}>`, inline: true},
            {name: `Members:`, value: `\`${roleMembers}\``, inline: true},
            {name: `Role Created At:`, value: `<t:${Math.floor(roleTimeStamp.getTime()/1000)}>`, inline: true},
        )
        if(targetRole.permissions.toArray().length > 0){
            embed.addFields({name: `Role Permissions:`, value: `${rolePermissions.join(", ")}`, inline: false},)
        }
        embed.setThumbnail("https://m7mdy9.github.io/images/chiaki_index_finger_up.png")
        embed.setFooter({text:`The Ultimate Role Information of '${roleName}'`,
            iconURL: 'https://cdn.discordapp.com/attachments/1275537058986725386/1506415756043227146/chiaki_index_finger_up.png?ex=6a0e2e80&is=6a0cdd00&hm=7b5c944b06e4a638bade19909a8de8942dc4f8de211d5068cba9adf156eb71d6&'})
        interaction.editReply({embeds:[embed]})
    }
}