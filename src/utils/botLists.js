const {DBL_TOKEN, TOPGG_TOKEN} = process.env
const { webhookLog } = require("./errorHandler");


async function startDBL(client){
    if(DBL_TOKEN){
        const dbl = new createDjsClient(DBL_TOKEN, client);
        await dbl.postBotStats({ guilds: client.guilds.cache.size, users: client.users.cache.size });
        const formattedCommands = client.commands.map(cmd => cmd.data)
        await dbl.postBotCommands([...formattedCommands])
        await dbl.startPosting()
    } else {
        console.error("Couldn't find DBL_TOKEN")
    }
}
async function startTopgg(client){
    if(TOPGG_TOKEN){
        const topggAp = AutoPoster(TOPGG_TOKEN, client)
        
        topggAp.on("error", (err)=>{
            console.error("Error in Topgg AP poster:", err)
        })
        topggAp.once("posted", (stats)=>{
            webhookLog(`Succesfully posted initial Top.gg Stats:\n${JSON.stringify(stats, null, 2)}`)
        })
    } else {
        console.error("Couldn't find TOPGG_TOKEN")
    }

}

module.exports = {startTopgg, startDBL}