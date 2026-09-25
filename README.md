# Human–AI Dependency and Cognitive Resilience Survey

JobApply AI is an approval-first workspace for using a resume to analyze jobs and prepare applications without bypassing LinkedIn protections or submitting anything without explicit user confirmation.

The repository contains a Next.js research survey and the original FastAPI application backend. The home route is a five-minute, approval-first pilot questionnaire. The researcher view is available at `/researcher` and exposes aggregate results only after token authentication.

## Survey pilot configuration

Set a researcher-only token before starting the app:

```powershell
$env:RESEARCHER_DASHBOARD_TOKEN = "replace-with-a-long-random-token"
npm run dev
```

Responses are written to `data/survey-responses.json` (the directory is created on first submission). The researcher dashboard uses `x-researcher-token` internally and provides the requested CSV export at `/researcher`. Do not collect real participant data until the university ethics approval and approved storage configuration are in place; for production, replace the local JSON writer with encrypted, access-controlled storage.

## Current MVP

- Daily review dashboard with realistic mock matches
- Match scoring and job detail panel
- Shortlist state for saved roles
- Private application notes
- Local resume upload and text extraction for PDF, DOCX, and TXT files
- Exact-term skill detection from extracted resume content
- Dynamic career-path ranking from confirmed resume skills, with visible skill gaps
- Software Engineering-only recommendations with unrelated and unsupported senior roles filtered out
- Batch application queue supporting 10, 25, 50, and 100-job safety settings
- One-by-one LinkedIn handoff with Open, Mark applied, Skip, and keyboard shortcuts
- One-click top-ten selection ranks only eligible junior/graduate software roles
- `POST /api/applications/batch/start` creates exactly ten READY application sessions
- Sequential batch mode keeps each LinkedIn handoff active until explicit Applied or Skip action
- LinkedIn detector validates pasted `/jobs/*` URLs and analyzes user-provided visible job details
- Chrome MV3 bridge extracts targeted visible LinkedIn job details without cross-tab scraping
- Manual review gate before any future submission flow
- Resume-based application preview with explicit approval
- Responsive layout for desktop and smaller screens
- FastAPI backend with SQLAlchemy models for users, resumes, profiles, jobs, and applications
- Transparent weighted match scoring with required and preferred skills separated
- PDF, DOCX, and TXT parser service
- Local SQLite default with PostgreSQL Docker configuration

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

## Run the backend

Python 3.11+ is recommended.

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`, with health check at `/health`.

For PostgreSQL instead of the development SQLite default:

```bash
docker compose up -d postgres
```

Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` to the PostgreSQL connection string before starting FastAPI.

## Use the LinkedIn extension

```powershell
cd extension
npm install
npm run build
```

Open `chrome://extensions`, enable Developer mode, select **Load unpacked**, and choose `extension/dist`. Open a LinkedIn job page, click the Jobflow extension, verify the debug panel shows a real description of at least 200 characters, and choose **ANALYZE JOB**. The extension sends structured job details to `/api/linkedin/analyze`, which compares them with the latest locally uploaded resume. It does not automate login, CAPTCHA, MFA, anti-bot controls, or final submission.

## Validate

```bash
npm run lint
npm run build
```

Backend checks:

```bash
cd backend
pytest
```

## Next integrations

The resume upload saves the selected file locally under `data/resumes/`, which is ignored by Git. The mock job list should be replaced with permitted sources such as official APIs or feeds. The dashboard discovers career paths from confirmed resume skills and exposes visible gaps rather than claiming missing skills. The backend exposes resume upload, job analysis, transparent matching, registration, and application preparation endpoints. A production version should add encrypted storage, authenticated user dependencies on every protected endpoint, database migrations, an LLM adapter using `LLM_API_KEY`, tailored draft generation, application tracking, and a confirmation step immediately before any permitted submission. Credentials and provider-specific secrets should stay in environment variables and should never be committed.
The batch queue prepares and organizes exactly ten eligible jobs locally, then presents them one at a time for browser handoff. It never clicks LinkedIn's final submit action. The dashboard now filters out Product Design, UX, UI, unrelated categories, and senior/staff/lead/principal roles before ranking. It does not fill a top-ten list with unsuitable jobs if fewer genuine matches are available. Because normal websites cannot read another open LinkedIn tab, the detector accepts a pasted LinkedIn jobs URL and visible job details rather than scraping the tab. The backend exposes resume upload, job analysis, transparent matching, registration, and application preparation endpoints. A production version should add encrypted storage, authenticated user dependencies on every protected endpoint, database migrations, persisted batch/application tables, an LLM adapter using `LLM_API_KEY`, tailored document generation, and a confirmation step immediately before any permitted submission. Credentials and provider-specific secrets should stay in environment variables and should never be committed.

## GitHub

The project has a local Git repository initialized by the scaffold. To publish it, create an empty GitHub repository, then run the standard `git remote add origin ...`, `git add .`, `git commit`, and `git push` commands from this folder after authenticating with GitHub.
