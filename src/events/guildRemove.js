const { Events } = require("discord.js");
const { 
    votingEntryModel, votingTimeModel, modlogSettingsModel,
    modlogsModel, autoroleModel, warningModel, welcomeMessageModel 
} = require("../database/models");

const guildRelatedModels = [
    votingEntryModel, votingTimeModel, modlogSettingsModel,
    modlogsModel, autoroleModel, warningModel, welcomeMessageModel 
]

module.exports = {
    name: Events.GuildDelete,
    once: false,
    /** @param {import('discord.js').Guild} guild */
    async execute(guild){
        const guildId = guild.id;

        Promise.allSettled(
            guildRelatedModels.map(model => model.findOneAndDelete({ guildId }))
        ).then(results =>{
            const failures = results.filter(result => result.status === "rejected");
            if(failures.length > 0){
                const failuresErrors = failures.map(fail => fail.reason);
                console.error(`Couldn't clean some/all fields for guildId: ${guildId}\nError(s):`,failuresErrors)
            }
        });
        
        return;
    }
}