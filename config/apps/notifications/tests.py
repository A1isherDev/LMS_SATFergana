from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from apps.notifications.models import Notification
from apps.classes.models import Class

User = get_user_model()

class NotificationTests(TestCase):
    def setUp(self):
        import uuid
        uid = str(uuid.uuid4())[:8]
        self.user = User.objects.create_user(
            email=f'student_{uid}@example.com',
            password='password123',
            role='STUDENT'
        )
        self.actor = User.objects.create_user(
            email=f'teacher_{uid}@example.com',
            password='password123',
            role='MAIN_TEACHER'
        )
        self.class_obj = Class.objects.create(
            name='Test Class',
            teacher=self.actor,
            start_date='2025-01-01',
            end_date='2025-12-31'
        )

    def test_notification_creation(self):
        """Test that a notification can be created manually."""
        content_type = ContentType.objects.get_for_model(Class)
        notification = Notification.objects.create(
            recipient=self.user,
            actor=self.actor,
            verb='posted an announcement',
            target_content_type=content_type,
            target_object_id=self.class_obj.id
        )
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 1)
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.verb, 'posted an announcement')
        self.assertFalse(notification.is_read)

    def test_unread_count(self):
        """Test the unread count calculation."""
        Notification.objects.create(recipient=self.user, actor=self.actor, verb='v1')
        Notification.objects.create(recipient=self.user, actor=self.actor, verb='v2')
        
        # Mark one as read
        n = Notification.objects.filter(recipient=self.user).first()
        n.is_read = True
        n.save()
        
        unread_count = Notification.objects.filter(recipient=self.user, is_read=False).count()
        self.assertEqual(unread_count, 1)
