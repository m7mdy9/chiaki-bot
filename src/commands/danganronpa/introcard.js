const { isSlurPresent } = require("../../utils/slurfilter");
const { getOptionNum, createAttachment, hiddenFlag } = require("../../utils/utils")
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
    cooldown: 1,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const chosenString = interaction.options.getString("ultimate")
        const chosenUser = interaction.options.getMember('student') || interaction.options.getUser('student');
        
        if(chosenString){
            const { isSlur, censoredMatch} = isSlurPresent(chosenString)
            if(isSlur){
                await interaction.deleteReply();
                return interaction.followUp({ content:
                    `:x: **Response Flagged:** An offensive word was found. **Match: **||${censoredMatch}||`+
                    `\nAny attempt to evade the censor may result in a **blacklist** from using this command.`+
                    `\n-# If you think that is a mistake, please report it via /report bug and provide sentence you put.`,
                    flags:[hiddenFlag]})
            }
        }

        const targetUser = chosenUser || interaction?.member || interaction.user;
        const fallBackUser = interaction.options.getUser('student') || interaction.user;

        const authorMember = interaction.guild ? interaction.member : interaction.user;
        const selectedMember = interaction.options.getMember("student");
        const selecetedUser = interaction.options.getUser("student");

        const displayAvatarURL = selectedMember?.displayAvatarURL?.bind(selectedMember) 
            || selecetedUser?.displayAvatarURL?.bind(selecetedUser)
            || authorMember?.displayAvatarURL?.bind(authorMember);

        const targetAvatar = displayAvatarURL({ size: 512, extension: "png" });

        const targetName = targetUser.displayName || fallBackUser.username;
        const targetSecondaryText = chosenString || "Ultimate Discord User";

        const attachmentBuffer = await createIntroCard(targetAvatar, targetName, targetSecondaryText)
        const discordAttachment = createAttachment(attachmentBuffer, "introCard.png")

        return interaction.editReply({ files:[discordAttachment] })
    }
} 