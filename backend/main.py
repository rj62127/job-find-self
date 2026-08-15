from fastapi import FastAPI, File, UploadFile, HTTPException, Header, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import json
import PyPDF2
import requests
import razorpay
from sqlalchemy import text
from typing import Optional, List
from groq import Groq

from database import engine, Base, SessionLocal, JobModel, User
from serper_search import search_jobs

app = FastAPI(title="Job Tracking Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
Base.metadata.create_all(bind=engine)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS uploads_remaining INTEGER DEFAULT 1;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS groq_key VARCHAR;"))
except Exception as e:
    print(f"Migration error: {e}")

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_xxxxxx")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "xxxxxxxxxxxxxx")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


class Job(BaseModel):
    id: int
    title: str
    company: str
    location: str
    match_score: float
    portal: str
    status: str
    url: str
    cover_letter: Optional[str] = None
    application_answers: Optional[str] = None
    technical_questions: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

def get_current_user(
    x_user_email: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    x_google_id: Optional[str] = Header(None)
):
    if not x_user_email or not x_google_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = SessionLocal()
    user = db.query(User).filter(User.google_id == x_google_id).first()
    if not user:
        user = User(google_id=x_google_id, email=x_user_email, name=x_user_name or "Unknown User")
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return user

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text

def call_gemini(prompt: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        print(f"Gemini API Error: {response.text}")
    response.raise_for_status()
    data = response.json()
    return data['candidates'][0]['content']['parts'][0]['text']

def process_resume_and_jobs(resume_text: str, user_id: int, gemini_key: str, serper_key: str, current_ctc: str, expected_hike: str):
    try:
        role_prompt = f"Analyze this resume and return ONLY the primary job title/role this person should apply for (e.g. 'Python Backend Developer', 'Frontend Engineer'). No other text.\nResume: {resume_text[:2000]}"
        raw_role = call_gemini(role_prompt, gemini_key)
        target_role = raw_role.replace('\n', ' ').replace('"', '').strip()
        words = target_role.split()
        if len(words) > 5:
            target_role = " ".join(words[:3])
    except Exception as e:
        print(f"Failed to extract role: {e}")
        target_role = "Software Engineer"

    portals_query = "naukri.com OR linkedin.com OR indeed.com"
    query = f'"{target_role}" {portals_query}'
    print(f"SERPER QUERY TO SEND: {query}")
    
    try:
        raw_jobs = search_jobs(query, api_key=serper_key, num_results=10)
    except Exception as e:
        print(f"Serper API Error: {e}")
        return
    
    ctc_instructions = ""
    if current_ctc and expected_hike:
        ctc_instructions = f"""
    The candidate's Current CTC is {current_ctc} LPA and their Expected Hike is {expected_hike}%. 
    Calculate their Expected CTC. If any job explicitly mentions a CTC or salary that is strictly LOWER than the Expected CTC, you MUST filter it out (do not include it in the output JSON). 
    If a job does not mention a salary, assume it is negotiable and include it."""

    prompt = f"""
    You are an expert technical recruiter. Analyze each job against the resume and calculate a 'Match Score' (0-100).{ctc_instructions}
    
    Resume Text: {resume_text[:3000]}
    Job Postings: {json.dumps(raw_jobs, indent=2)}
    
    Return a JSON array of objects: title, company, location, url, portal, description, match_score. Output ONLY valid JSON.
    """
    
    try:
        raw_response = call_gemini(prompt, gemini_key)
        clean_text = raw_response.strip()
        if clean_text.startswith("```json"): clean_text = clean_text[7:-3]
        elif clean_text.startswith("```"): clean_text = clean_text[3:-3]
            
        ai_scored_jobs = json.loads(clean_text)
        
        db = SessionLocal()
        for job_data in ai_scored_jobs:
            existing = db.query(JobModel).filter(JobModel.url == job_data.get("url"), JobModel.user_id == user_id).first()
            if not existing:
                new_job = JobModel(
                    user_id=user_id,
                    portal=job_data.get("portal", "Unknown"),
                    title=job_data.get("title", "Unknown"),
                    company=job_data.get("company", "Unknown"),
                    url=job_data.get("url", ""),
                    description=job_data.get("description", ""),
                    match_score=float(job_data.get("match_score", 0)),
                    status="New"
                )
                db.add(new_job)
        db.commit()
        db.close()
    except Exception as e:
        print(f"Gemini processing error: {e}")

class APIKeys(BaseModel):
    gemini_key: str
    serper_key: str
    groq_key: str

@app.get("/api-keys")
def get_api_keys(current_user: User = Depends(get_current_user)):
    return {
        "gemini_key": current_user.gemini_key or "",
        "serper_key": current_user.serper_key or "",
        "groq_key": current_user.groq_key or "",
        "uploads_remaining": current_user.uploads_remaining
    }

@app.post("/api-keys")
def save_api_keys(keys: APIKeys, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    user.gemini_key = keys.gemini_key
    user.serper_key = keys.serper_key
    user.groq_key = keys.groq_key
    db.commit()
    db.close()
    return {"message": "API Keys saved successfully"}

@app.post("/upload-resume")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    x_current_ctc: Optional[str] = Header(None),
    x_expected_hike: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith((".pdf", ".txt")):
         raise HTTPException(status_code=400, detail="Invalid file type.")
    
    db = SessionLocal()
    user = db.query(User).filter(User.id == current_user.id).first()
    
    # Check if user has personal keys
    has_personal_keys = bool(user.gemini_key and user.serper_key)
    
    # Check upload limits
    if not has_personal_keys and user.uploads_remaining <= 0:
        db.close()
        raise HTTPException(status_code=400, detail="Free trial exhausted! 💎 Upgrade to Premium or add your own API Keys in Settings to continue.")
        
    gemini_key = user.gemini_key or os.environ.get("GEMINI_API_KEY")
    serper_key = user.serper_key or os.environ.get("SERPER_API_KEY")
    
    if not gemini_key or not serper_key:
        db.close()
        raise HTTPException(status_code=400, detail="Missing API Keys. Please save them in Settings.")
        
    # Decrement quota if using global keys
    if not has_personal_keys:
        user.uploads_remaining -= 1
        db.commit()
        
    db.close()
    
    file_location = f"{UPLOAD_DIR}/{current_user.id}_resume.pdf"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    resume_text = extract_text_from_pdf(file_location)
    background_tasks.add_task(process_resume_and_jobs, resume_text, current_user.id, gemini_key, serper_key, x_current_ctc, x_expected_hike)
    return {"info": f"Resume uploaded successfully."}

@app.get("/jobs", response_model=List[Job])
def get_jobs(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    jobs = db.query(JobModel).filter(JobModel.user_id == current_user.id).order_by(JobModel.match_score.desc()).all()
    db.close()
    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": "Remote", 
            "match_score": j.match_score,
            "url": j.url,
            "portal": j.portal,
            "status": j.status,
            "cover_letter": j.cover_letter,
            "application_answers": j.application_answers,
            "technical_questions": j.technical_questions
        } for j in jobs
    ]

@app.put("/jobs/{job_id}/status")
def update_job_status(job_id: int, status_update: StatusUpdate, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.user_id == current_user.id).first()
    if not job:
        db.close()
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = status_update.status
    db.commit()
    db.close()
    return {"message": "Status updated successfully"}

@app.post("/jobs/{job_id}/generate-assets")
def generate_assets(
    job_id: int, 
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.user_id == current_user.id).first()
    if not job:
        db.close()
        raise HTTPException(status_code=404, detail="Job not found")
        
    resume_path = f"{UPLOAD_DIR}/{current_user.id}_resume.pdf"
    if not os.path.exists(resume_path):
        db.close()
        raise HTTPException(status_code=400, detail="Please upload your resume first.")
        
    resume_text = extract_text_from_pdf(resume_path)
    
    prompt = f"""
    You are an expert career coach and technical interviewer. 
    Task 1. Write a highly tailored, professional cover letter for the specified job.
    Task 2. Answer the question "Why should we hire you?" (around 200-300 words) aligning the candidate's resume with the job description.
    Task 3. Provide 30-40 highly specific interview questions (technical, architectural, and behavioral) that this specific company ({job.company}) is likely to ask based strictly on the Job Description provided. Keep the answers concise and impactful.
    Task 4. Provide a 'DSA Preparation Plan' for this role containing at least 15-20 specific LeetCode problem recommendations relevant to the tech stack. Format the LeetCode problems as real, clickable Markdown links (e.g., [Two Sum](https://leetcode.com/problems/two-sum/)).
    
    CRITICAL FORMATTING INSTRUCTIONS:
    - Use Markdown formatting for all text.
    - Use headings (###), bold text (**), bullet points, and proper spacing so it looks beautiful on the frontend.
    - Ensure all LeetCode links use the standard Markdown format: [Link Text](URL).

    
    Job Title: {job.title}
    Company: {job.company}
    Job Description: {job.description}
    
    Resume: {resume_text[:2000]}
    
    Return a valid JSON object: {{"cover_letter": "...", "answers": "...", "technical_questions": "..."}}
    """
    
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        gemini_key = user.gemini_key or os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            db.close()
            raise HTTPException(status_code=400, detail="Missing Gemini API Key. Please add it in Settings.")
            
        raw_response = call_gemini(prompt, gemini_key)
        clean_text = raw_response.strip()
        if clean_text.startswith("```json"): clean_text = clean_text[7:-3]
        elif clean_text.startswith("```"): clean_text = clean_text[3:-3]
            
        data = json.loads(clean_text)
        job.cover_letter = data.get("cover_letter", "")
        job.application_answers = data.get("answers", "")
        job.technical_questions = data.get("technical_questions", "")
        db.commit()
        
        result = {"cover_letter": job.cover_letter, "answers": job.application_answers, "technical_questions": job.technical_questions}
        db.close()
        return result
    except Exception as e:
        db.close()
        print(f"Gen Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate assets")

class ChatMessage(BaseModel):
    message: str
    history: List[dict]

@app.post("/jobs/{job_id}/chat")
def chat_with_groq(job_id: int, chat_req: ChatMessage, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.id == current_user.id).first()
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.user_id == current_user.id).first()
    
    if not job or not user:
        db.close()
        raise HTTPException(status_code=404, detail="Job or User not found")
        
    groq_key = user.groq_key or os.environ.get("GROQ_API_KEY")
    if not groq_key:
        db.close()
        raise HTTPException(status_code=400, detail="Missing Groq API Key. Please add it in Settings.")
        
    db.close()
    
    client = Groq(api_key=groq_key)
    
    resume_path = f"{UPLOAD_DIR}/{current_user.id}_resume.pdf"
    resume_text = extract_text_from_pdf(resume_path) if os.path.exists(resume_path) else ""
    
    system_prompt = f"""You are an expert technical interviewer and career coach.
You are helping the user prepare for an interview for the role of '{job.title}' at '{job.company}'.
Job Description: {job.description}
Candidate's Resume: {resume_text[:2000]}

Keep your answers helpful, concise, and highly specific to the job description. Provide actionable advice."""

    messages = [{"role": "system", "content": system_prompt}]
    for h in chat_req.history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": chat_req.message})
    
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
        )
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        print(f"Groq API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class OrderRequest(BaseModel):
    plan_id: str

PLANS = {
    "starter": {"amount": 9900, "uploads": 3},
    "pro": {"amount": 19900, "uploads": 10},
    "elite": {"amount": 49900, "uploads": 50}
}

@app.post("/create-razorpay-order")
def create_order(req: OrderRequest, current_user: User = Depends(get_current_user)):
    plan = PLANS.get(req.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
        
    order_data = {
        "amount": plan["amount"],
        "currency": "INR",
        "receipt": f"receipt_{current_user.id}_{req.plan_id}"
    }
    try:
        order = razorpay_client.order.create(data=order_data)
        return {"id": order["id"], "amount": order["amount"], "currency": order["currency"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VerifyPayment(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str

@app.post("/verify-payment")
def verify_payment(req: VerifyPayment, current_user: User = Depends(get_current_user)):
    plan = PLANS.get(req.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
        
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")
        
    db = SessionLocal()
    user = db.query(User).filter(User.id == current_user.id).first()
    user.uploads_remaining += plan["uploads"]
    db.commit()
    uploads_left = user.uploads_remaining
    db.close()
    
    return {"message": "Payment verified", "uploads_remaining": uploads_left}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
