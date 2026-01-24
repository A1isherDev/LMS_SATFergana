"""
User models for the SAT LMS platform.
Custom User model with role-based access and invitation system.
"""
import secrets
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from apps.common.models import TimestampedModel


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, TimestampedModel):
    """
    Custom User model with email as username and role-based access.
    """
    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('TEACHER', 'Teacher'),
        ('ADMIN', 'Admin'),
    ]
    
    username = None  # Remove username field
    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT', db_index=True)
    invitation_code = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    invited_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invited_users'
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['invitation_code']),
        ]
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    @property
    def is_student(self):
        return self.role == 'STUDENT'
    
    @property
    def is_teacher(self):
        return self.role == 'TEACHER'
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN' or self.is_staff


class StudentProfile(TimestampedModel):
    """
    Extended profile for students with SAT-specific information.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_profile',
        db_index=True
    )
    target_sat_score = models.IntegerField(
        default=1200,
        help_text="Target SAT score (400-1600)"
    )
    estimated_current_score = models.IntegerField(
        default=1000,
        help_text="Estimated current SAT score (400-1600)"
    )
    sat_exam_date = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Date of the SAT exam (for countdown timer)"
    )
    weak_areas = models.JSONField(
        default=dict,
        help_text="Weak areas breakdown: {math: float, reading: float, writing: float}"
    )
    
    class Meta:
        db_table = 'student_profiles'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['sat_exam_date']),
        ]
    
    def __str__(self):
        return f"Profile for {self.user.email}"
    
    def clean(self):
        """Validate SAT scores are in valid range."""
        from django.core.exceptions import ValidationError
        
        if not (400 <= self.target_sat_score <= 1600):
            raise ValidationError({'target_sat_score': 'Target SAT score must be between 400 and 1600'})
        
        if not (400 <= self.estimated_current_score <= 1600):
            raise ValidationError({'estimated_current_score': 'Estimated current score must be between 400 and 1600'})
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Invitation(TimestampedModel):
    """
    Invitation system for invitation-only registration.
    """
    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('TEACHER', 'Teacher'),
    ]
    
    code = models.CharField(max_length=50, unique=True, db_index=True)
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_invitations',
        db_index=True
    )
    email = models.EmailField(db_index=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    is_used = models.BooleanField(default=False, db_index=True)
    used_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_invitations'
    )
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(db_index=True)
    
    class Meta:
        db_table = 'invitations'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['email']),
            models.Index(fields=['is_used']),
            models.Index(fields=['expires_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation {self.code} for {self.email}"
    
    @classmethod
    def generate_code(cls):
        """Generate a unique invitation code."""
        while True:
            code = secrets.token_urlsafe(32)
            if not cls.objects.filter(code=code).exists():
                return code
    
    def is_valid(self):
        """Check if invitation is valid (not used and not expired)."""
        if self.is_used:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True
    
    def mark_as_used(self, user):
        """Mark invitation as used by a user."""
        self.is_used = True
        self.used_by = user
        self.used_at = timezone.now()
        self.save()
    
    def save(self, *args, **kwargs):
        """Auto-generate code if not provided."""
        if not self.code:
            self.code = self.generate_code()
        super().save(*args, **kwargs)
