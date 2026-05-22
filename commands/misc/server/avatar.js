const { embed_builder } = require('../../../utils/utils.js')
const { Vibrant } = require('node-vibrant/node');

module.exports = {
    name:"avatar",
    description:"Preview the icon of a server.",
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const guild = interaction.guild
        let avatarURL_default = interaction.guild.iconURL({
            extension: 'webp',
            size: 512,
        })
        let avatarURL_PNG = interaction.guild.iconURL({
            extension: 'png',
            size: 512,
            forceStatic: true,
        })
        let usedColor = null;
        try {
            let palette = await Vibrant.from(avatarURL_PNG,{quality:5})?.getPalette()
            if(palette){
                usedColor = palette.LightVibrant.hex
            }
        } catch(err){
            console.error("Error in vibrant.form in server avatar.js: ",err)
        }
        const embed = embed_builder(`**${guild.name}**'s Server Icon`,null,usedColor)
        .setImage(avatarURL_default)
        await interaction.editReply({ embeds:[embed] })
    }
}