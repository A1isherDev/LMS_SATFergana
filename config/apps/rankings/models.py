"""
Ranking models for the SAT LMS platform.
"""
from django.db import models
from django.utils import timezone
from apps.common.models import TimestampedModel


class Ranking(TimestampedModel):
    """
    Student ranking model for leaderboards.
    """
    PERIOD_TYPES = [
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('ALL_TIME', 'All Time'),
    ]
    
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='rankings',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    period_type = models.CharField(
        max_length=10,
        choices=PERIOD_TYPES,
        db_index=True,
        help_text="Type of ranking period"
    )
    period_start = models.DateTimeField(
        db_index=True,
        help_text="Start date of the ranking period"
    )
    period_end = models.DateTimeField(
        db_index=True,
        help_text="End date of the ranking period"
    )
    total_points = models.IntegerField(
        default=0,
        db_index=True,
        help_text="Total points earned in the period"
    )
    homework_completion_rate = models.FloatField(
        default=0.0,
        help_text="Percentage of homework completed (0-100)"
    )
    homework_accuracy = models.FloatField(
        default=0.0,
        help_text="Average homework accuracy (0-100)"
    )
    mock_exam_scores = models.JSONField(
        default=list,
        help_text="List of mock exam scores in the period"
    )
    rank = models.IntegerField(
        db_index=True,
        help_text="Rank position in the leaderboard"
    )
    previous_rank = models.IntegerField(
        null=True,
        blank=True,
        help_text="Previous rank for comparison"
    )
    
    class Meta:
        db_table = 'rankings'
        indexes = [
            models.Index(fields=['period_type', 'period_start', 'rank']),
            models.Index(fields=['student', 'period_type', 'period_start']),
            models.Index(fields=['period_type', 'period_start']),
            models.Index(fields=['rank']),
            models.Index(fields=['total_points']),
        ]
        ordering = ['rank']
        unique_together = ['student', 'period_type', 'period_start']
    
    def __str__(self):
        return f"{self.student.email} - {self.get_period_type_display()} - Rank #{self.rank}"
    
    @property
    def rank_change(self):
        """Calculate rank change from previous period."""
        if self.previous_rank is None:
            return 0
        return self.previous_rank - self.rank
    
    @property
    def rank_change_display(self):
        """Get display text for rank change."""
        change = self.rank_change
        if change > 0:
            return f"+{change}"
        elif change < 0:
            return str(change)
        else:
            return "0"
    
    @property
    def average_sat_score(self):
        """Calculate average SAT score from mock exams."""
        if not self.mock_exam_scores:
            return 0
        return sum(self.mock_exam_scores) / len(self.mock_exam_scores)
    
    @property
    def highest_sat_score(self):
        """Get highest SAT score in the period."""
        if not self.mock_exam_scores:
            return 0
        return max(self.mock_exam_scores)
    
    @classmethod
    def get_period_start(cls, period_type):
        """Get the start date for a given period type."""
        now = timezone.now()
        
        if period_type == 'WEEKLY':
            # Start of current week (Monday)
            days_since_monday = now.weekday()
            if days_since_monday == 0:  # Sunday
                days_since_monday = 6
            start_date = now - timezone.timedelta(days=days_since_monday)
            return start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        elif period_type == 'MONTHLY':
            # Start of current month
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return start_date
        
        elif period_type == 'ALL_TIME':
            # Fixed date for all-time rankings
            import datetime as dt
            from django.utils import timezone as tz
            return tz.make_aware(dt.datetime(2020, 1, 1), tz.get_default_timezone())
        
        return now
    
    @classmethod
    def get_period_end(cls, period_type):
        """Get the end date for a given period type."""
        now = timezone.now()
        
        if period_type == 'WEEKLY':
            # End of current week (Sunday)
            days_until_sunday = 6 - now.weekday()
            if days_until_sunday < 0:  # Sunday
                days_until_sunday = 0
            end_date = now + timezone.timedelta(days=days_until_sunday)
            return end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        elif period_type == 'MONTHLY':
            # End of current month
            if now.month == 12:
                end_date = now.replace(year=now.year + 1, month=1, day=1) - timezone.timedelta(days=1)
            else:
                end_date = now.replace(month=now.month + 1, day=1) - timezone.timedelta(days=1)
            return end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        elif period_type == 'ALL_TIME':
            # Far future date for all-time rankings
            return now + timezone.timedelta(days=365 * 10)
        
        return now
    
    @classmethod
    def calculate_student_points(cls, student, period_start, period_end):
        """Calculate points for a student within a period."""
        from apps.homework.models import HomeworkSubmission
        from apps.mockexams.models import MockExamAttempt
        
        # Get homework submissions in period
        homework_submissions = HomeworkSubmission.objects.filter(
            student=student,
            submitted_at__gte=period_start,
            submitted_at__lte=period_end
        )
        
        # Get mock exam attempts in period
        mock_exam_attempts = MockExamAttempt.objects.filter(
            student=student,
            submitted_at__gte=period_start,
            submitted_at__lte=period_end,
            is_completed=True,
            sat_score__isnull=False
        )
        
        # Calculate homework completion rate
        total_homework = homework_submissions.count()
        if total_homework > 0:
            completion_rate = 100.0
        else:
            completion_rate = 0.0
        
        # Calculate homework accuracy
        if total_homework > 0:
            total_score = sum(sub.score or 0 for sub in homework_submissions)
            max_possible_score = sum(sub.homework.max_score for sub in homework_submissions)
            accuracy = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0.0
        else:
            accuracy = 0.0
        
        # Calculate mock exam scores list
        sat_scores = [attempt.sat_score for attempt in mock_exam_attempts]
        
        # Calculate total points (simple scoring system)
        points = 0
        points += completion_rate * 10  # 10 points per % completion
        points += accuracy * 5  # 5 points per % accuracy
        points += sum(sat_scores) / 10  # 1 point per 10 SAT points
        
        return {
            'total_points': int(points),
            'homework_completion_rate': completion_rate,
            'homework_accuracy': accuracy,
            'mock_exam_scores': sat_scores
        }
    
    @classmethod
    def update_rankings(cls, period_type, period_start=None, period_end=None):
        """Update rankings for a specific period."""
        if period_start is None:
            period_start = cls.get_period_start(period_type)
        if period_end is None:
            period_end = cls.get_period_end(period_type)
        
        # Get all students
        from apps.users.models import User
        students = User.objects.filter(role='STUDENT')
        
        rankings_data = []
        
        for student in students:
            # Calculate student's performance metrics
            metrics = cls.calculate_student_points(student, period_start, period_end)
            
            # Get previous rank for comparison
            try:
                if period_type == 'WEEKLY':
                    prev_start = period_start - timezone.timedelta(weeks=1)
                    prev_end = period_end - timezone.timedelta(weeks=1)
                elif period_type == 'MONTHLY':
                    prev_start = period_start - timezone.timedelta(days=30)
                    prev_end = period_end - timezone.timedelta(days=30)
                else:
                    prev_start = None
                    prev_end = None
                
                if prev_start and prev_end:
                    prev_ranking = cls.objects.get(
                        student=student,
                        period_type=period_type,
                        period_start=prev_start
                    )
                    previous_rank = prev_ranking.rank
                else:
                    previous_rank = None
            except cls.DoesNotExist:
                previous_rank = None
            
            rankings_data.append({
                'student': student,
                'period_type': period_type,
                'period_start': period_start,
                'period_end': period_end,
                'previous_rank': previous_rank,
                **metrics
            })
        
        # Sort by total points (descending) and assign ranks
        rankings_data.sort(key=lambda x: x['total_points'], reverse=True)
        
        for idx, data in enumerate(rankings_data, 1):
            data['rank'] = idx
        
        # Delete existing rankings for this period
        cls.objects.filter(
            period_type=period_type,
            period_start=period_start
        ).delete()
        
        # Create new rankings
        created_rankings = []
        for data in rankings_data:
            ranking = cls.objects.create(**data)
            created_rankings.append(ranking)
        
        return created_rankings
    
    def clean(self):
        """Validate ranking data."""
        from django.core.exceptions import ValidationError
        
        if self.homework_completion_rate < 0 or self.homework_completion_rate > 100:
            raise ValidationError("Homework completion rate must be between 0 and 100")
        
        if self.homework_accuracy < 0 or self.homework_accuracy > 100:
            raise ValidationError("Homework accuracy must be between 0 and 100")
        
        if self.rank < 1:
            raise ValidationError("Rank must be at least 1")
        
        if self.period_start >= self.period_end:
            raise ValidationError("Period start must be before period end")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
