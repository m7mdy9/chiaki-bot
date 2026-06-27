const { embed_builder, getOptionNum, createAttachment, hiddenFlag, formatDate } = require("../../utils/utils.js")
const { buttonBuilder, modalBuilder, selectorTextBuilder } = require("../../utils/builders.js")
const { reportCardModel } = require("../../database/models/reportCard.js")
const { createReportCard } = require("../../workers/reportCardMaker.js")

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
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {

        const targetUser = interaction.options.getUser('student') || interaction.user
        const isAuthor = targetUser.id == interaction.user.id
        const userId = targetUser.id
        const avatarPath = targetUser.displayAvatarURL()
        const username = targetUser.username

        const flags = [hiddenFlag]

        const reportCardDocument = await reportCardModel.findOne({ userId })

        let finalProfile;

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
        Other we jus set the finalProfile to the defaultProfile
        */
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
        if (!isAuthor) {
            if(!reportCardDocument){
                embed.setFooter({ text: "This user did not set a report card, defaulting to Nagito's Card Info" })
            };
            return interaction.editReply({ embeds: [embed], files: [attachment] })
        } else {
            if(!reportCardDocument){
                embed.setFooter({ text: "You didn't set a report card, defaulting to Nagito's Card Info" })
            };

            // creating the edit button
            const editCardButton = new buttonBuilder(interaction).addButton("edit", "Edit Profile", "Secondary", null, "✏️")
            
            // setting the components to be sent and sending the initialResponse
            const components = [editCardButton.getRow()]
            const initialResponse = await interaction.editReply({ embeds: [embed], components, files: [attachment] })

            // starting an eventListener for the edit button
            editCardButton.startListener(initialResponse, null,
                /** @param {import('discord.js').ButtonInteraction} int  */
                async (int) => {

                    // Resets the selection choice
                    const resetSelectChoice = async()=>{ await int.editReply({components:[editSelectorRow]})};
                    
                    // updates the Report Card PNG with the newest content, and calls the resetSelectChoice
                    const updateReportCard = async ()=>{
                        await resetSelectChoice()
                        const updatedAttachment = createAttachment(await createReportCard(avatarPath, username, finalProfile))
                        return interaction.editReply({embeds:[embed], files:[updatedAttachment]})
                    }

                    // embed to be sent once the button is clicked
                    const editingEmbed = embed_builder('Edit Your Report Card',
                        'Please select what you would like to edit')
                    
                    // creating the selector and setting a field for each key in the finalProfile Object
                    const editSelector = new selectorTextBuilder(int)
                    editSelector.createSelector('editSelector', 'Select Field', 1, 1)
                    for (const key in finalProfile) {
                        if(key == "name") continue;

                        editSelector.addOption(key, key, null, selectorEmojis[key])
                    }

                    const editSelectorRow = editSelector.getRow()

                    // Sending the actual edit embed with the selector and making it ephermal
                    const editInitialResponse = await int.reply({ embeds: [editingEmbed], flags, components: [editSelectorRow], withResponse: true })
                    
                    // setting the ResponseMessage that will be used in the Event Listener
                    const editResponseMessage = editInitialResponse.resource.message
                    
                    // We save the original Response Options as we will embed will be edited later on and then reverted
                    const originalReponseOptions = { embeds: editResponseMessage.embeds, components:editResponseMessage.components, flags, withResponse: true}
                    
                    
                    editSelector.startListener(editResponseMessage, 90_000,
                        /** @param {import('discord.js').StringSelectMenuInteraction} secondInt */
                        async (secondInt) => {
                            if(secondInt.customId != editSelector.selector.data.custom_id) return;
                            
                            const selectedOption = secondInt.values[0]
                            const textOptions = ["likes", "dislikes", "notes", "talent", "birthday"]

                            // if the option is a text option, it opens a modal
                            if (textOptions.includes(selectedOption)) {
                                const textFieldModal = new modalBuilder(secondInt, "textModal", "Edit Your Report Card")
                                
                                const minMax = [3,42]
                                
                                const textRow = textFieldModal.createTextInput(selectedOption, `Input your ${selectedOption}`,"Short", null, true, finalProfile[selectedOption], minMax)
                                textFieldModal.addComponents(textRow)
                                await textFieldModal.showModal(null, async (allFields, modalInteraction) => {

                                    let outputValue = allFields[selectedOption]
                                    
                                    let isDateWrong = false;

                                    // if the selected option is birthday, we format, and if the input is wrong we just set the birthday as ??? 
                                    if(selectedOption == "birthday"){
                                        const formattedDate = formatDate(outputValue);
                                        if(formattedDate){
                                            outputValue = formattedDate;
                                        } else {
                                            isDateWrong = true;
                                            outputValue = "???"
                                        }
                                    }

                                    // we change the field in the finalProfile object before setting it in the Database
                                    finalProfile[selectedOption] = outputValue
                                    await reportCardModel.updateOne(
                                        { userId, }, // we search by userId
                                        { [selectedOption]: outputValue, lastEdited: Date.now() }, // we change the selectedOption and the lastEdited timestamp
                                        { upsert: true } // we put upsert as true, so if there is no document with that userId we create one
                                    )

                                    updateReportCard();

                                    // if the date is wrong it lets the user know it was set to ???
                                    if(isDateWrong){
                                        return modalInteraction.reply({content:":x: **Invalid Date**: Please input your birthday date correctly.\n**(unless you want it to stay as `???`)**\nExample: `April 28th`, `28/04`", flags})
                                    }
                                    return modalInteraction.reply({ content: `Set \`${selectedOption}\` to \`${outputValue}\` successfully.`, flags })
                                    
                                })
                            }
                            
                            // if the selecetd option is blood, we create its own selector
                            if(selectedOption == "blood"){

                                // we create the blood selector
                                const bloodSelector = new selectorTextBuilder(secondInt)
                                  .createSelector('bloodSelector','Select Blood Type', 1,1)
                                  
                                const bloodTypes = ["O", "A", "B", "AB", "??"]
                                
                                // we add each blood type as an option in the blood selector
                                bloodTypes.forEach(el =>{
                                    bloodSelector.addOption(el, el)
                                })

                                const bloodRow = bloodSelector.getRow()
                                
                                // the blood field embed to be sent
                                const bloodEmbed = embed_builder("Select your Blood Type")
                                
                                // we send the response
                                const bloodResponse = await secondInt.update({embeds:[bloodEmbed], components:[bloodRow], flags, withResponse: true})
                                const bloodResponseMessage = bloodResponse.resource.message

                                // starting a event listener for whenever an option is selected
                                bloodSelector.startListener(bloodResponseMessage, null, 
                                    /** 
                                     * @param {import('discord.js').StringSelectMenuInteraction} thirdInt 
                                    */
                                    async (thirdInt)=>{

                                        const outputValue = thirdInt.values[0]

                                        // changing the field before setting it in the database
                                        finalProfile[selectedOption] = outputValue
                                        await reportCardModel.updateOne(
                                            { userId, },
                                            { [selectedOption]: outputValue, lastEdited: Date.now() },
                                            { upsert: true }
                                        )

                                        // once it saves in the database, it stops the bloodSelector's event listener to avoid conflicts
                                        bloodSelector.collector.stop()

                                        // we set the message back to the original edit response, and we update the card and followUp with a success message
                                        await thirdInt.update(originalReponseOptions)

                                        updateReportCard(); 

                                        await thirdInt.followUp({ content: `Set \`${selectedOption}\` to \`${outputValue}\` successfully.`, flags })

                                    })
                            }
                        })
                })
        }
    }
}