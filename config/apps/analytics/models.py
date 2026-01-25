"""
Analytics models for the SAT LMS platform.
"""
from django.db import models
from django.utils import timezone
from apps.common.models import TimestampedModel


class StudentProgress(TimestampedModel):
    """
    Student progress tracking model.
    """
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='progress_records',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    date = models.DateField(db_index=True, help_text="Date of progress record")
    
    # Homework metrics
    homework_completed = models.IntegerField(
        default=0,
        help_text="Number of homework assignments completed"
    )
    homework_total = models.IntegerField(
        default=0,
        help_text="Total number of homework assignments"
    )
    homework_accuracy = models.FloatField(
        default=0.0,
        help_text="Average homework accuracy (0-100)"
    )
    
    # Mock exam metrics
    mock_exams_taken = models.IntegerField(
        default=0,
        help_text="Number of mock exams taken"
    )
    latest_sat_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Latest SAT score"
    )
    average_sat_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Average SAT score"
    )
    
    # Flashcard metrics
    flashcards_mastered = models.IntegerField(
        default=0,
        help_text="Number of flashcards mastered"
    )
    flashcards_total = models.IntegerField(
        default=0,
        help_text="Total number of flashcards"
    )
    
    # Overall metrics
    study_time_minutes = models.IntegerField(
        default=0,
        help_text="Total study time in minutes for the day"
    )
    streak_days = models.IntegerField(
        default=0,
        help_text="Current study streak in days"
    )
    
    class Meta:
        db_table = 'student_progress'
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['student', 'streak_days']),
        ]
        ordering = ['-date']
        unique_together = ['student', 'date']
    
    def __str__(self):
        return f"{self.student.email} - {self.date}"
    
    @property
    def homework_completion_rate(self):
        """Calculate homework completion rate."""
        if self.homework_total == 0:
            return 0.0
        return (self.homework_completed / self.homework_total) * 100
    
    @property
    def flashcard_mastery_rate(self):
        """Calculate flashcard mastery rate."""
        if self.flashcards_total == 0:
            return 0.0
        return (self.flashcards_mastered / self.flashcards_total) * 100
    
    @classmethod
    def update_daily_progress(cls, student, date=None):
        """Update or create daily progress record for a student."""
        if date is None:
            date = timezone.now().date()
        
        # Get or create progress record
        progress, created = cls.objects.get_or_create(
            student=student,
            date=date,
            defaults={
                'homework_completed': 0,
                'homework_total': 0,
                'homework_accuracy': 0.0,
                'mock_exams_taken': 0,
                'flashcards_mastered': 0,
                'flashcards_total': 0,
                'study_time_minutes': 0,
                'streak_days': 0
            }
        )
        
        # Calculate metrics from other apps
        from apps.homework.models import HomeworkSubmission
        from apps.mockexams.models import MockExamAttempt
        from apps.flashcards.models import FlashcardProgress
        
        # Homework metrics
        homework_submissions = HomeworkSubmission.objects.filter(
            student=student,
            submitted_at__date=date,
            is_submitted=True
        )
        
        progress.homework_completed = homework_submissions.count()
        
        # Get total homework assigned (simplified - could be enhanced)
        from apps.homework.models import Homework
        total_homework = Homework.objects.filter(
            due_date__date=date,
            is_published=True
        ).count()
        
        progress.homework_total = max(total_homework, progress.homework_completed)
        
        # Calculate accuracy
        if progress.homework_completed > 0:
            total_score = sum(sub.score or 0 for sub in homework_submissions)
            max_possible_score = sum(sub.homework.max_score for sub in homework_submissions)
            progress.homework_accuracy = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0.0
        
        # Mock exam metrics
        exam_attempts = MockExamAttempt.objects.filter(
            student=student,
            submitted_at__date=date,
            is_completed=True,
            sat_score__isnull=False
        )
        
        progress.mock_exams_taken = exam_attempts.count()
        
        if exam_attempts.exists():
            scores = [attempt.sat_score for attempt in exam_attempts]
            progress.latest_sat_score = max(scores)
            progress.average_sat_score = sum(scores) / len(scores)
        
        # Flashcard metrics
        flashcard_progress = FlashcardProgress.objects.filter(student=student)
        progress.flashcards_mastered = flashcard_progress.filter(is_mastered=True).count()
        progress.flashcards_total = flashcard_progress.count()
        
        # Calculate study streak
        yesterday = date - timezone.timedelta(days=1)
        yesterday_progress = cls.objects.filter(student=student, date=yesterday).first()
        
        if yesterday_progress and yesterday_progress.study_time_minutes > 0:
            progress.streak_days = yesterday_progress.streak_days + 1
        elif progress.study_time_minutes > 0:
            progress.streak_days = 1
        else:
            progress.streak_days = 0
        
        progress.save()
        return progress


class WeakArea(TimestampedModel):
    """
    Student weak areas analysis model.
    """
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='weak_areas',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    area_type = models.CharField(
        max_length=20,
        choices=[
            ('MATH', 'Math'),
            ('READING', 'Reading'),
            ('WRITING', 'Writing'),
            ('VOCABULARY', 'Vocabulary'),
        ],
        db_index=True
    )
    subcategory = models.CharField(
        max_length=50,
        blank=True,
        help_text="Specific subcategory within the area"
    )
    weakness_score = models.FloatField(
        default=0.0,
        help_text="Weakness score (0-100, higher = weaker)"
    )
    question_count = models.IntegerField(
        default=0,
        help_text="Number of questions analyzed"
    )
    correct_count = models.IntegerField(
        default=0,
        help_text="Number of correct answers"
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        db_index=True
    )
    
    class Meta:
        db_table = 'weak_areas'
        indexes = [
            models.Index(fields=['student', 'area_type']),
            models.Index(fields=['student', 'weakness_score']),
            models.Index(fields=['area_type', 'weakness_score']),
        ]
        ordering = ['-weakness_score']
        unique_together = ['student', 'area_type', 'subcategory']
    
    def __str__(self):
        return f"{self.student.email} - {self.area_type} ({self.subcategory})"
    
    @property
    def accuracy_rate(self):
        """Calculate accuracy rate for this area."""
        if self.question_count == 0:
            return 0.0
        return (self.correct_count / self.question_count) * 100
    
    @classmethod
    def analyze_student_weak_areas(cls, student):
        """Analyze and update weak areas for a student."""
        from apps.questionbank.models import QuestionAttempt
        
        # Get recent question attempts (last 30 days)
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        attempts = QuestionAttempt.objects.filter(
            student=student,
            created_at__gte=cutoff_date
        ).select_related('question')
        
        # Group by area and subcategory
        areas = {}
        
        for attempt in attempts:
            question = attempt.question
            area_type = question.question_type
            
            # Determine subcategory based on question tags or content
            subcategory = cls._get_subcategory(question)
            
            key = (area_type, subcategory)
            
            if key not in areas:
                areas[key] = {
                    'question_count': 0,
                    'correct_count': 0
                }
            
            areas[key]['question_count'] += 1
            if attempt.selected_answer == question.correct_answer:
                areas[key]['correct_count'] += 1
        
        # Update weak areas
        for (area_type, subcategory), data in areas.items():
            accuracy = (data['correct_count'] / data['question_count']) * 100 if data['question_count'] > 0 else 0
            weakness_score = 100 - accuracy  # Higher score = weaker area
            
            cls.objects.update_or_create(
                student=student,
                area_type=area_type,
                subcategory=subcategory,
                defaults={
                    'weakness_score': weakness_score,
                    'question_count': data['question_count'],
                    'correct_count': data['correct_count']
                }
            )
    
    @staticmethod
    def _get_subcategory(question):
        """Determine subcategory based on question content."""
        # This is a simplified implementation
        # In a real system, you might use tags, topics, or content analysis
        
        content = (question.question_text + ' ' + (question.explanation or '')).lower()
        
        if question.question_type == 'MATH':
            if 'algebra' in content:
                return 'Algebra'
            elif 'geometry' in content:
                return 'Geometry'
            elif 'statistics' in content or 'probability' in content:
                return 'Statistics & Probability'
            else:
                return 'General Math'
        
        elif question.question_type == 'READING':
            if 'main idea' in content:
                return 'Main Idea'
            elif 'inference' in content:
                return 'Inference'
            elif 'vocabulary' in content:
                return 'Vocabulary in Context'
            else:
                return 'General Reading'
        
        elif question.question_type == 'WRITING':
            if 'grammar' in content:
                return 'Grammar'
            elif 'punctuation' in content:
                return 'Punctuation'
            elif 'style' in content:
                return 'Style & Tone'
            else:
                return 'General Writing'
        
        return 'General'


class StudySession(TimestampedModel):
    """
    Study session tracking model.
    """
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='study_sessions',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    session_type = models.CharField(
        max_length=20,
        choices=[
            ('HOMEWORK', 'Homework'),
            ('MOCK_EXAM', 'Mock Exam'),
            ('FLASHCARDS', 'Flashcards'),
            ('QUESTION_PRACTICE', 'Question Practice'),
            ('REVIEW', 'Review'),
        ],
        db_index=True
    )
    started_at = models.DateTimeField(db_index=True)
    ended_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True
    )
    duration_minutes = models.IntegerField(
        default=0,
        help_text="Session duration in minutes"
    )
    questions_attempted = models.IntegerField(
        default=0,
        help_text="Number of questions attempted"
    )
    questions_correct = models.IntegerField(
        default=0,
        help_text="Number of questions answered correctly"
    )
    flashcards_reviewed = models.IntegerField(
        default=0,
        help_text="Number of flashcards reviewed"
    )
    
    class Meta:
        db_table = 'study_sessions'
        indexes = [
            models.Index(fields=['student', 'started_at']),
            models.Index(fields=['session_type', 'started_at']),
            models.Index(fields=['started_at']),
        ]
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.student.email} - {self.session_type} - {self.started_at}"
    
    @property
    def accuracy_rate(self):
        """Calculate accuracy rate for questions."""
        if self.questions_attempted == 0:
            return 0.0
        return (self.questions_correct / self.questions_attempted) * 100
    
    @property
    def is_active(self):
        """Check if session is still active."""
        return self.ended_at is None
    
    def end_session(self):
        """End the study session."""
        if not self.ended_at:
            self.ended_at = timezone.now()
            if self.started_at:
                duration = self.ended_at - self.started_at
                self.duration_minutes = int(duration.total_seconds() / 60)
            self.save()
    
    @classmethod
    def start_session(cls, student, session_type):
        """Start a new study session."""
        return cls.objects.create(
            student=student,
            session_type=session_type,
            started_at=timezone.now()
        )
