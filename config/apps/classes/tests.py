from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.classes.models import Class, Announcement
from apps.notifications.models import Notification

User = get_user_model()

class AnnouncementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        import uuid
        uid = str(uuid.uuid4())[:8]
        self.teacher = User.objects.create_user(
            email=f'teacher_{uid}@example.com',
            password='password123',
            role='MAIN_TEACHER'
        )
        self.student = User.objects.create_user(
            email=f'student_{uid}@example.com',
            password='password123',
            role='STUDENT'
        )
        self.class_obj = Class.objects.create(
            name='Test Class',
            teacher=self.teacher,
            start_date='2025-01-01',
            end_date='2025-12-31'
        )
        self.class_obj.students.add(self.student)
        self.client.force_authenticate(user=self.teacher)

    def test_post_announcement_triggers_notification(self):
        """Test that posting an announcement notifies students."""
        url = reverse('class-post-announcement', kwargs={'pk': self.class_obj.id})
        data = {
            'title': 'Test Announcement',
            'content': 'This is a test announcement'
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            data = getattr(response, 'data', None)
            if data:
                print(f"Error Response Data: {data}")
            else:
                print(f"Error Response Content: {response.content.decode()[:500]}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check if announcement was created
        self.assertEqual(Announcement.objects.count(), 1)
        
        # Check if notification was created for the student
        self.assertEqual(Notification.objects.filter(recipient=self.student).count(), 1)
        notification = Notification.objects.filter(recipient=self.student).first()
        self.assertEqual(notification.recipient, self.student)
        self.assertEqual(notification.actor, self.teacher)
        self.assertIn('posted a new announcement', notification.verb)
