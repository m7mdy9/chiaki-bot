const { agenda } = require("../agenda/agenda.js")
const { deploySlashCommands } = require('../handlers/commandHandler.js');
const { connectDB } = require("../database/connect.js")
const { startActivity } = require("../utils/utils.js")

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client){
        console.log(`✅ Logged in as ${client.user.tag}`);
        await connectDB();
        await deploySlashCommands(client, client.clientId, client.botToken);
        console.log(`Slash commands successfully deployed.`)
        startActivity(client)
    }
}