const { getOptionNum, getPermissionNum } = require("../../../utils/utils.js")

module.exports = {
    name: "user",
    description: "Purge a number of messages sent by a specificed user.",
    options: [
        {
            name: "user",
            description: "The user that you would like to their messages to be deleted.",
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name: "count",
            description: "The number of messages to search in for the specificed user, the maximum is 100 messages.",
            type: getOptionNum("INTEGER"),
            required: true
        },
    ],
    hidden: true,
    permissions: getPermissionNum("ManageMessages"),
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        let output;
        const targetUser = interaction.options.getUser("user")
        const targetUserId = targetUser.id
        const targetUsername = targetUser.username
        if(!interaction.appPermissions.has("ManageMessages")){
            return interaction.editReply("I can not delete messages as I do not have the `ManageMessages` permission.")
        }
        const delCount = interaction.options.getInteger("count")
        if(delCount < 1){
            return interaction.editReply("The given number must be between 1 and 100")
        }
        const fetchedMessages = (await interaction.channel.messages.fetch({ limit:delCount })).filter(el=>el.author.id==targetUserId);
        const deletedMessages = await interaction.channel.bulkDelete(fetchedMessages, true);
        if(deletedMessages.size < 1){
            output = `Could not delete any messages, as they are older than 14 days or none were found.`
        } else if(delCount == 1 || deletedMessages.size == 1){
            output = `Deleted one message sent by **${targetUsername}**.`              
        } else {
            output = `Deleted ${deletedMessages.size} messages sent by **${targetUsername}**.`
        }
        return interaction.editReply(output)
    }
}