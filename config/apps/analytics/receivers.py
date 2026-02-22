from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.homework.models import HomeworkSubmission
from apps.mockexams.models import MockExamAttempt
from apps.flashcards.models import FlashcardProgress
from apps.questionbank.models import QuestionAttempt
from .models import StudentProgress, WeakArea

@receiver(post_save, sender=HomeworkSubmission)
def update_progress_on_homework_submission(sender, instance, **kwargs):
    """Update student progress when a homework is submitted."""
    if instance.submitted_at:
        StudentProgress.update_daily_progress(instance.student)

@receiver(post_save, sender=MockExamAttempt)
def update_progress_on_exam_attempt(sender, instance, **kwargs):
    """Update student progress when a mock exam is completed."""
    if instance.is_completed and instance.submitted_at:
        StudentProgress.update_daily_progress(instance.student)

@receiver(post_save, sender=FlashcardProgress)
def update_progress_on_flashcard_review(sender, instance, **kwargs):
    """Update student progress when flashcards are reviewed."""
    StudentProgress.update_daily_progress(instance.student)

@receiver(post_save, sender=QuestionAttempt)
def update_weak_areas_on_question_attempt(sender, instance, **kwargs):
    """Trigger weak area analysis when a question is attempted."""
    WeakArea.analyze_student_weak_areas(instance.student)
    # Also update daily progress to reflect question practice time/counts
    StudentProgress.update_daily_progress(instance.student)
