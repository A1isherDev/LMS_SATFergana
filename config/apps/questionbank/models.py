"""
Question bank models for the SAT LMS platform.
"""
from django.db import models
from apps.common.models import TimestampedModel


class Question(TimestampedModel):
    """
    Question model for SAT practice questions.
    """
    QUESTION_TYPES = [
        ('MATH', 'Math'),
        ('READING', 'Reading'),
        ('WRITING', 'Writing'),
    ]
    
    question_type = models.CharField(
        max_length=10,
        choices=QUESTION_TYPES,
        db_index=True,
        help_text="SAT section: Math, Reading, or Writing"
    )
    skill_tag = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Specific skill area (e.g., 'Algebra', 'Grammar', 'Main Idea')"
    )
    difficulty = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        db_index=True,
        help_text="Difficulty level from 1 (easiest) to 5 (hardest)"
    )
    question_text = models.TextField(
        help_text="The full question text"
    )
    question_image = models.ImageField(
        upload_to='question_images/',
        null=True,
        blank=True,
        help_text="Optional image for the question"
    )
    options = models.JSONField(
        help_text="Multiple choice options: {A: '...', B: '...', C: '...', D: '...'}"
    )
    correct_answer = models.CharField(
        max_length=1,
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')],
        help_text="Correct answer choice"
    )
    explanation = models.TextField(
        help_text="Explanation of the correct answer"
    )
    estimated_time_seconds = models.IntegerField(
        default=60,
        help_text="Estimated time to solve in seconds"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this question is available for use"
    )
    
    class Meta:
        db_table = 'questions'
        indexes = [
            models.Index(fields=['question_type']),
            models.Index(fields=['skill_tag']),
            models.Index(fields=['difficulty']),
            models.Index(fields=['is_active']),
            models.Index(fields=['question_type', 'difficulty']),
            models.Index(fields=['question_type', 'skill_tag']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.question_type} - {self.skill_tag} (Difficulty {self.difficulty})"
    
    def clean(self):
        """Validate question data."""
        from django.core.exceptions import ValidationError
        import json
        
        # Validate options JSON structure
        try:
            if isinstance(self.options, str):
                options_dict = json.loads(self.options)
            else:
                options_dict = self.options
            
            required_keys = ['A', 'B', 'C', 'D']
            if not all(key in options_dict for key in required_keys):
                raise ValidationError("Options must contain A, B, C, and D keys")
            
            if self.correct_answer not in required_keys:
                raise ValidationError("Correct answer must be one of: A, B, C, D")
                
        except (json.JSONDecodeError, TypeError):
            raise ValidationError("Options must be valid JSON with A, B, C, D keys")
        
        if self.estimated_time_seconds <= 0:
            raise ValidationError("Estimated time must be greater than 0")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class QuestionAttempt(TimestampedModel):
    """
    Model to track student attempts at questions.
    """
    CONTEXT_CHOICES = [
        ('HOMEWORK', 'Homework'),
        ('MOCK_EXAM', 'Mock Exam'),
        ('PRACTICE', 'Independent Practice'),
    ]
    
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='attempts',
        db_index=True
    )
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='question_attempts',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    selected_answer = models.CharField(
        max_length=1,
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')],
        help_text="Answer selected by the student"
    )
    is_correct = models.BooleanField(
        db_index=True,
        help_text="Whether the answer was correct"
    )
    time_spent_seconds = models.IntegerField(
        help_text="Time spent on this question in seconds"
    )
    attempted_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the question was attempted"
    )
    context = models.CharField(
        max_length=20,
        choices=CONTEXT_CHOICES,
        default='PRACTICE',
        db_index=True,
        help_text="Context in which the question was attempted"
    )
    
    class Meta:
        db_table = 'question_attempts'
        indexes = [
            models.Index(fields=['student', 'question', 'attempted_at']),
            models.Index(fields=['student', 'attempted_at']),
            models.Index(fields=['question', 'is_correct']),
            models.Index(fields=['student', 'is_correct']),
            models.Index(fields=['context']),
        ]
        ordering = ['-attempted_at']
        unique_together = ['question', 'student', 'attempted_at']
    
    def __str__(self):
        return f"{self.student.email} - {self.question.question_type} - {'Correct' if self.is_correct else 'Incorrect'}"
    
    def clean(self):
        """Validate attempt data."""
        from django.core.exceptions import ValidationError
        
        if self.time_spent_seconds < 0:
            raise ValidationError("Time spent cannot be negative")
        
        # Check if selected answer is valid for this question
        if self.question:
            valid_answers = ['A', 'B', 'C', 'D']
            if self.selected_answer not in valid_answers:
                raise ValidationError("Selected answer must be A, B, C, or D")
    
    def save(self, *args, **kwargs):
        # Auto-calculate is_correct based on selected answer
        if self.question:
            self.is_correct = (self.selected_answer == self.question.correct_answer)
        
        self.clean()
        super().save(*args, **kwargs)
    
    @classmethod
    def get_student_accuracy(cls, student, question_type=None, skill_tag=None, context=None):
        """Get accuracy statistics for a student."""
        queryset = cls.objects.filter(student=student)
        
        if question_type:
            queryset = queryset.filter(question__question_type=question_type)
        if skill_tag:
            queryset = queryset.filter(question__skill_tag=skill_tag)
        if context:
            queryset = queryset.filter(context=context)
        
        total_attempts = queryset.count()
        correct_attempts = queryset.filter(is_correct=True).count()
        
        if total_attempts == 0:
            return 0.0
        
        return (correct_attempts / total_attempts) * 100
