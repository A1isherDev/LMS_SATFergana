"""
Celery tasks for the homework app.
"""
from celery import shared_task
from django.utils import timezone
from apps.homework.models import HomeworkSubmission


@shared_task
def mark_late_submissions():
    """
    Mark submissions as late if submitted after due date.
    This task should be scheduled to run periodically (e.g., every hour).
    """
    updated_count = 0
    
    # Get all submitted homework that might be late
    submissions = HomeworkSubmission.objects.filter(
        submitted_at__isnull=False,
        is_late=False
    ).select_related('homework')
    
    for submission in submissions:
        if submission.submitted_at > submission.homework.due_date:
            submission.is_late = True
            submission.save(update_fields=['is_late'])
            updated_count += 1
    
    return f"Marked {updated_count} submissions as late"


@shared_task
def auto_submit_overdue_homework():
    """
    Auto-submit homework that is past due date but not yet submitted.
    This task should be scheduled to run periodically (e.g., every hour).
    """
    submitted_count = 0
    
    # Get all unsubmitted homework that is overdue
    from apps.homework.models import Homework
    
    overdue_homework = Homework.objects.filter(
        due_date__lt=timezone.now(),
        is_published=True
    ).prefetch_related('submissions')
    
    for homework in overdue_homework:
        # Get students who haven't submitted
        enrolled_students = homework.class_obj.students.all()
        submitted_students = homework.submissions.filter(
            submitted_at__isnull=False
        ).values_list('student_id', flat=True)
        
        pending_students = enrolled_students.exclude(id__in=submitted_students)
        
        for student in pending_students:
            # Create submission with empty answers
            submission, created = HomeworkSubmission.objects.get_or_create(
                homework=homework,
                student=student,
                defaults={
                    'answers': {},
                    'time_spent_seconds': 0,
                    'submitted_at': timezone.now()
                }
            )
            
            if created:
                submission.check_late_submission()
                submission.save()
                submitted_count += 1
            elif not submission.submitted_at:
                # Update existing unsubmitted submission
                submission.submitted_at = timezone.now()
                submission.check_late_submission()
                submission.save()
                submitted_count += 1
    
    return f"Auto-submitted {submitted_count} overdue homework assignments"


@shared_task
def calculate_homework_statistics():
    """
    Calculate and cache homework statistics for performance.
    This task should be scheduled to run periodically (e.g., daily).
    """
    from django.core.cache import cache
    from apps.homework.models import Homework
    from django.db.models import Count, Avg, Q
    
    stats = {}
    
    # Get overall statistics
    total_homework = Homework.objects.filter(is_published=True).count()
    
    submissions = HomeworkSubmission.objects.all()
    completed_submissions = submissions.filter(submitted_at__isnull=False)
    late_submissions = completed_submissions.filter(is_late=True)
    
    total_submissions = submissions.count()
    completed_count = completed_submissions.count()
    late_count = late_submissions.count()
    
    avg_score = completed_submissions.aggregate(avg_score=Avg('score'))['avg_score'] or 0
    
    stats['overall'] = {
        'total_homework': total_homework,
        'total_submissions': total_submissions,
        'completed_submissions': completed_count,
        'late_submissions': late_count,
        'completion_rate': (completed_count / total_submissions * 100) if total_submissions > 0 else 0,
        'late_rate': (late_count / completed_count * 100) if completed_count > 0 else 0,
        'average_score': round(avg_score, 2)
    }
    
    # Calculate per-class statistics
    classes = Homework.objects.values('class_obj__name').annotate(
        homework_count=Count('id'),
        submission_count=Count('submissions'),
        completed_count=Count('submissions', filter=Q(submissions__submitted_at__isnull=False))
    )
    
    stats['by_class'] = {}
    for class_data in classes:
        class_name = class_data['class_obj__name']
        stats['by_class'][class_name] = {
            'homework_count': class_data['homework_count'],
            'submission_count': class_data['submission_count'],
            'completed_count': class_data['completed_count'],
            'completion_rate': (class_data['completed_count'] / class_data['submission_count'] * 100) if class_data['submission_count'] > 0 else 0
        }
    
    # Cache the statistics for 24 hours
    cache.set('homework_statistics', stats, timeout=86400)
    
    return "Homework statistics calculated and cached"
