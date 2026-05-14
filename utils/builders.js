const { ActionRowBuilder, ButtonBuilder,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ModalBuilder, TextInputBuilder, 
    TextInputStyle, ComponentType, ButtonStyle } = require("discord.js")

class buttonBuilder{
    buttons = []
    components;
    static row;
    constructor(interaction){
        this.interaction = interaction;
    }
    /**
     * @param {'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link'} style - The button color
    */
    addButton(customId= null, label, style='Primary', url=null, emoji=null){
        if(!Object.keys(ButtonStyle).includes(style)){
            style = ButtonStyle.Primary
        } else {
            style = ButtonStyle[style]
        }
        const button = new ButtonBuilder()
            .setLabel(label)
            .setStyle(style)
        if(customId){
            button.setCustomId(customId)
        }
        if(emoji){
            button.setEmoji(emoji)
        }
        if(url){
            button.setURL(url)
        }
        this.buttons.push(button)
    }
    getRow(){
        this.row = new ActionRowBuilder().addComponents(...this.buttons)
        return this.row
    }
    startListener(response, selectedTime=180_000, func){
        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.Button,
            idle: selectedTime, 
        });
        collector.on('collect', func)
        collector.on('end', async (collected, reason)=>{
            if (reason == 'idle'){
                this.row.components.forEach(el => {
                    el.setDisabled(true)
                });
                await this.interaction.editReply({
                    components: [this.row]
                })
            }
        })
    }
    
}

class selectorBuilder{
    constructor(interaction){
        this.interaction = interaction
    }
    createSelector(customId, placeHolder=null, min=1,max=1){
        this.selector = new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setMinValues(min)
            .setMaxValues(max)
        if(placeHolder){
            this.selector.setPlaceholder(placeHolder)
        }
    }
    addOption(label, value, description=null, emoji=null, selectedByDefault=false){
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(label)
            .setValue(value)
            .setDefault(selectedByDefault)
        if(description){option.setDescription(description)}
        if(emoji){option.setEmoji(emoji)}
        
        this.selector.addOptions(option)
    }
    getRow(){
        this.row = new ActionRowBuilder().addComponents(this.selector) 
        return this.row
    }
    startListener(response, selectedTime=180_000, func){
        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.StringSelect,
            idle: selectedTime, 
        });
        collector.on('collect', func)
        collector.on('end', async (collected, reason)=>{
            if (reason == 'idle'){
                this.row.components.forEach(el => {
                    el.setDisabled(true)
                });
                await this.interaction.editReply({
                    components: [this.row]
                })
            }
        })
    }
}

module.exports = {
    buttonBuilder,
    selectorBuilder,
}