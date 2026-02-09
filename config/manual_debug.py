import os
import sys
import django
from django.conf import settings

# Add config directory to path
sys.path.append(r'd:\SAT_Fergana\LMS_SATFergana\config')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from apps.users.models import User
from apps.classes.models import Class

client = APIClient()
# Take an existing teacher and class
teacher = User.objects.filter(role='TEACHER').first()
if not teacher:
    # Create one if not exists
    teacher = User.objects.create_user(email='debug_teacher@example.com', password='password123', role='TEACHER')

class_obj = Class.objects.filter(teacher=teacher).first()
if not class_obj:
    class_obj = Class.objects.create(
        name='Debug Class', 
        teacher=teacher, 
        start_date='2025-01-01', 
        end_date='2025-12-31'
    )

from django.urls import reverse
client.force_authenticate(user=teacher)
try:
    url = reverse('class-post-announcement', kwargs={'pk': class_obj.id})
except Exception as e:
    print(f"Reverse failed: {e}")
    url = f'/api/classes/{class_obj.id}/post_announcement/'

print(f"Resolved URL: {url}")
data = {
    'title': 'Manual Debug Announcement',
    'content': 'This is a manual debug announcement'
}
response = client.post(url, data, format='json')
print(f"Status: {response.status_code}")
if hasattr(response, 'data'):
    print(f"Data: {response.data}")
else:
    print(f"Content: {response.content}")
