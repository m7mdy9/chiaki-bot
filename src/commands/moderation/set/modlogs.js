const { modlogsModel } = require("../../../database/models");
const { selectorChannelBuilder, buttonBuilder } = require("../../../utils/builders");
const { getChannelType, embed_builder, hiddenFlag, getOptionNum, getChannelTypeNum, getPermissionNum } = require("../../../utils/utils");

module.exports = {
    name: "modlogs",
    description: "Set a channel to log moderation and other actions.",
    options: [
        {
            name: 'channel',
            description: 'Channel where the logs will be sent.',
            type: getOptionNum("CHANNEL"),
            required: false,
            channel_types: [getChannelTypeNum("GuildText")]
        }
    ],
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction  */
    async execute(interaction){
        const targetChannel = interaction.options.getChannel('channel');
        const guildId = interaction.guildId;
        let initialResponse;
        let modlogDoc = await modlogsModel.findOne({ guildId })

        const initialEmbed = embed_builder("Modlogs Channel") 

        async function setModlogChannel(channelId=null, modlogInt){
            if(initialResponse){
                if(channelId){
                    initialEmbed.setDescription(`Curret Channel: <#${channelId}>`)
                    .setFooter({ text: `Last Edited`}).setTimestamp();
                } else {
                    initialEmbed.setDescription(`No channel is set.`).setFooter(null).setTimestamp(null);
                }
                await initialResponse.edit({ embeds:[initialEmbed] })
            }
            if(!channelId){
                if(modlogDoc){
                    await modlogDoc.deleteOne();
                    modlogDoc = null;
                    modlogInt.reply({ content:`Successfully removed the modlogs channel.` , flags:[hiddenFlag]})
                    return; 
                } else {
                    modlogInt.reply({ content:`No channels to clear.`, flags:[hiddenFlag] })
                    return; 
                }
            }

            if(!modlogDoc){
                modlogDoc = await modlogsModel.create({ guildId, channelId })
            }
            modlogDoc.channelId = channelId;
            modlogDoc.timestamp = Date.now();
            await modlogDoc.save();
        }

        async function hasCorrectPermissions(targetPermChannel, permInt, edit=false){
            const botPermissions = targetPermChannel.permissionsFor(interaction.client.user);
    
            const isCorrectPerms = botPermissions.has([getPermissionNum("ViewChannel"), getPermissionNum("SendMessages"), getPermissionNum("EmbedLinks")])
            if(!isCorrectPerms){
                if(edit){
                    await permInt.editReply({ content: `**Missing permissions.** Please allow me to view, send messages and embed links in the chosen channel.` })
                } else {
                    await permInt.reply({ content: `**Missing permissions.** Please allow me to view, send messages and embed links in the chosen channel.` })
                }
                return false; 
            } else {
                return true;
            }
        }

        if(targetChannel){

            if(hasCorrectPermissions(targetChannel, interaction, true)){
                await setModlogChannel(targetChannel.id)
            } else {
                return;
            }
        }

        const initialButton = new buttonBuilder(interaction);
        initialButton.addButton('startEditBtn',"Edit", "Secondary", null, "✏️")
        initialButton.addButton('delChannel', "Remove", "Danger", null, "🗑️")
        const initialRowComponents = [initialButton.getRow()]

        if(modlogDoc?.channelId){
            initialEmbed.setDescription(`Current Channel: <#${modlogDoc.channelId}>`)
            .setFooter({ text: `Last Edited`}).setTimestamp(modlogDoc.timestamp)
        } else {
            initialEmbed.setDescription(`No channel is set.`)
        }
        
        initialResponse = await interaction.editReply({ embeds:[initialEmbed], components: initialRowComponents });
        initialButton.startListener(initialResponse, null, 
            /** @param {import('discord.js').Interaction} btnInt */
            async (btnInt)=>{
                if(btnInt.customId == "delChannel"){
                    if(!modlogDoc){
                        return btnInt.reply({ content:"No modlogs channel is set to remove.", flags:[hiddenFlag]})
                    }
                    return setModlogChannel(null, btnInt);
                } else {
                    const channelSelector = new selectorChannelBuilder(btnInt);
                    const alreadySelectedChannel = modlogDoc?.channelId ? [modlogDoc.channelId] : [];
                    
                    channelSelector.createRoleSelect('modlogSelect', "Select a channel.", [1, 1], alreadySelectedChannel, [getChannelType("GuildText")]);
                    const channelSelectorRow = channelSelector.getRow();
                    const channelSelectorEmbed = embed_builder("Select a Channel", "Select a channel where modlogs will be sent.");

                    const buttonResponse = await btnInt.reply({ embeds:[channelSelectorEmbed], components:[channelSelectorRow], withResponse: true });
                    const buttonMessage = buttonResponse.resource.message;

                    channelSelector.startListener(buttonMessage, null, 
                    /** @param {import('discord.js').Interaction} selectorInt */
                    async (selectorInt)=>{
                        const selectedChannel = selectorInt.channels.first();
                        if(hasCorrectPermissions(selectedChannel, selectorInt, false)){
                            await setModlogChannel(selectedChannel.id);
                            await buttonMessage.delete();
                            return selectorInt.reply({ content:`Successfully set <#${selectedChannel.id}> as the modlog channel.`, flags:[hiddenFlag]})
                        } else {
                            return;
                        }
                    })
                }
        })
    }
}