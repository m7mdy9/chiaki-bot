const { ActionRowBuilder, ButtonBuilder,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ModalBuilder, TextInputBuilder, 
    TextInputStyle, ComponentType, ButtonStyle, 
} = require("discord.js")

class buttonBuilder{
    buttons = []
    components = null;
    row = null;
    constructor(interaction){
        this.interaction = interaction;
    }
    /**
     * @param {'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link'} style - cool button style from discord!!
    */
    addButton(customId=null, label=null, style='Primary', url=null, emoji=null){
        if(!Object.keys(ButtonStyle).includes(style)){
            style = ButtonStyle.Primary
        } else {
            style = ButtonStyle[style]
        }
        if(!label && !emoji){
            throw new TypeError(`[Button Builder Error] There must atleast a label or an emoji set to any button.
                \nButton where error resides: ${customId}`)
        }
        const button = new ButtonBuilder()
            .setStyle(style)
        if(label){
            button.setLabel(label)
        }
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
        return this
    }
    getRow(){
        this.row = new ActionRowBuilder().addComponents(...this.buttons)
        return this.row
    }
    startListener(response, selectedTime=60_000, func){
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
        return this
    }
    addOption(label, value, description=null, emoji=null, selectedByDefault=false){
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(label)
            .setValue(value)
            .setDefault(selectedByDefault)
        if(description){option.setDescription(description)}
        if(emoji){option.setEmoji(emoji)}
        
        this.selector.addOptions(option)
        return this
    }
    getRow(){
        this.row = new ActionRowBuilder().addComponents(this.selector) 
        return this.row
    }
    startListener(response, selectedTime=60_000, func){
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
class modalBuilder{
    textInputList = [];
    /**
     * @param {string} customId 
     * @param {string} title 
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    constructor(interaction, customId, title){
        this.interaction = interaction
        this.modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title.substring(0,45))
    }
    /**
     * @param {'Short' | 'Paragraph'} style - short or long input
    */
    createTextInput(customId, label, style=null, placeholder=null, required=true, value=null, [min,max]=[]){
        if(!style){
            style = TextInputStyle.Short
        } else {
            style = TextInputStyle[style]
        }
        const textInput = new TextInputBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(style)
            .setRequired(required)
        if(placeholder) textInput.setPlaceholder(placeholder);
        if(value) textInput.setValue(value)
        if(min && max) {
            textInput.setMinLength(min)
            textInput.setMaxLength(max)
        }
        this.textInputList.push(textInput)
        return new ActionRowBuilder().addComponents(textInput)
    }
    addComponents(...args){
        this.modal.addComponents(...args)
        return this
    }
    /**
     * @param {Function} func 
     */
    async showModal(time=null,func){
        await this.interaction.showModal(this.modal)
        const array = this.textInputList.flatMap(txt =>
            txt.data.customId
        )
        console.log(array)
        const filter = (i) => this.modal.data.custom_id === i.customId && i.user.id == this.interaction.user.id
        try{
            const modalInteraction = await this.interaction.awaitModalSubmit({
                filter,time: time ?? 900_000
            }).catch((error)=>{
                if (error.code === "InteractionCollectorError"){
                    this.interaction.followUp({content:"The input timed out.", ephemeral:true})
                }
                return null
            })
            if(!modalInteraction) return console.log("Modal interaction ended");
            const allFields = {}
            modalInteraction.fields.fields.forEach(field =>{
                allFields[field.customId] = field.value
            })
            await func(allFields, modalInteraction)
        } catch(err){
            console.error("Error inside the Modal Builder: ",err)
        }
    }
    
}

module.exports = {
    buttonBuilder,
    selectorBuilder,
    modalBuilder
}