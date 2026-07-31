const fs = require("fs");
const path = require("path");
const { REST, Routes, Collection, SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { getPermissionNum } = require("../utils/utils");
const { YELLOW, RED, DARK_GREY, GREEN, RESET } = process.env
const { currentBranch } = require("../")

let ignoreCategories = [];
if(currentBranch == "main"){
    ignoreCategories.push("owner")
}

/**
 * @param {import('discord.js').Client} client 
 */
async function loadCommands(client) {
    const targetDir = path.dirname(__dirname);
    let commandsPath = path.join(targetDir, "commands");

    client.commands = new Collection(); // Store commands
    const commands = [];

    // get the command categories (crucial for the help command)
    const commandCategories = fs.readdirSync(commandsPath, {withFileTypes: true})
        .filter(file => file.isDirectory() && !ignoreCategories.includes(file.name) )
        .map(dirent => path.join(dirent.parentPath, dirent.name))
    const commandFiles = commandCategories.flatMap(folder => {
        return fs.readdirSync(folder, {withFileTypes: true}).filter(file => file.name.endsWith(".js") && !file.isDirectory()).map(file => path.join(file.parentPath,file.name))
    })
    const commandFolders = commandCategories.flatMap(file =>{
        return fs.readdirSync(file, {withFileTypes: true})
        .filter(file => file.isDirectory())
        .map(dirent => path.join(dirent.parentPath, dirent.name))
    })
    // console.log(commandCategories, commandFiles, commandFolders)
    for (let file of commandFiles) {
        commandsPath = file;
        file = path.basename(file)
        const fullPath = commandsPath;
        
        const command = require(fullPath);

        // setup function just in case maybe
        if (command.setup) {
            await command.setup(client); // passing the client to that function
        }

        // incase stupid me doesnt include data himself
        if (!command.data) {
            command.data = {
                name: command.name || file.replace(".js", ""),
                description: command.description || "No description provided",
                options: command.options || [],
                default_member_permissions: command?.permissions || null,
                dm_permission: command?.permissions ? false : true
            }
        }

        // 'pls dont crash' command block
        if (!command.data.name || !command.data.description || !command.execute) {
            console.warn(YELLOW+`❌ Skipping "${file}": Missing required "name" or "description" or "execute" properties.`+RESET);
            continue;
        }

        // we add all command info to the commands collection and we push the command data to the commands array
        client.commands.set(command.data.name, command);
        commands.push(command.data);
    }
    
    // i hate sub commands
    // const commandFolders = fs.readdirSync(commandsPath);
    for (let folder of commandFolders) {
        commandsPath = folder
        folder = path.basename(folder).toLowerCase().replace(/[^a-z0-9_-]/g, '')
        const folderPath = commandsPath;
        // directories only!!
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        // base command for the sub command
        
        const baseCommandExists = commands.find(cmd => cmd.name === folder)

        let baseCommand;
        
        if(baseCommandExists){
            baseCommand = baseCommandExists
            baseCommand.options = baseCommand.options || []
        } else {
            baseCommand = {
                name: folder,
                description: `Main command: ${folder}`,
                options: []
            }
        }
        const permissionFile = fs.readdirSync(folderPath).filter(file => path.extname(file) === '' && file.startsWith("!")) || null
        // console.log(permissionFile)
        if (permissionFile.length > 0){
            baseCommand.default_member_permissions = getPermissionNum(permissionFile[0].slice(1))
            baseCommand.dm_permission = false
        };
        
        const subcommandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
        let hasSubcommands = false;

        for (const file of subcommandFiles) {
            const fullPath = path.join(folderPath, file);
            const subcommand = require(fullPath);

            // same stuff
            if (subcommand.setup) {
                await subcommand.setup(client);
            }

            if (!subcommand.data) {
                subcommand.data = {
                    name: subcommand.name || file.replace(".js", ""),
                    description: subcommand.description || "No description provided",
                    options: subcommand.options || []
                };
            }
            if (!subcommand.data.name || !subcommand.data.description || !subcommand.execute) {
                console.warn(YELLOW+`❌ Skipping "${file}" in folder "${folder}": Missing required "name" or "description" or "execute" properties.`+RESET);
                continue;
            }

            const subcommandJSON = {
                type: 1,
                name: subcommand.data.name,
                description: subcommand.data.description,
                options: subcommand.data.options || []
            }

            baseCommand.options.push(subcommandJSON)
            hasSubcommands = true

            // stores the the subcommand correctly with the base command as `bc sc`
            client.commands.set(`${folder} ${subcommand.data.name}`, subcommand);
        }

        // If any subcommands were added, register the base command
        if (hasSubcommands && !baseCommandExists) {
            commands.push(baseCommand);
        }
    }
    
    return commands;
}

async function deploySlashCommands(client, clientId, token) {
    
    const commands = await loadCommands(client);
    const rest = new REST({ version: "10" }).setToken(token);

    try {
        console.log(DARK_GREY+"Deploying new commands..."+RESET);
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log(DARK_GREY+"Slash commands deployed successfully!"+RESET);
    } catch (error) {
        console.error(RED+"❌ Error deploying commands:"+RESET, error);
    }
}

module.exports = { deploySlashCommands };