require('dotenv').config({ path: '../.env' })
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ComponentType, 
    ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js");
const { buttonBuilder } = require("../../utils/builders.js")
const { embed_info, embed_builder } = require("../../utils/utils.js");
const dr2Cast = [
  "hajime hinata",
  "nagito komaeda",
  "chiaki nanami",
  "fuyuhiko kuzuryu",
  "akane owari",
  "sonia nevermind",
  "kazuichi soda",
  "gundham tanaka",
  "mikan tsumiki",
  "nekomaru nidai",
  "ibuki mioda",
  "hiyoko saionji",
  "teruteru hanamura",
  "peko pekoyama",
  "ultimate imposter",
  "ultimate impostor",
  "izuru kamukura"
]
const dr2Good = [
    "chiaki nanami",
    "peko pekoyama",
    "hajime hinata",
    "nagito komaeda",
    "mikan tsumiki",
    "ibuki mioda",
    "mahiru koizumi",
].flatMap(char => char.split(" "));
const dr2Bad = [
    "teruteru hanamura",
    "teru",
    "teruteru",
    "hanamura"
].flatMap(char => char.split(" "));
const dr2Check = dr2Cast.flatMap(char => {
    return char.split(" ")
})
const ownerId = process.env.ownerId
module.exports = {
    name: "info",
    description: "View information about Chiaki Bot, its developr and its Github Page.",
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
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
                    const button = new buttonBuilder(interaction)
                    button.addButton("hajime", "hajime", "Primary")
                    button.addButton('chiaki', "chiaki", 'Success')
                    button.addButton("nagito", 'nagito', 'Danger')
                    const row = button.getRow()
                    // buttons = new ActionRowBuilder().addComponents(
                    //     new ButtonBuilder()
                    //     .setCustomId('hajime')
                    //     .setLabel("hajime")
                    //     .setStyle(ButtonStyle.Primary)
                    //     ,
                    //     new ButtonBuilder()
                    //     .setCustomId('chiaki')
                    //     .setLabel('chiaki')
                    //     .setStyle(ButtonStyle.Success),
                    //     new ButtonBuilder()
                    //     .setCustomId('nagito')
                    //     .setLabel('nagito')
                    //     .setStyle(ButtonStyle.Danger),
                    //     new ButtonBuilder()
                    //     .setLabel('mechamaru')
                    //     .setStyle(ButtonStyle.Link)
                    //     .setURL("https://m7mdy9.github.io/timestamp-gen"),
                    //     new ButtonBuilder()
                    //     .setCustomId('Kazuichi')
                    //     .setLabel('Kazuichi')
                    //     .setStyle(ButtonStyle.Secondary),
                    // )
                    const modal = new ModalBuilder()
                    .setCustomId("modal123")
                    .setTitle("Your Favourite Danganronpa 2 Character")
                    const textInput = new TextInputBuilder()
                    .setCustomId("input123")
                    .setLabel("Enter Character Name")
                    .setPlaceholder("Ex: Chiaki Nanami")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    const modalRow = new ActionRowBuilder()
                    .addComponents(textInput)
                    modal.addComponents(modalRow);
                    
                    
                    const embed1 = embed_info(ownerId, client, result, time)
                    const response = await interaction.editReply({ embeds: [embed1], components: [row], withRespone: true })
                    // const collector = response.createMessageComponentCollector({
                    //     componentType: ComponentType.Button,
                    //     time: 300_000
                    // });
                    button.startListener(response, null , async (int) =>{
                        if (int.user.id != interaction.user.id){
                            return int.reply({ content: "You did not initiate the command.", ephemeral: true})
                        }
                        let answer, color;
                        if (int.customId === 'chiaki'){
                            answer = "Chiaki is the best character!!"
                            color = '#eeabff'
                            int.showModal(modal)
                            const submission = await interaction.awaitModalSubmit({
                                filter: int => int.customId === 'modal123' && int.user.id === interaction.user.id,
                                time: 120_000
                            })
                            const state = await interaction.fetchReply().catch(()=>null)
                            const buttonDisabled = state?.components[0]?.components.every(but => but.buttonDisabled)
                            if (buttonDisabled){
                                return submission.reply({
                                    content: "The interaction has timed out due to taking too long.",
                                    ephemeral: true
                                })
                            }
                            await submission.deferReply({});
                            let answer1
                            const reply_raw = await submission.fields.getTextInputValue('input123')
                            const reply = reply_raw.toLowerCase()
                            const replyArray = reply.split(" ")
                            if (!replyArray.every(char => dr2Check.includes(char))){
                                answer1 = "**No, that's wrong!** The character you input must be in the **main** cast. (and make sure your spelling is correct...)"
                            } else {
                                if(replyArray.every(char => dr2Good.includes(char))){
                                    if(["chiaki","nanami","chiaki nanami"].includes(reply)){
                                        answer1 = "You are correct! This is the best Danganronpa 2 character."
                                    } else answer1 = "Famous/Good Answer."
                                } else if(replyArray.every(char => dr2Bad.includes(char))){
                                    answer1 = "Seek mental attention urgently! 🚨⚠️"
                                } else answer1 = "Unpopular but it's alright!"
                            }
                            return submission.editReply({content:answer1+`\n-# Selected: ${reply_raw}`})
                        } else {
                                await int.update({ embeds:[embed_builder("Updating...")], components:[]})
                                answer = `ah yes ${int.customId} he's something i guess`
                                color = `#db7474`
                                setTimeout(async()=>{
                                    // if (modal){
                                    //     return;
                                    // }
                                    await interaction.editReply({ 
                                        embeds: [embed_builder("character!!", answer, color)], 
                                        components: [button.getRow()]
                                    })
                                }, 2000)
                            }
                    })
                    // collector.on("collect", async i => {

                    //     })
                    } catch (error){
                        console.error(`Error in info: `, error)
                    }
        }
}