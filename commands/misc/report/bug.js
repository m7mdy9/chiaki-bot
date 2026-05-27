const { getOptionNum, embed_builder, hiddenFlag } = require("../../../utils/utils.js")
const { buttonBuilder, modalBuilder } = require("../../../utils/builders.js")
const { reportsModel } = require("../../../database/models/reports.js")

module.exports = {
    name: "bug",
    description: "Report a bug to the Chiaki Bot's Developer.",
    options: [
        {
            name:"attachment",
            description:"Provide an attachment if needed.",
            type: getOptionNum("ATTACHMENT"),
            required: false,
        },
    ],
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const attachment = interaction.options.getAttachment("attachment")
        const userId = interaction.user.id
        const lastReport = await reportsModel.findOne({ userId }).sort({timestamp: -1})
        const guildId = interaction?.guild?.id

        if(lastReport){
            const cdTS = Date.parse(lastReport.timestamp) + 5 * 60 * 1000
            if(cdTS > Date.now() && userId != process.env.ownerId){
                return interaction.editReply({embeds:[embed_builder(null,
                    `There's a 5 minute cooldown between bug reports, sorry!
                    \nYou can try again <t:${Math.floor(cdTS/1000)}:R>`,process.env.red)]})
            }
        }
        const embed = embed_builder("Report a Bug", "Press the button to input your report.",process.env.red)
        const resultEmbed = embed_builder("Report Sent!", "Thank you for your report!", process.env.green)

        const button = new buttonBuilder(interaction)
            .addButton("report", "Report", "Danger", null, "⚠️")
        const response = await interaction.editReply({ embeds: [embed], components: [button.getRow()] })
        button.startListener(response, undefined, (int) => {
            const modal = new modalBuilder(int, "report_modal", "Bug Report")
            const modalRow = modal.createTextInput("report_input", "Input your report.", "Paragraph", "What is the bug? How is it Caused? What would be the correct output?", true, null, [20, 1000])
            modal.addComponents(modalRow)
            if (int.user.id != userId) return int.reply({ content: "You did not initiate the command.", flags: [hiddenFlag] });
            modal.showModal(undefined, async (fields, modalInteraction) => {
                await modalInteraction.deferUpdate();
                interaction.editReply({ embeds: [resultEmbed], components: [] });
                const caseNum = (await reportsModel.countDocuments()) + 1
                const reason = fields.report_input
                reportsModel.create({
                    userId,
                    guildId,
                    caseNum,
                    reason,
                    attachment: attachment?.url
                })
                const reportEmbed = embed_builder(`New Bug Report by ${interaction.user.username}`).addFields(
                    { name: `User ID`, value: `\`${userId}\``, inline: true },
                    { name: `Guild ID`, value: `${guildId ? `\`${guildId}\`` : "No Guild ID"}`, inline: true },
                    { name: `\u200b`, value: `\u200b`, inline: true },
                    { name: `caseNum`, value: caseNum.toString(), inline: true },
                    { name: `attachment URL`, value: `${attachment?.url ?? "None"}`, inline: true },
                    { name: `\u200b`, value: `\u200b`, inline: true },
                    { name: `reason`, value: reason, inline: false },
                )
                    .setTimestamp().setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                if (attachment?.contentType?.startsWith("image")) {
                    reportEmbed.setImage(attachment.url)
                }
                (await interaction.client.channels.fetch(process.env.reportChannelId)).send({ embeds: [reportEmbed] })
                return console.log(attachment, fields)
            })
        }, undefined)
    }
}