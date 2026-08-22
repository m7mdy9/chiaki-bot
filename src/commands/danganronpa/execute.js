// Special thanks to LibellantBrit for suggesting this command idea to me!

const { getOptionNum, makeExecutionGif, } = require("../../utils/utils.js")
const { AttachmentBuilder } = require("discord.js")
const { resolve } = require("path")


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
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const interactionMessage = await interaction.editReply("Please wait while the gif generates...")
        const timeoutId = setTimeout(async () => {
            await interactionMessage.edit(`Gif generation is taking longer than expected.\nThe cause may be that the bot is currently hosted on a free host since I can't afford a proper host at the moment.\n\nYou can join our support server (**\`/support server\`**) and ask the main dev to host the bot locally (if he is available) so the command only takes around 4 seconds or less to run.`)
        }, 7000);
        try{
            const targetMember = interaction.options.getMember("student") || interaction.options.getUser("student") || interaction.user
            const targetUser = interaction.options.getUser("student") || interaction.user
            
            const avatarURL = targetMember.displayAvatarURL({size:128, extension: 'png'});
            const username = targetUser.username
            
            const [gifAttachment, timeTakenToExecute] = await makeExecutionGif(avatarURL, username)

            clearTimeout(timeoutId)
            return interactionMessage.edit({
                files: [gifAttachment],
                content:`-# Generated in ${timeTakenToExecute}s`
            })
        } catch(err){
            clearTimeout(timeoutId)
            interactionMessage.edit("Could not generate an execution gif.")
            return console.error(`Error in ${__filename}: `,err)
        }
    }
}