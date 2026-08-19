from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./sql_app.db")
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

from sqlalchemy.pool import NullPool

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine_kwargs: dict = {"connect_args": connect_args}
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, **engine_kwargs
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    
    # API Keys
    gemini_key = Column(String, nullable=True)
    serper_key = Column(String, nullable=True)
    groq_key = Column(String, nullable=True)
    uploads_remaining = Column(Integer, default=1)

    # JobTrack CRM Profile settings
    current_ctc = Column(String, nullable=True)
    expected_ctc = Column(String, nullable=True)
    lwd = Column(String, nullable=True)
    notice_period = Column(String, nullable=True)
    target_roles = Column(String, nullable=True)
    preferred_locations = Column(String, nullable=True)
    work_preference = Column(String, nullable=True)

    # Relationships
    jobs = relationship("JobModel", back_populates="owner", cascade="all, delete-orphan")
    companies = relationship("Company", back_populates="owner", cascade="all, delete-orphan")
    recruiters = relationship("Recruiter", back_populates="owner", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    location = Column(String, nullable=True)
    size = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="companies")
    jobs = relationship("JobModel", back_populates="company_ref")
    recruiters = relationship("Recruiter", back_populates="company_ref")


class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    name = Column(String, index=True)
    designation = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    owner = relationship("User", back_populates="recruiters")
    company_ref = relationship("Company", back_populates="recruiters")
    jobs = relationship("JobModel", back_populates="recruiter_ref")
    communications = relationship("Communication", back_populates="recruiter_ref")


class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    recruiter_id = Column(Integer, ForeignKey("recruiters.id"), nullable=True)
    
    # Old fields kept for backward compatibility and simplicity
    company = Column(String, index=True, default="Unknown") # Legacy text field
    title = Column(String, index=True)
    portal = Column(String, index=True)
    url = Column(String, index=True)
    description = Column(Text)
    match_score = Column(Float, default=0.0)
    
    # CRM Specific
    source = Column(String, nullable=True)
    location = Column(String, nullable=True)
    work_type = Column(String, nullable=True) # Remote, Hybrid, Onsite
    status = Column(String, default="New", index=True)
    application_date = Column(DateTime, default=datetime.utcnow)
    next_followup_date = Column(DateTime, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    
    # Generated Assets
    cover_letter = Column(Text, nullable=True)
    application_answers = Column(Text, nullable=True)
    technical_questions = Column(Text, nullable=True)

    owner = relationship("User", back_populates="jobs")
    company_ref = relationship("Company", back_populates="jobs")
    recruiter_ref = relationship("Recruiter", back_populates="jobs")
    
    communications = relationship("Communication", back_populates="job_ref", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="job_ref", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="job_ref", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="job_ref", cascade="all, delete-orphan")


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    recruiter_id = Column(Integer, ForeignKey("recruiters.id"), nullable=True)
    
    date = Column(DateTime, default=datetime.utcnow)
    comm_type = Column(String) # Email, LinkedIn, Phone
    subject = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    response_received = Column(String, nullable=True)
    response_date = Column(DateTime, nullable=True)
    next_followup = Column(DateTime, nullable=True)

    job_ref = relationship("JobModel", back_populates="communications")
    recruiter_ref = relationship("Recruiter", back_populates="communications")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    
    platform = Column(String)
    name = Column(String)
    received_date = Column(DateTime, default=datetime.utcnow)
    deadline = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    status = Column(String, default="Pending")
    score = Column(String, nullable=True)
    result = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    url = Column(String, nullable=True)

    job_ref = relationship("JobModel", back_populates="assessments")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    
    round_type = Column(String)
    date = Column(DateTime, nullable=True)
    time = Column(String, nullable=True)
    interviewer = Column(String, nullable=True)
    meeting_url = Column(String, nullable=True)
    status = Column(String, default="Scheduled")
    questions_asked = Column(Text, nullable=True)
    topics = Column(Text, nullable=True)
    result = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    job_ref = relationship("JobModel", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview_ref", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    
    question = Column(Text)
    category = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    my_answer = Column(Text, nullable=True)
    correct_answer = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    interview_ref = relationship("Interview", back_populates="questions")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    
    offered_ctc = Column(String, nullable=True)
    fixed_ctc = Column(String, nullable=True)
    variable_ctc = Column(String, nullable=True)
    bonus = Column(String, nullable=True)
    esop = Column(String, nullable=True)
    location = Column(String, nullable=True)
    work_type = Column(String, nullable=True)
    joining_date = Column(DateTime, nullable=True)
    offer_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    status = Column(String, default="Received")
    notes = Column(Text, nullable=True)

    job_ref = relationship("JobModel", back_populates="offers")

# Let SQLAlchemy try to create standard tables initially
Base.metadata.create_all(bind=engine)

