const express = require('express');
const app = express();
const { chiakiSite } = require('./utils/utils');

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3; url=${chiakiSite}" />
      </head>
      <body>
        Chiaki Bot is Alive! Redirecting to main site...
      </body>
    </html>
  `)
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});