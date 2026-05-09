require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, SortOrderType, parseEmoji, Collection } = require('discord.js');
const { deploySlashCommands } = require('./utils/commandHandler.js');
const { retry } = require("./utils/utils.js")
const { connect_db } = require("./utils/mongodb.js")
// const { startServer } = require("./utils/server.js")

const botToken = process.env.TOKEN;
const ownerId = process.env.ownerId;
const clientId = process.env.clientId; 
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName, options } = interaction;
    const subcommand = options.getSubcommand(false); // Get subcommand if exists

    const fullCommand = subcommand ? `${commandName} ${subcommand}` : commandName;

    const command = client.commands.get(fullCommand);

    if (!command) {
        console.error(`No command matching ${fullCommand} was found.`);
        return;
    }

    try {
        if (fullCommand === "eval" && interaction.user.id !== ownerId){
            return interaction.reply({ content: `Only <@!${ownerId}> can run this command buddy, we don't want anyone doing bad stuff do we?`, ephemeral: true})
        }
        await interaction.deferReply();
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Error executing ${fullCommand}:`, error);
        await interaction.editReply("❌ An error occurred while executing this command.");
    }
});

client.once(`clientReady`, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await connect_db();
    console.log(`Successfully connected to MangoDB.`)
    await deploySlashCommands(client, clientId);
    console.log(`Slash commands successfully deployed.`)
});

client.on('rateLimit', (rateLimitInfo) => {
    console.warn(`Rate limit hit:`, rateLimitInfo);
});

client.login(botToken).catch((error) => {
    console.error('Failed to login:', error);
    process.exit(1)
});