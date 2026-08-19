import requests
import json
import time

def run_apify_scraper(target_role, apify_key):
    """
    Runs an Apify Actor in the background. 
    Here we use a generic LinkedIn Job Scraper as an example.
    Note: Apify tasks can take a few minutes to run.
    """
    if not apify_key:
        return []
        
    actor_id = "bebity/linkedin-jobs-scraper" # Reliable Apify LinkedIn scraper
    run_url = f"https://api.apify.com/v2/acts/{actor_id}/runs?token={apify_key}"
    
    # Payload for the specific actor
    payload = {
        "searchQuery": target_role,
        "location": "India", # Defaulting to India for this specific project context
        "limit": 10,
        "datePosted": "past-week"
    }
    
    print(f"Triggering Apify Scraper for {target_role}...")
    try:
        # 1. Start the Actor Run
        start_res = requests.post(run_url, json=payload, headers={"Content-Type": "application/json"})
        start_res.raise_for_status()
        run_info = start_res.json().get("data", {})
        run_id = run_info.get("id")
        
        if not run_id:
            print("Failed to get Apify run ID")
            return []
            
        print(f"Apify Scraper Started. Run ID: {run_id}")
        
        # 2. Poll for completion
        # For a background task, we'll poll synchronously since this is run in a BackgroundTask thread in FastAPI.
        max_retries = 30 # 15 minutes max
        for _ in range(max_retries):
            time.sleep(30)
            status_url = f"https://api.apify.com/v2/acts/{actor_id}/runs/{run_id}?token={apify_key}"
            status_res = requests.get(status_url)
            status_data = status_res.json().get("data", {})
            status = status_data.get("status")
            
            print(f"Apify Status: {status}")
            if status == "SUCCEEDED":
                dataset_id = status_data.get("defaultDatasetId")
                dataset_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={apify_key}"
                items_res = requests.get(dataset_url)
                return items_res.json()
            elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                print(f"Apify run failed with status {status}")
                return []
                
    except Exception as e:
        print(f"Apify API Error: {e}")
        return []

    return []
