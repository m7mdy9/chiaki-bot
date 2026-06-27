const { reportBugBLModel, reportsModel } = require("../../database/models/index.js");
const { selectorTextBuilder, modalBuilder, buttonBuilder } = require("../../utils/builders.js");
const { hiddenFlag, embed_builder, disableAllComponents } = require("../../utils/utils.js");
const { RED, YELLOW, GREEN, RESET } = process.env;

module.exports = {
    name: "interactionCreate",
    /** @param {import('discord.js').ButtonInteraction} interaction */
    async execute(interaction) {
        if (interaction.isChatInputCommand()) return;
        if (!interaction.isButton()) return;
        
        const customId = interaction.customId;
        const originalMsgId = interaction.message.id
        let OriginalBugReportMessage, DMMessage;

        //.addButton('reportBugFixed:'+caseNum, 'Issue fixed',"Success", null, "✅")
        //.addButton('reportBugMesssage:'+caseNum, 'Message User', "Secondary", null, "🗣️")
        //.addButton('reportBugBL:'+caseNum, 'Strike/BL reporter', "Danger", null, "⚠️");
        const replyBugPrefix = "replyBug"
        const customIdPrefix = customId.split(":")?.[0]
        const customIdCaseNum = customId?.split(":")?.[1]
        const customIdChannelId = customId?.split(":")?.[2]
        const customIdMessageId = customId?.split(":")?.[3]

        if (customIdPrefix != replyBugPrefix) {
            return;
        } else {
            OriginalBugReportMessage = await (await interaction.client.channels.fetch(customIdChannelId)).messages.fetch(customIdMessageId);
            DMMessage = interaction.message;
            console.log(customId)
        }
        const messageModal = new modalBuilder(interaction, 'bugReplyModal', "Your Reply")
        const bugReportDMInput = messageModal.createText1Input("bugReportDMInput", "Enter your messages to us!", "Paragraph", "Message goes here!", true, null, [5, 1000]);
        messageModal.addComponents(bugReportDMInput)

        messageModal.showModal(null, 
            /**
             * @param {import('discord.js').ModalSubmitInteraction} modalInteraction 
             */
            async (allFields, modalInteraction) => {
            const textGiven = allFields.bugReportDMInput

            const textEmbed = embed_builder(`Reply from ${interaction.user.username}`, `**Their message:**\n${textGiven}`)

            const reportEmbedButtons = new buttonBuilder(interaction)
                .addButton('reportBugMesssage:'+customIdCaseNum, 'Message User', "Secondary", null, "🗣️")
            
            
            const updatedRows = disableAllComponents(DMMessage)

            if(!DMMessage.channel){
                try {
                    DMMessage.channel = await interaction.client.channels.fetch(DMMessage.channelId)
                } catch(err){
                    console.warn(`${YELLOW}Failed to fetch dm in replyBug.js event${RESET}\nError: `,err)
                }
            }
            modalInteraction.reply({ content:`Successfully sent message to our team!\nWe will get back to you soon!`,flags:[hiddenFlag]})
            OriginalBugReportMessage.reply({ embeds:[textEmbed], components:[reportEmbedButtons.getRow()] })
            DMMessage.edit({ components:updatedRows })
            return;
        })


    },
};