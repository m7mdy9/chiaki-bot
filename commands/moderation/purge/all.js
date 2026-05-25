const { getOptionNum, getPermissionNum } = require("../../../utils/utils.js")

module.exports = {
    name: "all",
    description: "Purge the count of messages given within this virtual location sent by any student.",
    options: [
        {
            name: "count",
            description: "The number of messages to be deleted, the maximum is 100 messages.",
            type: getOptionNum("NUMBER"),
            required: true
        }
    ],
    permissions: getPermissionNum("ManageMessages"),
    hidden: true,
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        let output;
        if(!interaction.appPermissions.has("ManageMessages")){
            return interaction.editReply("I can not delete messages as I do not have the `ManageMessages` permission.")
        }
        const delCount = interaction.options.getNumber("count")
        if(delCount < 1){
            return interaction.editReply("The given number must be between 1 and 100")
        }
        const deletedMessages = await interaction.channel.bulkDelete(delCount, true);
        if(deletedMessages.size < 1){
            output = `Could not delete any messages, as they are older than 14 days or none were found.`
        } else if(delCount == 1){
            output = `Deleted one message`
        } else {
            output = `Deleted ${deletedMessages?.size} messages`
        }
        return interaction.editReply(output)
    }
}