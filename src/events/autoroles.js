const { autoroleModel } = require("../database/models")

module.exports = {
    name: "guildMemberAdd",
    once: false,
    /** @param {import('discord.js').GuildMember} member */
    async execute(member){
        const guildId = member.guild.id
        const autoroleDoc = await autoroleModel.findOne({ guildId });
        if(!autoroleDoc || !autoroleDoc?.roleIds) return;
        
        try {
            autoroleDoc.roleIds.forEach(async role => {
                try {
                    await member.roles.add(role)
                } catch(err){
                    console.error(`ERR in autoroles.js: `,err)
                }
            })
        } catch (err){
            console.error(`ERR in autoroles.js, Couldn't give roles to user: `,err)
        }
    }
}