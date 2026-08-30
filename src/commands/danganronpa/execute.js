// Special thanks to LibellantBrit for suggesting this command idea to me!

const { getOptionNum, makeExecutionGif, chiakiThink, hiddenFlag, getChannelTypeNum, chiakiThinkId, isFirstTimestampBigger } = require("../../utils/utils.js")
const { AttachmentBuilder, Collection } = require("discord.js")
const { resolve } = require("path")

const userCooldowns = new Collection();

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

            if(isFirstTimestampBigger(Date.now(), userTimestamp, 15)){
                await interaction.followUp({
                content:
                `Gif generation is taking longer than expected.\nThe cause may be that the bot is currently hosted on a free host since I can't afford a proper host at the moment.\n\nYou can join our **\`/support server\`** and ask the main dev to host the bot locally (if he is available) so command would only take around 4 seconds or less to run.`,
                flags:[hiddenFlag]
                })

                userCooldowns.set(interaction.user.id, Date.now())
            } else {
                return;
            }
        }, 10000);

        try{
            const authorMember = interaction.guild ? interaction.member : interaction.user;
            const chosenMember = interaction.options.getMember("student");
            const chosenUser = interaction.options.getUser("student");

            const displayAvatarURL = chosenMember?.displayAvatarURL?.bind(chosenMember) 
            || chosenUser?.displayAvatarURL?.bind(chosenUser)
            || authorMember?.displayAvatarURL?.bind(authorMember);
            
            const targetUser = interaction.options.getUser("student") || interaction.user
            const avatarURL = displayAvatarURL({size:128, extension: 'png'});
            const username = targetUser.username
            
            const [gifAttachment, timeTakenToExecute] = await makeExecutionGif(avatarURL, username)

            clearTimeout(timeoutId)
            return interaction.editReply({
                files: [gifAttachment],
                content:`-# Generated in ${timeTakenToExecute}s`
            })
        } catch(err){
            clearTimeout(timeoutId)
            interaction.editReply("Could not generate an execution gif.\n-# Please report this issue in our **\`/support server\`** and we will fix it ASAP!")
            return console.error(`Error in ${__filename}: `,err)
        }
    }
}