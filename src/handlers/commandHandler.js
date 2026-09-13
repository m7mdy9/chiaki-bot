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

    const commandCollectionExists = client.commands instanceof Collection 
    if (!commandCollectionExists) client.commands = new Collection();
    const commands = [];

    /*1. We get the top-level Command Categories
        1.a. They are filtered to be categories, and mapped at the end to be the full joined path

     *2. We get the base/normal command files inside these categories (no subcommands yet)
        2.a. We filter those to files only ending with ".js" and no directories, then we map them to be the fullPath
     
     *3. We get the command folders inside the command categories (subcommand folders)
        3.a. Those are filtered for directories, and they include commands inside them, which will be subcommands.
    */
    const commandCategories = fs.readdirSync(commandsPath, {withFileTypes: true})
        .filter(file => file.isDirectory())
        .map(dirent => path.join(dirent.parentPath, dirent.name));
    
    const commandFiles = commandCategories.flatMap(folder => {
        return fs.readdirSync(folder, {withFileTypes: true}).filter(file => file.name.endsWith(".js") && !file.isDirectory()).map(file => path.join(file.parentPath,file.name))
    })
    
    const commandFolders = commandCategories.flatMap(file =>{
        return fs.readdirSync(file, {withFileTypes: true})
        .filter(file => file.isDirectory())
        .map(dirent => path.join(dirent.parentPath, dirent.name))
    });

    // Normal Slash Commands (not subcommands)
    for (let file of commandFiles) {
        const command = await handleCommand(file, client);

        if(!command) continue;

        client.commands.set(command.data.name, command);

        if(ignoredCommands.includes(command.data.name)){
            testOnlyCommands.push(command.data)
            continue;
        }

        commands.push(command.data);
    }
    
    // Going over Folder names of the Subcommands (each folder will be a baseCommand for the subcommands below it)
    for (let folder of commandFolders) {
        const { 
            baseCommand,
            baseCommandExists,
            hasSubcommands 
        } = await handleBasecommands(commands, folder, client)
        
        if(!baseCommand) continue;
        const  cmdCategory = path.basename(path.dirname(folder))

        const isOwnerCategory = cmdCategory === "owner"

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

async function handleCommand(file, client){
        const fullPath = file;
        const fileBasename = path.basename(file)

        const command = require(fullPath);

        if(command.readOnly){
            return null;
        }
        
        // runs setup function if exists, and passes client to it
        if (command.setup) {
            await command.setup(client);
        }

        const cmdCategory = path.basename(path.dirname(fullPath))
        const isFunCommands = ["fun","danganronpa","image"].includes(cmdCategory) || command.isInstalled
        
        // Integration Types: 0 = GuildInstall, 1 = UserInstall  
        // Context Types (can be executed in): 0 = Guild, 1 = BotDM (our bot), 2 = PrivateChannels (bot isnt there)
        const integration_types = [0]
        const contexts = [0]

        if(!command.permissions && !command.isServerOnly){
            contexts.push(1)
        }
        if(isFunCommands){
            contexts.push(2)
            integration_types.push(1)
        }

        if (!command.data) {
            command.data = {
                name: command.name || fileBasename.replace(".js", ""),
                description: command.description || "No description provided",
                options: command.options || [],
                default_member_permissions: command?.permissions || null,
                dm_permission: command?.permissions ? false : true,
                contexts,
                integration_types,
            }
        }

        if (!command.data.name || !command.data.description || !command.execute) {
            console.warn(YellowAscii+`❌ Skipping "${fileBasename}": Missing required "name" or "description" or "execute" properties.`+ResetAscii);
            return null;
        }
        command.fullName = command.data.name;
        return command;
}

async function handleBasecommands(commands, folder, client){
    const folderPath = folder;
    const folderBasename = path.basename(folder).toLowerCase().replace(/[^a-z0-9_-]/g, '')

    if (!fs.lstatSync(folderPath).isDirectory()) return {
        baseCommand: null, 
        baseCommandExists: null,
        hasSubcommands: null 
        };
    
    const baseCommandExists = commands.find(cmd => cmd.name === folderBasename)
    
    let baseCommand;
    
    if(baseCommandExists){
        baseCommand = baseCommandExists
        baseCommand.options = baseCommandExists.options || []
    } else {
        baseCommand = {
            name: folderBasename,
            description: `Main command: ${folderBasename}`,
            options: []
        }
    }

    /* any file with no extension that starts with ! and is followed by a permission name,
        * ex: "!Administrator" 
        * is set as the default permission for this basecommand and subcommands below it (if you have a better implementation idea lmk)
    */
    const permissionFile = fs.readdirSync(folderPath).filter(file => path.extname(file) === '' && file.startsWith("!")) || null
    if (permissionFile.length > 0){
        baseCommand.default_member_permissions = getPermissionNum(permissionFile[0].slice(1))
        baseCommand.dm_permission = false
    };
    
    const cmdCategory = path.basename(path.dirname(folderPath));
    const funCommandExceptions = ["welcome", "votingtime"]
    
    const isFunCommands = ["fun","danganronpa","image"].includes(cmdCategory) && !funCommandExceptions.includes(folderBasename)

    // Integration Types: 0 = GuildInstall, 1 = UserInstall  
    // Context Types (can be executed in): 0 = Guild, 1 = BotDM (our bot), 2 = PrivateChannels (bot isnt there)
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
        const { subcommand, subcommandJSON } = await handleSubcommand(folderPath, file, baseCommand, client)
        if(!subcommand) continue;

        hasSubcommands = true
        baseCommand.options.push(subcommandJSON)
        client.commands.set(`${folderBasename} ${subcommand.data.name}`, subcommand);
    }

    return {
        baseCommand,
        baseCommandExists: Boolean(baseCommandExists),
        hasSubcommands,
    }
}

async function handleSubcommand(folderPath, file, baseCommand, client){
    const fullPath = path.join(folderPath, file);
    const subcommand = require(fullPath);

    if (subcommand.readOnly) {
        return { subcommand: null, subcommandJSON: null };
    }

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
        console.warn(YellowAscii+`❌ Skipping "${file}" in folder "${path.basename(folderPath)}": Missing required "name" or "description" or "execute" properties.`+ResetAscii);
        return { subcommand: null, subcommandJSON: null };
    }
    subcommand.fullName = `${baseCommand.name} ${subcommand.data.name}`

    const subcommandJSON = {
        type: 1, // subcommand type
        name: subcommand.data.name,
        description: subcommand.data.description,
        options: subcommand.data.options || []
    }

    return { subcommand, subcommandJSON }
}