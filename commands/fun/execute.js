const { getOptionNum } = require("../../utils/utils.js")
const { AttachmentBuilder } = require("discord.js")
const { resolve } = require("path")
const Piscina = require("piscina")


const worker = new Piscina({
    filename: resolve(process.cwd(), "utils/gifWorker.js")
})
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
            const avatarPath = targetMember.displayAvatarURL({size:128});
            // username of the user or author
            const username = targetUser.username
            
            // measuring how long it has been since the process started
            const startTime = performance.now()

            // running our gifWorker.js as a threaded worker to avoid blocking and performance drops and it returns a Uint8Array Buffer
            const gifBuffer = await worker.run({avatarPath, username})

            // transfers the gifBuffer into the Buffer class so discord actually doesnt break the gif!
            const formattedGifBuffer = Buffer.from(gifBuffer)
            console.log(formattedGifBuffer)

            // creating the gif attachment that will be sent in discord
            const gifAttachment = new AttachmentBuilder(formattedGifBuffer, { name: 'execute-avatar.gif'})
            
            // measuring how long it took for the process in seconds and allowing 2 decimal points 
            const timeTakenToExecute = ((performance.now() - startTime)/1000).toFixed(2)
            
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