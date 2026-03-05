const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Make me</title>
    <style>
      html, body {
        height: 100%;
        margin: 0;
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      p {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <p>Make me.</p>
  </body>
</html>`);
});

app.get('/health', async (_req, res) => {
  if (!pool) {
    return res.json({ ok: true });
  }

  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true, db: true });
  } catch (_error) {
    return res.status(500).json({ ok: false, db: false });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
