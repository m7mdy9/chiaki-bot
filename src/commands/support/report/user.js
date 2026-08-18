const { getOptionNum, embed_builder, hiddenFlag, createChannelInCategory, redHex, greenHex } = require("../../../utils/utils.js");
const { buttonBuilder, modalBuilder } = require("../../../utils/builders.js");
const { reportUserModel, reportUserBLModel, reportCardModel, reportCardBLModel } = require("../../../database/models/index.js");
const { USER_REPORT_CATEGORY_ID } = process.env;

module.exports = {
    name: "user",
    description: "Report someone who abuses the report card command (inappropriate usage).",
    options: [
        {
            name: 'abuser',
            description: 'Select the abuser (you may input their discord id)',
            type: getOptionNum("USER"),
            required: true,
        }
    ],
    hidden: true,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const targetUser = interaction.options.getUser('abuser');
        const targetUserId = targetUser.id;
        const reporter = interaction.user;
        const reporterId = reporter.id;
        const guildId = interaction.guildId || null

        const lastReport = await reportUserModel.findOne({ reporterId }).sort({timestamp: -1})
        if(lastReport && reporterId != process.env.OWNER_ID){
            const cdTS = Date.parse(lastReport.timestamp) + 60 * 1000
            if(cdTS > Date.now()){
                return interaction.editReply({embeds:[embed_builder(null,
                    `There's a 1 minute cooldown between user reports, sorry!
                    \nYou can try again <t:${Math.floor(cdTS/1000)}:R>`,redHex)]})
            }
        }

        const abuserReportCard = await reportCardModel.findOne({ userId: targetUserId })
        if(!abuserReportCard){
            return interaction.editReply({ content: "This user does not have a report card registered in our database." , flags:[hiddenFlag]})
        }
        // if(targetUser.bot) return interaction.editReply("You can not report other Discord Bots.");
        // if(targetUserId == reporterId) return interaction.editReply("You can not report yourself.")

        const initialReportEmbed = embed_builder("User Report", `Start report for **\`${targetUser.username}\`**?\n\n**Troll reports will result in a blacklist from using this command.**`)

        const reportButton = new buttonBuilder(interaction).addButton('startUserReport', "Start Report", "Danger", null, "⚠️")
        const initialComponents = [reportButton.getRow()]

        const initialResponse = await interaction.editReply({ embeds: [initialReportEmbed], components: initialComponents })
        
        reportButton.startListener(initialResponse, null, async (int) => {
            const textModal = new modalBuilder(int, `reportUserModal`, 'User Report')
            const reportUserInput = textModal.createTextInput('reportUserInput', "Reason for the report", "Short", "e.g. User X put racial slurs in their report card!", true, null, [5, 200])
            textModal.addComponents(reportUserInput)

            textModal.showModal(null, async (allFields, modalInteraction) => {
                const reportInput = allFields.reportUserInput;

                const lastDocCaseNum = (await reportUserModel.findOne().sort({ caseNum: -1 }))?.caseNum

                const caseNum = lastDocCaseNum ? lastDocCaseNum + 1 : 1

                const newReportDoc = await reportUserModel.create({
                    guildId,
                    reporterId,
                    abuserId: targetUserId,
                    caseNum,
                    reason: reportInput
                })
                const abuserNameId = `**<@!${targetUserId}>/\`${targetUserId}\`**`
                
                const userReportCategory = await interaction.client.channels.fetch(USER_REPORT_CATEGORY_ID)
                const userReportChannel = await createChannelInCategory(`report-case-${caseNum}-${targetUser.username}`, userReportCategory, `report channel for case: ${caseNum}`)

                const reportEmbed = embed_builder(`New User Report by ${interaction.user.username}`).addFields(
                    { name: `Reporter ID`, value: `\`${reporterId}\``, inline: true },
                    { name: `Guild ID`, value: `${guildId ? `\`${guildId}\`` : "No Guild ID"}`, inline: true },
                    { name: `\u200b`, value: `\u200b`, inline: true },
                    { name: `Abuser Mention/Id`, value: abuserNameId, inline: true },
                    { name: `caseNum`, value: `**\`${caseNum.toString()}\`**`, inline: true },
                    { name: `\u200b`, value: `\u200b`, inline: true },
                    { name: `reason`, value: reportInput, inline: false },
                )
                    .setTimestamp().setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                const reportEmbedButtons = new buttonBuilder()
                    .addButton(`reportUserStrikeAbuser:${caseNum}`, 'Strike Abuser',"Danger", null, "✅")
                    .addButton(`reportUserMessageReporter:${caseNum}`, 'Message Reporter', "Secondary", null, "🗣️")
                    .addButton(`reportUserStrikeReporter:${caseNum}`, 'Strike/BL Reporter', "Danger", null, "⚠️")
                    .addButton(`reportUserDismiss:${caseNum}`, `Dismiss`, `Secondary`, null, '❌');

                userReportChannel.send({ embeds: [reportEmbed], components:[reportEmbedButtons.getRow()]})
                .then(()=>{ userReportChannel.send({ content: `Abuser's Report Card:\n\`\`\`js\n${abuserReportCard}\n\`\`\``}) })
                
                try {
                    const reportEmbedInDM = embed_builder(`Created User Report Case: ${caseNum}`, null, greenHex)
                      .addFields(
                        { name: 'Abuser Mention/ID', value: abuserNameId, inline: true },
                        { name: 'Report Info', value: reportInput, inline: false },
                      ).setTimestamp().setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                      .setFooter({ text: "Thanks for your report! We will get back to you soon!" })

                    interaction.user.send({ embeds:[reportEmbedInDM]})
                } catch (err) {
                    interaction.followUp({ content:"Could not DM you the Report Information.\nIf you would like to keep DMs closed and receive such DMs, add the bot to your apps. (you can do so by opening the bot profile, clicking add app and choosing add to my apps)",flags:[hiddenFlag]})
                    console.error(`Couldn't DM Reporter in report user.js,Error name: `, err)
                }

                const successEmbed = embed_builder('Thank you for your report!',`You successfully submitted a report on **\`${targetUser.username}\`**!`, greenHex)
                  .setFooter({ text: "We will get back to you soon!" })

                return modalInteraction.update({ embeds:[successEmbed], components:[], flags: [hiddenFlag] })
            })
        })
    }
}