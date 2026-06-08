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
            const targetUser = interaction.options.get("student")?.member || interaction.options.get("student")?.user || interaction.user
            const avatarPath = targetUser.displayAvatarURL();
            const username = targetUser.user.username
    
            const gifBuffer = await worker.run({avatarPath, username})
            const formattedGifBuffer = Buffer.from(gifBuffer)
            console.log(formattedGifBuffer)
            const gifAttachment = new AttachmentBuilder(formattedGifBuffer, { name: 'execute-avatar.gif'})
    
            interaction.editReply({
                files: [gifAttachment]
            })
        } catch(err){
            interaction.editReply("Could not generate an execution gif.")
            console.error(`Error in ${__filename}: `,err)
        }
    }
}