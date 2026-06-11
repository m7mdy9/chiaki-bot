const { agenda } = require("../agenda/agenda.js")
const { defineVotingTimeJob } = require("../agenda/jobs/votingTimeJob.js")
const { deploySlashCommands } = require('../handlers/commandHandler.js');
const { connectDB } = require("../database/connect.js")
const { startActivity } = require("../utils/utils.js")
const { GREEN, RESET } = process.env
module.exports = {
    name: "clientReady",
    once: true,
    async execute(client){
        console.log(`✅ Logged in as ${client.user.tag}`);
        await connectDB();
        await deploySlashCommands(client, client.clientId, client.botToken);
        console.log(`Slash commands successfully deployed.`)
        startActivity(client)

        defineVotingTimeJob(client);
        await agenda.start()
        console.log("Started the agenda scheduler!")
    }
}