const { getOptionNum, createAttachment } = require("../../utils/utils")
const { createIntroCard } = require("../../workers/introCardMaker")

module.exports = {
    name: "introcard",
    description: "Create a Danganronpa Style Intro Card (credits to DESPAIRlaa on DevainArt for the intro card)",
    options: [
        {
            name: "ultimate",
            description: "Input your Ultimate! (e.g. Ultimate Gamer)",
            type: getOptionNum("STRING"),
            required: false,
        },
        {
            name: "student",
            description: "Select the student to make a card for!",
            type: getOptionNum("USER"),
            required: false,
        },
    ],
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const chosenString = interaction.options.getString("ultimate")
        const chosenUser = interaction.options.getMember('student') || interaction.options.getUser('student');
        
        const targetUser = chosenUser || interaction?.member || interaction.user;
        const targetAvatar = targetUser.displayAvatarURL({ size: 512, extension: "png" });

        const targetName = targetUser.displayName;
        const targetSecondaryText = chosenString || "Ultimate Discord User";

        const attachmentBuffer = await createIntroCard(targetAvatar, targetName, targetSecondaryText)
        const discordAttachment = createAttachment(attachmentBuffer, "introCard.png")

        return interaction.editReply({ files:[discordAttachment] })
    }
} 