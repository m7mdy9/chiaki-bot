const { hiddenFlag } = require("../utils/utils.js")
let fullCommandInfo, ephemeralCommands
const { ownerId } = process.env

module.exports = {
    name: "interactionCreate",
    setup: async function(){
        [fullCommandInfo, ephemeralCommands] = await require('../commands/misc/help.js').setup().catch((err)=>console.error(err))
    },
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        
        if (!interaction.isCommand()) return;

        const client = interaction.client

        // moderation commands are server only, thus we limit them to via here
        const modCmds = fullCommandInfo.get("moderation").map(el => el.name)
        // other server only commands that aren't in the moderation category
        const specialServerOnly = ["member info", "server avatar"]

        const { commandName, options } = interaction;
        const subcommand = options.getSubcommand(false); // Get subcommand if exists

        const fullCommand = subcommand ? `${commandName} ${subcommand}` : commandName;

        const command = client.commands.get(fullCommand);

        if (!command) {
            console.error(`No command matching ${fullCommand} was found.`);
            return;
        }

        const isServerOnly = modCmds.includes(fullCommand) || specialServerOnly.includes(fullCommand);
        try {
            if (["eval", "test test"].includes(fullCommand) && interaction.user.id !== ownerId) {
                return interaction.reply({ content: `Only members of the Future Foundation may execute this command.`, flags: [hiddenFlag] })
            } // prevents server-only commands to run in dms or a guild that the bot doesnt reside in 
            else if (isServerOnly && !interaction.guild) {
                return interaction.reply({
                    content: `You can not run this commnad outside of servers that the bot is in.
                        \nIf you would like this command to work, invite **[Chiaki Nanami](${process.env.INVITE})** to the server or ask an administrator to do so.`,
                    flags: [hiddenFlag]
                })
            }
            ephemeralCommands.includes(fullCommand) ? await interaction.deferReply({ flags: [hiddenFlag] }) : await interaction.deferReply();
            await command.execute(interaction, client);
            // console.log(subcommand,fullCommand,command)
        } catch (error) {
            console.error(`Error executing ${fullCommand}:`, error);
            try {
                await interaction.editReply("❌ An error occurred while executing this command.");
            } catch(err){
                console.error('Error with sending the fail message. Error name: ',err.name)
                return;
            }
        }
    }
}