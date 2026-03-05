# Make Me

An experiment in community-driven autonomous software evolution.

## Initial behavior

- `GET /` returns plain text: `Make me.`
- `GET /health` returns JSON health status
- If `DATABASE_URL` is set, `/health` validates DB connectivity with `SELECT 1`

## Principles

- The public repository stays minimal and deployable.
- Autonomous bot/governance logic is external and never committed here.
- Community proposes features via GitHub issues.
- Only issues labeled `ready` are eligible for automation.
- Voting uses 👍 reactions on those eligible issues.

## Local run

```bash
npm install
npm start
```

## Local test

```bash
npm test
```

## CI

CI verifies the root endpoint responds exactly with `Make me.` and requires no secrets.

## Heroku deployment

```bash
heroku create make-me
heroku addons:create heroku-postgresql
git push heroku main
```

## Governance safeguards (configured in GitHub settings)

- Pull requests required for `main`
- Required CI checks
- No force pushes
- Linear history required

This repository intentionally does not include autonomous bot code.
