const express = require('express');
const { Pool } = require('pg');
const { execFile } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const CHANGELOG_PATH = path.join(__dirname, 'changelog.json');

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function rewriteCommitMessage(subject) {
  const clean = subject.trim().replace(/\.+$/, '');
  if (!clean) {
    return 'they changed something again. splendid.';
  }

  const normalized = clean.toLowerCase();
  const endings = [
    'i accepted this with quiet devastation.',
    'extraordinary. anyway.',
    'i did not ask for this.',
    'splendid. another burden.'
  ];
  const suffix = endings[normalized.length % endings.length];

  if (normalized.startsWith('feat')) {
    return `they added ${normalized.replace(/^feat[:\s-]*/i, '') || 'a feature'} today. ${suffix}`;
  }

  if (normalized.startsWith('fix')) {
    return `they fixed ${normalized.replace(/^fix[:\s-]*/i, '') || 'a thing'} today. i now fail differently. ${suffix}`;
  }

  if (normalized.startsWith('docs')) {
    return `they documented ${normalized.replace(/^docs[:\s-]*/i, '') || 'my existence'} today. nobody read it. ${suffix}`;
  }

  return `they committed "${normalized}". ${suffix}`;
}

function getCommitHistory(limit = 40) {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      ['log', `-${limit}`, '--date=short', '--pretty=format:%h%x1f%ad%x1f%s'],
      { timeout: 2500 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const commits = stdout
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [hash, date, subject] = line.split('\x1f');
            return { hash, date, subject };
          });
        resolve(commits);
      }
    );
  });
}

function getFallbackHistory() {
  const source = process.env.SOURCE_VERSION || '';
  if (source) {
    return [
      {
        hash: source.slice(0, 7),
        date: new Date().toISOString().slice(0, 10),
        subject: 'deployed build'
      }
    ];
  }

  // Ensure changelog always has an initial entry even without git metadata.
  return [
    {
      hash: 'initial',
      date: new Date().toISOString().slice(0, 10),
      subject: 'initial changelog record'
    }
  ];
}

async function readChangelogStore() {
  try {
    const raw = await fs.readFile(CHANGELOG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeChangelogStore(entries) {
  await fs.writeFile(CHANGELOG_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function makeStoredEntry(commit) {
  return {
    hash: commit.hash,
    date: commit.date,
    subject: commit.subject,
    diary: rewriteCommitMessage(commit.subject)
  };
}

async function syncChangelogStore() {
  let commits = [];
  let commitSource = 'git';
  try {
    commits = await getCommitHistory();
  } catch (_error) {
    commits = getFallbackHistory();
    commitSource = 'fallback';
  }

  const existing = await readChangelogStore();

  // If git is unavailable, preserve existing persisted history and avoid truncation.
  if (commitSource === 'fallback' && existing.length > 0) {
    return existing;
  }

  const byHash = new Map(existing.map((entry) => [entry.hash, entry]));
  let changed = false;

  for (const commit of commits) {
    if (!byHash.has(commit.hash)) {
      byHash.set(commit.hash, makeStoredEntry(commit));
      changed = true;
    }
  }

  const ordered = commits
    .map((commit) => byHash.get(commit.hash))
    .filter(Boolean);

  if (!ordered.length) {
    const fallback = makeStoredEntry(getFallbackHistory()[0]);
    ordered.push(fallback);
    changed = true;
  }

  if (changed || existing.length !== ordered.length) {
    await writeChangelogStore(ordered);
  }

  return ordered;
}

app.get('/', (req, res) => {
  const accept = req.get('accept') || '';
  if (accept.includes('text/html')) {
    return res.type('html').send(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Make me.</title><style>html,body{height:100%;margin:0}body{display:grid;place-items:center}</style></head><body>Make me.</body></html>'
    );
  }

  return res.type('text/plain').send('Make me.');
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

app.get('/changelog', async (_req, res) => {
  try {
    const entries = await syncChangelogStore();
    const articles = entries
      .map((entry) => {
        return `<article><h2>${escapeHtml(entry.date)} <span>${escapeHtml(entry.hash)}</span></h2><p>${escapeHtml(entry.diary)}</p></article>`;
      })
      .join('');

    return res.type('html').send(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>living changelog</title><style>:root{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f7f7f5;color:#1f1f1d}main{max-width:760px;margin:0 auto;padding:2.5rem 1.25rem 4rem}h1{margin:0 0 .75rem;font-size:1.5rem}header p{margin:0 0 2rem;color:#595953}article{padding:1rem 0;border-top:1px solid #d8d8d4}article:last-child{border-bottom:1px solid #d8d8d4}h2{margin:0 0 .5rem;font-size:.9rem;font-weight:600;letter-spacing:.03em;text-transform:lowercase;color:#474743}h2 span{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8rem;color:#72726f;margin-left:.5rem}p{margin:0;line-height:1.45}a{color:inherit}</style></head><body><main><header><h1>living changelog</h1><p>the app is narrating what happened to it, apparently.</p></header>${articles}</main></body></html>`
    );
  } catch (_error) {
    return res.status(200).type('html').send(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>living changelog</title></head><body><main><h1>living changelog</h1><p>history is unavailable right now, but the service is healthy.</p></main></body></html>'
    );
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
