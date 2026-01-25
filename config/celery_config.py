"""
Celery configuration for SAT LMS platform.
"""
import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set default Celery configuration
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('sat_lms')

# Celery Configuration Options
app.config_from_object('django.conf:settings', namespace='CELERY')

# Database routing
app.autodiscover_tasks()

# Task routing
app.conf.task_routes = {
    'apps.homework.tasks.*': {'queue': 'homework'},
    'apps.mockexams.tasks.*': {'queue': 'mockexams'},
    'apps.flashcards.tasks.*': {'queue': 'flashcards'},
    'apps.rankings.tasks.*': {'queue': 'rankings'},
    'apps.analytics.tasks.*': {'queue': 'analytics'},
}

# Periodic Tasks Configuration
app.conf.beat_schedule = {
    # Homework tasks
    'mark-late-submissions': {
        'task': 'apps.homework.tasks.mark_late_submissions',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'auto-submit-overdue-homework': {
        'task': 'apps.homework.tasks.auto_submit_overdue_homework',
        'schedule': crontab(minute='0', hour='*/1'),  # Every hour
    },
    'calculate-homework-statistics': {
        'task': 'apps.homework.tasks.calculate_homework_statistics',
        'schedule': crontab(minute='0', hour='2'),  # Daily at 2 AM
    },
    
    # Mock exam tasks
    'auto-submit-expired-exams': {
        'task': 'apps.mockexams.tasks.auto_submit_expired_exams',
        'schedule': crontab(minute='*/1'),  # Every minute
    },
    'calculate-mock-exam-statistics': {
        'task': 'apps.mockexams.tasks.calculate_mock_exam_statistics',
        'schedule': crontab(minute='*/10'),  # Every 10 minutes
    },
    'cleanup-old-attempts': {
        'task': 'apps.mockexams.tasks.cleanup_old_attempts',
        'schedule': crontab(minute='0', hour='3'),  # Daily at 3 AM
    },
    
    # Rankings tasks
    'update-weekly-rankings': {
        'task': 'apps.rankings.tasks.update_weekly_rankings',
        'schedule': crontab(minute='0', hour='1', day_of_week='1'),  # Monday 1 AM
    },
    'update-monthly-rankings': {
        'task': 'apps.rankings.tasks.update_monthly_rankings',
        'schedule': crontab(minute='0', hour='1', day='1'),  # 1st of month 1 AM
    },
    'update-all-time-rankings': {
        'task': 'apps.rankings.tasks.update_all_time_rankings',
        'schedule': crontab(minute='0', hour='2'),  # Daily at 2 AM
    },
    'cleanup-old-rankings': {
        'task': 'apps.rankings.tasks.cleanup_old_rankings',
        'schedule': crontab(minute='0', hour='0', day='1'),  # 1st of month midnight
    },
    'validate-ranking-integrity': {
        'task': 'apps.rankings.tasks.validate_ranking_integrity',
        'schedule': crontab(minute='0', hour='0', day_of_week='1'),  # Monday midnight
    },
    
    # Analytics tasks
    'generate-ranking-report': {
        'task': 'apps.rankings.tasks.generate_ranking_report',
        'schedule': crontab(minute='0', hour='1'),  # Daily at 1 AM
    },
}

# Task configuration
app.conf.task_soft_time_limit = 300  # 5 minutes
app.conf.task_time_limit = 600     # 10 minutes
app.conf.result_expires = 3600      # 1 hour
app.conf.task_serializer = 'json'
app.conf.result_serializer = 'json'
app.conf.accept_content = ['json']
app.conf.timezone = 'UTC'
app.conf.enable_utc = True

# Worker configuration
app.conf.worker_concurrency = 4
app.conf.worker_prefetch_multiplier = 1
app.conf.worker_max_tasks_per_child = 1000
app.conf.worker_max_memory_per_child = 20000

# Broker configuration
app.conf.broker_url = settings.REDIS_URL
app.conf.result_backend = 'django-db'
app.conf.broker_connection_retry = True
app.conf.broker_connection_retry_delay = 30
app.conf.broker_connection_retry_max_retries = 3
