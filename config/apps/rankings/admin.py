"""
Admin configuration for rankings app.
"""
from django.contrib import admin
from apps.rankings.models import Ranking


@admin.register(Ranking)
class RankingAdmin(admin.ModelAdmin):
    """Admin interface for Ranking model."""
    list_display = [
        'student', 'period_type', 'rank', 'previous_rank', 'rank_change_display',
        'total_points', 'homework_completion_rate', 'average_sat_score',
        'period_start', 'created_at'
    ]
    list_filter = [
        'period_type', 'rank', 'period_start', 'created_at'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name'
    ]
    raw_id_fields = ['student']
    readonly_fields = [
        'created_at', 'updated_at', 'rank_change', 'rank_change_display',
        'average_sat_score', 'highest_sat_score'
    ]
    
    fieldsets = (
        ('Ranking Details', {
            'fields': ('student', 'period_type', 'rank', 'previous_rank')
        }),
        ('Performance Metrics', {
            'fields': (
                'total_points', 'homework_completion_rate', 'homework_accuracy',
                'mock_exam_scores'
            )
        }),
        ('Period Information', {
            'fields': ('period_start', 'period_end')
        }),
        ('Calculated Fields', {
            'fields': (
                'rank_change', 'rank_change_display', 'average_sat_score',
                'highest_sat_score'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def rank_change_display(self, obj):
        """Display rank change with formatting."""
        return obj.rank_change_display
    rank_change_display.short_description = 'Rank Change'
    
    def average_sat_score(self, obj):
        """Display average SAT score."""
        return obj.average_sat_score
    average_sat_score.short_description = 'Avg SAT Score'
    
    def highest_sat_score(self, obj):
        """Display highest SAT score."""
        return obj.highest_sat_score
    highest_sat_score.short_description = 'Highest SAT Score'
    
    def rank_change(self, obj):
        """Display rank change."""
        return obj.rank_change
    rank_change.short_description = 'Rank Change'
    
    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly after creation."""
        if obj:
            return self.readonly_fields + ['student', 'period_type', 'period_start', 'period_end']
        return self.readonly_fields
