import requests
from urllib.parse import urlparse

SEARCH_URL = "https://google.serper.dev/search"

JOB_PORTALS = {
    "Naukri": "naukri.com",
    "LinkedIn": "linkedin.com/jobs",
    "Indeed": "indeed.com",
    "Foundit": "foundit.in",
    "Hirist": "hirist.tech",
    "Cutshort": "cutshort.io",
    "Wellfound": "wellfound.com",
    "Instahyre": "instahyre.com",
    "Glassdoor": "glassdoor.co.in",
}

def clean_text(text):
    if not text:
        return ""
    return " ".join(text.split())

def detect_portal(url):
    hostname = urlparse(url).netloc.lower()
    for portal, domain in JOB_PORTALS.items():
        if domain in hostname:
            return portal
    return "Other"

def extract_jobs(data):
    jobs = []
    for item in data.get("organic", []):
        url = item.get("link", "")
        title = clean_text(item.get("title", ""))
        snippet = clean_text(item.get("snippet", ""))

        if not url or not title:
            continue

        portal = detect_portal(url)
        if portal == "Other":
            continue

        jobs.append({
            "portal": portal,
            "title": title,
            "url": url,
            "description": snippet,
        })
    return jobs

def search_jobs(query, api_key, num_results=20):
    if not api_key:
        raise ValueError("Serper API key is required")

    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "q": query,
        "num": num_results,
        "gl": "in",
        "hl": "en",
    }
    
    response = requests.post(SEARCH_URL, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        print(f"Serper API Error Details: {response.text}")
    response.raise_for_status()
    
    data = response.json()
    return extract_jobs(data)
