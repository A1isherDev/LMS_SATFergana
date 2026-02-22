# Common views and utilities
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint for monitoring"""
    return JsonResponse({
        "status": "healthy",
        "message": "SAT Fergana API is running",
        "version": "1.0.0"
    })


class AuditLogMixin:
    """
    Mixin to automatically log CREATE, UPDATE, and DELETE actions in ViewSets.
    """
    def log_audit(self, instance, action, description=None, changes=None):
        """Helper to log an action with request context."""
        from apps.common.utils import log_action
        return log_action(
            user=self.request.user,
            action=action,
            resource_type=instance.__class__.__name__,
            resource_id=instance.id,
            description=description,
            changes=changes,
            request=self.request
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self.log_audit(instance, 'CREATE')

    def perform_update(self, serializer):
        instance = serializer.save()
        self.log_audit(instance, 'UPDATE')

    def perform_destroy(self, instance):
        instance_id = instance.id
        instance_name = instance.__class__.__name__
        instance.delete()
        # Create a dummy object or just log manually if instance is gone
        from apps.common.utils import log_action
        log_action(
            user=self.request.user,
            action='DELETE',
            resource_type=instance_name,
            resource_id=instance_id,
            request=self.request
        )
