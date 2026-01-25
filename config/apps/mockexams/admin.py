"""
Admin configuration for mockexams app.
"""
from django.contrib import admin
from apps.mockexams.models import MockExam, MockExamAttempt


@admin.register(MockExam)
class MockExamAdmin(admin.ModelAdmin):
    """Admin interface for MockExam model."""
    list_display = [
        'title', 'exam_type', 'total_questions', 'total_time_seconds',
        'is_active', 'created_at'
    ]
    list_filter = ['exam_type', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Exam Details', {
            'fields': ('title', 'description', 'exam_type', 'is_active')
        }),
        ('Time Limits', {
            'fields': ('math_time_limit', 'reading_time_limit', 'writing_time_limit')
        }),
        ('Questions', {
            'fields': ('math_questions', 'reading_questions', 'writing_questions')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def total_questions(self, obj):
        """Display total number of questions."""
        return obj.total_questions
    total_questions.short_description = 'Total Questions'
    
    def total_time_seconds(self, obj):
        """Display total time limit."""
        return obj.total_time_seconds
    total_time_seconds.short_description = 'Total Time (seconds)'


@admin.register(MockExamAttempt)
class MockExamAttemptAdmin(admin.ModelAdmin):
    """Admin interface for MockExamAttempt model."""
    list_display = [
        'student', 'mock_exam', 'is_completed', 'sat_score',
        'started_at', 'submitted_at', 'duration_seconds'
    ]
    list_filter = [
        'is_completed', 'mock_exam__exam_type', 'started_at', 'submitted_at'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name',
        'mock_exam__title'
    ]
    raw_id_fields = ['mock_exam', 'student']
    readonly_fields = [
        'started_at', 'submitted_at', 'math_raw_score', 'reading_raw_score',
        'writing_raw_score', 'total_raw_score', 'math_scaled_score',
        'reading_scaled_score', 'writing_scaled_score', 'sat_score',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Attempt Details', {
            'fields': ('mock_exam', 'student', 'started_at', 'submitted_at', 'is_completed')
        }),
        ('Raw Scores', {
            'fields': (
                'math_raw_score', 'reading_raw_score', 'writing_raw_score',
                'total_raw_score'
            ),
            'classes': ('collapse',)
        }),
        ('Scaled Scores', {
            'fields': (
                'math_scaled_score', 'reading_scaled_score', 'writing_scaled_score',
                'sat_score'
            ),
            'classes': ('collapse',)
        }),
        ('Student Data', {
            'fields': ('answers', 'time_spent_by_section'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def duration_seconds(self, obj):
        """Display duration of the attempt."""
        if obj.submitted_at:
            return int((obj.submitted_at - obj.started_at).total_seconds())
        return "In Progress"
    duration_seconds.short_description = 'Duration (seconds)'
