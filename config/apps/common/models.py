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
