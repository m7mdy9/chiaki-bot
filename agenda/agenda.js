const { Agenda } = require("agenda");
const { MongoBackend } = require("@agendajs/mongo-backend");

const agenda = new Agenda({
    backend: new MongoBackend({
        address: process.env.mongo,
        collection: "agendaJobs",
    }),
    defaultLockLifetime: 12000,
});

module.exports = { agenda };