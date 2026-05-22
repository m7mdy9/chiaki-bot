const fs = require("fs");
const path = require("path");
const { REST, Routes, Collection, SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { getPermissionNum } = require("./utils")
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
    console.log(commandCategories, commandFiles, commandFolders)
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
            console.error(`❌ Skipping "${file}": Missing required "name" or "description" or "execute" properties.`);
            continue;
        }

        // yay bot has command now!
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
        const baseCommand = new SlashCommandBuilder()
            .setName(folder)
            .setDescription(`Main command: ${folder}`)
        const permissionFile = fs.readdirSync(folderPath).filter(file => path.extname(file) === '' && file.startsWith("!")) || null
        console.log(permissionFile)
        if (permissionFile.length > 0){
            baseCommand.setDefaultMemberPermissions(getPermissionNum(permissionFile[0].slice(1)))
            baseCommand.setDMPermission(false)
        };
        /*console.log(permissionFile,baseCommand)*/
        let hasSubcommands = false;
        // fetch all js files
        const subcommandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
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
                console.error(`❌ Skipping "${file}" in folder "${folder}": Missing required "name" or "description" or "execute" properties.`);
                continue;
            }

            baseCommand.addSubcommand(sub => {
                sub = sub.setName(subcommand.data.name)
                         .setDescription(subcommand.data.description)
                // big ass loop of options if it has any
                    if (Array.isArray(subcommand.data.options)) {
                        for (const option of subcommand.data.options) {
                            // this is the worst part of my code i mean hey look its a switch statement!!
                            // 3: String, 4: Integer, 5: Boolean, 6: User, 7: Channel, 8: Role, 9: Mentionable, 10: Number, 11: Attachment
                            switch (option.type) {
                                case 3: // string option
                                    sub.addStringOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 4: // integer option
                                    sub.addIntegerOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 5: // boolean option
                                    sub.addBooleanOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 6: // user option
                                    sub.addUserOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 7: // channel option
                                    sub.addChannelOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 8: // role option
                                    sub.addRoleOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 9: // mentionable option (can be a user or role)
                                    sub.addMentionableOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 10: // number option (floating-point number)
                                    sub.addNumberOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 11: // attachment option
                                    sub.addAttachmentOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                default:
                                    console.warn(`Unknown option type ${option.type} for option ${option.name}`);
                                    break;
                        }
                    }
                }
                return sub;
            });
            hasSubcommands = true;

            // stores the the subcommand correctly with the base command as `bc sc`
            client.commands.set(`${folder} ${subcommand.data.name}`, subcommand);
        }

        // If any subcommands were added, register the base command
        if (hasSubcommands) {
            commands.push(baseCommand.toJSON());
        }
    }

    return commands;
}

async function deploySlashCommands(client, clientId) {
    const commands = await loadCommands(client);
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        console.log("🚀 Deploying new commands...");
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log("✅ Slash commands deployed successfully!");
    } catch (error) {
        console.error("❌ Error deploying commands:", error);
    }
}

module.exports = { deploySlashCommands };
