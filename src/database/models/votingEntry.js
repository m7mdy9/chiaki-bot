const { Schema, model, default: mongoose } = require("mongoose")

const votingEntrySchema = new Schema({
    votingId: { type: mongoose.Schema.Types.ObjectId, required: true},
    userId: { type: String, required: true},
    votedFor: { type: Object, required: true},
    enteredAt: { type: Date, default: Date.now},
})

votingEntrySchema.index({ votingId: 1, userId: 1 }, { unique: true });

const votingEntryModel = model('Voting Entry', votingEntrySchema)

module.exports = {votingEntryModel}