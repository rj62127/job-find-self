import requests
import json

API_KEY = "AQ.Ab8RN6IbcVYSHU3Apolc3_b7GVSXFNFFcLX22bv9dfFhFjD2kA"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
response = requests.get(url)
print(json.dumps(response.json(), indent=2))
