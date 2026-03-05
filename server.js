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
  res.type('text/plain').send('Make me.');
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
