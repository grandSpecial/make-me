# Make Me

An experiment in community-driven autonomous software evolution.

## Initial behavior

- `GET /` returns plain text: `Make me.`
- `GET /health` returns JSON health status
- `GET /changelog` returns a rendered "living changelog" page generated from real git commits
- If `DATABASE_URL` is set, `/health` validates DB connectivity with `SELECT 1`

## Changelog route

- `/changelog` reads commit history directly from the local repository at request time
- each commit is rewritten into a lowercase deadpan diary entry from the app's perspective
- new commits appear automatically on refresh because entries are generated from current `git log`
- if git history cannot be read in the runtime environment, the route returns a temporary unavailable page

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
