const { Schema, model } = require("mongoose")

const autoroleSchema = new Schema({
    guildId: {type: String, required: true, unique: true},
    roleIds: {type: [String], required: true},
    timestamp: { type: Date, default: Date.now}
})

const autoroleModel = model('autorole', autoroleSchema)

module.exports = { autoroleModel }