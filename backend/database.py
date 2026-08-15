from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

import os

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./sql_app.db")
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    
    gemini_key = Column(String, nullable=True)
    serper_key = Column(String, nullable=True)

    jobs = relationship("JobModel", back_populates="owner")

class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    portal = Column(String, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True, default="Unknown")
    url = Column(String, index=True)
    description = Column(Text)
    match_score = Column(Float, default=0.0)
    status = Column(String, default="New") # New, Applied, Interview, Rejected, Offer
    
    # Generated Assets
    cover_letter = Column(Text, nullable=True)
    application_answers = Column(Text, nullable=True)
    technical_questions = Column(Text, nullable=True)

    owner = relationship("User", back_populates="jobs")

# Add missing column if it doesn't exist (Migration)
import sqlite3
def run_migrations():
    conn = sqlite3.connect('./sql_app.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN technical_questions TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists
    conn.commit()
    conn.close()
run_migrations()

Base.metadata.create_all(bind=engine)
