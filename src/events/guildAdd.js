const { Events } = require('discord.js');
const { botHasBasicPerms, embed_builder, supportServerInvite } = require('../utils/utils');

module.exports = {
    name: Events.GuildCreate,
    once: false,
    /** @param {import('discord.js').Guild} guild */
    async execute(guild){
        const guildId = guild.id;

        let targetChannel;

        const systemChannel = guild.systemChannel;
        if(!systemChannel || !botHasBasicPerms(systemChannel, guild, true)){

            const avoidChannels = ["rules","announcements","intro","introduction","shout","rule","moderator-only"]
            const channels = guild.channels.cache.filter(channel => !avoidChannels.includes(channel.name.toLowerCase()))

            for(const channel of channels.values()){
                if(botHasBasicPerms(channel, guild, true)){
                    targetChannel = channel;
                    break;
                } else {
                    continue;
                }
            }

        } else {
            targetChannel = systemChannel;
        }
        // console.log(targetChannel,guild.channels.cache.values())
        if(!targetChannel){
            return;
        }

        try {
            await targetChannel.send({ embeds: [introductionEmbed()] })
            return;
        } catch(err){
            console.error(`Couldn't send intro message in guildId: ${guildId}\nError:`, err)
        }
    }
}

function commandWrap(command){
    return `**\`${command}\`**`
}

function introductionEmbed(){
    const embed = embed_builder("Chiaki Bot Introduction", "**Thank you for adding ChiakiBot to your server! Hope you enjoy your time using it!**"
        +"\n\nChiaki Bot's source code is public on github, and you can visit it from my about me or with **\`/info\`**, so even if you're worried you can check it out for yourself or run the code yourself on your own PRIVATE bot!\n(though if you do that and you end up liking it, considering giving me a tip! **\`/donate\`**)")
    .addFields(
        { name: "Featured Commands and Categories", 
            value: 
            `Chiaki Bot features a lot of special commands, along side normal moderative commands (for more info, run **\`/help\`**)`
            +`\nSome of these special commands are **\`/reportcard\`, \`/introcard\`, \`/execute\`, \`/votingtime start\`** and much more!`
            +`\n\nChiaki Bot also features moderative commands (you can view all of them via **\`/help\`**) that help you manage and moderate yourself, alongside autoroles and mod logs!`
            ,inline: false },
        { name: "\u200b", value: 
            `For more information use **\`/help\`**, and if you need any help with ChiakiBot, **check out our support server: ${supportServerInvite} !**`
            +"\n\nThank you for using Chiaki Bot."
            , inline: false },
    );

    return embed;
}