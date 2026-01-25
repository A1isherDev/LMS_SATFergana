"""
Celery tasks for rankings app.
"""
from celery import shared_task
from django.utils import timezone
from apps.rankings.models import Ranking


@shared_task
def update_weekly_rankings():
    """
    Update weekly rankings.
    This task should be scheduled to run every Monday at 00:00.
    """
    try:
        updated_rankings = Ranking.update_rankings('WEEKLY')
        return f"Updated {len(updated_rankings)} weekly rankings"
    except Exception as e:
        return f"Failed to update weekly rankings: {str(e)}"


@shared_task
def update_monthly_rankings():
    """
    Update monthly rankings.
    This task should be scheduled to run on the 1st of each month at 00:00.
    """
    try:
        updated_rankings = Ranking.update_rankings('MONTHLY')
        return f"Updated {len(updated_rankings)} monthly rankings"
    except Exception as e:
        return f"Failed to update monthly rankings: {str(e)}"


@shared_task
def update_all_time_rankings():
    """
    Update all-time rankings.
    This task should be scheduled to run daily at 02:00.
    """
    try:
        updated_rankings = Ranking.update_rankings('ALL_TIME')
        return f"Updated {len(updated_rankings)} all-time rankings"
    except Exception as e:
        return f"Failed to update all-time rankings: {str(e)}"


@shared_task
def cleanup_old_rankings():
    """
    Clean up old rankings to prevent database bloat.
    This task should be scheduled to run monthly.
    """
    from datetime import timedelta
    
    # Keep rankings for the last 6 months
    cutoff_date = timezone.now() - timedelta(days=180)
    
    # Delete old rankings (except ALL_TIME)
    deleted_count = Ranking.objects.filter(
        period_start__lt=cutoff_date,
        period_type__in=['WEEKLY', 'MONTHLY']
    ).delete()[0]
    
    return f"Deleted {deleted_count} old ranking records"


@shared_task
def generate_ranking_report():
    """
    Generate a comprehensive ranking report.
    This task should be scheduled to run weekly.
    """
    from django.core.cache import cache
    
    report_data = {}
    
    # Get current rankings for all periods
    periods = ['WEEKLY', 'MONTHLY', 'ALL_TIME']
    
    for period in periods:
        period_start = Ranking.get_period_start(period)
        rankings = Ranking.objects.filter(
            period_type=period,
            period_start=period_start
        ).select_related('student').order_by('rank')
        
        if rankings.exists():
            report_data[period] = {
                'total_students': rankings.count(),
                'top_performer': {
                    'name': rankings.first().student.get_full_name() or rankings.first().student.email,
                    'email': rankings.first().student.email,
                    'rank': rankings.first().rank,
                    'points': rankings.first().total_points
                },
                'average_points': rankings.aggregate(
                    avg_points=timezone.db.models.Avg('total_points')
                )['avg_points'] or 0,
                'average_sat_score': sum(r.average_sat_score for r in rankings) / rankings.count(),
                'generated_at': timezone.now()
            }
    
    # Cache the report for 24 hours
    cache.set('ranking_report', report_data, timeout=86400)
    
    return "Ranking report generated and cached"


@shared_task
def recalculate_student_rankings(student_id):
    """
    Recalculate rankings for a specific student (useful for debugging or manual updates).
    """
    from apps.users.models import User
    
    try:
        student = User.objects.get(id=student_id, role='STUDENT')
        
        # Update rankings for all periods
        results = {}
        for period in ['WEEKLY', 'MONTHLY', 'ALL_TIME']:
            try:
                updated_rankings = Ranking.update_rankings(period)
                student_ranking = next(
                    (r for r in updated_rankings if r.student.id == student_id),
                    None
                )
                
                if student_ranking:
                    results[period] = {
                        'rank': student_ranking.rank,
                        'points': student_ranking.total_points,
                        'success': True
                    }
                else:
                    results[period] = {
                        'success': False,
                        'message': 'No ranking found for student'
                    }
            except Exception as e:
                results[period] = {
                    'success': False,
                    'message': str(e)
                }
        
        return f"Recalculated rankings for student {student_id}: {results}"
        
    except User.DoesNotExist:
        return f"Student with ID {student_id} not found"
    except Exception as e:
        return f"Failed to recalculate rankings: {str(e)}"


@shared_task
def validate_ranking_integrity():
    """
    Validate ranking data integrity.
    This task should be scheduled to run weekly.
    """
    issues = []
    
    # Check for duplicate ranks within the same period
    periods = ['WEEKLY', 'MONTHLY', 'ALL_TIME']
    
    for period in periods:
        period_start = Ranking.get_period_start(period)
        rankings = Ranking.objects.filter(
            period_type=period,
            period_start=period_start
        )
        
        # Check for rank gaps or duplicates
        ranks = list(rankings.values_list('rank', flat=True))
        expected_ranks = list(range(1, len(ranks) + 1))
        
        if sorted(ranks) != expected_ranks:
            issues.append(f"Rank integrity issue in {period}: expected {expected_ranks}, got {sorted(ranks)}")
        
        # Check for negative rank changes that seem unrealistic
        for ranking in rankings:
            if ranking.previous_rank and ranking.rank_change < -50:
                issues.append(f"Suspicious rank change for student {ranking.student.id} in {period}: {ranking.rank_change}")
    
    if issues:
        return f"Ranking integrity issues found: {issues}"
    else:
        return "Ranking integrity check passed - no issues found"
