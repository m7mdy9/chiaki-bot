const { Schema, model, default: mongoose } = require("mongoose")

const reportBugBLSchema = new Schema({
    userId: { type: String, required: true},
    reason: { type: String, required: true},
    blacklistedBy: { type: String, required: true},
    caseNum: { type: Number, default: 1},
    expiryDate: { type: Date, required: false},
    timestamp: { type: Date, default: Date.now},
})

reportBugBLSchema.index({ userId: 1 });

const reportBugBLModel = model('report bug blacklist', reportBugBLSchema)

module.exports = { reportBugBLModel }