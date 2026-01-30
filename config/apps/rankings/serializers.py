"""
Serializers for the rankings app.
"""
from rest_framework import serializers
from apps.rankings.models import Ranking


class RankingSerializer(serializers.ModelSerializer):
    """Serializer for Ranking model."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)
    rank_change = serializers.ReadOnlyField()
    rank_change_display = serializers.ReadOnlyField()
    average_sat_score = serializers.ReadOnlyField()
    highest_sat_score = serializers.ReadOnlyField()
    
    class Meta:
        model = Ranking
        fields = [
            'id', 'student', 'student_name', 'student_email', 'period_type',
            'period_type_display', 'period_start', 'period_end', 'rank',
            'previous_rank', 'rank_change', 'rank_change_display',
            'total_points', 'homework_completion_rate', 'homework_accuracy',
            'mock_exam_scores', 'average_sat_score', 'highest_sat_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'period_start', 'period_end', 'rank',
            'previous_rank', 'created_at', 'updated_at'
        ]


class RankingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for ranking lists."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)
    rank_change_display = serializers.ReadOnlyField()
    
    class Meta:
        model = Ranking
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'period_type', 'period_type_display', 'rank',
            'rank_change_display', 'total_points', 'created_at'
        ]


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for individual leaderboard entries."""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    student_email = serializers.CharField()
    student_bio = serializers.CharField(allow_null=True, required=False)
    rank = serializers.IntegerField()
    rank_change = serializers.IntegerField()
    rank_change_display = serializers.CharField()
    total_points = serializers.IntegerField()
    homework_completion_rate = serializers.FloatField()
    homework_accuracy = serializers.FloatField()
    average_sat_score = serializers.FloatField()
    highest_sat_score = serializers.IntegerField()
    mock_exam_count = serializers.IntegerField()
    study_time_minutes = serializers.IntegerField()


class LeaderboardSerializer(serializers.Serializer):
    """Serializer for complete leaderboard data."""
    period_type = serializers.CharField()
    period_start = serializers.DateTimeField()
    period_end = serializers.DateTimeField()
    total_students = serializers.IntegerField()
    leaderboard = LeaderboardEntrySerializer(many=True)
    generated_at = serializers.DateTimeField()
    
    def validate_period_type(self, value):
        """Validate period type."""
        valid_types = ['WEEKLY', 'MONTHLY', 'ALL_TIME']
        if value not in valid_types:
            raise serializers.ValidationError(f"Period type must be one of: {valid_types}")
        return value


class RankingStatsSerializer(serializers.Serializer):
    """Serializer for ranking statistics."""
    total_students = serializers.IntegerField()
    average_points = serializers.FloatField()
    average_sat_score = serializers.FloatField()
    average_completion_rate = serializers.FloatField()
    average_accuracy = serializers.FloatField()
    top_performer = serializers.DictField()
    period_type = serializers.CharField()


class StudentRankingSummarySerializer(serializers.Serializer):
    """Serializer for student's ranking summary across all periods."""
    weekly_ranking = RankingListSerializer(read_only=True)
    monthly_ranking = RankingListSerializer(read_only=True)
    all_time_ranking = RankingListSerializer(read_only=True)
    best_rank = serializers.IntegerField()
    best_period = serializers.CharField()
    current_rank_trend = serializers.CharField()  # 'up', 'down', 'stable'


class RankingUpdateSerializer(serializers.Serializer):
    """Serializer for triggering ranking updates."""
    period_type = serializers.ChoiceField(
        choices=['WEEKLY', 'MONTHLY', 'ALL_TIME'],
        required=True,
        help_text="Type of ranking to update"
    )
    force_recalculate = serializers.BooleanField(
        default=False,
        help_text="Force recalculation of all rankings for the period"
    )
