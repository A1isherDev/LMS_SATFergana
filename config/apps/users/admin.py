"""
Admin configuration for users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import User, StudentProfile, Invitation


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Invitation', {'fields': ('invitation_code', 'invited_by')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    
    filter_horizontal = ['groups', 'user_permissions']


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    """Admin interface for StudentProfile model."""
    list_display = ['user', 'target_sat_score', 'estimated_current_score', 'sat_exam_date', 'created_at']
    list_filter = ['created_at', 'sat_exam_date']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('SAT Information', {
            'fields': (
                'target_sat_score',
                'estimated_current_score',
                'sat_exam_date',
                'weak_areas'
            )
        }),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    """Admin interface for Invitation model."""
    list_display = ['code', 'email', 'role', 'invited_by', 'is_used', 'used_by', 'expires_at', 'created_at']
    list_filter = ['role', 'is_used', 'expires_at', 'created_at']
    search_fields = ['code', 'email', 'invited_by__email']
    raw_id_fields = ['invited_by', 'used_by']
    readonly_fields = ['code', 'created_at', 'updated_at', 'used_at']
    
    fieldsets = (
        ('Invitation Details', {
            'fields': ('code', 'invited_by', 'email', 'role', 'expires_at')
        }),
        ('Usage', {
            'fields': ('is_used', 'used_by', 'used_at')
        }),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make code readonly after creation."""
        if obj:
            return self.readonly_fields + ['code']
        return self.readonly_fields
