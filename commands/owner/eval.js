const ownerId = '966205214308847626'

module.exports = {
    options: [
        {
            name: 'code',
            description: 'code',
            type: 3,
            required: true
        }
    ],
    async execute(interaction) {
        if (interaction.user.id !== ownerId) {
            return interaction.editReply("❌");
        }

        const code = interaction.options.getString('code');

        try {
            let evaled = eval(code); // ⚠️ DANGEROUS: Always restrict access to this!

            // If the result is a promise, await it
            if (evaled instanceof Promise) {
                evaled = await evaled;
            }

            // Convert objects to string for better readability
            const output = typeof evaled === 'string' ? evaled : require('util').inspect(evaled, { depth: 0 });

            // Send the result (if too long, send in a file)
            if (output.length > 2000) {
                return interaction.editReply({ files: [{ attachment: Buffer.from(output), name: 'output.txt' }] });
            } else {
                return interaction.editReply(`\`\`\`js\n${output}\n\`\`\``);
            }
        } catch (error) {
            return interaction.editReply(`\`\`\`js\nError: ${error.message}\n\`\`\``);
        }
    }
};