from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


class LoginRequest(RegisterRequest):
    pass


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class JobCreate(BaseModel):
    title: str
    company: str
    location: str | None = None
    description: str
    job_url: HttpUrl | None = None
    required_skills: list[str] = []
    preferred_skills: list[str] = []


class JobResponse(JobCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    match_score: int | None = None


class MatchResponse(BaseModel):
    overall: int
    skills: int
    experience: int
    location: int
    title: int
    matched_skills: list[str]
    missing_required: list[str]
    missing_preferred: list[str]


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    location: str | None = None
    summary: str | None = None
    skills: list[str] = []
    preferences: dict[str, str | int | bool] = {}


class ProfileResponse(ProfileUpdate):
    id: int


class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: int | None = None
    cover_letter: str = ""
    answers: dict[str, str] = {}


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    status: str
    cover_letter: str
    answers: dict[str, str]
