const { agenda } = require("../agenda/agenda.js")
const { defineVotingTimeJob } = require("../agenda/jobs/votingTimeJob.js")
const { deploySlashCommands } = require('../handlers/commandHandler.js');
const { connectDB } = require("../database/connect.js")
const { startActivity, checkmarkEmoji, startDBL } = require("../utils/utils.js");
const { webhookLog } = require("../utils/errorHandler.js");

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client){
        console.log(`✅ Logged in as ${client.user.tag}`);
        await connectDB();
        await deploySlashCommands(client, client.CLIENT_ID, client.BOT_TOKEN);
        console.log(`Slash commands successfully deployed.`)
        startActivity(client)
        
        defineVotingTimeJob(client);
        await agenda.start()
        console.log("Started the agenda scheduler!")
        await webhookLog(`${checkmarkEmoji} Successfully started up **${client.user.tag}**`)
        
        if(process.currentBranch == "main"){
            await startDBL(client)
        }
    }
}