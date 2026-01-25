"""
Serializers for the classes app.
"""
from rest_framework import serializers
from apps.classes.models import Class
from apps.users.serializers import UserSerializer


class ClassSerializer(serializers.ModelSerializer):
    """Detailed serializer for Class model."""
    teacher = UserSerializer(read_only=True)
    students = UserSerializer(many=True, read_only=True)
    current_student_count = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    has_ended = serializers.ReadOnlyField()
    teacher_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Class
        fields = [
            'id', 'name', 'description', 'teacher', 'teacher_id', 'students',
            'start_date', 'end_date', 'is_active', 'max_students',
            'current_student_count', 'is_full', 'has_ended',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_teacher_id(self, value):
        """Validate that teacher exists and has TEACHER role."""
        from apps.users.models import User
        
        try:
            teacher = User.objects.get(id=value, role='TEACHER')
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
