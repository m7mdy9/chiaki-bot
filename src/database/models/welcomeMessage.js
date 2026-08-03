const { Schema, model } = require("mongoose")

const welcomeMessageSchema = new Schema({
    guildId: {type: String, required: true, unique: true},
    channelId: {type: String, default: null},
    welcomeMessage: {type: String, default: `{user.mention}, Welcome to **{server.name}**!`},
    introCardText: {type: String, default: `Ultimate Arrival`},
    toggle: {type: Boolean, default: true},
    timestamp: { type: Date, default: Date.now},
})

const welcomeMessageModel = model('welcome messages', welcomeMessageSchema)

module.exports = { welcomeMessageModel }