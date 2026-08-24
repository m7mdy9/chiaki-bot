const { Collection } = require("discord.js")
const { hiddenFlag, botInvite } = require("../utils/utils.js")
let fullCommandInfo
const { OWNER_ID } = process.env

module.exports = {
    name: "interactionCreate",
    setup: async function(){
        fullCommandInfo = await require('../commands/misc/help.js').setup().catch((err)=>console.error(err))
    },
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        
        if (!interaction.isCommand()) return;

        const client = interaction.client
        const isOwner = interaction.user.id === OWNER_ID

        /** @type {import('discord.js').Collection<string, import('discord.js').Collection<string, number>>} */
        const cooldowns = client.cooldowns;
        
        const modCommands = fullCommandInfo.get("moderation").map(el => el.name)
        const ownerCommands = fullCommandInfo.get("owner").map(el => el.name)

        // other server only commands that aren't in the moderation category
        
        
        const { commandName, options } = interaction;
        const subcommand = options.getSubcommand(false); // Get subcommand if exists
        
        const fullCommand = subcommand ? `${commandName} ${subcommand}` : commandName;
        
        const command = client.commands.get(fullCommand);
        
        if (!command) {
            console.error(`No command matching ${fullCommand} was found.`);
            return;
        }

        const serverOnlyFlag = command?.isServerOnly || false;
        const commandCooldown = command?.cooldown || 0.5;
        
        if(!cooldowns.has(fullCommand)){
            cooldowns.set(fullCommand, new Collection())
        }

        const currentMs = Date.now();
        const cooldownTimestamps = cooldowns.get(fullCommand)

        const cooldownAmountMs = commandCooldown * 1000  // from seconds to ms

        if(cooldownTimestamps.has(interaction.user.id)){
            const expiryMs = cooldownTimestamps.get(interaction.user.id) + cooldownAmountMs
            if(currentMs < expiryMs){
                const expiryTimestamp = `<t:${Math.round(expiryMs / 1000)}:R>`
                return interaction.reply({
                    content:`You can only use this command every **${commandCooldown} second(s)**. You can run it again **${expiryTimestamp}**` ,flags:[hiddenFlag]
                })
            }
        }

        const isServerOnly = modCommands.includes(fullCommand) || serverOnlyFlag;
        const isOwnerOnly = ownerCommands.includes(fullCommand)
        const isHidden = command?.hidden ?? false;
        const isDefer = command?.isDefer ?? true;
        console.log(command?.isDefer)

        try {
        
            if (isServerOnly && !interaction.guild) {
                return interaction.reply({
                    content: `You can not run this commnad outside of servers that the bot is in.
                    \nIf you would like this command to work, invite **[Chiaki Nanami](${botInvite})** to the server or ask an administrator to do so.`,
                    flags: [hiddenFlag]
                })
            }
        
            if (isOwnerOnly && !isOwner) {
                return interaction.reply({ content: `Only members of the Future Foundation may execute this command.`, flags: [hiddenFlag] })
            }
            
            cooldownTimestamps.set(interaction.user.id, currentMs);
            setTimeout(()=> cooldownTimestamps.delete(interaction.user.id), cooldownAmountMs);
            
            if(isDefer){
                isHidden ? await interaction.deferReply({ flags: [hiddenFlag] }) : await interaction.deferReply();
            }
            
            await command.execute(interaction, client);
        
        } catch (error) {
            console.error(`Error executing /${fullCommand}:`, error);
            try {
                await interaction.editReply("❌ An error occurred while executing this command.");
            } catch(err){
                console.error(`Error with sending the fail message for /${fullCommand}. Error: `,err)
                return;
            }
        }
    }
}