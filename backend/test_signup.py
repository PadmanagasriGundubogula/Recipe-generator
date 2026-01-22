
import requests

url = "http://localhost:2000/signup"
data = {
    "name": "Test User",
    "email": "test_unique_123@example.com",
    "password": "password123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
