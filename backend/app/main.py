import json
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import Base, engine, get_db
from .models import Application, CandidateProfile, Job, Resume, User
from .schemas.api import ApplicationCreate, ApplicationResponse, JobCreate, JobResponse, LoginRequest, MatchResponse, ProfileResponse, ProfileUpdate, RegisterRequest, TokenResponse
from .services.matching import score_match
from .services.parsers import extract_text
from .services.security import create_token, hash_password, verify_password

settings = get_settings()
Base.metadata.create_all(bind=engine)
app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def local_user(db: Session) -> User:
    user = db.scalar(select(User).order_by(User.id))
    if user:
        return user
    user = User(email="local@example.com", password_hash=hash_password("local-development-only"))
    user.profile = CandidateProfile(full_name="Local Candidate")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def application_response(application: Application) -> ApplicationResponse:
    return ApplicationResponse(id=application.id, job_id=application.job_id, status=application.status, cover_letter=application.cover_letter, answers=json.loads(application.answers or "{}"))


def job_response(job: Job) -> JobResponse:
    return JobResponse(id=job.id, title=job.title, company=job.company, location=job.location, description=job.description, job_url=job.job_url, required_skills=job.required_skills.split(", ") if job.required_skills else [], preferred_skills=job.preferred_skills.split(", ") if job.preferred_skills else [], match_score=job.match_score)


def profile_response(profile: CandidateProfile) -> ProfileResponse:
    return ProfileResponse(id=profile.id, full_name=profile.full_name, location=profile.location, summary=profile.summary, skills=[skill for skill in profile.skills.split(", ") if skill], preferences=json.loads(profile.preferences or "{}"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password))
    user.profile = CandidateProfile()
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_token(user.id))


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=create_token(user.id))


@app.get("/api/profile", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)) -> ProfileResponse:
    user = local_user(db)
    return profile_response(user.profile or CandidateProfile(id=0))


@app.put("/api/profile", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db)) -> ProfileResponse:
    user = local_user(db)
    profile = user.profile or CandidateProfile(user_id=user.id)
    profile.full_name = payload.full_name
    profile.location = payload.location
    profile.summary = payload.summary
    profile.skills = ", ".join(payload.skills)
    profile.preferences = json.dumps(payload.preferences)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile_response(profile)


@app.post("/api/resumes/upload", status_code=201)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict[str, int | str]:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in {".pdf", ".docx", ".txt"}:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    target = upload_dir / f"resume-{Path(file.filename or 'upload').stem}-{Path(file.filename or 'upload').suffix[1:]}"
    target.write_bytes(await file.read())
    text = extract_text(str(target))
    resume = Resume(user_id=local_user(db).id, filename=file.filename or target.name, path=str(target), extracted_text=text)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return {"id": resume.id, "filename": resume.filename, "text_length": len(text)}


@app.post("/api/jobs/analyze", response_model=JobResponse, status_code=201)
def analyze_job(payload: JobCreate, db: Session = Depends(get_db)) -> JobResponse:
    job_data = payload.model_dump(mode="json", exclude={"required_skills", "preferred_skills"})
    job = Job(**job_data, required_skills=", ".join(payload.required_skills), preferred_skills=", ".join(payload.preferred_skills))
    db.add(job)
    db.commit()
    db.refresh(job)
    return job_response(job)


@app.post("/api/jobs/{job_id}/match", response_model=MatchResponse)
def match_job(job_id: int, resume_id: int, db: Session = Depends(get_db)) -> MatchResponse:
    job = db.get(Job, job_id)
    resume = db.get(Resume, resume_id)
    if not job or not resume:
        raise HTTPException(status_code=404, detail="Job or resume not found")
    result = score_match(resume.extracted_text, job.title, job.location, job.required_skills.split(", ") if job.required_skills else [], job.preferred_skills.split(", ") if job.preferred_skills else [])
    job.match_score = result["overall"]
    db.commit()
    return MatchResponse(**result)


@app.get("/api/jobs/recommended", response_model=list[JobResponse])
def recommended_jobs(db: Session = Depends(get_db)) -> list[JobResponse]:
    return [job_response(job) for job in db.scalars(select(Job).order_by(Job.match_score.desc().nullslast())).all()]


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)) -> JobResponse:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_response(job)


@app.post("/api/applications/prepare", response_model=ApplicationResponse, status_code=201)
def prepare_application(payload: ApplicationCreate, db: Session = Depends(get_db)) -> Application:
    if not db.get(Job, payload.job_id):
        raise HTTPException(status_code=404, detail="Job not found")
    application = Application(user_id=local_user(db).id, job_id=payload.job_id, cover_letter=payload.cover_letter, answers=json.dumps(payload.answers), status="Ready for Review")
    db.add(application)
    db.commit()
    db.refresh(application)
    return application_response(application)


@app.get("/api/applications", response_model=list[ApplicationResponse])
def list_applications(db: Session = Depends(get_db)) -> list[ApplicationResponse]:
    return [application_response(application) for application in db.scalars(select(Application).order_by(Application.id.desc())).all()]


@app.get("/api/applications/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: int, db: Session = Depends(get_db)) -> ApplicationResponse:
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application_response(application)


@app.put("/api/applications/{application_id}", response_model=ApplicationResponse)
def update_application(application_id: int, status: str, db: Session = Depends(get_db)) -> ApplicationResponse:
    allowed = {"Saved", "Analyzing", "Prepared", "Ready for Review", "User Approved", "Applied", "Rejected", "Interview", "Offer"}
    if status not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported application status")
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application.status = status
    db.commit()
    db.refresh(application)
    return application_response(application)


@app.post("/api/ai/cover-letter")
def draft_cover_letter(job_id: int, resume_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    job = db.get(Job, job_id)
    resume = db.get(Resume, resume_id)
    if not job or not resume:
        raise HTTPException(status_code=404, detail="Job or resume not found")
    return {"draft": f"Dear {job.company} team,\n\nI am interested in the {job.title} role. Please review my attached resume for the experience and skills I can bring to this position.\n\nSincerely,\nThe candidate"}


@app.post("/api/ai/application-answer")
def draft_application_answer(question: str, resume_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    if not db.get(Resume, resume_id):
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"question": question, "draft": "Please edit this evidence-based draft with details from your resume before approving it."}
