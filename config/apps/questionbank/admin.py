"""
Admin configuration for questionbank app.
"""
from django.contrib import admin
from apps.questionbank.models import Question, QuestionAttempt


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    """Admin interface for Question model."""
    list_display = [
        'id', 'question_type', 'skill_tag', 'difficulty',
        'is_active', 'created_at'
    ]
    list_filter = [
        'question_type', 'skill_tag', 'difficulty', 'is_active', 'created_at'
    ]
    search_fields = ['question_text', 'skill_tag']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Question Details', {
            'fields': (
                'question_type', 'skill_tag', 'difficulty',
                'question_text', 'question_image'
            )
        }),
        ('Answer Information', {
            'fields': ('options', 'correct_answer', 'explanation')
        }),
        ('Settings', {
            'fields': ('estimated_time_seconds', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make some fields readonly after creation."""
        if obj:
            return self.readonly_fields
        return self.readonly_fields


@admin.register(QuestionAttempt)
class QuestionAttemptAdmin(admin.ModelAdmin):
    """Admin interface for QuestionAttempt model."""
    list_display = [
        'student', 'question', 'selected_answer', 'is_correct',
        'time_spent_seconds', 'context', 'attempted_at'
    ]
    list_filter = [
        'is_correct', 'context', 'question__question_type',
        'question__skill_tag', 'attempted_at'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name',
        'question__question_text', 'question__skill_tag'
    ]
    raw_id_fields = ['question', 'student']
    readonly_fields = ['created_at', 'attempted_at']
    
    fieldsets = (
        ('Attempt Details', {
            'fields': ('question', 'student', 'selected_answer', 'is_correct')
        }),
        ('Performance', {
            'fields': ('time_spent_seconds', 'context')
        }),
        ('Timestamps', {
            'fields': ('attempted_at', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make some fields readonly after creation."""
        if obj:
            return self.readonly_fields + ['question', 'student', 'selected_answer']
        return self.readonly_fields
