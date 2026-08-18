// Special thanks to LibellantBrit for suggesting this command idea to me!

const { embed_builder,getOptionNum, hiddenFlag, darkRedHex } = require("../../../utils/utils.js")
const { selectorUserBuilder, buttonBuilder } = require("../../../utils/builders.js")
const { votingTimeModel } = require("../../../database/models/votingTimes.js")
const { agenda } = require("../../../agenda/agenda.js")
const ms = require("ms")

const monokumaRed = darkRedHex

module.exports = {
    name:"start",
    description:"Start a voting for the blackened...ITS VOTING TIME!",
    options: [
        {
            name:"duration",
            description:"Input how long the voting will last (e.g. 1h or 1 day)",
            type: getOptionNum("STRING"),
            required:true,
        }
    ],
    isServerOnly: true,
    cooldown: 3,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const author = interaction.user
        const endsInOption = interaction.options.getString("duration")
        const timeInMs = ms(endsInOption)

        if(!timeInMs || timeInMs < 30*1000){
            return interaction.editReply("Please provide a correct duration of atleast 30 seconds (e.g. 1 day)")
        }

        const userSelectEmbed = embed_builder("Voting Time!",
            "Select the students. (2-16)",
            monokumaRed
        )
        const userSelector = new selectorUserBuilder(interaction)
        const row = userSelector.createUserSelector("vote_users", "Select atleast 2 students", [2, 16])
        .getRow()

        const dark_red_box = "<:dark_red_box:1513974012085145732>"

        const initialResponse = await interaction.editReply({ embeds:[userSelectEmbed], components:[row]})
        userSelector.startListener(initialResponse, null, 
            /** @param {import('discord.js').ChatInputCommandInteraction} int */
            async (int)=>{
            if(int.user.id != author.id){
                return int.reply({ content:"You did not run  this command.",flags:[hiddenFlag]})
            }
            const selectedUsers = int.values
            
            const votingEmbed = embed_builder("Vote for the Blackened!",null,monokumaRed)
                .setFooter({
                    text: 'Will you make the right choice, or the dreadfully wrong one?'
                })
            selectedUsers.forEach(user=>{
                votingEmbed.addFields({name:`\u200b`,value:`**≫ <@!${user}>**`, inline:true})
            })
            const emptyField = {name:`\u200b`, value:`\u200b`, inline:true}
            let embedFieldsLength = votingEmbed.data.fields.length
            if(embedFieldsLength > 3 && (embedFieldsLength % 3) != 0){
                while((embedFieldsLength % 3) != 0){
                    votingEmbed.addFields(emptyField)
                    embedFieldsLength++
                }
            }
            const endTime = Date.now() + timeInMs
            const endTimeDiscordTimestamp = Math.floor(endTime/1000)
            votingEmbed.addFields({name:'\u200b', value:`Voting ends <t:${endTimeDiscordTimestamp}:R>`})
            
            let usersNames = [];

            const fetchedUsers = await Promise.all(
                selectedUsers.map(user => interaction.client.users.fetch(user))
            ) 
            fetchedUsers.forEach(user =>{
                usersNames.push(user.username)
            })

            const channelId = initialResponse.channel.id
            const guildId = initialResponse.guild.id
            const userId = author.id
            const usersIds = selectedUsers;
            const votingDocument = await votingTimeModel.create({
                guildId,
                channelId,
                usersIds,
                usersNames,
                endTime,
                timestamp: Date.now()
            })

            const votingDocId = votingDocument._id
            const votingButton = new buttonBuilder(interaction)
            .addButton(`votingTime_join:${votingDocId}`,"VOTE","Danger").getRow()

            const votingMessage = await interaction.editReply({embeds:[votingEmbed], components:[votingButton], withResponse: true})
            const messageId = votingMessage.id
            
            votingDocument.messageId = messageId;
            await votingDocument.save();

            await agenda.schedule(endTime, "votingTime", {
                votingId: votingDocId,
                channelId,
                messageId,
                users: {
                    ids: usersIds,
                    names: usersNames,
                }
            })

            return int.reply({content:"Created the Voting Time for the Blackend successfully.",flags: [hiddenFlag]})
        })
    }
}