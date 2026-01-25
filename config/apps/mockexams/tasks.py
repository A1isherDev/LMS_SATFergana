"""
Celery tasks for mockexams app.
"""
from celery import shared_task
from django.utils import timezone
from apps.mockexams.models import MockExamAttempt


@shared_task
def auto_submit_expired_exams():
    """
    Auto-submit mock exams that have exceeded their time limit.
    This task should be scheduled to run periodically (e.g., every minute).
    """
    submitted_count = 0
    
    # Get all in-progress attempts
    attempts = MockExamAttempt.objects.filter(
        is_completed=False
    ).select_related('mock_exam')
    
    for attempt in attempts:
        # Check if attempt has exceeded time limit
        if attempt.is_over_time:
            attempt.submit_exam()
            submitted_count += 1
    
    return f"Auto-submitted {submitted_count} expired mock exams"


@shared_task
def calculate_mock_exam_statistics():
    """
    Calculate and cache mock exam statistics for performance.
    This task should be scheduled to run periodically (e.g., daily).
    """
    from django.core.cache import cache
    from django.db.models import Count, Avg, Q
    from apps.mockexams.models import MockExam
    
    stats = {}
    
    # Get overall statistics
    total_attempts = MockExamAttempt.objects.count()
    completed_attempts = MockExamAttempt.objects.filter(is_completed=True).count()
    
    completed_queryset = MockExamAttempt.objects.filter(is_completed=True)
    
    avg_sat_score = completed_queryset.aggregate(
        avg_score=Avg('sat_score')
    )['avg_score'] or 0
    
    avg_math_score = completed_queryset.aggregate(
        avg_score=Avg('math_scaled_score')
    )['avg_score'] or 0
    
    avg_reading_score = completed_queryset.aggregate(
        avg_score=Avg('reading_scaled_score')
    )['avg_score'] or 0
    
    avg_writing_score = completed_queryset.aggregate(
        avg_score=Avg('writing_scaled_score')
    )['avg_score'] or 0
    
    # Calculate score distribution
    score_ranges = {
        '400-600': 0,
        '600-800': 0,
        '800-1000': 0,
        '1000-1200': 0,
        '1200-1400': 0,
        '1400-1600': 0
    }
    
    for attempt in completed_queryset:
        if attempt.sat_score:
            if attempt.sat_score < 600:
                score_ranges['400-600'] += 1
            elif attempt.sat_score < 800:
                score_ranges['600-800'] += 1
            elif attempt.sat_score < 1000:
                score_ranges['800-1000'] += 1
            elif attempt.sat_score < 1200:
                score_ranges['1000-1200'] += 1
            elif attempt.sat_score < 1400:
                score_ranges['1200-1400'] += 1
            else:
                score_ranges['1400-1600'] += 1
    
    stats['overall'] = {
        'total_attempts': total_attempts,
        'completed_attempts': completed_attempts,
        'completion_rate': (completed_attempts / total_attempts * 100) if total_attempts > 0 else 0,
        'average_sat_score': round(avg_sat_score, 2),
        'average_math_score': round(avg_math_score, 2),
        'average_reading_score': round(avg_reading_score, 2),
        'average_writing_score': round(avg_writing_score, 2),
        'score_distribution': score_ranges
    }
    
    # Calculate statistics by exam type
    exam_types = ['FULL', 'MATH_ONLY', 'READING_WRITING_ONLY']
    stats['by_exam_type'] = {}
    
    for exam_type in exam_types:
        type_attempts = MockExamAttempt.objects.filter(
            mock_exam__exam_type=exam_type
        )
        type_completed = type_attempts.filter(is_completed=True)
        
        type_total = type_attempts.count()
        type_completed_count = type_completed.count()
        
        type_avg_sat = type_completed.aggregate(
            avg_score=Avg('sat_score')
        )['avg_score'] or 0
        
        stats['by_exam_type'][exam_type] = {
            'total_attempts': type_total,
            'completed_attempts': type_completed_count,
            'completion_rate': (type_completed_count / type_total * 100) if type_total > 0 else 0,
            'average_sat_score': round(type_avg_sat, 2)
        }
    
    # Calculate top performers
    top_performers = completed_queryset.filter(
        sat_score__isnull=False
    ).order_by('-sat_score')[:10]
    
    stats['top_performers'] = [
        {
            'student_name': attempt.student.get_full_name() or attempt.student.email,
            'student_email': attempt.student.email,
            'exam_title': attempt.mock_exam.title,
            'sat_score': attempt.sat_score,
            'submitted_at': attempt.submitted_at
        }
        for attempt in top_performers
    ]
    
    # Cache the statistics for 24 hours
    cache.set('mock_exam_statistics', stats, timeout=86400)
    
    return "Mock exam statistics calculated and cached"


@shared_task
def cleanup_old_attempts():
    """
    Clean up old incomplete attempts (older than 7 days).
    This task should be scheduled to run periodically (e.g., weekly).
    """
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=7)
    
    # Delete incomplete attempts older than 7 days
    old_attempts = MockExamAttempt.objects.filter(
        is_completed=False,
        started_at__lt=cutoff_date
    )
    
    deleted_count = old_attempts.count()
    old_attempts.delete()
    
    return f"Deleted {deleted_count} old incomplete mock exam attempts"
