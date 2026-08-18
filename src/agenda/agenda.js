const { Agenda } = require("agenda");
const { MongoBackend } = require("@agendajs/mongo-backend");

const agenda = new Agenda({
    backend: new MongoBackend({
        address: process.env.MONGODB_KEY,
        collection: "agendaJobs",
    }),
    defaultLockLifetime: 12000,
});

module.exports = { agenda };