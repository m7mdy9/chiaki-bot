const { AttachmentBuilder } = require("discord.js");
const { autoroleModel, welcomeMessageModel } = require("../database/models");
const { createIntroCard } = require("../workers/introCardMaker");
const { createAttachment, botHasBasicPerms } = require("../utils/utils");

/** @param {import('discord.js').GuildMember} member */
async function createWelcomeMsg(member, welcomeMsg, introCardText){
    const memberAvatarURL = member.displayAvatarURL({ size: 512, extension:"png", forceStatic: true })    
    const inputTags = {
        "{user.tag}": `${member.user.tag}`,
        "{user.mention}": `<@!${member.id}>`,
        "{user.displayName}": `${member.displayName}`,
        "{server.name}": `${member.guild.name}`,
    }

    let formattedWelcomeMsg = welcomeMsg;
    let formattedIntroText = introCardText

    for (const [tag, value] of Object.entries(inputTags)){
        formattedWelcomeMsg = formattedWelcomeMsg.replaceAll(tag, value);
    }
    for (const [tag, value] of Object.entries(inputTags)){
        formattedIntroText = formattedIntroText.replaceAll(tag, value);
    }

    const introCardBuffer = await createIntroCard(memberAvatarURL, member.user.username, formattedIntroText);
    const introCardAttachment = createAttachment(introCardBuffer, "intro-card.png");
    
    return {
        content: formattedWelcomeMsg,
        files: [introCardAttachment],
    }
}

module.exports = {
    name: "guildMemberAdd",
    once: false,
    /** @param {import('discord.js').GuildMember} member */
    async execute(member){
        const guildId = member.guild.id
        const welcomeDoc = await welcomeMessageModel.findOne({ guildId });
        
        if(!welcomeDoc || !welcomeDoc?.channelId || !welcomeDoc?.toggle){
            return;
        }
        try {
            const channel = await member.guild.channels.fetch(welcomeDoc.channelId)
            if(!channel || !botHasBasicPerms(channel, member)){
                return;
            }
            const welcomeMsgOptions = await createWelcomeMsg(member, welcomeDoc.welcomeMessage, welcomeDoc.introCardText);

            await channel.send({...welcomeMsgOptions})

        } catch(err){
            console.error(`Couldn't send message in welcomeMessage.js`, err.name)
        }

    },
    createWelcomeMsg
}