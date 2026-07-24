const { Schema, model } = require("mongoose")

const modlogsSchema = new Schema({
    guildId: {type: String, required: true, unique: true},
    channelId: {type: String, required: true},
    timestamp: { type: Date, default: Date.now}
})

const modlogsModel = model('modlogs', modlogsSchema)

module.exports = { modlogsModel }