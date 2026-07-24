const { autoroleModel } = require("../../../database/models")
const { embed_builder, hiddenFlag } = require("../../../utils/utils.js")
const { buttonBuilder, selectorRoleBuilder } = require("../../../utils/builders.js")

module.exports = {
    name: `autorole`,
    description: `Check or set roles given to users on join.`,
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction  */
    async execute(interaction){
        const guildId = interaction.guildId;
        let rolesDoc = await autoroleModel.findOne({ guildId });
        
        const initialEmbed = embed_builder("Server AutoRoles")
        let formattedRoles;
        if(rolesDoc){
            const lastEditedTimestamp = rolesDoc.timestamp
            formattedRoles = rolesDoc.roleIds.map(roleId => `<@&${roleId}>`).join(" ")
            initialEmbed.setDescription(`**Current AutoRoles:**\n${formattedRoles}`)
            initialEmbed.setFooter({ text: `Last Edited`}).setTimestamp(lastEditedTimestamp)
        } else {
            initialEmbed.setDescription(`**No AutoRoles have been set**`)
        }
        const initialButton = new buttonBuilder(interaction);
        initialButton.addButton('startEditBtn',"Edit", "Secondary", null, "✏️")
        initialButton.addButton('clearRoles', "Clear", "Danger", null, "🗑️")
        const initialRowComponents = [initialButton.getRow()]

        const initialResponse = await interaction.editReply({ embeds:[initialEmbed], components:initialRowComponents });
        
        async function updateRolesAndMsg(newRoles=[]){
            const embedToEdit = initialEmbed
            if(newRoles?.length == 0 || !newRoles){
                await rolesDoc?.deleteOne()
                rolesDoc = null;

                embedToEdit.setDescription(`**No AutoRoles have been set**`)
                embedToEdit.setFooter(null).setTimestamp(null)

            } else {
                if(!rolesDoc){
                    rolesDoc = await autoroleModel.create({ guildId, roleIds: newRoles })
                } else {
                    rolesDoc.roleIds = newRoles;
                    rolesDoc.timestamp = Date.now();
                    await rolesDoc.save()
                }
                const currentTimestamp = Date.now()
                formattedRoles = newRoles.map(roleId => `<@&${roleId}>`).join(" ")
                embedToEdit.setDescription(`**Current AutoRoles:**\n${formattedRoles}`)
                embedToEdit.setFooter({ text: `Last Edited`})
                embedToEdit.setTimestamp(currentTimestamp)
            }
            await initialResponse.edit({ embeds:[embedToEdit]})
        }

        initialButton.startListener(initialResponse, null, 
            /** @param {import('discord.js').Interaction} btnInt */
            async (btnInt)=>{
                
                if(btnInt.customId == "clearRoles"){
                    if(!rolesDoc){ return btnInt.reply({ content:"No roles to clear.", flags:[hiddenFlag]})}
                    await updateRolesAndMsg()
                    return btnInt.reply({content:"Roles cleared.", flags:[hiddenFlag]})
                }
                let previouslySelectedRoles = rolesDoc ? rolesDoc.roleIds : []
                const roleSelectEmbed = embed_builder("AutRole Select","Select roles to be added on join.\nUnselect roles you don't want to be added")
                const roleSelector = new selectorRoleBuilder(interaction)
                roleSelector.createRoleSelect("autoroleSelect", "Select Roles", [0, 5], previouslySelectedRoles)
                const roleSelectorRow = roleSelector.getRow();

                const firstBtnResponse = await btnInt.reply({ embeds:[roleSelectEmbed], components:[roleSelectorRow],  withResponse: true})
                const firstBtnMsg = firstBtnResponse.resource.message;

                roleSelector.startListener(firstBtnMsg, null, 
                    /** @param {import('discord.js').Interaction} roleInt */
                    async (roleInt)=>{
                        const selectedRoles = roleInt.roles;
                        if(selectedRoles.size == 0){
                            await updateRolesAndMsg();
                            await firstBtnMsg.delete();
                            return roleInt.reply({ content: `Set none as AutoRoles.`, flags:[hiddenFlag]})
                        }
                        const hasBotRoles = selectedRoles.some(role => role.managed);
                        if(hasBotRoles){
                            return roleInt.reply({ content:"You can not select roles managed by bots.", flags:[hiddenFlag]})
                        }

                        const hasHigherRoles = selectedRoles.some(role => !role.editable)
                        if(hasHigherRoles){
                            return roleInt.reply({ content:"You can not select roles that are higher than my roles.", flags:[hiddenFlag]})
                        }


                        const selectedRoleIds = [...selectedRoles.keys()]
                        await updateRolesAndMsg(selectedRoleIds)

                        await firstBtnMsg.delete();
                        return roleInt.reply({ content:`Successfully selected: ${formattedRoles}`, flags: [hiddenFlag]})
                })
        })
    }
}