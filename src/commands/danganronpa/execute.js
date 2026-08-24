// Special thanks to LibellantBrit for suggesting this command idea to me!

const { getOptionNum, makeExecutionGif, chiakiThink, hiddenFlag, getChannelTypeNum, chiakiThinkId, } = require("../../utils/utils.js")
const { AttachmentBuilder, Collection, InteractionContextType } = require("discord.js")
const { resolve } = require("path")

const userCooldowns = new Collection();

/**
 * @param {Date | Number} timestamp1 
 * @param {Date | Number} timestamp2 - MINUTES ARE ADDED TO TIMESTAMP 2 
 * @param {Number} minutes - ADDED TO TIMESTAMP 2
 * @returns {Boolean} true or false
 */
const isFirstTimestampBigger = (timestamp1, timestamp2, minutes) =>{
    const minutesInMs = minutes * 60 * 1000
    
    timestamp1 = timestamp1 instanceof Date ? timestamp1.getTime() : timestamp1;
    timestamp2 = timestamp2 instanceof Date ? timestamp2.getTime() : timestamp2;

    return timestamp1 > timestamp2 + minutesInMs
}

module.exports = {
    name: "execute",
    description: "Punish a guilty student..Let's Give It Everything We Got! It's Punishment Time!",
    options: [
        {
            name: "student",
            description: "Pick the guilty student",
            type: getOptionNum("USER"),
            required: false,
        }
    ],
    cooldown: 3,
    isDefer: false,
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        await interaction.reply(`Please wait while the gif generates...<:chiaki_think:${chiakiThinkId}>`)

        const timeoutId = setTimeout(async () => {
            const userTimestamp = userCooldowns.get(interaction.user.id) || 0;
            console.log(userTimestamp, userCooldowns)

            if(isFirstTimestampBigger(Date.now(), userTimestamp, 15)){
                await interaction.followUp({
                content:`Gif generation is taking longer than expected.\nThe cause may be that the bot is currently hosted on a free host since I can't afford a proper host at the moment.\n\nYou can join our support server (**\`/support server\`**) and ask the main dev to host the bot locally (if he is available) so the command only takes around 4 seconds or less to run.`,
                flags:[hiddenFlag]
                })

                userCooldowns.set(interaction.user.id, Date.now())
            } else {
                return;
            }
        }, 10000);

        try{
            const targetMember = interaction.options.getMember("student") || interaction.options.getUser("student") || interaction.user
            const targetUser = interaction.options.getUser("student") || interaction.user
            
            const avatarURL = targetMember.displayAvatarURL({size:128, extension: 'png'});
            const username = targetUser.username
            
            const [gifAttachment, timeTakenToExecute] = await makeExecutionGif(avatarURL, username)

            clearTimeout(timeoutId)
            return interaction.editReply({
                files: [gifAttachment],
                content:`-# Generated in ${timeTakenToExecute}s`
            })
        } catch(err){
            clearTimeout(timeoutId)
            interaction.editReply("Could not generate an execution gif.")
            return console.error(`Error in ${__filename}: `,err)
        }
    }
}