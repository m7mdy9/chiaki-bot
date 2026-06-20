const { embed_builder, getOptionNum, createAttachment, hiddenFlag, formatDate } = require("../../../utils/utils.js")
const { buttonBuilder, modalBuilder, selectorTextBuilder } = require("../../../utils/builders.js")
const { reportCardModel } = require("../../../database/models/reportCard.js")
const { createReportCard } = require("../../../workers/reportCardMaker.js")

module.exports = {
    name: "card",
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

        
        // const profile = {
            //     birthday: "17/11",
        //     blood: "AB",
        //     likes: "no i hate discord bots",
        //     dislikes: "no i hate discord bots",
        //     talent: "no i hate discord bots",
        //     notes: "no i hate discord bots"
        // }

        const buffer = await createReportCard(avatarPath, username, finalProfile)
        const attachment = createAttachment(buffer)
        

        const embed = embed_builder(`${username}'s Report Card`).setImage("attachment://output.png")

        if (!isAuthor) {
            if(!reportCardDocument){
                embed.setFooter({ text: "This user did not set a report card, defaulting to Nagito's Card Info" })
            };
            return interaction.editReply({ embeds: [embed], files: [attachment] })
        } else {
            if(!reportCardDocument){
                embed.setFooter({ text: "You didn't set a report card, defaulting to Nagito's Card Info" })
            };
            const editCardButton = new buttonBuilder(interaction).addButton("edit", "Edit Profile", "Secondary", null, "✏️")
            const components = [editCardButton.getRow()]
            const initialResponse = await interaction.editReply({ embeds: [embed], components, files: [attachment] })
            editCardButton.startListener(initialResponse, null,
                /** @param {import('discord.js').ButtonInteraction} int  */
                async (int) => {

                    const resetSelectChoice = async()=>{ await int.editReply({components:[editSelectorRow]})};
                    const updateReportCard = async ()=>{
                        await resetSelectChoice()
                        const updatedAttachment = createAttachment(await createReportCard(avatarPath, username, finalProfile))
                        return interaction.editReply({embeds:[embed], files:[updatedAttachment]})
                    }
                    let editingEmbed = embed_builder('Edit Your Report Card',
                        'Please select what you would like to edit')
                    const editSelector = new selectorTextBuilder(int)
                    editSelector.createSelector('editSelector', 'Select Field', 1, 1)
                    for (let key in finalProfile) {
                        if(key == "name") continue;

                        editSelector.addOption(key, key, null, selectorEmojis[key])
                    }
                    const editSelectorRow = editSelector.getRow()

                    const editInitialResponse = await int.reply({ embeds: [editingEmbed], flags, components: [editSelectorRow], withResponse: true })
                    const editResponseMessage = editInitialResponse.resource.message
                    const originalReponseOptions = { embeds: editResponseMessage.embeds, components:editResponseMessage.components, flags, withResponse: true}
                    
                    
                    editSelector.startListener(editResponseMessage, 90_000,
                        /** @param {import('discord.js').StringSelectMenuInteraction} secondInt */
                        async (secondInt) => {
                            if(secondInt.customId != editSelector.selector.data.custom_id) return;
                            
                            const selectedOption = secondInt.values[0]
                            const textOptions = ["likes", "dislikes", "notes", "talent", "birthday"]

                            if (textOptions.includes(selectedOption)) {

                                const textFieldModal = new modalBuilder(secondInt, "textModal", "Edit Your Report Card")
                                
                                const minMax = [3,42]
                                
                                const textRow = textFieldModal.createTextInput(selectedOption, `Input your ${selectedOption}`,"Short", null, true, finalProfile[selectedOption], minMax)
                                textFieldModal.addComponents(textRow)
                                await textFieldModal.showModal(null, async (allFields, modalInteraction) => {

                                    let outputValue = allFields[selectedOption]
                                    
                                    let isDateWrong = false;
                                    if(selectedOption == "birthday"){
                                        const formattedDate = formatDate(outputValue);
                                        if(formattedDate){
                                            outputValue = formattedDate;
                                        } else {
                                            isDateWrong = true;
                                            outputValue = "???"
                                        }
                                    }

                                    finalProfile[selectedOption] = outputValue
                                    await reportCardModel.updateOne({
                                        userId,
                                    }, { [selectedOption]: outputValue, lastEdited: Date.now() },
                                        { upsert: true }
                                    )
                                    updateReportCard();
                                    if(isDateWrong){
                                        return modalInteraction.reply({content:":x: **Invalid Date**: Please input your birthday date correctly.\n**(unless you want it to stay as `???`)**\nExample: `April 28th`, `28/04`", flags})
                                    }
                                    return modalInteraction.reply({ content: `Set \`${selectedOption}\` to \`${outputValue}\` successfully.`, flags })
                                    
                                })
                            } else if(selectedOption == "blood"){
                                const bloodSelector = new selectorTextBuilder(int)
                                  .createSelector('bloodSelector','Select Blood Type', 1,1)
                                const bloodTypes = ["O", "A", "B", "AB", "??"]
                                bloodTypes.forEach(el =>{
                                    bloodSelector.addOption(el, el)
                                })
                                const bloodRow = bloodSelector.getRow()
                                const bloodEmbed = embed_builder("Select your Blood Type")
                                
                                
                                const bloodResponse = await secondInt.update({embeds:[bloodEmbed], components:[bloodRow], flags, withResponse: true})
                                
                                bloodSelector.startListener(bloodResponse.resource.message, null, 
                                    /** 
                                     * @param {import('discord.js').StringSelectMenuInteraction} thirdInt 
                                    */
                                    async (thirdInt)=>{

                                        if(thirdInt.customId != bloodSelector.selector.data.custom_id) return;

                                        const outputValue = thirdInt.values[0]

                                        finalProfile[selectedOption] = outputValue
                                        await reportCardModel.updateOne({
                                            userId,
                                        }, { [selectedOption]: outputValue, lastEdited: Date.now() },
                                            { upsert: true }
                                        )

                                        bloodSelector.collector.stop()

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