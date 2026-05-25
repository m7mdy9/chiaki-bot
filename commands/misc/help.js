const fs = require("fs")
const path = require("path")
const { embed_builder, getPermissionNum } = require("../../utils/utils.js")
const { selectorBuilder } = require("../../utils/builders.js")
const { ButtonStyle, inlineCode } = require("discord.js");
let categoryNames, fullCommandInfo;
const chiakiColor = '#ffdcfc';

async function getCommands(){
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
                    // console.log(commandInfo)
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
        return fullCommandInfo
}

module.exports ={
    name: "help",
    description: "Shows information about commands relating to the bot.",
    setup: getCommands,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        // const formattedCategoryNames = categoryNames.map(w => w[0].toUpperCase() + w.slice(1))
        const Embeds = new Map()
        const helpEmbed = embed_builder("Help", "Please select the category of commands that you need help with", chiakiColor)
        const selector = new selectorBuilder(interaction)
        selector.createSelector("chosenCategory", "Choose a category")
        for (const categ of categoryNames){
            const formattedName = categ[0].toUpperCase()+categ.slice(1)
            const embed = embed_builder(formattedName,null,chiakiColor)
            const commands = fullCommandInfo.get(categ)
            
            if (!commands || commands.length === 0) continue;
            selector.addOption(formattedName, categ)
            for (const command of commands){
                let description;
                if (command?.options && command.options.length != 0){
                    let optionsNames = [];
                    command.options?.forEach(el => {
                        optionsNames.push(el.name)
                    });
                    description = `${command.description}\n**options:** ${optionsNames.join(", ")}`
                } else {
                    description = command.description
                }
                embed.addFields(
                    {name:`\`/${command.name}\``, value: description, inline: false}
                )
            }
            Embeds.set(categ, embed)
        }
        // console.log(Embeds)
        const row = selector.getRow()
        const response = await interaction.editReply({ embeds: [helpEmbed], components:[row],})
        selector.startListener(response, null, async (i) =>{
            if (i.user.id != interaction.user.id) {
                return i.reply({ content: "You did not initiate the command.", ephemeral: true })
            }
            const selection = i.values[0]
            i.update({ embeds: [Embeds.get(selection)], components:[row]})
        })
        // const ListFormatter = new Intl.ListFormat("en", {
        //     style: "long",
        //     type: "conjunction"
        // })
        // return interaction.editReply( {content:ListFormatter.format(categoryNames)})
    }
}