const { Schema, model } = require("mongoose")

const modlogSettingsSchema = new Schema({
    guildId: {type: String, required: true, unique: true},
    moderativeActions: {type: Boolean, default: true},
    channelActions: {type: Boolean, default: true},
    memberJoinLeave: {type: Boolean, default: true},
    memberRoleUpdate: {type: Boolean, default: true},
    messageDeletion: {type: Boolean, default: true},
    messageEdits: {type: Boolean, default: true},
    roleActions: {type: Boolean, default: true},
    modlogChanges: {type: Boolean, default: true},
    autoroleChanges: {type: Boolean, default: true},
    ignoredChannelIds: {type: [String], default: []},
    timestamp: { type: Date, default: Date.now},
})

const modlogSettingsModel = model('modlog settings', modlogSettingsSchema)

module.exports = { modlogSettingsModel }