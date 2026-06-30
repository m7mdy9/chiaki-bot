const { Schema, model, default: mongoose } = require("mongoose")

const reportCardBLSchema = new Schema({
    userId: { type: String, required: true},
    reason: { type: String, required: true},
    blacklistedBy: { type: String, required: true},
    caseNum: { type: Number, default: 1},
    expiryDate: { type: Date, required: false},
    timestamp: { type: Date, default: Date.now},
})

reportCardBLSchema.index({ userId: 1 });

const reportCardBLModel = model('report card blacklist', reportCardBLSchema)

module.exports = { reportCardBLModel }