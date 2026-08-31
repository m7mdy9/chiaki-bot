const { getOptionNum, embed_builder } = require('../../utils/utils.js')
const Vibrant = require('node-vibrant');

module.exports = {
    name:"avatar",
    description:"Preview the avatar of a student.",
    options: [
        {
            name:'member',
            description: 'Member whose avatar you would like to view.',
            type: getOptionNum("USER"),
            required: true,
        },
        {
            name:'serveravatar',
            description: "Toggle avatar on/off (on by default)",
            type: getOptionNum("BOOLEAN"),
            required: false,
        },
    ],
    isInstalled: true,
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const targetMember = interaction.options.get('member')
        const serverAvatar = interaction.options.getBoolean('serveravatar') ?? true;
        let avatarURL_default,avatarURL_PNG;
        
        if(interaction.guild && targetMember.member && serverAvatar){
            avatarURL_default = targetMember.member.displayAvatarURL({
                extension: 'webp',
                size: 512,
            })
            avatarURL_PNG = targetMember.member.displayAvatarURL({
                extension: 'png',
                size: 512,
                forceStatic: true,
            })
        } else {
            avatarURL_default = targetMember.user.avatarURL({
                extension: 'webp',
                size: 512,
            })
            avatarURL_PNG = targetMember.user.avatarURL({
                extension: 'png',
                size: 512,
                forceStatic: true,
            })
        }
        let usedColor = null;
        try {
            let palette = await Vibrant.from(avatarURL_PNG,{quality:5})?.getPalette()
            if(palette){
                usedColor = palette.LightVibrant.hex
            }
        } catch(err){
            console.error("Error in vibrant.form in avatar.js: ",err)
        }
        const embed = embed_builder(`**${targetMember.user.username}**'s Avatar`,null,usedColor)
        .setImage(avatarURL_default)
        await interaction.editReply({ embeds:[embed] })
    }
}