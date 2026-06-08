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
            const targetUser = interaction.options.getMember("student") || interaction.options.getUser("student") || interaction.user
            const avatarPath = targetUser.displayAvatarURL({size:128});
            const username = targetUser.username
            
            const startTime = performance.now()
            const gifBuffer = await worker.run({avatarPath, username})
            const formattedGifBuffer = Buffer.from(gifBuffer)
            console.log(formattedGifBuffer)
            const gifAttachment = new AttachmentBuilder(formattedGifBuffer, { name: 'execute-avatar.gif'})
            const timeTakenToExecute = ((performance.now() - startTime)/1000).toFixed(2)
            return interaction.editReply({
                files: [gifAttachment],
                content:`-# Generated in ${timeTakenToExecute}s`
            })
        } catch(err){
            interaction.editReply("Could not generate an execution gif.")
            console.error(`Error in ${__filename}: `,err)
        }
    }
}