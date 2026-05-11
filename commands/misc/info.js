require('dotenv').config({ path: '../.env' })
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType} = require("discord.js");
const { logerror, logstuff } = require("../../utils/utils.js");
const { embed_info, embed_builder } = require("../../utils/embeds.js")

const ownerId = process.env.ownerId
module.exports = {
    name: "info",
    description: "Information.",
        async execute(interaction) {
            const client = interaction.client
            try {
                    let result = Math.round(interaction.client.uptime / 60000)
                    let time = "minutes"
                    if (result >= 60){
                        let result1 = result / 60
                        result = result1.toFixed(1)
                        if (result >= 24){
                        result1 = result / 24
                        result = result1.toFixed(1)
                        time = "days"
                        } else {
                                time = "hours"
                        }
                    }
                    buttons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                        .setCustomId('hajime')
                        .setLabel("hajime")
                        .setStyle(ButtonStyle.Primary)
                        ,
                        new ButtonBuilder()
                        .setCustomId('chiaki')
                        .setLabel('chiaki')
                        .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                        .setCustomId('nagito')
                        .setLabel('nagito')
                        .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                        .setLabel('mechamaru')
                        .setStyle(ButtonStyle.Link)
                        .setURL("https://m7mdy9.github.io/timestamp-gen"),
                        new ButtonBuilder()
                        .setCustomId('Kazuichi')
                        .setLabel('Kazuichi')
                        .setStyle(ButtonStyle.Secondary),
                    )
                    const embed1 = embed_info(ownerId, client, result, time)
                        const response = await interaction.editReply({ embeds: [embed1], components: [buttons], withRespone: true })
                        const collector = response.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 300_000
                        });
                        collector.on("collect", async i => {
                            if (i.user.id != interaction.user.id){
                                return i.reply({ content: "You did not initiate the command.", ephemeral: true})
                            }
                            await i.update({ embeds:[embed_builder("Updating...")], components:[]})
                            let answer, color;
                            if (i.customId === 'chiaki'){
                                answer = "Chiaki is the best character!!"
                                color = '#eeabff'
                            } else {
                                answer = `ah yes ${i.customId} he's something i guess`
                                color = `#db7474`
                            }
                            setTimeout(async()=>{
                                await interaction.editReply({ 
                                    embeds: [embed_builder("character!!", answer, color)], 
                                    components: [buttons]
                                })
                            }, 2000)
                        })
                    } catch (error){
                        console.error(`Error in info: `, error)
                    }
        }
}