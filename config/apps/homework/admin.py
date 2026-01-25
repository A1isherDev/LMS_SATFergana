"""
Admin configuration for homework app.
"""
from django.contrib import admin
from apps.homework.models import Homework, HomeworkSubmission


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    """Admin interface for Homework model."""
    list_display = [
        'title', 'class_obj', 'assigned_by', 'due_date',
        'max_score', 'is_published', 'total_questions', 'created_at'
    ]
    list_filter = [
        'is_published', 'due_date', 'created_at',
        'class_obj', 'assigned_by'
    ]
    search_fields = ['title', 'description', 'class_obj__name']
    raw_id_fields = ['class_obj', 'assigned_by']
    filter_horizontal = ['questions']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Homework Details', {
            'fields': ('title', 'description', 'class_obj', 'assigned_by')
        }),
        ('Questions', {
            'fields': ('questions',)
        }),
        ('Schedule', {
            'fields': ('due_date', 'is_published')
        }),
        ('Scoring', {
            'fields': ('max_score',)
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


@admin.register(HomeworkSubmission)
class HomeworkSubmissionAdmin(admin.ModelAdmin):
    """Admin interface for HomeworkSubmission model."""
    list_display = [
        'student', 'homework', 'is_submitted', 'is_late',
        'score', 'time_spent_seconds', 'submitted_at', 'created_at'
    ]
    list_filter = [
        'is_late', 'submitted_at', 'created_at',
        'homework__class_obj', 'homework__assigned_by'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name',
        'homework__title'
    ]
    raw_id_fields = ['homework', 'student']
    readonly_fields = ['created_at', 'submitted_at']
    
    fieldsets = (
        ('Submission Details', {
            'fields': ('homework', 'student', 'submitted_at', 'is_late')
        }),
        ('Performance', {
            'fields': ('score', 'time_spent_seconds', 'answers')
        }),
        ('Feedback', {
            'fields': ('feedback',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def is_submitted(self, obj):
        """Display submission status."""
        return obj.is_submitted
    is_submitted.boolean = True
    is_submitted.short_description = 'Submitted'
    
    def get_readonly_fields(self, request, obj=None):
        """Make some fields readonly after creation."""
        if obj:
            return self.readonly_fields + ['homework', 'student', 'answers']
        return self.readonly_fields
