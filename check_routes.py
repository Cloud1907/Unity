import requests
import json

try:
    response = requests.get("http://localhost:8000/openapi.json")
    if response.status_code == 200:
        schema = response.json()
        paths = schema.get("paths", {})
        print("Registered paths:")
        for path, methods in paths.items():
            print(f"  {path}: {list(methods.keys())}")
    else:
        print(f"Failed to get openapi.json: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
