const express = require('express');
const { logstuff } = require('../utils/utils.js'); // Adjust the path as needed
const cors = require("cors")

function startServer(client) {
    const app = express();
    app.use(cors())
    // Use the port from the environment variable (Railway assigns this)
    const port = process.env.PORT || 3000;

    // Define a route to handle incoming requests
    app.get('/', (req, res) => {
        res.send('Bot is alive!');
    });

    // Start the Express server on the port
    app.listen(port, () => {
        logstuff(client, `Server running on port ${port}`);
    });

    // Handle favicon requests
    app.get('/favicon.ico', (req, res) => {
        res.status(204); // No Content
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'healthy', uptime: process.uptime() });
    });
}

module.exports = {
    startServer
};