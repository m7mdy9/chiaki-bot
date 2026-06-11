const fs = require("fs")
const path = require("path")

/**
 * @param {import('discord.js').Client} client 
 */
module.exports = async (client) =>{
    const eventsPath = path.join(process.cwd(), "src/events/")
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"))

    for (const file of eventFiles){
        const filePath = path.join(eventsPath, file)

        const event = require(filePath)
        
        if(event.setup){
            event.setup(client)
        }
        if(event.once){
            client.once(event.name, (...args)=>{
                event.execute(...args)
            })
        } else {
            client.on(event.name, (...args)=>{
                event.execute(...args)
            })
        }
    }
    console.log(process.env.GREEN+`Loaded ${eventFiles.length} events!`+process.env.RESET)
}