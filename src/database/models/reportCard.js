const { Schema, model, default: mongoose } = require("mongoose")

const reportCardSchema = new Schema({
    userId: { type: String, required: true},
    likes: { type: String, required: false},
    dislikes: { type: String, required: false},
    talent: { type: String, required: false},
    notes: { type: String, required: false},
    birthday: { type: String, required: false},
    blood: { type: String, required: false},
    createdAt: { type: Date, default: Date.now},
    lastEdited: { type: Date, default: Date.now},
})

reportCardSchema.index({ userId: 1 }, { unique: true });

const reportCardModel = model('reportCard', reportCardSchema)

module.exports = { reportCardModel }