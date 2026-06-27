const fs = require("fs")
const path = require("path")
/**
 * @param {import('discord.js').Client} client 
*/
module.exports = async (client) =>{
    const { RED, RESET, YELLOW } = process.env
    const eventsPath = path.join(process.cwd(), "src/events/")
    const eventRootFiles = fs.readdirSync(eventsPath, {withFileTypes: true}).filter(file => file.name.endsWith(".js")).map(el => el = path.join(el.parentPath, el.name))
    const eventFolders = fs.readdirSync(eventsPath, {withFileTypes: true}).filter(folder => folder.isDirectory()).map(el => el = path.join(el.parentPath, el.name))
    
    let eventCounter = 0;
    let fullEventFiles = eventRootFiles

    for (const folder of eventFolders){
        const files = fs.readdirSync(folder, {withFileTypes: true}).filter(file => file.name.endsWith(".js")).map(el => el = path.join(el.parentPath, el.name))
        fullEventFiles.push(...files)
    }

    for (const filePath of fullEventFiles){

        try {
            const event = require(filePath)
            
            if(event.setup){
                event.setup(client)
            }
            if(event.once){
                client.once(event.name, (...args)=>{
                    event.execute(...args)
                        .catch((err) =>console.error(`${RED}Error in event: ${event.name}${RESET}\n${YELLOW}Error: ${RESET}`, err))
                })
            } else {
                client.on(event.name, (...args)=>{
                    event.execute(...args)
                        .catch((err) =>console.error(`${RED}Error in event: ${event.name}${RESET}\n${YELLOW}Error: ${RESET}`, err))
                })
            }
            eventCounter++
        } catch(err){
            console.error(`❌ Couldn't load event ${path.basename(filePath)}, skipping.\nError: `,err)
        }
    }

    console.log(process.env.GREEN+`Loaded ${eventCounter} events!`+process.env.RESET)
}