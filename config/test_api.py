#!/usr/bin/env python
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import User

print("=== TESTING RANKINGS API DIRECTLY ===")

# Get a student user
student = User.objects.filter(role='STUDENT').first()
if not student:
    print("No student found!")
    exit()

# Generate tokens
refresh = RefreshToken.for_user(student)
access_token = str(refresh.access_token)

print(f"Testing with student: {student.email}")
print(f"Access token: {access_token[:50]}...")

# Test the API endpoint
try:
    url = "http://localhost:8000/api/rankings/leaderboard/?period_type=WEEKLY"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"\nTesting URL: {url}")
    response = requests.get(url, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Data keys: {list(data.keys())}")
        if 'leaderboard_entries' in data:
            entries = data['leaderboard_entries']
            print(f"Number of entries: {len(entries)}")
            if entries:
                print(f"First entry: {entries[0]}")
    else:
        print(f"Error response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("Connection error - is the server running?")
except Exception as e:
    print(f"Error: {e}")
