const { embed_builder, getOptionNum, createAttachment, hiddenFlag, formatDate } = require("../../utils/utils.js")
const { buttonBuilder, modalBuilder, selectorTextBuilder } = require("../../utils/builders.js")
const { reportCardModel, reportCardBLModel } = require("../../database/models/index.js")
const { createReportCard } = require("../../workers/reportCardMaker.js")
const { isSlurPresent } = require("../../utils/slurfilter.js")

const warningMessage = `Adding offensive words or breakage of the Discord & Chiaki Bot's ToS may result in a **blacklist** from using this command.`
const reportMessage = `If you see anyone with an offensive report card, please report them via /report user`
const flags = [hiddenFlag]
let finalProfile;

module.exports = {
    name: "reportcard",
    description: "Generate a Danganronpa 2 Report Card for a Student!",
    options: [
        {
            name: "student",
            description: "Select a student",
            type: getOptionNum("USER"),
            required: false
        }
    ],
    cooldown: 1,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const targetUser = interaction.options.getUser('student') || interaction.user
        const isAuthor = targetUser.id == interaction.user.id
        const userId = targetUser.id
        const avatarPath = targetUser.displayAvatarURL()
        const username = targetUser.username

        let blacklistedDoc;
        if(isAuthor){
            blacklistedDoc = await reportCardBLModel.findOne({ userId }).sort({ caseNum: -1 })
        }

        const reportCardDocument = await reportCardModel.findOne({ userId }).sort({ caseNum: -1 })
        const defaultProfile = {
            birthday: "April 28th",
            blood: "O",
            likes: "Pretty things",
            dislikes: "Noisy places",
            talent: "Ultimate Lucky Student",
            notes: "N/A"
        }
        const selectorEmojis = {
            birthday: "🎂",
            blood: "🩸",
            likes: "✅",
            dislikes: "❌",
            talent: "🏆",
            notes: "🗒️"
        }
        
        /* if there is a reportCardDoc, we set the finalProfile to its content (and if a field is messing we use the defaultProfile)
        Other we jus set the finalProfile to the defaultProfile */
        if (reportCardDocument) {
            const { birthday, blood, likes, dislikes, talent, notes } = reportCardDocument
            finalProfile = {
                birthday: birthday || defaultProfile.birthday,
                blood: blood || defaultProfile.blood,
                likes: likes || defaultProfile.likes,
                dislikes: dislikes || defaultProfile.dislikes,
                talent: talent || defaultProfile.talent,
                notes: notes || defaultProfile.notes,
            }
        } else {
            finalProfile = defaultProfile;
        }

        // we create the report card, and we make an attachment of buffer result
        const buffer = await createReportCard(avatarPath, username, finalProfile)
        const attachment = createAttachment(buffer)
        
        // the main output embed
        const embed = embed_builder(`${username}'s Report Card`).setImage("attachment://output.png")

        // if the runner isnt the author of the reportCard, it just sends it without the EDIT button
        const footerMessage = reportCardDocument ?
        reportMessage :
        `${isAuthor ? `You` : `This user`} did't set a report card, defaulting to Nagito's Card Info`;

        embed.setFooter({ text: footerMessage })

        // no edit options are created if the requested report card isn't the author's
        if (!isAuthor) {
            return interaction.editReply({ embeds: [embed], files: [attachment] })
        }
            
        const editCardButton = new buttonBuilder(interaction).addButton("edit", "Edit Profile", "Secondary", null, "✏️")
        const components = [editCardButton.getRow()]
        const initialResponse = await interaction.editReply({ embeds: [embed], components, files: [attachment] })

        editCardButton.startListener(initialResponse, null,
            /** @param {import('discord.js').ButtonInteraction} editCardInt  */
            async (editCardInt) => {
                if (blacklistedDoc && blacklistedDoc?.expiryDate) {
                    const isBlacklisted = await handleBlacklist(blacklistedDoc, editCardInt);
                    if(isBlacklisted) return;
                }
                
                const resetSelectChoice = async()=>{ await editCardInt.editReply({components:[editSelectorRow]})};
                
                // updates the Report Card PNG with the newest content, and calls the resetSelectChoice
                const updateReportCard = async ()=>{
                    await resetSelectChoice()
                    const updatedAttachment = createAttachment(await createReportCard(avatarPath, username, finalProfile))
                    return interaction.editReply({
                        embeds:[embed.setFooter({ text: reportMessage })],
                        files:[updatedAttachment]
                    })
                }

                const handleUpdate = async (key, value) => {
                    finalProfile[key] = value;
                    await reportCardModel.updateOne(
                        { userId, },
                        { [key]: value, lastEdited: Date.now() },
                        { upsert: true } // we put upsert as true, so if there is no document with that userId we create one
                    )
                    updateReportCard()
                }


                const editingEmbed = embed_builder('Edit Your Report Card',
                    'Please select what you would like to edit.\n\n'+warningMessage);

                const editSelector = new selectorTextBuilder(editCardInt)
                editSelector.createSelector('editSelector', 'Select Field', 1, 1)
                
                for (const key in finalProfile) {
                    editSelector.addOption(key, key, null, selectorEmojis[key])
                }
                const editSelectorRow = editSelector.getRow()


                /*1. Sending the Edit Embed with the Selector (ephermal/hiddenFlag)
                * 2. Setting the ResponseMessage that will be passed to the Event Listener
                * 3. Saving the original Reponse Options as it will be reverted back */
                const editInitialResponse = await editCardInt.reply({ embeds: [editingEmbed], flags, components: [editSelectorRow], withResponse: true })                    
                const editResponseMessage = editInitialResponse.resource.message                    
                const originalResponseOptions = { embeds: editResponseMessage.embeds, components:editResponseMessage.components, flags, withResponse: true}
                
                editSelector.startListener(editResponseMessage, 90_000,
                    /** @param {import('discord.js').StringSelectMenuInteraction} editSelectorInt */
                    async (editSelectorInt) => {
                        const selectedOption = editSelectorInt.values[0]
                        const textOptions = ["likes", "dislikes", "notes", "talent", "birthday"]
    
                        if (textOptions.includes(selectedOption)) {
                            await handleTextOption(editSelectorInt, selectedOption, resetSelectChoice, handleUpdate);
                        }

                        if (selectedOption == "blood") {
                            await handleBloodSelect(editSelectorInt, selectedOption, originalResponseOptions, handleUpdate);
                        }
                    })
            })
    }
}

// -- handler functions begin here -- //

async function handleTextOption(textOptionInt, textOption, resetSelectChoice, updateHandler){
    const textFieldModal = new modalBuilder(textOptionInt, "textModal", "Edit Your Report Card")

    const minMax = [3, 42]

    const textRow = textFieldModal.createTextInput(
        textOption, `Input your ${textOption}`, 
        "Short", null, 
        true, finalProfile[textOption], 
        minMax);
    
    textFieldModal.addComponents(textRow)
    
    await textFieldModal.showModal(null, async (allFields, modalInteraction) => {
        await handleTextModalSubmit(allFields, modalInteraction, textOption, resetSelectChoice, updateHandler)
    })
}

async function handleTextModalSubmit(allFields, modalInteraction, textOption, resetSelectChoice, updateHandler) {
    let outputValue = allFields[textOption]
    let isDateWrong = false;

    const { isSlur, censoredMatch } = isSlurPresent(outputValue)
    if (isSlur) {
        await resetSelectChoice();
        return modalInteraction.reply({
            content: `:x: **Response Flagged:** An offensive word was found. **Match: **||${censoredMatch}||` +
                `\nAny attempt to evade the censor may result in a **blacklist** from using this command.` +
                `\n-# If you think that is a mistake, please report it via /report bug and provide sentence you put.`, flags: [hiddenFlag]
        })
    }

    // if the selected option is birthday, we format, and if the input is wrong we just set the birthday as ??? 
    if (textOption == "birthday") {
        const formattedDate = formatDate(outputValue);
        if (formattedDate) {
            outputValue = formattedDate;
        } else {
            isDateWrong = true;
            outputValue = "???"
        }
    }

    await updateHandler(textOption, outputValue)

    // if the date is wrong it lets the user know it was set to ???
    if (isDateWrong) {
        return modalInteraction.reply({ content: ":x: **Invalid Date**: Please input your birthday date correctly.\n**(unless you want it to stay as `???`)**\nExample: `April 28th`, `28/04`", flags })
    }
    return modalInteraction.reply({ content: `Set \`${textOption}\` to \`${outputValue}\` successfully.`, flags })
}

async function handleBloodSelect(bloodInt, selectedOption, originalResponseOptions, updateHandler){

    const bloodSelector = new selectorTextBuilder(bloodInt)
        .createSelector('bloodSelector', 'Select Blood Type', 1, 1)

    const bloodTypes = ["O", "A", "B", "AB", "??"]

    bloodTypes.forEach(bloodType => {
        bloodSelector.addOption(bloodType, bloodType) // label, value
    })

    const bloodRow = bloodSelector.getRow()
    const bloodEmbed = embed_builder("Select your Blood Type")

    const bloodResponse = await bloodInt.update({ embeds: [bloodEmbed], components: [bloodRow], flags, withResponse: true })
    const bloodResponseMessage = bloodResponse.resource.message

    bloodSelector.startListener(bloodResponseMessage, null,
        async (bloodSelectorInt)=>{ await handleBloodSubmit(bloodSelectorInt, bloodSelector, selectedOption, originalResponseOptions, updateHandler) })
}

/** 
 * @param {import('discord.js').StringSelectMenuInteraction} bloodSelectorInt 
 * @param {selectorTextBuilder} bloodSelector
 * @param {Promise<void>} updateHandler 
 * */
async function handleBloodSubmit(bloodSelectorInt, bloodSelector, selectedOption, originalResponseOptions, updateHandler) {

    const outputValue = bloodSelectorInt.values[0]
    await bloodSelectorInt.update(originalResponseOptions)
    await updateHandler(selectedOption, outputValue)

    // once it saves in the database, it stops the bloodSelector's event listener to avoid conflicts
    bloodSelector.collector.stop()

    await bloodSelectorInt.followUp({ content: `Set \`${selectedOption}\` to \`${outputValue}\` successfully.`, flags })
}

async function handleBlacklist(targetBLDoc, providedInt){
    const expiryDateMS = targetBLDoc.expiryDate.getTime()
    const expiryDateTimestamp = Math.floor(expiryDateMS / 1000)
    if (expiryDateMS > Date.parse(new Date("2098"))) {
        await providedInt.reply({ content: `You are blacklisted from using \`/report card\` permanently.\n\nReason: ${targetBLDoc.reason}`, flags: [hiddenFlag] })
        return true;
    } else if (expiryDateMS > Date.now()) {
        await providedInt.reply({ content: `You are blacklisted from using \`/report card\`\nYour blacklist expires <t:${expiryDateTimestamp}:R>\n\nReason: ${targetBLDoc.reason}`, flags: [hiddenFlag] })
        return true;
    } else {
        return false;
    }
}