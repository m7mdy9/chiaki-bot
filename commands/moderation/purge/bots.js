const { getOptionNum, getPermissionNum } = require("../../../utils/utils.js")

module.exports = {
    name: "bots",
    description: "Purge a number of messages sent by bots.",
    options: [
        {
            name: "count",
            description: "The number of messages to search in for bots, the maximum is 100 messages.",
            type: getOptionNum("INTEGER"),
            required: true
        }
    ],
    hidden: true,
    permissions: getPermissionNum("ManageMessages"),
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        let output;
        if(!interaction.appPermissions.has("ManageMessages")){
            return interaction.editReply("I can not delete messages as I do not have the `ManageMessages` permission.")
        }
        const delCount = interaction.options.getInteger("count")
        if(delCount < 1){
            return interaction.editReply("The given number must be between 1 and 100")
        }
        const fetchedMessages = (await interaction.channel.messages.fetch({ limit:delCount })).filter(el=>el.author.bot);
        const deletedMessages = await interaction.channel.bulkDelete(fetchedMessages, true);
        if(deletedMessages.size < 1){
            output = `Could not delete any messages, as they are older than 14 days or none were found.`
        } else if(delCount == 1 || deletedMessages.size == 1){
            output = `Deleted one message.`                
        } else {
            output = `Deleted ${deletedMessages?.size} messages.`
        }
        return interaction.editReply(output)
    }
}