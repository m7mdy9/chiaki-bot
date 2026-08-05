const { agenda } = require("../agenda.js");
const { votingTimeModel } = require("../../database/models/votingTimes.js");
const { votingEntryModel } = require("../../database/models/votingEntry.js");
const { disableAllComponents, extractEmbedsFromMessage, embed_builder, makeExecutionGif } = require("../../utils/utils.js")
const { Types } = require("mongoose");
const { EmbedBuilder } = require("discord.js");
const { dark_red, RED, YELLOW, RESET, DARK_RED_SQUARE, BLACK_SQUARE } = process.env

const black_square = `<:black_square:${BLACK_SQUARE}>`
const dark_red_square = `<:dark_red_square:${DARK_RED_SQUARE}>`

/**
 * @param {import("discord.js").Client} client 
 */
function defineVotingTimeJob(client){
    agenda.define('votingTime', async (job)=>{
        const { votingId, channelId, messageId, users } = job.attrs.data
        const { ids, names } = users
        const usersIds = ids
        
        const voteObjId = new Types.ObjectId(votingId)
        
        try{
            /**
             * @param {import('discord.js').Message} message
            */
           const message = await (await client.channels.fetch(channelId))?.messages?.fetch(messageId)
           let lastEmbeds = [];
           let files = [];
           
           const voteDocument = await votingTimeModel.findById(votingId)

            if(!message){
                console.warn(YELLOW+`Voting ${votingId}'s message not found.`+RESET)
                voteDocument?.delete();
                return; 
            }

            const numberOfVotes = voteDocument.votersIds.length

            const votesById = await votingEntryModel.aggregate([
                {
                    $match: { votingId: voteObjId },
                },
                {
                    $group: {
                        _id: "$votedFor.id",
                        name: { $first: "$votedFor.name" },
                        voteCount: { $sum: 1}
                    },
                },
                {
                    $sort: { voteCount: -1 }
                }
            ])
            const disabledRows = disableAllComponents(message)

            const embed = extractEmbedsFromMessage(message)[0]
            const pastFields = embed.data.fields
            const newFields = pastFields.map(el =>{
                if(el.value.startsWith('Voting')){
                    return {
                        name: el.name,
                        value: `~~${el.value}~~`,
                        inline: false,
                    }
                }
                if(el.value == "\u200b" || !el.value || !el.value.startsWith("**")){
                    return el
                }
                return {
                    name: el.name,
                    value: `~~${el.value}~~`,
                    inline: el.inline || true,
                }
            })
            const newEmbed =  EmbedBuilder.from(embed.data).setTitle("VOTING OVER").setFields(newFields)

            await message.edit({embeds:[newEmbed], components: disabledRows })
            const processingMessage = await message.reply({embeds:[embed_builder(null,"**Processing results...**",dark_red)]})


            if(votesById.length < 1){
                const noVotesEmbed = embed_builder("VOTING RESULTS",null,dark_red).addFields({name:"NO VOTES", value:"\u200b"})
                lastEmbeds.push(noVotesEmbed)
            } else {
                let votingResults = {}
                votesById.forEach(el => {
                    votingResults[el._id] = 
                    [
                        el.name, el.voteCount
                    ]
                })
                let i = -1;
                const votesFields = pastFields.map(el =>{
                    if(el.value == "\u200b" || !el.value || !el.value.startsWith("**")){
                    return el
                    }
                    i++
                    const votesUserHas = votingResults[usersIds[i]]?.[1] || 0
                    let votedEmojis = "";
                    if(votesUserHas == 0){
                        votedEmojis = black_square.repeat(numberOfVotes)
                    } else {
                        votedEmojis += dark_red_square.repeat(votesUserHas)
                        const remainingSquares = numberOfVotes - votesUserHas
                        votedEmojis += black_square.repeat(remainingSquares) 
                    }
                    return {
                        name: `≫ ${names[i]}`,
                        value: `${votedEmojis} (${votesUserHas}/${numberOfVotes})`,
                        inline: true,
                    }
                    
                }).slice(0,-1)

                const votesEmbed = embed_builder("VOTING RESULTS",null,dark_red).addFields(votesFields)
                lastEmbeds.push(votesEmbed)

                const highestVotes = votesById[0]?.voteCount || null
                const tiedBlackeneds = votesById.filter(vote => vote?.voteCount === highestVotes)
                const isTie = tiedBlackeneds.length > 1
                
                
                if(isTie){
                    const tiedNames = tiedBlackeneds.map(el => el.name)
                    const tieEmbed = embed_builder("GAME OVER",`**${tiedNames.join(", ")} were found guilty!**\n**Time for Punishment!**`, dark_red)
                    lastEmbeds.push(tieEmbed)
                } else {
                    const username = votesById[0].name
                    const avatarPath = (await client.users.fetch(votesById[0]._id)).displayAvatarURL({ size: 128 })

                    const oneBlackenedEmbed = embed_builder("GAME OVER",`**${username} was found guilty!**\n**Time for Punishment!**`,dark_red)
                        .setImage("attachment://execute-avatar.gif")
                    const [gifAttachment,_] = await makeExecutionGif(avatarPath, username)
                    files.push(gifAttachment)
                    lastEmbeds.push(oneBlackenedEmbed)
                }
            }
            voteDocument.ended = true;
            voteDocument.save().catch(err=>console.error('Failed to save ended',err))
            votingEntryModel.deleteMany({ votingId: voteObjId }).catch(err=>console.error('Failed to delete entries',err))
            voteDocument.deleteOne()

            return processingMessage.edit({ embeds:lastEmbeds, files})

        } catch(err){
            console.error(RED+`Failed to end the voting MessageID:${messageId}`+RESET)
            console.error(err)
        }
    },{ lockLifetime: 60000 })
}

module.exports = {defineVotingTimeJob}; 