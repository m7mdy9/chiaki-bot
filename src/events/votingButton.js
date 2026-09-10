const { votingEntryModel } = require("../database/models/votingEntry.js");
const { votingTimeModel } = require("../database/models/votingTimes.js");
const { selectorTextBuilder } = require("../utils/builders.js")
const { hiddenFlag, embed_builder, redHex, darkRedHex, RedAscii, ResetAscii, YellowAscii } = require("../utils/utils.js");

module.exports = {
    name:"interactionCreate",
    /** @param {import('discord.js').ButtonInteraction} interaction */
    async execute(interaction){
        if (interaction.isChatInputCommand()) return;
        if(!interaction.isButton()) return;

        const customId = interaction.customId

        if(!customId.startsWith("votingTime_join")){
            return;
        }

        await interaction.deferReply({flags:[hiddenFlag]})
        
        const [_, votingId] = customId.split(":")
        const userId = interaction.user.id

        try {
            const votingDocument = await votingTimeModel.findById(votingId)
            const usersNames = votingDocument.usersNames
            const usersIds = votingDocument.usersIds

            const votePromptEmbed = embed_builder("Voting Time!","Who will you be voting for as the blackened?",darkRedHex)
            const usernameSelector = new selectorTextBuilder(interaction)
                .createSelector("select_user","Vote for the Blackened", 1,1)
            usersNames.forEach(user =>{
                usernameSelector.addOption(user,user)
            })
            
            const response = await interaction.editReply({ embeds: [votePromptEmbed], components:[usernameSelector.getRow()]}) 
            usernameSelector.startListener(response, 30_000, 
                /** @param {import('discord.js').Interaction} int */
                async (int)=>{
                        const selectedUser = int.values[0]
                        const selectedUserId = usersIds[usersNames.indexOf(selectedUser)]

                        await interaction.deleteReply();
                        
                        const votingEntryDocument = await votingEntryModel.updateOne(
                            {
                                votingId,
                                userId,
                            },
                            {
                                $set: {
                                    votingId,
                                    userId,
                                    votedFor: 
                                        {
                                            name: selectedUser,
                                        id: selectedUserId,
                                        }
                                    },
                            },
                            {
                                upsert: true,
                            }
                        )
                        
                        const selectedEmbed = embed_builder("Vote Success",
                            votingEntryDocument.upsertedCount > 0 ? `You have voted for **${selectedUser}**`
                            : `You have changed your vote to **${selectedUser}**`
                            ,redHex)
                        int.reply({ embeds:[selectedEmbed], flags:[hiddenFlag]})
                        
                        votingDocument.votersIds.addToSet(userId)
                        await votingDocument.save()
                },
                async()=>{ timeoutFunc(interaction) }
            )
        } catch(err){
            if(err.code === 11000){ // error code when MongoDB blocks due to violating unique flag
                return interaction.editReply({
                    content:"You have already voted!"
                })
            }

            console.log(RedAscii+"Error in voting button event!"+ResetAscii)
            console.error(err)
        }
    }
}

async function timeoutFunc(timeoutInt) {
    try {
        const timeoutEmbed = embed_builder("GAME OVER", "You have ran out of time. (the command timed out, please run it again)", darkRedHex)
        await timeoutInt.editReply({
            embeds: [timeoutEmbed],
            components: []
        });
    } catch (err) {
        if (err.code === 10008) {
            //return console.warn( YellowAscii + "Failed to disable buttons due to interaction deletion." + ResetAscii)
            return;
        }
        console.error("Failed to disable buttons in buttonBuilder: ", err)
    }
}