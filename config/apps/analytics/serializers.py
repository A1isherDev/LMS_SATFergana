"""
Serializers for the analytics app.
"""
from rest_framework import serializers
from apps.analytics.models import StudentProgress, WeakArea, StudySession


class StudentProgressSerializer(serializers.ModelSerializer):
    """Serializer for StudentProgress model."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    homework_completion_rate = serializers.ReadOnlyField()
    flashcard_mastery_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = StudentProgress
        fields = [
            'id', 'student', 'student_name', 'student_email', 'date',
            'homework_completed', 'homework_total', 'homework_completion_rate',
            'homework_accuracy', 'mock_exams_taken', 'latest_sat_score',
            'average_sat_score', 'flashcards_mastered', 'flashcards_total',
            'flashcard_mastery_rate', 'study_time_minutes', 'streak_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'date', 'created_at', 'updated_at'
        ]


class WeakAreaSerializer(serializers.ModelSerializer):
    """Serializer for WeakArea model."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    accuracy_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = WeakArea
        fields = [
            'id', 'student', 'student_name', 'student_email', 'area_type',
            'subcategory', 'weakness_score', 'question_count', 'correct_count',
            'accuracy_rate', 'last_updated', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'created_at', 'updated_at'
        ]


class StudySessionSerializer(serializers.ModelSerializer):
    """Serializer for StudySession model."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    accuracy_rate = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = StudySession
        fields = [
            'id', 'student', 'student_name', 'student_email', 'session_type',
            'session_type_display', 'started_at', 'ended_at', 'duration_minutes',
            'questions_attempted', 'questions_correct', 'flashcards_reviewed',
            'accuracy_rate', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'started_at', 'created_at', 'updated_at'
        ]


class ProgressChartSerializer(serializers.Serializer):
    """Serializer for progress chart data."""
    date = serializers.DateField()
    homework_completion_rate = serializers.FloatField()
    homework_accuracy = serializers.FloatField()
    sat_score = serializers.IntegerField(allow_null=True)
    flashcard_mastery_rate = serializers.FloatField()
    study_time_minutes = serializers.IntegerField()


class WeakAreaAnalysisSerializer(serializers.Serializer):
    """Serializer for weak area analysis."""
    area_type = serializers.CharField()
    subcategory = serializers.CharField()
    weakness_score = serializers.FloatField()
    accuracy_rate = serializers.FloatField()
    question_count = serializers.IntegerField()
    improvement_suggestion = serializers.CharField()


class StudyTimeAnalysisSerializer(serializers.Serializer):
    """Serializer for study time analysis."""
    total_study_time = serializers.IntegerField()
    average_daily_time = serializers.FloatField()
    study_streak = serializers.IntegerField()
    most_productive_day = serializers.CharField()
    session_type_breakdown = serializers.DictField()


class PerformanceTrendSerializer(serializers.Serializer):
    """Serializer for performance trends."""
    period = serializers.CharField()
    sat_score_trend = serializers.CharField()  # 'improving', 'declining', 'stable'
    homework_accuracy_trend = serializers.CharField()
    flashcard_mastery_trend = serializers.CharField()
    overall_trend_score = serializers.FloatField()


class StudentAnalyticsSummarySerializer(serializers.Serializer):
    """Serializer for comprehensive student analytics summary."""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    student_email = serializers.CharField()
    current_sat_score = serializers.IntegerField()
    target_sat_score = serializers.IntegerField()
    score_gap = serializers.IntegerField()
    homework_completion_rate = serializers.FloatField()
    homework_accuracy = serializers.FloatField()
    flashcard_mastery_rate = serializers.FloatField()
    study_streak = serializers.IntegerField()
    total_study_time = serializers.IntegerField()
    weak_areas = WeakAreaAnalysisSerializer(many=True)
    performance_trends = PerformanceTrendSerializer()
    recent_progress = ProgressChartSerializer(many=True)


class ClassAnalyticsSerializer(serializers.Serializer):
    """Serializer for class-level analytics (teachers/admins)."""
    class_id = serializers.IntegerField()
    class_name = serializers.CharField()
    total_students = serializers.IntegerField()
    average_sat_score = serializers.FloatField()
    average_homework_completion = serializers.FloatField()
    average_homework_accuracy = serializers.FloatField()
    top_performer = serializers.DictField()
    struggling_students = serializers.ListField()
    class_weak_areas = serializers.ListField()
    study_time_stats = serializers.DictField()


class StudySessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating study sessions."""
    
    class Meta:
        model = StudySession
        fields = ['session_type']
    
    def create(self, validated_data):
        """Create study session for current student."""
        student = self.context['request'].user
        
        # End any active sessions
        StudySession.objects.filter(
            student=student,
            ended_at__isnull=True
        ).update(ended_at=timezone.now())
        
        return StudySession.start_session(student, validated_data['session_type'])


class StudySessionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating study sessions."""
    
    class Meta:
        model = StudySession
        fields = [
            'questions_attempted', 'questions_correct', 'flashcards_reviewed'
        ]


class TopicAnalyticsSerializer(serializers.Serializer):
    """Serializer for topic-level performance data."""
    skill_tag = serializers.CharField()
    question_type = serializers.CharField()
    total_attempts = serializers.IntegerField()
    correct_attempts = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()
    average_time_seconds = serializers.FloatField()
