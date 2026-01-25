"""
Admin configuration for analytics app.
"""
from django.contrib import admin
from apps.analytics.models import StudentProgress, WeakArea, StudySession


@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    """Admin interface for StudentProgress model."""
    list_display = [
        'student', 'date', 'homework_completed', 'homework_total',
        'homework_completion_rate', 'homework_accuracy',
        'mock_exams_taken', 'latest_sat_score', 'study_time_minutes',
        'streak_days', 'created_at'
    ]
    list_filter = [
        'date', 'homework_completed', 'mock_exams_taken',
        'streak_days', 'created_at'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name'
    ]
    raw_id_fields = ['student']
    readonly_fields = [
        'created_at', 'updated_at', 'homework_completion_rate',
        'flashcard_mastery_rate'
    ]
    
    fieldsets = (
        ('Student & Date', {
            'fields': ('student', 'date')
        }),
        ('Homework Metrics', {
            'fields': (
                'homework_completed', 'homework_total', 'homework_accuracy'
            )
        }),
        ('Mock Exam Metrics', {
            'fields': (
                'mock_exams_taken', 'latest_sat_score', 'average_sat_score'
            )
        }),
        ('Flashcard Metrics', {
            'fields': (
                'flashcards_mastered', 'flashcards_total'
            )
        }),
        ('Study Metrics', {
            'fields': ('study_time_minutes', 'streak_days')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def homework_completion_rate(self, obj):
        """Display homework completion rate."""
        return obj.homework_completion_rate
    homework_completion_rate.short_description = 'Completion Rate'
    
    def flashcard_mastery_rate(self, obj):
        """Display flashcard mastery rate."""
        return obj.flashcard_mastery_rate
    flashcard_mastery_rate.short_description = 'Mastery Rate'


@admin.register(WeakArea)
class WeakAreaAdmin(admin.ModelAdmin):
    """Admin interface for WeakArea model."""
    list_display = [
        'student', 'area_type', 'subcategory', 'weakness_score',
        'accuracy_rate', 'question_count', 'last_updated'
    ]
    list_filter = [
        'area_type', 'weakness_score', 'last_updated'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name',
        'subcategory'
    ]
    raw_id_fields = ['student']
    readonly_fields = [
        'created_at', 'updated_at', 'accuracy_rate', 'last_updated'
    ]
    
    fieldsets = (
        ('Student & Area', {
            'fields': ('student', 'area_type', 'subcategory')
        }),
        ('Performance Metrics', {
            'fields': (
                'weakness_score', 'question_count', 'correct_count'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_updated'),
            'classes': ('collapse',)
        }),
    )
    
    def accuracy_rate(self, obj):
        """Display accuracy rate."""
        return obj.accuracy_rate
    accuracy_rate.short_description = 'Accuracy Rate'


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    """Admin interface for StudySession model."""
    list_display = [
        'student', 'session_type', 'started_at', 'ended_at',
        'duration_minutes', 'questions_attempted', 'questions_correct',
        'flashcards_reviewed', 'is_active', 'created_at'
    ]
    list_filter = [
        'session_type', 'started_at', 'ended_at'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name'
    ]
    raw_id_fields = ['student']
    readonly_fields = [
        'created_at', 'updated_at', 'accuracy_rate', 'is_active'
    ]
    
    fieldsets = (
        ('Student & Session', {
            'fields': ('student', 'session_type', 'started_at', 'ended_at')
        }),
        ('Performance Metrics', {
            'fields': (
                'duration_minutes', 'questions_attempted', 'questions_correct',
                'flashcards_reviewed'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def accuracy_rate(self, obj):
        """Display accuracy rate."""
        return obj.accuracy_rate
    accuracy_rate.short_description = 'Accuracy Rate'
    
    def is_active(self, obj):
        """Display active status."""
        return obj.is_active
    is_active.boolean = True
    is_active.short_description = 'Active'
