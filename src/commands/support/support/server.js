const { embed_builder, supportServerInvite } = require("../../../utils/utils");

module.exports = {
    name: "server",
    description: "Get the invite link for our support server!",
    isInstalled: true,
    async execute(interaction){
        const inviteEmbed = embed_builder("Support Server", `Need help with the bot? Wanna help us and suggest your ideas? Maybe you just want to increase your server count by one!\n\n**Join our support server: ${supportServerInvite} !**`)
        .setURL(supportServerInvite);

        return interaction.editReply({ embeds:[inviteEmbed] })
    }
}