"""
Admin configuration for classes app.
"""
from django.contrib import admin
from apps.classes.models import Class


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    """Admin interface for Class model."""
    list_display = [
        'name', 'teacher', 'current_student_count', 'max_students',
        'is_active', 'start_date', 'end_date', 'created_at'
    ]
    list_filter = ['is_active', 'start_date', 'end_date', 'created_at']
    search_fields = ['name', 'teacher__email', 'teacher__first_name', 'teacher__last_name']
    raw_id_fields = ['teacher']
    filter_horizontal = ['students']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Class Information', {
            'fields': ('name', 'description', 'teacher', 'students')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date', 'is_active')
        }),
        ('Capacity', {
            'fields': ('max_students',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def current_student_count(self, obj):
        """Display current number of enrolled students."""
        return obj.current_student_count
    current_student_count.short_description = 'Current Students'
    
    def get_readonly_fields(self, request, obj=None):
        """Make some fields readonly after creation."""
        if obj:
            return self.readonly_fields + ['teacher']
        return self.readonly_fields
