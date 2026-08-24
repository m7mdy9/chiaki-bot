const fs = require("fs")
const path = require("path")
const { embed_builder, getPermissionNum, pinkHex } = require("../../utils/utils.js")
const { selectorTextBuilder, buttonBuilder } = require("../../utils/builders.js")
const { ButtonStyle } = require("discord.js");

let categoryNames, fullCommandInfo;
const chiakiColor = pinkHex;

async function getCommands(type){
        const mainPath = path.dirname(__dirname);
        const categoryPaths = fs.readdirSync(mainPath, { withFileTypes: true}).flatMap(el =>{
            if (el.isDirectory()) return path.join(el.parentPath, el.name) 
        })
        categoryNames = categoryPaths.flatMap(el => path.basename(el))
        fullCommandInfo = new Map();
        for (const category of categoryPaths){
            // console.log(category)
            const categoryName = path.basename(category)
            const commands = []
            const subFolders = [];
            const files = fs.readdirSync(category, {withFileTypes: true})
            for (const file of files){
                const fullFilePath = path.join(file.parentPath, file.name)
                if (file.isDirectory(fullFilePath)){
                    subFolders.push(file)
                    continue;
                } else {
                    const data = require(fullFilePath)
                    let formattedOptions = [];
                    const formatTemplate = ["name", "description"];
                    if (data.options){
                        for (obj of data.options){
                            formattedOptions.push(Object.fromEntries(
                                Object.entries(obj).filter(([key]) => formatTemplate.includes(key))
                            ))
                        }
                    }
                    const commandInfo = {
                        name: data.name || file.name.replace(".js", ""),
                        description: data.description || "No description provided.",
                        options: formattedOptions || null,
                    }
                    commands.push(commandInfo)
                }
            }
            for (const folder of subFolders){
                const fullSubFolderPath = path.join(folder.parentPath, folder.name)
                const subFiles = fs.readdirSync(fullSubFolderPath, {withFileTypes: true})
                for (const subFile of subFiles) {
                    const fullSubFilePath = path.join(subFile.parentPath, subFile.name)
                    if (subFile.isDirectory(fullSubFilePath)) {
                        subFolders.push(subFile)
                        continue;
                    } else if (path.extname(subFile.name) == "" || !subFile.name.endsWith(".js")){
                        continue;
                    } else {
                        const data = require(fullSubFilePath)
                        let formattedOptions = [];
                        const formatTemplate = ["name", "description"];
                        if (data.options) {
                            for (obj of data.options) {
                                formattedOptions.push(Object.fromEntries(
                                    Object.entries(obj).filter(([key]) => formatTemplate.includes(key))
                                ))
                            }
                        }
                        const commandInfo = {
                            name: `${folder.name} ${data.name}` || `${folder.name} ${subFile.name.replace(".js", "")}`,
                            description: data.description || "No description provided.",
                            options: formattedOptions || null,
                        }
                        // console.log(commandInfo)
                        commands.push(commandInfo)
                    }
                }
            }
            fullCommandInfo.set(categoryName, commands)
            // console.log(fullCommandInfo)
        }
        return fullCommandInfo;
}

module.exports ={
    name: "help",
    description: "Shows information about awesome commands you can use!",
    setup: getCommands,
    isInstalled: true,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        // const formattedCategoryNames = categoryNames.map(w => w[0].toUpperCase() + w.slice(1))
        const Embeds = new Map()
        const helpEmbed = embed_builder("Help", "Please select the category of commands that you need help with", chiakiColor)
        const selector = new selectorTextBuilder(interaction)
        selector.createSelector("chosenCategory", "Choose a category")
        for (const categ of categoryNames){

            if(categ == "owner") continue;
            
            const formattedName = categ[0].toUpperCase()+categ.slice(1)
            let embedList = []
            const commands = fullCommandInfo.get(categ)
            
            if (!commands || commands.length === 0) continue;
            selector.addOption(formattedName, categ)
            
            let i = 0;
            let currentDescription = "";
            let embedFields = [];
            for (const command of commands){
                i++
                let description;

                if (command?.options && command.options.length != 0){
                    let optionsNames = [];
                    command.options?.forEach(el => {
                        optionsNames.push(el.name)
                    });
                    description = `${command.description}\n\u200b**options:** ${optionsNames.join(", ")}`
                } else {
                    description = command.description
                }
                embedFields.push(
                    {name:`\`/${command.name}\``, value: description, inline: false}
                )
                if(i % 7 === 0 || i === commands.length){
                    // currentDescription += `**\`/${command.name}\`**: ${description}`
                    embedList.push(
                        embed_builder(formattedName, currentDescription, chiakiColor).addFields(embedFields)
                    );
                    embedFields = []
                    // currentDescription = "";
                } else {
                    // currentDescription +=`**\`/${command.name}\`**: ${description}\n\n`
                }
            }
            Embeds.set(categ, embedList)
        }
        // console.log(Embeds)
        const selectorRow = selector.getRow()
        
        const pageButtons = new buttonBuilder(interaction)
        .addButton("previousPage", "<", "Secondary", null, null, false)
        .addButton("pageIndex", "1", "Primary", null, null, true)
        .addButton("nextPage", ">", "Secondary", null, null, false);
        
        const prevPageBtnIndex = 0;
        const pageIndexBtnIndex = 1;
        const nextPageBtnIndex = 2;

        const updateIndexAndGetRow = (pageNumber, embedsSize) =>{
            pageButtons.buttons[pageIndexBtnIndex].setLabel(pageNumber.toString());
            if(embedsSize == 1){
                pageButtons.buttons.forEach(button => button.setDisabled(true));
                return pageButtons.getRow();
            }
            pageButtons.buttons.filter(button => button.data.custom_id != "pageIndex")
                .forEach(button => button.setDisabled(false));
            
            if(embedsSize == pageNumber){
                pageButtons.buttons[nextPageBtnIndex].setDisabled(true);
            }
            if(pageNumber == 1){
                pageButtons.buttons[prevPageBtnIndex].setDisabled(true);
            }

            return pageButtons.getRow();
        }

        let currentIndex = 0;
        let currentSelection;
        const response = await interaction.editReply({ embeds: [helpEmbed], components:[selectorRow],})
        selector.startListener(response, 120_000, async (i) =>{
            const selection = i.values[0]
            const selectedEmbeds = Embeds.get(selection);
            const firstEmbed = selectedEmbeds[0].setFooter({ text: `Page 1/${selectedEmbeds.length}` })
            const buttonRow =  updateIndexAndGetRow(1, selectedEmbeds.length);

            currentSelection = selectedEmbeds;
            currentIndex = 0;

            i.update({ embeds: [firstEmbed], components:[buttonRow, selectorRow]})
        })

        pageButtons.startListener(response, 120_000, async (btnInt)=>{
            const customId = btnInt.customId;
            let updatedButtonRow;

            const embedsLength = currentSelection.length;
            
            if(customId == "nextPage"){
                currentIndex++
                updatedButtonRow = updateIndexAndGetRow(currentIndex + 1, embedsLength);
            }
            if(customId == "previousPage"){
                currentIndex--
                updatedButtonRow = updateIndexAndGetRow(currentIndex + 1, embedsLength);
            }
            
            const currentPageNumber = currentIndex + 1
            const selectedEmbed = currentSelection[currentIndex].setFooter({ text: `Page ${currentPageNumber}/${embedsLength}` })
            
            btnInt.update({ embeds: [selectedEmbed], components:[updatedButtonRow, selectorRow]})
        })
        // const ListFormatter = new Intl.ListFormat("en", {
        //     style: "long",
        //     type: "conjunction"
        // })
        // return interaction.editReply( {content:ListFormatter.format(categoryNames)})
    }
}