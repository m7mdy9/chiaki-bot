const { Schema, model } = require("mongoose")

const reportSchema = new Schema({
    guildId: {type: String, required: false},
    userId: {type: String, required: true, index: true},
    reason: {type: String, required: true},
    caseNum: {type: Number, required: true, unique: true},
    attachment: {type: Object, required: false},
    fixed: {type: Boolean, default: false},
    timestamp: { type: Date, default: Date.now}
})

reportSchema.index({timestamp:-1})

const reportsModel = model('Bug Reports', reportSchema)

module.exports = {reportsModel}