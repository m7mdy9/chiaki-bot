const { Schema, model } = require("mongoose")

const warningSchema = new Schema({
    guildId: {type: String, required: true},
    userId: {type: String, required: true},
    modId: {type: String, required: true},
    reason: {type: String, default: null},
    caseNum: {type: Number, required: true},
    timestamp: { type: Date, default: Date.now}
})

warningSchema.index({ guildId: 1, userId: 1, timestamp:-1})

const warningModel = model('Warnings', warningSchema)

module.exports = {warningModel}