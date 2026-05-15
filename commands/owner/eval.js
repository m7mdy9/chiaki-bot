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
            let evaled = eval(code); // the evalued code

            // waits for the promise to finish if the function is one
            if (evaled instanceof Promise) {
                evaled = await evaled;
            }

            // convert to string via 'util', read about it later more pls
            const output = typeof evaled === 'string' ? evaled : require('util').inspect(evaled, { depth: 0 });

            // convert into a file if the length exceeds discord's stupid limit
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