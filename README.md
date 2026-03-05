# Make Me

An experiment in community-driven autonomous software evolution.

## Initial behavior

- `GET /` returns plain text: `Make me.`
- `GET /health` returns JSON health status
- `GET /changelog` returns a rendered "living changelog" page generated from real git commits
- If `DATABASE_URL` is set, `/health` validates DB connectivity with `SELECT 1`

## Changelog route

- `/changelog` stores rewritten entries in `changelog.json` at the app root
- on each request, the app syncs recent commits into `changelog.json` and keeps existing rewrites stable
- each commit is rewritten into a lowercase deadpan diary entry from the app's perspective
- if git history is unavailable at runtime, the route still serves a valid page using stored or fallback entries

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
