const { Schema, model, default: mongoose } = require("mongoose")

const reportUserBLSchema = new Schema({
    userId: { type: String, required: true},
    reason: { type: String, required: true},
    blacklistedBy: { type: String, required: true},
    caseNum: { type: Number, default: 1},
    expiryDate: { type: Date, required: false},
    timestamp: { type: Date, default: Date.now},
})

reportUserBLSchema.index({ userId: 1 });

const reportUserBLModel = model('report user blacklist', reportUserBLSchema)

module.exports = { reportUserBLModel }