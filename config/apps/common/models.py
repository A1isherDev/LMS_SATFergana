"""
Common base models and mixins for the SAT LMS platform.
"""
from django.db import models
from django.utils import timezone


class TimestampedModel(models.Model):
    """
    Abstract base model that provides created_at and updated_at timestamps.
    All models should inherit from this for consistent timestamp tracking.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class SoftDeleteManager(models.Manager):
    """
    Manager for soft-deleted models.
    Filters out soft-deleted objects by default.
    """
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class SoftDeleteModel(models.Model):
    """
    Abstract base model that provides soft delete functionality.
    Objects are not actually deleted, but marked with deleted_at timestamp.
    """
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Access all objects including deleted
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        """Soft delete by setting deleted_at timestamp."""
        self.deleted_at = timezone.now()
        self.save(using=using)
        # Return expected value for Django delete method
        return (1, {})
    
    def restore(self):
        """Restore a soft-deleted object."""
        self.deleted_at = None
        self.save()
    
    def hard_delete(self):
        """Actually delete from database."""
        super().delete()


# TenantManager removed


class TenantModel(TimestampedModel):
    """
    Abstract base model that includes timestamp fields.
    Previously handled multi-tenancy, now kept for compatibility.
    """
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    # start save method removed
    # end save method removed


class AuditLog(TenantModel):
    """
    Model for tracking sensitive administrative actions.
    Scoped by organization using TenantModel.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Export'),
        ('ACCESS_SENSITIVE', 'Access Sensitive Data'),
    ]

    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who performed the action"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    resource_type = models.CharField(max_length=100, db_index=True, help_text="Type of resource (e.g., 'User', 'Class')")
    resource_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    changes = models.JSONField(default=dict, blank=True, help_text="Details of what was changed")
    
    # Request info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)

    class Meta(TenantModel.Meta):
        db_table = 'audit_logs'
        ordering = ['-created_at']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        user_email = self.user.email if self.user else "System"
        return f"{self.action} on {self.resource_type} by {user_email} at {self.created_at}"
