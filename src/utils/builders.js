const { 
    ActionRowBuilder, ButtonBuilder,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    UserSelectMenuBuilder, RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder, ModalBuilder, 
    TextInputBuilder, TextInputStyle, 
    ComponentType, ButtonStyle, 
} = require("discord.js")
const { intAuthorValidate } = require("./utils")

const RED = process.env.RED
const YELLOW = process.env.YELLOW
const RESET = process.env.RESET

/**
 * @param {any} context - The class instance of ('this'), must contain interaction and row
 * @param {string} className - The name of the class executing the function 
 * @returns {(collected: any, reason: string) => Promise<void>} The Default Timeout function, and it will log with the specified name in ('className') 
 */
function returnDefaultTimeout(context, className) {
    const defaultTimeout = async (collected, reason) => {
        try {
            // fetching the last reply sent by the interaction
            const lastReply = await context.interaction.fetchReply()

            // customId of components the last reply sent by the interaction
            const lastReply_customId = lastReply?.components[0]?.components[0]?.data.custom_id || "none"
            
            // customId of components in the row inside the class
            const thisRow_customId = context.row.components[0]?.data.custom_id || null

            // checking if both customIds match
            const isSameComponents = lastReply_customId === thisRow_customId
            
            // if there are no components or they don't match we exit this function
            if (!isSameComponents || lastReply?.components?.length < 1) return;
            
            // otherwise, we disable the components and edit the interaction to have the disabled components
            context.row.components.forEach(el => {
                el.setDisabled(true)
            });
            await context.interaction.editReply({
                components: [context.row]
            })

        } catch (err) {
            if (err.code === 10008) {
                return console.warn(YELLOW + `Failed to disable components in ${className} due to interaction deletion.` + RESET)
            }
            console.error(`Failed to disable components in ${className}: `, err)
        }
    }
    return defaultTimeout
}

/**
 * @param {import('discord.js').Interaction} mainInt - The Interaction you would like to validate it's user by.
 * @param {Function} func - The function that will run if the user is validated.
 */
function validateUser(mainInt, func){
    return async(int)=>{
        if(!mainInt){
            await func(int)
        }
        if (!intAuthorValidate(mainInt, int)) return;
        
        await func(int)
    }
}

class buttonBuilder{
    buttons = []
    components = null;
    row = null;
    /**
     * @param {import('discord.js').Interaction} interaction 
     */
    constructor(interaction){
        this.interaction = interaction;
    }
    /**
     * @param {'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link'} style - cool button style from discord!!
    */
    addButton(customId=null, label=null, style='Primary', url=null, emoji=null, disable=false){
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
        if(disable){
            button.setDisabled(true);
        }
        
        this.buttons.push(button)
        return this
    }
    getRow(){
        this.row = new ActionRowBuilder().addComponents(...this.buttons)
        
        this.customIds = this.buttons.flatMap(button => button.data.custom_id) 
        
        return this.row
    }    
    /**
     * @param {import('discord.js').InteractionResponse} response 
     * @param {Number} selectedTime 
     * @param {Function} func 
     * @param {Function} timeoutFunc 
     */
    startListener(response, selectedTime=60_000, func, timeoutFunc=null, validateUserBoolean=true){

        const collectFunction = validateUserBoolean ? validateUser(this.interaction, func) : validateUser(null ,func)

        const filter = (int) => this.customIds.includes(int.customId) 

        const collector = response.createMessageComponentCollector({
            filter, 
            componentType: ComponentType.Button,
            idle: selectedTime ?? 60_000, 
        });

        this.collector = collector;
        
        collector.on('collect', collectFunction)
        collector.on('end', timeoutFunc ? timeoutFunc : returnDefaultTimeout(this, this.constructor.name))
    }
    
}

class selectorTextBuilder{
    constructor(interaction){
        this.interaction = interaction
    }
    createSelector(customId, placeHolder=null, min=1,max=1){
        
        this.customId = customId

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

    /**
     * @param {import('discord.js').InteractionResponse} response 
     * @param {Number} selectedTime 
     * @param {Function} func 
     * @param {Function} timeoutFunc 
     */
    startListener(response, selectedTime=60_000, func, timeoutFunc=null, validateUserBoolean=true){
        
        const collectFunction = validateUserBoolean ? validateUser(this.interaction, func) : validateUser(null ,func)
        
        const filter = (int) => this.customId === int.customId  

        const collector = response.createMessageComponentCollector({
            filter, 
            componentType: ComponentType.StringSelect,
            idle: selectedTime ?? 60_000,  
        });

        this.collector = collector;

        collector.on('collect', collectFunction)
        collector.on('end', timeoutFunc ? timeoutFunc : returnDefaultTimeout(this, this.constructor.name))
    }
}

class selectorUserBuilder{
    constructor(interaction){
        this.interaction = interaction
    }

    createUserSelector(customId, placeHolder=null, [min,max]=[undefined, undefined], defaultSelect=[]){

        this.customId = customId
        
        this.selector = new UserSelectMenuBuilder()
            .setCustomId(customId)
        if(placeHolder){
            this.selector.setPlaceholder(placeHolder)
        }
        if(!isNaN(min) && !isNaN(max)){
            this.selector.setMinValues(min)
                .setMaxValues(max)
        }
        if(defaultSelect.length > 0){
            this.selector.setDefaultUsers(...defaultSelect)
        }
        return this
    }

    getRow(){
        this.row = new ActionRowBuilder().addComponents(this.selector);
        return this.row
    } 
        
    /**
     * @param {import('discord.js').InteractionResponse} response 
     * @param {Number} selectedTime 
     * @param {Function} func 
     * @param {Function} timeoutFunc 
     */
    startListener(response, selectedTime=60_000, func, timeoutFunc=null, validateUserBoolean=true){

        const collectFunction = validateUserBoolean ? validateUser(this.interaction, func) : validateUser(null ,func)

        const filter = (int) => this.customId === int.customId

        const collector = response.createMessageComponentCollector({
            filter,
            componentType: ComponentType.UserSelect,
            idle: selectedTime ?? 60_000,  
        });

        collector.on('collect', collectFunction)
        collector.on('end', timeoutFunc ? timeoutFunc : returnDefaultTimeout(this, this.constructor.name))
    }
}

class selectorRoleBuilder{
    constructor(interaction){
        this.interaction = interaction
    }

    createRoleSelect(customId, placeHolder=null, [min,max]=[undefined, undefined], defaultSelect=[]){

        this.customId = customId
        
        this.selector = new RoleSelectMenuBuilder()
            .setCustomId(customId)
        if(placeHolder){
            this.selector.setPlaceholder(placeHolder)
        }
        if(!isNaN(min) && !isNaN(max)){
            this.selector.setMinValues(min)
                .setMaxValues(max)
        }
        if(defaultSelect.length > 0){
            this.selector.setDefaultRoles(...defaultSelect)
        }
        return this
    }

    getRow(){
        this.row = new ActionRowBuilder().addComponents(this.selector);
        return this.row
    } 
        
    /**
     * @param {import('discord.js').InteractionResponse} response 
     * @param {Number} selectedTime 
     * @param {Function} func 
     * @param {Function} timeoutFunc 
     */
    startListener(response, selectedTime=60_000, func, timeoutFunc=null, validateUserBoolean=true){

        const collectFunction = validateUserBoolean ? validateUser(this.interaction, func) : validateUser(null ,func)

        const filter = (int) => this.customId === int.customId

        const collector = response.createMessageComponentCollector({
            filter,
            componentType: ComponentType.RoleSelect,
            idle: selectedTime ?? 60_000,  
        });

        collector.on('collect', collectFunction)
        collector.on('end', timeoutFunc ? timeoutFunc : returnDefaultTimeout(this, this.constructor.name))
    }
}

class selectorChannelBuilder{
    constructor(interaction){
        this.interaction = interaction
    }

    createChannelSelect(customId, placeHolder=null, [min,max]=[undefined, undefined], defaultSelect=[], channelTypes=[]){

        this.customId = customId
        
        this.selector = new ChannelSelectMenuBuilder()
            .setCustomId(customId)
        if(placeHolder){
            this.selector.setPlaceholder(placeHolder)
        }
        if(!isNaN(min) && !isNaN(max)){
            this.selector.setMinValues(min)
                .setMaxValues(max)
        }
        if(defaultSelect.length > 0){
            this.selector.setDefaultChannels(...defaultSelect)
        }
        if(channelTypes.length > 0){
            this.selector.setChannelTypes(...channelTypes)
        }
        return this
    }

    getRow(){
        this.row = new ActionRowBuilder().addComponents(this.selector);
        return this.row
    } 
        
    /**
     * @param {import('discord.js').InteractionResponse} response 
     * @param {Number} selectedTime 
     * @param {Function} func 
     * @param {Function} timeoutFunc 
     */
    startListener(response, selectedTime=60_000, func, timeoutFunc=null, validateUserBoolean=true){

        const collectFunction = validateUserBoolean ? validateUser(this.interaction, func) : validateUser(null ,func)

        const filter = (int) => this.customId === int.customId

        const collector = response.createMessageComponentCollector({
            filter,
            componentType: ComponentType.ChannelSelect,
            idle: selectedTime ?? 60_000,  
        });

        collector.on('collect', collectFunction)
        collector.on('end', timeoutFunc ? timeoutFunc : returnDefaultTimeout(this, this.constructor.name))
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
        .setCustomId(`${customId}:${interaction.id}`)
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
    async showModal(time=900_000,func){
        await this.interaction.showModal(this.modal)

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
    selectorTextBuilder,
    selectorUserBuilder,
    selectorRoleBuilder,
    selectorChannelBuilder,
    modalBuilder,
}