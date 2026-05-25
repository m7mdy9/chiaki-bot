require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, SortOrderType, parseEmoji, Collection, ActivityType } = require('discord.js');
const { deploySlashCommands } = require('./utils/commandHandler.js');
const { retry } = require("./utils/utils.js")
const { connectDB } = require("./database/connect.js")
let fullCommandInfo;
const rng_array = (dict) => {
    const keys = Object.keys(dict)
    const randKey = keys[Math.floor(Math.random() * keys.length)]
    const value = dict[randKey]
    const randValue = value[Math.floor(Math.random() * value.length)]
    return [randKey, randValue]
}
// const { startServer } = require("./utils/server.js")

const botToken = process.env.TOKEN;
const ownerId = process.env.ownerId;
const clientId = process.env.clientId; 
const client = new Client({ intents: [GatewayIntentBits.GuildMembers,GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    // moderation commands are server only, thus we limit them to via here
    const modCmds = fullCommandInfo.get("moderation").map(el=>el.name)
    // other server only commands that aren't in the moderation category
    const specialServerOnly = ["member info", "server avatar"]

    const { commandName, options } = interaction;
    const subcommand = options.getSubcommand(false); // Get subcommand if exists
    
    const fullCommand = subcommand ? `${commandName} ${subcommand}` : commandName;
    
    const command = client.commands.get(fullCommand);
    
    if (!command) {
        console.error(`No command matching ${fullCommand} was found.`);
        return;
    }
    
    const isServerOnly = modCmds.includes(fullCommand) || specialServerOnly.includes(fullCommand);
    try {
        if (["eval", "test test"].includes(fullCommand) && interaction.user.id !== ownerId){
            return interaction.reply({ content: `Only members of the Future Foundation may execute this command.`, ephemeral: true})
        } // prevents server-only commands to run in dms or a guild that the bot doesnt reside in 
        else if(isServerOnly && !interaction.guild){
            return interaction.reply({ content:`You can not run this commnad outside of servers that the bot is in.
                \nIf you would like this command to work, invite **[Chiaki Nanami](https://discord.com/oauth2/authorize?client_id=1502713354936914080&permissions=8&integration_type=0&scope=bot+applications.commands)** to the server or ask an administrator to do so.`,
            ephemeral: true})
        }
        fullCommand == "eval" ? await interaction.deferReply({ephemeral: true}) : await interaction.deferReply();
        await command.execute(interaction, client);
        // console.log(subcommand,fullCommand,command)
    } catch (error) {
        console.error(`Error executing ${fullCommand}:`, error);
        await interaction.editReply("❌ An error occurred while executing this command.");
    }
});
function startActivity(){
    const activity_list = {
        Playing:[
            "Danganronpa: Trigger Happy Havoc",
            "Danganronpa 2: Goodbye Despair",
            "Danganronpa V3: Killing Harmony"
        ],
        Watching:[
            "Danganronpa 3: The End of Hope's Peak High School Despair Arc",
            "Danganronpa 3: The End of Hope's Peak High School Future Arc",
            "Danganronpa 3: The End of Hope's Peak High School Hope Arc",
            "Danganronpa 2.5: Nagito Komaeda and the World Destroyer"
        ],
        Listening:[
            "Danganronpa 1 OST",
            "Danganronpa 2 OST",
            "Danganronpa V3 OST",
        ]
    }

    setInterval(()=>{
        let selected_array = rng_array(activity_list)
        eval(`client.user.setActivity(\"${selected_array[1]}\", {type: ActivityType.${selected_array[0]}})`)
        console.log(selected_array)
    }, 60000)
    client.user.setActivity('New World Order', { type:ActivityType.Listening})
}

client.once(`clientReady`, async () => {
    fullCommandInfo = await require('./commands/misc/help.js').setup().catch(()=>null)
    console.log(`✅ Logged in as ${client.user.tag}`);
    await connectDB();
    await deploySlashCommands(client, clientId);
    console.log(`Slash commands successfully deployed.`)
    startActivity()
});

client.on('rateLimit', (rateLimitInfo) => {
    console.warn(`Rate limit hit:`, rateLimitInfo);
});

client.login(botToken).catch((error) => {
    console.error('Failed to login:', error);
    process.exit(1)
});