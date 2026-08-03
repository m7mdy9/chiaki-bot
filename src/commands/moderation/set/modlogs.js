module.exports = {
    name: "modlogs",
    description: "Set a channel to log moderation and other actions.",
    options: [
        {
            name: 'channel',
            description: 'Channel where the logs will be sent.',
        }
    ],
    readOnly: true,
}