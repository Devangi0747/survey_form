# Jobflow

Jobflow is an approval-first workspace for a calmer daily job search. It is designed to find relevant roles, surface the strongest matches, and help prepare an application without submitting anything on your behalf.

## Current MVP

- Daily review dashboard with realistic mock matches
- Match scoring and job detail panel
- Shortlist state for saved roles
- Private application notes
- Manual review gate before any future submission flow
- Responsive layout for desktop and smaller screens

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

## Validate

```bash
npm run lint
npm run build
```

## Next integrations

The mock job list should be replaced with permitted sources such as official APIs or feeds. A production version should add encrypted profile storage, a daily scheduler, tailored draft generation, application tracking, and a confirmation step immediately before any permitted submission. Credentials and provider-specific secrets should stay in environment variables and should never be committed.

## GitHub

The project has a local Git repository initialized by the scaffold. To publish it, create an empty GitHub repository, then run the standard `git remote add origin ...`, `git add .`, `git commit`, and `git push` commands from this folder after authenticating with GitHub.
