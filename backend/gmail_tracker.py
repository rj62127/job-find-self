import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import google.generativeai as genai
import json

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_gmail_service(token_path="token.json", credentials_path="client_secret.json"):
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                print(f"ERROR: {credentials_path} not found.")
                return None
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            # In a real SaaS this would be web flow, but for local testing InstalledAppFlow is easier.
            # Assuming web flow is handled by main.py, this script is just a background task helper.
            creds = flow.run_local_server(port=0)
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    return service

def fetch_recent_emails(service, max_results=10):
    if not service: return []
    try:
        results = service.users().messages().list(userId='me', maxResults=max_results, q="is:inbox").execute()
        messages = results.get('messages', [])
        
        email_data = []
        for msg in messages:
            msg_details = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
            headers = msg_details['payload']['headers']
            
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
            sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown Sender")
            
            # Simple snippet extraction
            snippet = msg_details.get('snippet', '')
            email_data.append({"id": msg['id'], "subject": subject, "sender": sender, "snippet": snippet})
            
        return email_data
    except Exception as e:
        print(f"Error fetching emails: {e}")
        return []

def analyze_emails_with_ai(emails, gemini_key):
    if not emails: return []
    
    genai.configure(api_key=gemini_key)
    model = genai.GenerativeModel('gemini-flash-latest')
    
    prompt = f"""
    You are an AI assistant tracking job applications. 
    Analyze the following recent emails and identify any that are related to job applications (Interviews, Rejections, Offers).
    
    Emails:
    {json.dumps(emails, indent=2)}
    
    Return a JSON array ONLY containing objects for emails that are job updates.
    Keys: "email_id", "company_name" (guess from sender/subject), "new_status" (Interview, Rejected, Offer).
    """
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.strip()
        if clean_text.startswith("```json"): clean_text = clean_text[7:-3]
        elif clean_text.startswith("```"): clean_text = clean_text[3:-3]
        
        return json.loads(clean_text)
    except Exception as e:
        print(f"Error analyzing emails: {e}")
        return []
