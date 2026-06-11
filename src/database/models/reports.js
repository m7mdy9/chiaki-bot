const { Schema, model } = require("mongoose")

const reportSchema = new Schema({
    guildId: {type: String, required: false},
    userId: {type: String, required: true},
    reason: {type: String, required: true},
    caseNum: {type: Number, required: true},
    attachment: {type: Object, required: false},
    timestamp: { type: Date, default: Date.now}
})

reportSchema.index({timestamp:-1})

const reportsModel = model('Bug Reports', reportSchema)

module.exports = {reportsModel}