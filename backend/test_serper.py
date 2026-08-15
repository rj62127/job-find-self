import requests

api_key = "211433d26b621b683104ea3d6ebeaf63bd1f4f03"
query = '"Software Engineer" (site:naukri.com OR site:linkedin.com/jobs OR site:indeed.com OR site:foundit.in OR site:hirist.tech OR site:cutshort.io OR site:wellfound.com OR site:instahyre.com OR site:glassdoor.co.in)'

headers = {
    "X-API-KEY": api_key,
    "Content-Type": "application/json",
}
payload = {
    "q": query,
    "num": 15,
    "gl": "in",
    "hl": "en",
}

response = requests.post("https://google.serper.dev/search", headers=headers, json=payload)
print("Status Code:", response.status_code)
print("Response:", response.text)
