const { getOptionNum, embed_builder, hiddenFlag, createChannelInCategory } = require("../../../utils/utils.js")
const { buttonBuilder, modalBuilder } = require("../../../utils/builders.js")
const { reportsModel, reportBugBLModel } = require("../../../database/models")
const { RED, RESET, bugReportCategoryId } = process.env

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
    hidden: true,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const attachment = interaction.options.getAttachment("attachment")
        const userId = interaction.user.id
        const lastReport = await reportsModel.findOne({ userId }).sort({timestamp: -1})
        const guildId = interaction?.guild?.id

        const blacklistedDoc = await reportBugBLModel.findOne({ userId, }).sort({ _id: -1 })
        if(blacklistedDoc && blacklistedDoc?.expiryDate){
            const expiryDateMS = blacklistedDoc.expiryDate.getTime()
            const expiryDateTimestamp = Math.floor(expiryDateMS / 1000)
            if(expiryDateMS > Date.parse(new Date("2098"))){
                await interaction.editReply({ content:`You are blacklisted from using \`/report bug\` permanently.\n\nReason: ${blacklistedDoc.reason}` ,flags:[hiddenFlag]})
                return;
            }
            if(expiryDateMS > Date.now()){
                await interaction.editReply({ content:`You are blacklisted from using \`/report bug\`\nYour blacklist expires <t:${expiryDateTimestamp}:R>\n\nReason: ${blacklistedDoc.reason}` ,flags:[hiddenFlag]})
                return;
            }
        }
        
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
                
                const lastDocCaseNum = (await reportsModel.findOne().sort({ caseNum: -1 }))?.caseNum

                const caseNum = lastDocCaseNum ? lastDocCaseNum + 1 : 1

                const reason = fields.report_input
                reportsModel.create({
                    userId,
                    guildId,
                    caseNum,
                    reason,
                    attachment: attachment?.url
                })

                modalInteraction.update({ embeds: [resultEmbed], components: [] });
                try {
                    const reportEmbedToReporter = embed_builder(`Created Bug Report Case: ${caseNum}`, null, process.env.green)
                            .addFields(
                            { name: `Report Info`, value: reason, inline: false },
                            { name: `attachment URL`, value: `${attachment?.url ?? "None"}` }
                        )
                        .setTimestamp().setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                        .setFooter({ text: "Thank you for your report! We will get back to you as soon as possible!"})

                    if (attachment?.contentType?.startsWith("image")) {
                        reportEmbedToReporter.setImage(attachment.url)
                    }
                    interaction.user.send({ embeds:[reportEmbedToReporter]})
                } catch (err) {
                    interaction.followUp({ content:"Could not DM you the Report Information.\nIf you would like to keep DMs closed and receive such DMs, add the bot to your apps. (you can do so by opening the bot profile, clicking add app and choosing add to my apps)",flags:[hiddenFlag]})
                    console.error(`Couldn't DM Reporter in report bug.js,Error name: `, err)
                }

                const reportEmbed = embed_builder(`New Bug Report by ${interaction.user.username}`).addFields(
                    { name: `User ID`, value: `\`${userId}\``, inline: true },
                    { name: `Guild ID`, value: `${guildId ? `\`${guildId}\`` : "No Guild ID"}`, inline: true },
                    { name: `\u200b`, value: `\u200b`, inline: true },
                    { name: `caseNum`, value: `**\`${caseNum.toString()}\`**`, inline: true },
                    { name: `attachment URL`, value: `${attachment?.url ?? "None"}`, inline: true },
                    { name: `\u200b`, value: `\u200b`, inline: true },
                    { name: `reason`, value: reason, inline: false },
                )
                    .setTimestamp().setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                if (attachment?.contentType?.startsWith("image")) {
                    reportEmbed.setImage(attachment.url)
                }

                const reportEmbedButtons = new buttonBuilder()
                    .addButton(`reportBugFixed:${caseNum}`, 'Issue fixed',"Success", null, "✅")
                    .addButton(`reportBugMesssage:${caseNum}`, 'Message User', "Secondary", null, "🗣️")
                    .addButton(`reportBugBL:${caseNum}`, 'Strike/BL reporter', "Danger", null, "⚠️")
                    .addButton(`reportBugDismiss:${caseNum}`, `Dismiss`, `Secondary`, null, '❌');

                const reportCategory = await interaction.client.channels.fetch(bugReportCategoryId)
                const reportChannel = await createChannelInCategory(`bug-case-${caseNum}`, reportCategory, `report channel for case: ${caseNum}`)
                
                const messageOptions = { embeds: [reportEmbed], components:[reportEmbedButtons.getRow()] }

                if(reportChannel){
                    const reportMessage = await reportChannel.send(messageOptions);
                    reportMessage.pin();
                } else {
                    console.error(RED+"Failed to find the report channel"+RESET)

                    const ownerIdDM = await interaction.client.users.fetch(process.env.ownerId)
                    ownerIdDM.send("Failed to find the report channel")
                    ownerIdDM.send({content:"Report:", ...messageOptions})
                }
                
                console.log(`Report added, Case: ${caseNum}. Attachment?: ${Boolean(attachment)}`)
                return; 
            })
        }, undefined)
    }
}