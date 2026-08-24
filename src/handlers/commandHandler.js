const fs = require("fs");
const path = require("path");
const { REST, Routes, Collection, SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { getPermissionNum, RedAscii, ResetAscii, DarkGreyAscii, YellowAscii } = require("../utils/utils");
const currentBranch = process.env.currentBranch;

const helpCommand = require("../commands/misc/help.js")

let ignoredCommands = [];
let testOnlyCommands = [];
/**
 * @param {import('discord.js').Client} client 
*/
async function loadCommands(client) {
    const ownerCommands = (await helpCommand.setup()).get("owner").flatMap(cmd => cmd?.name)
    if(currentBranch == "main"){
        ignoredCommands = ownerCommands
    }

    const targetDir = path.dirname(__dirname);
    let commandsPath = path.join(targetDir, "commands");

    client.commands = new Collection(); // Store commands
    const commands = [];

    // get the command categories (crucial for the help command)
    const commandCategories = fs.readdirSync(commandsPath, {withFileTypes: true})
        .filter(file => file.isDirectory())
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

        if(command.readOnly){
            continue;
        }
        // setup function just in case maybe
        if (command.setup) {
            await command.setup(client); // passing the client to that function
        }
        const cmdCategory = path.basename(path.dirname(commandsPath))
        const isFunCommands = ["fun","danganronpa","image"].includes(cmdCategory) || command.name == "avatar" || command.name == "help"
        
        const integration_types = [0]
        const contexts = [0]

        if(!command.permissions && !command.isServerOnly){
            contexts.push(1)
        }
        if(isFunCommands){
            contexts.push(2)
            integration_types.push(1)
        }

        // incase stupid me doesnt include data himself
        if (!command.data) {
            command.data = {
                name: command.name || file.replace(".js", ""),
                description: command.description || "No description provided",
                options: command.options || [],
                default_member_permissions: command?.permissions || null,
                dm_permission: command?.permissions ? false : true,
                contexts,
                integration_types,
            }
        }

        // 'pls dont crash' command block
        if (!command.data.name || !command.data.description || !command.execute) {
            console.warn(YellowAscii+`❌ Skipping "${file}": Missing required "name" or "description" or "execute" properties.`+ResetAscii);
            continue;
        }

        // we add all command info to the commands collection and we push the command data to the commands array
        client.commands.set(command.data.name, command);

        if(!ignoredCommands.includes(command.data.name)){
            commands.push(command.data);
        } else {
            testOnlyCommands.push(command.data)
        }

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
        
        const cmdCategory = path.basename(path.dirname(commandsPath));
        const funCommandExceptions = ["welcome", "votingtime"]

        const isFunCommands = ["fun","danganronpa","image"].includes(cmdCategory) && !funCommandExceptions.includes(folder)

        const integration_types = [0]
        const contexts = [0]
        if(!(permissionFile.length > 0)){
            contexts.push(1)
        }
        if(isFunCommands && !(permissionFile.length > 0)){
            integration_types.push(1)
            contexts.push(2)
        }
        baseCommand.contexts = contexts;
        baseCommand.integration_types = integration_types;

        const subcommandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
        let hasSubcommands = false;

        for (const file of subcommandFiles) {
            const fullPath = path.join(folderPath, file);
            const subcommand = require(fullPath);

            if (subcommand.readOnly) {
                continue;
            }

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
                console.warn(YellowAscii+`❌ Skipping "${file}" in folder "${folder}": Missing required "name" or "description" or "execute" properties.`+ResetAscii);
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
        const isOwnerCategory = cmdCategory == "owner"

        if (hasSubcommands && !baseCommandExists && !isOwnerCategory) {
            commands.push(baseCommand);
        }
        else if(hasSubcommands && !baseCommandExists && isOwnerCategory){
            testOnlyCommands.push(baseCommand)
        }
    }
    
    return commands;
}

async function deploySlashCommands(client, CLIENT_ID, token) {
    
    const commands = await loadCommands(client);
    const rest = new REST({ version: "10" }).setToken(token);

    try {
        console.log(DarkGreyAscii+"Deploying new commands..."+ResetAscii);
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, process.env.TESTING_GUILD), { body: [...testOnlyCommands]})
        console.log(DarkGreyAscii+"Slash commands deployed successfully!"+ResetAscii);
    } catch (error) {
        console.error(RedAscii+"❌ Error deploying commands:"+ResetAscii, error);
    }
}

module.exports = { deploySlashCommands };