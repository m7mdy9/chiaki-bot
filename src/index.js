require("dotenv").config({quiet:true});
const { Client, GatewayIntentBits, Collection, Partials} = require('discord.js');
const runEventHandler = require("./handlers/eventHandler")
const { execSync } = require("child_process");

// checking current branch to see whether we will use the main client id and token or the testing id and token
let currentBranch = "main"
try {
    currentBranch = execSync("git branch --show-current").toString().trim()
} catch(err){
    console.error("Couldn't detect branch, auto set to main.", err)
}

// Correcting the console color codes, as they are usually broken due to the ways .env saves values
['RED', 'YELLOW', 'GREEN', 'RESET', 'DARK_GREY'].forEach(key => {
    if (process.env[key]) {
        process.env[key] = process.env[key].replace(/\\x1b/g, '\x1b');
    }
});

// Assigning token and clientId based on whether the current branch is main or not
const botToken = currentBranch == "main" ? process.env.TOKEN : process.env.TESTING_TOKEN
const clientId = currentBranch == "main" ? process.env.clientId : process.env.TESTING_clientId

// creating our client with our needed intents and initializing an empty discordjs Collection to save our commands in, via the commandHandler.js 
const client = new Client({ 
    intents: [GatewayIntentBits.GuildMembers,GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
    partials: [Partials.Channel, Partials.Message]
});
client.commands = new Collection();
client.clientId = clientId
client.botToken = botToken

async function startBot(){
    try{
        await runEventHandler(client)
        
        await client.login(botToken)

    } catch(err){
        console.log(process.env.RED+"Congratulations, the bot failed to start! | "+process.env.RESET)
        console.error(err)
        process.exit(1)
    }
}

startBot()