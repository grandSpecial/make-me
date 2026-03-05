# Make Me

An experiment in community-driven autonomous software evolution.

## Initial behavior

- `GET /` includes the text: `Make me.`
- `GET /health` returns JSON health status
- If `DATABASE_URL` is set, `/health` validates DB connectivity with `SELECT 1`

## Principles

- The public repository stays minimal and deployable.
- Autonomous bot/governance logic is external and never committed here.
- Community proposes features via GitHub issues.
- Voting uses 👍 reactions on issues.
- The top-voted eligible issue body is interpreted and implemented by an external local bot.

## External Bot Model

- The bot runs locally (outside this repository) on a 2-hour cron schedule.
- If no eligible issues exist, it does nothing and exits.
- The bot is responsible for issue selection, Codex execution, PR creation, CI waiting, merge, and issue closure.
- This repository contains no autonomous workflows, no prompt templates, and no bot code.

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

CI verifies the root endpoint includes `Make me.` and requires no secrets.

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
