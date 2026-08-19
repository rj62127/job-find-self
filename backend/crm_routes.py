from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
import database
import database as models

def get_current_user(
    x_user_email: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    x_google_id: Optional[str] = Header(None)
):
    if not x_user_email or not x_google_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db = database.SessionLocal()
    user = db.query(models.User).filter(models.User.google_id == x_google_id).first()
    if not user:
        user = models.User(google_id=x_google_id, email=x_user_email, name=x_user_name or "Unknown User")
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return user
import database as models

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========================
# Pydantic Schemas
# ========================

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None
    notes: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class RecruiterBase(BaseModel):
    name: str
    company_id: Optional[int] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None

class RecruiterCreate(RecruiterBase):
    pass

class RecruiterUpdate(RecruiterBase):
    name: Optional[str] = None

class RecruiterResponse(RecruiterBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class CommunicationBase(BaseModel):
    job_id: int
    comm_type: str
    recruiter_id: Optional[int] = None
    date: Optional[datetime] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    response_received: Optional[str] = None
    response_date: Optional[datetime] = None
    next_followup: Optional[datetime] = None

class CommunicationCreate(CommunicationBase):
    pass

class CommunicationUpdate(CommunicationBase):
    job_id: Optional[int] = None
    comm_type: Optional[str] = None

class CommunicationResponse(CommunicationBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class AssessmentBase(BaseModel):
    job_id: int
    platform: str
    name: str
    status: str = "Pending"
    received_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    score: Optional[str] = None
    result: Optional[str] = None
    notes: Optional[str] = None
    url: Optional[str] = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentUpdate(AssessmentBase):
    job_id: Optional[int] = None
    platform: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None

class AssessmentResponse(AssessmentBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class InterviewBase(BaseModel):
    job_id: int
    round_type: str
    status: str = "Scheduled"
    date: Optional[datetime] = None
    time: Optional[str] = None
    interviewer: Optional[str] = None
    meeting_url: Optional[str] = None
    questions_asked: Optional[str] = None
    topics: Optional[str] = None
    result: Optional[str] = None
    feedback: Optional[str] = None
    notes: Optional[str] = None

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(InterviewBase):
    job_id: Optional[int] = None
    round_type: Optional[str] = None
    status: Optional[str] = None

class InterviewResponse(InterviewBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class InterviewQuestionBase(BaseModel):
    interview_id: int
    question: str
    category: Optional[str] = None
    difficulty: Optional[str] = None
    my_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    notes: Optional[str] = None

class InterviewQuestionCreate(InterviewQuestionBase):
    pass

class InterviewQuestionUpdate(InterviewQuestionBase):
    interview_id: Optional[int] = None
    question: Optional[str] = None

class InterviewQuestionResponse(InterviewQuestionBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class OfferBase(BaseModel):
    job_id: int
    status: str = "Received"
    offered_ctc: Optional[str] = None
    fixed_ctc: Optional[str] = None
    variable_ctc: Optional[str] = None
    bonus: Optional[str] = None
    esop: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    joining_date: Optional[datetime] = None
    offer_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

class OfferCreate(OfferBase):
    pass

class OfferUpdate(OfferBase):
    job_id: Optional[int] = None
    status: Optional[str] = None

class OfferResponse(OfferBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# ========================
# CRUD Helpers & Endpoints
# ========================

def create_crud_endpoints(router: APIRouter, prefix: str, model, create_schema, update_schema, response_schema):
    
    @router.post(prefix, response_model=response_schema)
    def create_item(item: create_schema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
        db_item = model(**item.model_dump(), user_id=current_user.id)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @router.get(prefix, response_model=List[response_schema])
    def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
        return db.query(model).filter(model.user_id == current_user.id).offset(skip).limit(limit).all()

    @router.get(prefix + "/{item_id}", response_model=response_schema)
    def read_item(item_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
        db_item = db.query(model).filter(model.id == item_id, model.user_id == current_user.id).first()
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        return db_item

    @router.put(prefix + "/{item_id}", response_model=response_schema)
    def update_item(item_id: int, item: update_schema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
        db_item = db.query(model).filter(model.id == item_id, model.user_id == current_user.id).first()
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        
        update_data = item.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_item, key, value)
            
        db.commit()
        db.refresh(db_item)
        return db_item

    @router.delete(prefix + "/{item_id}", response_model=dict)
    def delete_item(item_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
        db_item = db.query(model).filter(model.id == item_id, model.user_id == current_user.id).first()
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
            
        db.delete(db_item)
        db.commit()
        return {"ok": True, "message": "Item deleted successfully"}

create_crud_endpoints(router, "/companies", models.Company, CompanyCreate, CompanyUpdate, CompanyResponse)
create_crud_endpoints(router, "/recruiters", models.Recruiter, RecruiterCreate, RecruiterUpdate, RecruiterResponse)
create_crud_endpoints(router, "/communications", models.Communication, CommunicationCreate, CommunicationUpdate, CommunicationResponse)
create_crud_endpoints(router, "/assessments", models.Assessment, AssessmentCreate, AssessmentUpdate, AssessmentResponse)
create_crud_endpoints(router, "/interviews", models.Interview, InterviewCreate, InterviewUpdate, InterviewResponse)
create_crud_endpoints(router, "/interview-questions", models.InterviewQuestion, InterviewQuestionCreate, InterviewQuestionUpdate, InterviewQuestionResponse)
create_crud_endpoints(router, "/offers", models.Offer, OfferCreate, OfferUpdate, OfferResponse)

class ManualJobCreate(BaseModel):
    title: str
    company: str
    location: str
    portal: str
    status: str

@router.post("/jobs/manual")
def create_manual_job(job: ManualJobCreate, session: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_job = models.JobModel(
        title=job.title,
        company=job.company,
        location=job.location,
        portal=job.portal,
        status=job.status,
        user_id=current_user.id
    )
    session.add(new_job)
    session.commit()
    session.refresh(new_job)
    return {"message": "Job created manually", "job_id": new_job.id}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

import requests

@router.post("/chat")
def global_chat(req: ChatRequest, session: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not current_user.groq_key:
        raise HTTPException(status_code=400, detail="Groq API Key not set. Please set it in Settings.")
    
    # Simple semantic keyword matching from user's last message
    last_msg = req.messages[-1].content.lower()
    
    # Fetch user jobs
    jobs = session.query(models.JobModel).filter(models.JobModel.user_id == current_user.id).all()
    
    # Find matching jobs (very basic keyword match on title/company)
    matched_jobs = []
    for job in jobs:
        if job.company and job.company.lower() in last_msg:
            matched_jobs.append(job)
        elif job.title and any(word in last_msg for word in job.title.lower().split() if len(word) > 4):
            matched_jobs.append(job)
            
    # Remove duplicates
    matched_jobs = list({j.id: j for j in matched_jobs}.values())
    
    context_str = "No specific job found in database matching the query."
    if matched_jobs:
        context_str = "User's matching jobs context:\n"
        for j in matched_jobs[:3]: # Limit to top 3
            context_str += f"- Job: {j.title} at {j.company}\nDescription: {j.description[:800]}\nStatus: {j.status}\n\n"

    system_prompt = {
        "role": "system",
        "content": (
            "You are JobSense AI, an intelligent assistant helping the user track and prepare for job interviews. "
            f"{context_str}\n"
            "Use the provided job context to write cover letters, prepare interview questions, or offer guidance. "
            "If the user asks for a job not in the context, ask them to clarify the company or job title."
        )
    }

    # Prepare messages for Groq
    groq_msgs = [system_prompt] + [{"role": m.role, "content": m.content} for m in req.messages]

    headers = {
        "Authorization": f"Bearer {current_user.groq_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": groq_msgs,
        "temperature": 0.7
    }

    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Groq API error: {resp.text}")

    data = resp.json()
    reply = data["choices"][0]["message"]["content"]
    
    return {"reply": reply}
