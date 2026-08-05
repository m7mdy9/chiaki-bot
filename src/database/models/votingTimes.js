const { Schema, model } = require("mongoose")

const votingTimeSchema = new Schema({
    guildId: {type: String, required: true},
    channelId: {type: String, required: true},
    messageId: {type: String, required: false, index: true},
    usersIds: {type: [String], required: true},
    usersNames: {type: [String], required: true},
    votersIds: {type: [String] ,default: []},
    endTime: { type: Date, required: true},
    ended: { type: Boolean, default: false},
    timestamp: { type: Date, default: Date.now}
})

votingTimeSchema.index({timestamp:-1})

const votingTimeModel = model('Voting Time', votingTimeSchema)

module.exports = {votingTimeModel}