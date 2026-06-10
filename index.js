require("dotenv").config({quiet:true});
const { Client, GatewayIntentBits, Collection} = require('discord.js');
const runEventHandler = require("./handlers/eventHandler")
const { execSync } = require("child_process");
const { error } = require("console");

let currentBranch = "main"
try {
    currentBranch = execSync("git branch --show-current").toString().trim()
} catch(err){
    console.error("Couldn't detect branch, auto set to main.", err)
}

['RED', 'YELLOW', 'GREEN', 'RESET'].forEach(key => {
    if (process.env[key]) {
        process.env[key] = process.env[key].replace(/\\x1b/g, '\x1b');
    }
});

const botToken = currentBranch == "main" ? process.env.TOKEN : process.env.TESTING_TOKEN
const clientId = currentBranch == "main" ? process.env.clientId : process.env.TESTING_clientId

const ownerId = process.env.ownerId;
const client = new Client({ intents: [GatewayIntentBits.GuildMembers,GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
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