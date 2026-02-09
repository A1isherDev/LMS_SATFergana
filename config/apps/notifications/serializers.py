"""
Serializers for the notifications app.
"""
from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    """
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    target_type = serializers.CharField(source='target_content_type.model', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'actor', 'actor_name', 'verb',
            'target_type', 'target_object_id', 'is_read', 'created_at'
        ]
        read_only_fields = ['recipient', 'actor', 'verb', 'target_type', 'target_object_id', 'created_at']
