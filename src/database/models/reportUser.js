const { Schema, model } = require("mongoose")

const reportUserSchema = new Schema({
    guildId: {type: String, required: false},
    reporterId: {type: String, required: true, index: true},
    abuserId: {type: String, required: true, index: true},
    reason: {type: String, required: true},
    caseNum: {type: Number, required: true, unique: true},
    checked: {type: Boolean, default: false},
    timestamp: { type: Date, default: Date.now}
})

reportUserSchema.index({timestamp:-1})

const reportUserModel = model('user reports', reportUserSchema)

module.exports = { reportUserModel }