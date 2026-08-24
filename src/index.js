process.env.DOTENV_CONFIG_QUIET = 'true';
require("dotenv").config({quiet:true});

// checking current branch to see whether we will use the main client id and token or the testing id and token
let currentBranch = "main"
try {
    if(process.env?.isKoyeb){
        currentBranch = "main"
    } else {
        currentBranch = require("child_process").execSync("git branch --show-current").toString().trim()
    }
} catch(err){
    console.error("Couldn't detect branch, auto set to main.", err)
}
process.env.currentBranch = currentBranch;


const { Client, GatewayIntentBits, Collection, Partials} = require('discord.js');
const runEventHandler = require("./handlers/eventHandler")
const { handleError } = require("./utils/errorHandler");
console.originalError = console.error;
console.error = (...args)=>{
    handleError(...args)
}

const isNotMainBranch = currentBranch != "main"
// Assigning BOT_TOKEN and CLIENT_ID based on whether the current branch is main or not

const BOT_TOKEN = isNotMainBranch && process.env.TESTING_TOKEN ? process.env.TESTING_TOKEN : process.env.BOT_TOKEN 
const CLIENT_ID = isNotMainBranch && process.env.TESTING_CLIENT_ID ? process.env.TESTING_CLIENT_ID : process.env.CLIENT_ID 
process.env.MONGODB_KEY = isNotMainBranch && process.env.MONGODB_TESTING_KEY ? process.env.MONGODB_TESTING_KEY : process.env.MONGODB_KEY;

console.log(currentBranch)

// creating our client with our needed intents and initializing an empty discordjs Collection to save our commands in, via the commandHandler.js 
const client = new Client({ 
    intents: [
        GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Channel, Partials.Message
    ]
});
client.cooldowns = new Collection();
client.commands = new Collection();
client.CLIENT_ID = CLIENT_ID
client.BOT_TOKEN = BOT_TOKEN

async function startBot(){
    try{
        require("./server.js")
        await runEventHandler(client)
        
        await client.login(BOT_TOKEN)

    } catch(err){
        console.originalError("Congratulations, the bot failed to start!", err)
        console.error("Congratulations, the bot failed to start!", err)
        process.exit(1)
    }
}

module.exports = {currentBranch, client}

startBot()