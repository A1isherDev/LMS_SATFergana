"""
Flashcard models for the SAT LMS platform.
"""
from django.db import models
from django.utils import timezone
from apps.common.models import TimestampedModel


class Flashcard(TimestampedModel):
    """
    Vocabulary flashcard for SAT preparation.
    """
    word = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Vocabulary word"
    )
    definition = models.TextField(
        help_text="Definition of the word"
    )
    example_sentence = models.TextField(
        blank=True,
        help_text="Example sentence using the word"
    )
    difficulty = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        default=3,
        db_index=True,
        help_text="Difficulty level from 1 (easiest) to 5 (hardest)"
    )
    part_of_speech = models.CharField(
        max_length=20,
        choices=[
            ('NOUN', 'Noun'),
            ('VERB', 'Verb'),
            ('ADJECTIVE', 'Adjective'),
            ('ADVERB', 'Adverb'),
            ('OTHER', 'Other'),
        ],
        default='OTHER',
        db_index=True,
        help_text="Part of speech"
    )
    synonyms = models.TextField(
        blank=True,
        help_text="Comma-separated list of synonyms"
    )
    antonyms = models.TextField(
        blank=True,
        help_text="Comma-separated list of antonyms"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this flashcard is available for review"
    )
    
    class Meta:
        db_table = 'flashcards'
        indexes = [
            models.Index(fields=['word']),
            models.Index(fields=['difficulty']),
            models.Index(fields=['part_of_speech']),
            models.Index(fields=['is_active']),
            models.Index(fields=['difficulty', 'is_active']),
        ]
        ordering = ['word']
    
    def __str__(self):
        return f"{self.word} ({self.get_part_of_speech_display()})"
    
    def get_synonyms_list(self):
        """Get synonyms as a list."""
        if self.synonyms:
            return [s.strip() for s in self.synonyms.split(',') if s.strip()]
        return []
    
    def get_antonyms_list(self):
        """Get antonyms as a list."""
        if self.antonyms:
            return [a.strip() for a in self.antonyms.split(',') if a.strip()]
        return []


class FlashcardProgress(TimestampedModel):
    """
    Student progress tracking for individual flashcards with spaced repetition.
    """
    flashcard = models.ForeignKey(
        Flashcard,
        on_delete=models.CASCADE,
        related_name='progress_records',
        db_index=True
    )
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='flashcard_progress',
        db_index=True,
        limit_choices_to={'role': 'STUDENT'}
    )
    last_reviewed = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When this flashcard was last reviewed"
    )
    next_review = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When this flashcard should be reviewed next"
    )
    review_count = models.IntegerField(
        default=0,
        help_text="Number of times this flashcard has been reviewed"
    )
    ease_factor = models.FloatField(
        default=2.5,
        help_text="Ease factor for spaced repetition (SM-2 algorithm)"
    )
    interval_days = models.IntegerField(
        default=1,
        help_text="Days until next review"
    )
    is_mastered = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this flashcard is considered mastered"
    )
    consecutive_correct = models.IntegerField(
        default=0,
        help_text="Number of consecutive correct reviews"
    )
    
    class Meta:
        db_table = 'flashcard_progress'
        indexes = [
            models.Index(fields=['student', 'next_review']),
            models.Index(fields=['student', 'is_mastered']),
            models.Index(fields=['student', 'last_reviewed']),
            models.Index(fields=['flashcard', 'student']),
            models.Index(fields=['next_review']),
        ]
        ordering = ['next_review']
        unique_together = ['flashcard', 'student']
    
    def __str__(self):
        return f"{self.student.email} - {self.flashcard.word}"
    
    @property
    def is_due_for_review(self):
        """Check if flashcard is due for review."""
        if not self.next_review:
            return True
        return timezone.now() >= self.next_review
    
    @property
    def days_until_review(self):
        """Get days until next review."""
        if not self.next_review:
            return 0
        delta = self.next_review - timezone.now()
        return max(0, delta.days)
    
    @property
    def mastery_level(self):
        """Get mastery level based on review performance."""
        if self.is_mastered:
            return "Mastered"
        elif self.consecutive_correct >= 5:
            return "Nearly Mastered"
        elif self.consecutive_correct >= 3:
            return "Learning"
        elif self.review_count >= 3:
            return "Struggling"
        else:
            return "New"
    
    def update_spaced_repetition(self, quality):
        """
        Update spaced repetition parameters using SM-2 algorithm.
        
        Args:
            quality: Quality of recall (0-5)
                0 = complete blackout
                1 = incorrect response, but remembered after seeing answer
                2 = incorrect response, but correct one seemed familiar
                3 = correct response, but with difficulty
                4 = correct response after hesitation
                5 = perfect recall
        """
        from apps.common.utils import calculate_spaced_repetition
        
        if quality < 0 or quality > 5:
            raise ValueError("Quality must be between 0 and 5")
        
        # Update consecutive correct count
        if quality >= 3:
            self.consecutive_correct += 1
        else:
            self.consecutive_correct = 0
        
        # Check if mastered (5 consecutive correct reviews)
        if self.consecutive_correct >= 5:
            self.is_mastered = True
            self.next_review = timezone.now() + timezone.timedelta(days=365)  # Review in 1 year
        else:
            self.is_mastered = False
            
            # Calculate next review using SM-2 algorithm
            new_ease_factor, new_interval_days, next_review_date = calculate_spaced_repetition(
                quality=quality,
                ease_factor=self.ease_factor,
                interval_days=self.interval_days,
                review_count=self.review_count
            )
            
            self.ease_factor = new_ease_factor
            self.interval_days = new_interval_days
            self.next_review = next_review_date
        
        # Update review tracking
        self.last_reviewed = timezone.now()
        self.review_count += 1
        
        self.save()
    
    def reset_progress(self):
        """Reset progress to initial state."""
        from apps.common.utils import get_initial_spaced_repetition_values
        
        initial_values = get_initial_spaced_repetition_values()
        
        self.ease_factor = initial_values['ease_factor']
        self.interval_days = initial_values['interval_days']
        self.review_count = initial_values['review_count']
        self.is_mastered = initial_values['is_mastered']
        self.consecutive_correct = 0
        self.last_reviewed = None
        self.next_review = timezone.now()
        
        self.save()
    
    @classmethod
    def get_due_cards(cls, student, limit=None):
        """Get flashcards due for review for a student."""
        queryset = cls.objects.filter(
            student=student,
            next_review__lte=timezone.now(),
            flashcard__is_active=True
        ).select_related('flashcard').order_by('next_review')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset
    
    @classmethod
    def get_learning_stats(cls, student):
        """Get learning statistics for a student."""
        total_cards = cls.objects.filter(student=student).count()
        mastered_cards = cls.objects.filter(student=student, is_mastered=True).count()
        due_cards = cls.get_due_cards(student).count()
        
        # Get cards by mastery level
        struggling = cls.objects.filter(
            student=student,
            review_count__gte=3,
            consecutive_correct__lt=2
        ).count()
        
        learning = cls.objects.filter(
            student=student,
            consecutive_correct__gte=2,
            consecutive_correct__lt=5,
            is_mastered=False
        ).count()
        
        nearly_mastered = cls.objects.filter(
            student=student,
            consecutive_correct__gte=5,
            is_mastered=False
        ).count()
        
        return {
            'total_cards': total_cards,
            'mastered_cards': mastered_cards,
            'due_cards': due_cards,
            'struggling_cards': struggling,
            'learning_cards': learning,
            'nearly_mastered_cards': nearly_mastered,
            'mastery_percentage': (mastered_cards / total_cards * 100) if total_cards > 0 else 0
        }
    
    def clean(self):
        """Validate progress data."""
        from django.core.exceptions import ValidationError
        
        if self.ease_factor < 1.3:
            raise ValidationError("Ease factor must be at least 1.3")
        
        if self.interval_days < 1:
            raise ValidationError("Interval days must be at least 1")
        
        if self.review_count < 0:
            raise ValidationError("Review count cannot be negative")
        
        if self.consecutive_correct < 0:
            raise ValidationError("Consecutive correct count cannot be negative")
    
    def save(self, *args, **kwargs):
        self.clean()
        
        # Set initial next review if not set
        if not self.next_review and not self.pk:
            self.next_review = timezone.now()
        
        super().save(*args, **kwargs)
