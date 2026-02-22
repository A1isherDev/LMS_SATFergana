"""
Mock exam models for the SAT LMS platform.
"""
from django.db import models
from django.utils import timezone
from apps.common.models import TimestampedModel, TenantModel


class MockExam(TenantModel):
    """
    Mock exam model with section-based timing.
    """
    EXAM_TYPES = [
        ('FULL', 'Full SAT'),
        ('MATH_ONLY', 'Math Only'),
        ('READING_WRITING_ONLY', 'Reading & Writing Only'),
    ]
    
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    exam_type = models.CharField(
        max_length=20,
        choices=EXAM_TYPES,
        default='FULL',
        db_index=True
    )
    math_questions = models.ManyToManyField(
        'questionbank.Question',
        related_name='math_exams',
        blank=True,
        limit_choices_to={'question_type': 'MATH'}
    )
    reading_questions = models.ManyToManyField(
        'questionbank.Question',
        related_name='reading_exams',
        blank=True,
        limit_choices_to={'question_type': 'READING'}
    )
    writing_questions = models.ManyToManyField(
        'questionbank.Question',
        related_name='writing_exams',
        blank=True,
        limit_choices_to={'question_type': 'WRITING'}
    )
    
    # Time limits in seconds
    math_time_limit = models.IntegerField(
        default=2700,  # 45 minutes
        help_text="Math section time limit in seconds"
    )
    reading_time_limit = models.IntegerField(
        default=2400,  # 40 minutes
        help_text="Reading section time limit in seconds"
    )
    writing_time_limit = models.IntegerField(
        default=2400,  # 40 minutes
        help_text="Writing section time limit in seconds"
    )
    
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this exam is available for students"
    )
    # Department field removed
    
    class Meta(TenantModel.Meta):
        db_table = 'mock_exams'
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=['exam_type']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_exam_type_display()})"
    
    @property
    def total_questions(self):
        """Get total number of questions in this exam."""
        count = 0
        if self.exam_type in ['FULL', 'MATH_ONLY']:
            count += self.math_questions.count()
        if self.exam_type in ['FULL', 'READING_WRITING_ONLY']:
            count += self.reading_questions.count()
            count += self.writing_questions.count()
        return count
    
    @property
    def total_time_seconds(self):
        """Get total time limit in seconds."""
        total = 0
        if self.exam_type in ['FULL', 'MATH_ONLY']:
            total += self.math_time_limit
        if self.exam_type in ['FULL', 'READING_WRITING_ONLY']:
            total += self.reading_time_limit
            total += self.writing_time_limit
        return total
    
    def get_section_questions(self, section):
        """Get questions for a specific section."""
        if section == 'math':
            return self.math_questions.all()
        elif section == 'reading':
            return self.reading_questions.all()
        elif section == 'writing':
            return self.writing_questions.all()
        return []
    
    def get_section_time_limit(self, section):
        """Get time limit for a specific section in seconds."""
        if section == 'math':
            return self.math_time_limit
        elif section == 'reading':
            return self.reading_time_limit
        elif section == 'writing':
            return self.writing_time_limit
        return 0
    
    def clean(self):
        """Validate exam data."""
        # Skip M2M validation if instance is not saved yet (creates circular dependency)
        if not self.pk:
            return
    
        from django.core.exceptions import ValidationError
        
        if self.exam_type == 'FULL':
            if not self.math_questions.exists():
                raise ValidationError("Full exam must have math questions")
            if not self.reading_questions.exists():
                raise ValidationError("Full exam must have reading questions")
            if not self.writing_questions.exists():
                raise ValidationError("Full exam must have writing questions")
        elif self.exam_type == 'MATH_ONLY':
            if not self.math_questions.exists():
                raise ValidationError("Math-only exam must have math questions")
        elif self.exam_type == 'READING_WRITING_ONLY':
            if not self.reading_questions.exists():
                raise ValidationError("Reading & Writing exam must have reading questions")
            if not self.writing_questions.exists():
                raise ValidationError("Reading & Writing exam must have writing questions")
        
        # Validate time limits
        if self.math_time_limit <= 0:
            raise ValidationError("Math time limit must be greater than 0")
        if self.reading_time_limit <= 0:
            raise ValidationError("Reading time limit must be greater than 0")
        if self.writing_time_limit <= 0:
            raise ValidationError("Writing time limit must be greater than 0")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class MockExamAttempt(TenantModel):
    """
    Student attempt at a mock exam.
    """
    mock_exam = models.ForeignKey(
        MockExam,
        on_delete=models.CASCADE,
        related_name='attempts',
        db_index=True
    )
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='mock_exam_attempts',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    started_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the student started the exam"
    )
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When the student submitted the exam"
    )
    
    # Raw scores (0-based)
    math_raw_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Raw score for math section (0-58)"
    )
    reading_raw_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Raw score for reading section (0-52)"
    )
    writing_raw_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Raw score for writing section (0-44)"
    )
    total_raw_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total raw score"
    )
    
    # Scaled scores (200-800)
    math_scaled_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Scaled score for math section (200-800)"
    )
    reading_scaled_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Scaled score for reading section (200-800)"
    )
    writing_scaled_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Scaled score for writing section (200-800)"
    )
    sat_score = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Final SAT score (400-1600)"
    )
    
    # Student answers and timing
    answers = models.JSONField(
        default=dict,
        help_text="Student answers: {section: {question_id: answer}}"
    )
    time_spent_by_section = models.JSONField(
        default=dict,
        help_text="Time spent by section: {math: int, reading: int, writing: int}"
    )
    
    is_completed = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether the exam attempt is completed"
    )
    
    class Meta(TenantModel.Meta):
        db_table = 'mock_exam_attempts'
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=['student', 'submitted_at']),
            models.Index(fields=['mock_exam', 'submitted_at']),
            models.Index(fields=['sat_score']),
            models.Index(fields=['is_completed']),
        ]
        ordering = ['-started_at']
        unique_together = ['mock_exam', 'student']
    
    def __str__(self):
        return f"{self.student.email} - {self.mock_exam.title}"
    
    @property
    def duration_seconds(self):
        """Get total duration of the attempt in seconds."""
        if self.submitted_at:
            return (self.submitted_at - self.started_at).total_seconds()
        return (timezone.now() - self.started_at).total_seconds()
    
    @property
    def is_over_time(self):
        """Check if the attempt exceeded the time limit."""
        return self.duration_seconds > self.mock_exam.total_time_seconds
    
    def calculate_raw_scores(self):
        """Calculate raw scores from answers."""
        from apps.questionbank.models import Question
        
        math_correct = 0
        reading_correct = 0
        writing_correct = 0
        
        answers = self.answers or {}
        
        # Calculate math score
        if 'math' in answers:
            math_questions = self.mock_exam.math_questions.all()
            for question in math_questions:
                q_id = str(question.id)
                if q_id in answers['math'] and answers['math'][q_id] == question.correct_answer:
                    math_correct += 1
            self.math_raw_score = math_correct
        
        # Calculate reading score
        if 'reading' in answers:
            reading_questions = self.mock_exam.reading_questions.all()
            for question in reading_questions:
                q_id = str(question.id)
                if q_id in answers['reading'] and answers['reading'][q_id] == question.correct_answer:
                    reading_correct += 1
            self.reading_raw_score = reading_correct
        
        # Calculate writing score
        if 'writing' in answers:
            writing_questions = self.mock_exam.writing_questions.all()
            for question in writing_questions:
                q_id = str(question.id)
                if q_id in answers['writing'] and answers['writing'][q_id] == question.correct_answer:
                    writing_correct += 1
            self.writing_raw_score = writing_correct
        
        # Calculate total raw score
        self.total_raw_score = math_correct + reading_correct + writing_correct
        
        return self.total_raw_score
    
    def convert_to_sat_score(self):
        """Convert raw scores to SAT scaled scores."""
        from apps.common.utils import convert_raw_to_scaled_sat
        
        if self.math_raw_score is not None:
            self.math_scaled_score = convert_raw_to_scaled_sat(self.math_raw_score, 'math')
        
        if self.reading_raw_score is not None and self.writing_raw_score is not None:
            # Reading and Writing are combined for SAT scoring
            combined_raw = self.reading_raw_score + self.writing_raw_score
            combined_scaled = convert_raw_to_scaled_sat(combined_raw, 'reading_writing')
            # Split the combined score (roughly evenly)
            self.reading_scaled_score = combined_scaled // 2
            self.writing_scaled_score = combined_scaled - self.reading_scaled_score
        
        # Calculate total SAT score
        if self.math_scaled_score and self.reading_scaled_score and self.writing_scaled_score:
            self.sat_score = self.math_scaled_score + self.reading_scaled_score + self.writing_scaled_score
        
        return self.sat_score
    
    def submit_exam(self):
        """Submit the exam and calculate scores."""
        if not self.is_completed:
            self.submitted_at = timezone.now()
            self.calculate_raw_scores()
            self.convert_to_sat_score()
            self.is_completed = True
            self.save()
    
    def get_section_progress(self, section):
        """Get progress for a specific section."""
        questions = self.mock_exam.get_section_questions(section)
        total_questions = questions.count()
        
        if not total_questions:
            return 0.0
        
        answers = self.answers or {}
        section_answers = answers.get(section, {})
        answered_questions = len(section_answers)
        
        return (answered_questions / total_questions) * 100
    
    def get_overall_progress(self):
        """Get overall exam progress."""
        total_questions = self.mock_exam.total_questions
        if not total_questions:
            return 0.0
        
        answered_count = 0
        answers = self.answers or {}
        
        for section in ['math', 'reading', 'writing']:
            if section in answers:
                answered_count += len(answers[section])
        
        return (answered_count / total_questions) * 100
    
    def clean(self):
        """Validate attempt data."""
        from django.core.exceptions import ValidationError
        
        # Validate scores are in valid ranges
        if self.math_raw_score is not None and (self.math_raw_score < 0 or self.math_raw_score > 58):
            raise ValidationError("Math raw score must be between 0 and 58")
        
        if self.reading_raw_score is not None and (self.reading_raw_score < 0 or self.reading_raw_score > 52):
            raise ValidationError("Reading raw score must be between 0 and 52")
        
        if self.writing_raw_score is not None and (self.writing_raw_score < 0 or self.writing_raw_score > 44):
            raise ValidationError("Writing raw score must be between 0 and 44")
        
        if self.sat_score is not None and (self.sat_score < 400 or self.sat_score > 1600):
            raise ValidationError("SAT score must be between 400 and 1600")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    

