const { getOptionNum, getPermissionNum, embed_builder } = require("../../../utils/utils.js")
const { warningModel } = require("../../../database/models/warnings.js")
const { buttonBuilder,selectorBuilder } = require("../../../utils/builders.js")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    name: "view",
    description: "View the warnings for a student within this virtual world.",
    options:[
        {
            name: "member",
            description: "Student whose warnings you would like to view.",
            type: getOptionNum("USER"),
            required: true,
        }
    ],
    permissions: getPermissionNum("ModerateMembers"),
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction){
        const targetMember = interaction.options.get("member")
        const targetUsername = targetMember.user.username
        const userId = targetMember.user.id;
        const guildId = interaction.guildId
    
        const memberWarnings = await warningModel.find({guildId, userId})
        if(!memberWarnings || memberWarnings.length < 1){
            return interaction.editReply({embeds:[
                embed_builder(
                    `${targetUsername}'s warnings`,
                    `This user does not have any warnings.`
                )
            ]})
        }
        let embedsFields = [];
        let embeds = []
        memberWarnings.forEach(el =>{
            const { modId, reason, caseNum, timestamp } = el
            embedsFields.push({
                name:`Case #${caseNum}:`,
                value:`Warned by: **<@!${modId}>**\nReason: ${reason}\nTimestamp:<t:${Math.floor(Date.parse(timestamp)/1000)}>`,
                inline:false})
        })
        console.log(embedsFields)
        // for (const warning of memberWarnings){
        //     embeds.push({modId, reason, caseNum, timestamp})
        //     console.log(embeds)
        // }
        const baseEmbed = embed_builder(`${targetUsername}'s warnings`, null).setThumbnail(targetMember.user.displayAvatarURL({size: 256}))
        let currentEmbed = EmbedBuilder.from(baseEmbed)
        for (let i = 0; i < embedsFields.length; i++){
            console.log(i)
            currentEmbed.addFields(embedsFields[i])
            if( ( (i+1) % 5 == 0 && i != 0) || (i+1) === embedsFields.length){
                console.log("In IF:",i)
                embeds.push(currentEmbed) // .setColor("Aqua")
                currentEmbed = EmbedBuilder.from(baseEmbed)
            }
        }
        embeds.forEach(el =>{
            el.setFooter({text: `${embeds.indexOf(el)+1}/${embeds.length} Pages`})
        })
        const Buttons = new buttonBuilder(interaction)
        Buttons.addButton("backest",null,"Secondary",null,"⏪")
            .addButton("back",null,"Secondary",null,"◀")
            .addButton("forward",null,"Secondary",null,"▶")
            .addButton("forwardest",null,"Secondary",null,"⏩")
        const ButtonDict = {
            backest: embeds.length > 2,
            back: embeds.length > 1,
            forward: embeds.length > 1,
            forwardest: embeds.length > 2,
        }
        const row = Buttons.getRow()
        const buttonDisabler = (index)=> {
            Buttons.row.components.forEach(el=>{
                const customId = el.data.custom_id;
                if(!ButtonDict[customId]){
                    el.setDisabled(true)
                    console.log(customId)
                } else {
                    if(index == 0 && (customId == "backest" || customId == "back")){
                        el.setDisabled(true)
                    } else if ((index+1) == embeds.length && (customId == "forward" || customId == "forwardest")){
                        el.setDisabled(true)
                    } else {
                        el.setDisabled(false)
                    }
                }
        })
        }
        let current_embed = embeds[0]
        buttonDisabler(0)
        const response = await interaction.editReply({embeds:[current_embed], components:[Buttons.row], withReponse: true})
        Buttons.startListener(response, null, async (int)=>{
            const currentIndex = embeds.indexOf(current_embed)
            const ButtonIndex = {
                backest: embeds[0],
                back: embeds[currentIndex-1],
                forward: embeds[currentIndex+1],
                forwardest: embeds[-1],
            }
            if (int.user.id !== interaction.user.id){
                return int.reply({ content: "You did not initiate the command.", ephemeral: true})
            }
            current_embed = ButtonIndex[int.customId]
            const newIndex = embeds.indexOf(current_embed)
            buttonDisabler(newIndex)
            await int.update({ embeds:[current_embed], components:[row]})
        })

    }
}