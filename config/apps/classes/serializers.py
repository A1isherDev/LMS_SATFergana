"""
Serializers for the classes app.
"""
from rest_framework import serializers
from apps.classes.models import Class, Announcement, ClassResource
from apps.users.serializers import UserSerializer


class ClassSerializer(serializers.ModelSerializer):
    """Detailed serializer for Class model."""
    teacher = UserSerializer(read_only=True)
    students = UserSerializer(many=True, read_only=True)
    current_student_count = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    has_ended = serializers.ReadOnlyField()
    announcements = serializers.SerializerMethodField()
    teacher_id = serializers.IntegerField(write_only=True, required=False)
    student_count = serializers.SerializerMethodField()
    class_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = [
            'id', 'name', 'description', 'teacher', 'teacher_id', 'students',
            'start_date', 'end_date', 'is_active', 'max_students',
            'current_student_count', 'student_count', 'is_full', 'has_ended',
            'class_stats', 'announcements', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'announcements', 'created_at', 'updated_at']
        extra_kwargs = {
            'start_date': {'required': False},
            'end_date': {'required': False},
        }
    
    def get_student_count(self, obj):
        """Get number of enrolled students."""
        return obj.students.count()
    
    def get_class_stats(self, obj):
        """Get class statistics for analytics."""
        from apps.homework.models import HomeworkSubmission
        from apps.users.models import User
        from django.db.models import Avg, Sum, Count
        
        students = obj.students.all()
        if not students.exists():
            return {
                'average_sat_score': 0,
                'average_completion_rate': 0,
                'total_study_time': 0,
                'active_students': 0
            }
        
        # Get SAT scores
        # Get SAT scores from actual mock exam attempts
        from apps.mockexams.models import MockExamAttempt
        attempts = MockExamAttempt.objects.filter(
            student__in=students,
            is_completed=True,
            sat_score__isnull=False
        )
        sat_scores = [attempt.sat_score for attempt in attempts]
        avg_sat = sum(sat_scores) / len(sat_scores) if sat_scores else 0
        
        # Get homework completion rates
        homework_submissions = HomeworkSubmission.objects.filter(
            student__in=students,
            submitted_at__isnull=False
        )
        
        total_homework = HomeworkSubmission.objects.filter(
            student__in=students
        ).count()
        
        completion_rate = (homework_submissions.count() / total_homework * 100) if total_homework > 0 else 0

        # Get total study time
        from apps.analytics.models import StudySession
        total_minutes = StudySession.objects.filter(
            student__in=students
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        return {
            'average_sat_score': round(avg_sat),
            'average_completion_rate': round(completion_rate, 1),
            'total_study_time': total_minutes,
            'active_students': students.count()
        }
    
    def get_announcements(self, obj):
        """Get recent active announcements for the class."""
        announcements = obj.announcements.filter(is_active=True)[:5]
        return AnnouncementSerializer(announcements, many=True).data
    
    def validate_teacher_id(self, value):
        """Validate that teacher exists and has TEACHER role."""
        from apps.users.models import User
        
        try:
            teacher = User.objects.get(id=value, role__in=['MAIN_TEACHER', 'SUPPORT_TEACHER'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid teacher ID or user is not a teacher")
        
        return value
    
    def validate(self, attrs):
        """Validate class dates and capacity."""
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['start_date'] >= attrs['end_date']:
                raise serializers.ValidationError("End date must be after start date")
        
        if attrs.get('max_students', 0) <= 0:
            raise serializers.ValidationError("Maximum students must be greater than 0")
        
        return attrs


class ClassListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for class lists."""
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    current_student_count = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    has_ended = serializers.ReadOnlyField()
    
    class Meta:
        model = Class
        fields = [
            'id', 'name', 'teacher_name', 'teacher_email',
            'start_date', 'end_date', 'is_active', 'max_students',
            'current_student_count', 'is_full', 'has_ended',
            'created_at'
        ]


class ClassEnrollmentSerializer(serializers.Serializer):
    """Serializer for enrolling/removing students from classes."""
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of student IDs to enroll/remove"
    )
    
    def validate_student_ids(self, value):
        """Validate that all students exist and have STUDENT role."""
        from apps.users.models import User
        
        invalid_ids = []
        for student_id in value:
            if not User.objects.filter(id=student_id, role='STUDENT').exists():
                invalid_ids.append(student_id)
        
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid student IDs or users are not students: {invalid_ids}"
            )
        
        return value


class ClassLeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for individual leaderboard entries."""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    student_email = serializers.CharField()
    total_points = serializers.IntegerField()
    homework_completion_rate = serializers.FloatField()
    homework_accuracy = serializers.FloatField()
    average_mock_score = serializers.FloatField()
    rank = serializers.IntegerField()


class ClassLeaderboardSerializer(serializers.Serializer):
    """Serializer for class leaderboard data."""
    class_id = serializers.IntegerField()
    class_name = serializers.CharField()
    period = serializers.CharField()
    leaderboard = ClassLeaderboardEntrySerializer(many=True)
    total_students = serializers.IntegerField()
    generated_at = serializers.DateTimeField()


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for Class Announcement model."""
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    class_obj = serializers.PrimaryKeyRelatedField(read_only=True)
    teacher = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'class_obj', 'teacher', 'teacher_name',
            'title', 'content', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ClassResourceSerializer(serializers.ModelSerializer):
    """Serializer for Class Resource model."""
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    
    class Meta:
        model = ClassResource
        fields = [
            'id', 'class_obj', 'teacher', 'teacher_name',
            'title', 'description', 'resource_type', 'resource_type_display',
            'file', 'url', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'teacher']
