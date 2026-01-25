"""
Homework models for the SAT LMS platform.
"""
from django.db import models
from django.utils import timezone
from apps.common.models import TimestampedModel


class Homework(TimestampedModel):
    """
    Homework assignment model.
    """
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    class_obj = models.ForeignKey(
        'classes.Class',
        on_delete=models.CASCADE,
        related_name='homework_assignments',
        db_index=True
    )
    assigned_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='assigned_homework',
        db_index=True,
        limit_choices_to={'role': 'TEACHER'}
    )
    due_date = models.DateTimeField(db_index=True)
    questions = models.ManyToManyField(
        'questionbank.Question',
        related_name='homework_assignments',
        blank=True
    )
    max_score = models.IntegerField(
        default=100,
        help_text="Maximum possible score for this homework"
    )
    is_published = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this homework is visible to students"
    )
    
    class Meta:
        db_table = 'homework'
        indexes = [
            models.Index(fields=['class_obj']),
            models.Index(fields=['assigned_by']),
            models.Index(fields=['due_date']),
            models.Index(fields=['is_published']),
            models.Index(fields=['class_obj', 'due_date']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.class_obj.name}"
    
    @property
    def total_questions(self):
        """Get total number of questions in this homework."""
        return self.questions.count()
    
    @property
    def is_overdue(self):
        """Check if homework is past due date."""
        return timezone.now() > self.due_date
    
    @property
    def days_until_due(self):
        """Get days until due date."""
        if self.is_overdue:
            return 0
        delta = self.due_date - timezone.now()
        return max(0, delta.days)
    
    def calculate_max_score(self):
        """Calculate max score based on number of questions."""
        question_count = self.total_questions
        if question_count > 0:
            # Each question is worth equal points
            self.max_score = question_count * 10  # 10 points per question
            self.save()
        return self.max_score
    
    def clean(self):
        """Validate homework data."""
        from django.core.exceptions import ValidationError
        
        if self.due_date <= timezone.now():
            raise ValidationError("Due date must be in the future")
        
        if self.max_score <= 0:
            raise ValidationError("Max score must be greater than 0")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class HomeworkSubmission(TimestampedModel):
    """
    Homework submission model.
    """
    homework = models.ForeignKey(
        Homework,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='homework_submissions',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When the student submitted the homework"
    )
    is_late = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether the submission was late"
    )
    score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Score achieved (auto-calculated)"
    )
    answers = models.JSONField(
        default=dict,
        help_text="Student answers: {question_id: selected_answer}"
    )
    time_spent_seconds = models.IntegerField(
        default=0,
        help_text="Total time spent on homework in seconds"
    )
    feedback = models.TextField(
        blank=True,
        help_text="Teacher feedback on the submission"
    )
    
    class Meta:
        db_table = 'homework_submissions'
        indexes = [
            models.Index(fields=['homework', 'student']),
            models.Index(fields=['student', 'submitted_at']),
            models.Index(fields=['homework', 'submitted_at']),
            models.Index(fields=['is_late']),
        ]
        ordering = ['-created_at']
        unique_together = ['homework', 'student']
    
    def __str__(self):
        return f"{self.student.email} - {self.homework.title}"
    
    @property
    def is_submitted(self):
        """Check if homework has been submitted."""
        return self.submitted_at is not None
    
    @property
    def accuracy_percentage(self):
        """Get accuracy as percentage."""
        if self.score is None or self.homework.max_score == 0:
            return 0.0
        return (self.score / self.homework.max_score) * 100
    
    def calculate_score(self):
        """Auto-grade the homework based on answers."""
        if not self.answers:
            self.score = 0
            return self.score
        
        total_questions = 0
        correct_answers = 0
        
        for question_id, selected_answer in self.answers.items():
            try:
                question = self.homework.questions.get(id=question_id)
                total_questions += 1
                
                if selected_answer == question.correct_answer:
                    correct_answers += 1
                    
            except self.homework.questions.model.DoesNotExist:
                continue
        
        # Calculate score (10 points per correct answer)
        self.score = correct_answers * 10
        
        # Ensure score doesn't exceed max_score
        self.score = min(self.score, self.homework.max_score)
        
        return self.score
    
    def check_late_submission(self):
        """Check if submission is late and update accordingly."""
        if self.submitted_at and self.submitted_at > self.homework.due_date:
            self.is_late = True
        else:
            self.is_late = False
    
    def submit(self):
        """Submit the homework."""
        if not self.is_submitted:
            self.submitted_at = timezone.now()
            self.check_late_submission()
            self.calculate_score()
            self.save()
    
    def get_answer_summary(self):
        """Get summary of answers with correctness."""
        if not self.answers:
            return {}
        
        summary = {}
        for question_id, selected_answer in self.answers.items():
            try:
                question = self.homework.questions.get(id=question_id)
                is_correct = selected_answer == question.correct_answer
                
                summary[question_id] = {
                    'question_text': question.question_text[:100] + '...' if len(question.question_text) > 100 else question.question_text,
                    'selected_answer': selected_answer,
                    'correct_answer': question.correct_answer,
                    'is_correct': is_correct,
                    'explanation': question.explanation if not is_correct else None
                }
            except self.homework.questions.model.DoesNotExist:
                continue
        
        return summary
    
    def clean(self):
        """Validate submission data."""
        from django.core.exceptions import ValidationError
        
        if self.time_spent_seconds < 0:
            raise ValidationError("Time spent cannot be negative")
        
        # Validate answers format
        if self.answers and not isinstance(self.answers, dict):
            raise ValidationError("Answers must be a dictionary")
    
    def save(self, *args, **kwargs):
        self.clean()
        
        # Auto-calculate score if answers are provided
        if self.answers and not self.pk:  # New submission
            self.calculate_score()
        
        # Check late submission if submitted_at is set
        if self.submitted_at:
            self.check_late_submission()
        
        super().save(*args, **kwargs)
