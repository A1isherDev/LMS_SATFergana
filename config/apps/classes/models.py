"""
Class models for the SAT LMS platform.
"""
from django.db import models
from apps.common.models import TimestampedModel, TenantModel


class Class(TenantModel):
    """
    Class model for managing teacher-student relationships.
    """
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='teaching_classes',
        db_index=True,
        limit_choices_to={'role__in': ['MAIN_TEACHER', 'SUPPORT_TEACHER']}
    )
    students = models.ManyToManyField(
        'users.User',
        related_name='enrolled_classes',
        blank=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    max_students = models.IntegerField(default=50, help_text="Maximum number of students")
    # Department field removed
    
    # New field for schedule configuration
    schedule_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Schedule configuration e.g. {'days': ['MON', 'WED'], 'time': '10:00'}"
    )
    
    class Meta(TenantModel.Meta):
        db_table = 'classes'
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=['teacher']),
            models.Index(fields=['is_active']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['teacher', 'is_active']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.teacher.email}"
    
    @property
    def current_student_count(self):
        """Get current number of enrolled students."""
        return self.students.count()
    
    @property
    def is_full(self):
        """Check if class is at maximum capacity."""
        return self.current_student_count >= self.max_students
    
    @property
    def has_ended(self):
        """Check if class has ended."""
        from django.utils import timezone
        return self.end_date < timezone.now().date()
    
    def clean(self):
        """Validate class dates."""
        from django.core.exceptions import ValidationError
        
        if self.start_date >= self.end_date:
            raise ValidationError({'end_date': 'End date must be after start date'})
        
        if self.max_students <= 0:
            raise ValidationError({'max_students': 'Maximum students must be greater than 0'})
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Announcement(TenantModel):
    """
    Model for class announcements posted by teachers.
    """
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='announcements',
        db_index=True
    )
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='posted_announcements',
        db_index=True
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta(TenantModel.Meta):
        db_table = 'class_announcements'
        ordering = ['-created_at']
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=['class_obj', 'is_active']),
        ]

    def __str__(self):
        return f"Announcement for {self.class_obj.name}: {self.title}"


class ClassResource(TenantModel):
    """
    Model for teacher resources (PDFs, links, etc.)
    """
    RESOURCE_TYPES = (
        ('PDF', 'PDF Document'),
        ('LINK', 'External Link'),
        ('VIDEO', 'Video'),
        ('OTHER', 'Other'),
    )

    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='resources',
        db_index=True
    )
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='uploaded_resources',
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=10, choices=RESOURCE_TYPES, default='OTHER')
    file = models.FileField(upload_to='class_resources/', blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    
    class Meta(TenantModel.Meta):
        db_table = 'class_resources'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_resource_type_display()})"
