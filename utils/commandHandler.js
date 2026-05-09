const fs = require("fs");
const path = require("path");
const { REST, Routes, Collection, SlashCommandBuilder } = require("discord.js");

async function loadCommands(client) {
    const targetDir = path.dirname(__dirname);
    const commandsPath = path.join(targetDir, "commands");
    
    client.commands = new Collection(); // Store commands
    const commands = [];

    // 1. Load standalone command files directly in the commands folder
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const fullPath = path.join(commandsPath, file);
        // If the entry is a directory, skip it (we handle directories later)
        if (fs.lstatSync(fullPath).isDirectory()) continue;
        
        const command = require(fullPath);

        // Call the setup function if it exists
        if (command.setup) {
            await command.setup(client); // Pass client if needed
        }

        // ✅ Automatically generate the `data` object if it doesn't exist
        if (!command.data) {
            command.data = {
                name: command.name || file.replace(".js", ""), // Use file name as fallback
                description: command.description || "No description provided",
                options: command.options || [] // Default to no options
            };
        }

        // Validate the command structure
        if (!command.data.name || !command.data.description || !command.execute) {
            console.error(`❌ Skipping "${file}": Missing required "name" or "description" or "execute" properties.`);
            continue;
        }

        // Store the command using its name as the key
        client.commands.set(command.data.name, command);
        commands.push(command.data);
    }

    // 2. Load subcommand folders
    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        // Only process directories
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        // Create a base command for the folder (the main command)
        const baseCommand = new SlashCommandBuilder()
            .setName(folder)
            .setDescription(`Main command: ${folder}`);
        let hasSubcommands = false;

        // Get all .js files inside the folder
        const subcommandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
        for (const file of subcommandFiles) {
            const fullPath = path.join(folderPath, file);
            const subcommand = require(fullPath);

            // Call the setup function if it exists
            if (subcommand.setup) {
                await subcommand.setup(client);
            }

            // Automatically generate the data object if missing
            if (!subcommand.data) {
                subcommand.data = {
                    name: subcommand.name || file.replace(".js", ""),
                    description: subcommand.description || "No description provided",
                    options: subcommand.options || []
                };
            }

            // Validate that the subcommand has a name and description
            if (!subcommand.data.name || !subcommand.data.description || !subcommand.execute) {
                console.error(`❌ Skipping "${file}" in folder "${folder}": Missing required "name" or "description" or "execute" properties.`);
                continue;
            }

            // Add the subcommand to the base command using its builder method.
            baseCommand.addSubcommand(sub => {
                sub = sub.setName(subcommand.data.name)
                         .setDescription(subcommand.data.description);
                // Loop through options if any are provided
                    if (Array.isArray(subcommand.data.options)) {
                        for (const option of subcommand.data.options) {
                            // The option types here use numeric values.
                            // 3: String, 4: Integer, 5: Boolean, 6: User, 7: Channel, 8: Role, 9: Mentionable, 10: Number, 11: Attachment
                            switch (option.type) {
                                case 3: // String option
                                    sub.addStringOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 4: // Integer option
                                    sub.addIntegerOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 5: // Boolean option
                                    sub.addBooleanOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 6: // User option
                                    sub.addUserOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 7: // Channel option
                                    sub.addChannelOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 8: // Role option
                                    sub.addRoleOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 9: // Mentionable option (can be a user or role)
                                    sub.addMentionableOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 10: // Number option (floating-point number)
                                    sub.addNumberOption(opt =>
                                        opt.setName(option.name)
                                        .setDescription(option.description)
                                        .setRequired(option.required || false)
                                    );
                                    break;
                                case 11: // Attachment option
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

            // Store the subcommand in client.commands with a combined key (e.g., "folder subcommand")
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
        console.log(commands)
    } catch (error) {
        console.error("❌ Error deploying commands:", error);
    }
}

module.exports = { deploySlashCommands };
