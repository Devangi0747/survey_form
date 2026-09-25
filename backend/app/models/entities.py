from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    profile: Mapped["CandidateProfile | None"] = relationship(back_populates="user", uselist=False)
    resumes: Mapped[list["Resume"]] = relationship(back_populates="user")
    applications: Mapped[list["Application"]] = relationship(back_populates="user")


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    full_name: Mapped[str | None] = mapped_column(String(255))
    location: Mapped[str | None] = mapped_column(String(255))
    summary: Mapped[str | None] = mapped_column(Text)
    skills: Mapped[str] = mapped_column(Text, default="")
    preferences: Mapped[str] = mapped_column(Text, default="{}")
    user: Mapped[User] = relationship(back_populates="profile")


class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    path: Mapped[str] = mapped_column(String(500))
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    user: Mapped[User] = relationship(back_populates="resumes")


class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    company: Mapped[str] = mapped_column(String(255), index=True)
    location: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    job_url: Mapped[str | None] = mapped_column(String(1000))
    required_skills: Mapped[str] = mapped_column(Text, default="")
    preferred_skills: Mapped[str] = mapped_column(Text, default="")
    match_score: Mapped[int | None] = mapped_column(Integer)


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="Saved")
    cover_letter: Mapped[str] = mapped_column(Text, default="")
    answers: Mapped[str] = mapped_column(Text, default="{}")
    user: Mapped[User] = relationship(back_populates="applications")
    job: Mapped[Job] = relationship()
