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
        try{
            // trying to get member if not we get user, if neither we get the author of the interaction (for displayAvatarURL)
            const targetMember = interaction.options.getMember("student") || interaction.options.getUser("student") || interaction.user
            // we just get the user if not we get the interaction author, this is for fetching the username, .username wont work with member
            const targetUser = interaction.options.getUser("student") || interaction.user
            
            // fetching display avatar URL from either the member, user or the author
            const avatarURL = targetMember.displayAvatarURL({size:128, extension: 'png'});
            // username of the user or author
            const username = targetUser.username
            
            const [gifAttachment, timeTakenToExecute] = await makeExecutionGif(avatarURL, username)

            // sending the gif with the timeTakenToExecute
            return interaction.editReply({
                files: [gifAttachment],
                content:`-# Generated in ${timeTakenToExecute}s`
            })
        } catch(err){
            // catches the error to avoid crashing 
            interaction.editReply("Could not generate an execution gif.")
            return console.error(`Error in ${__filename}: `,err)
        }
    }
}