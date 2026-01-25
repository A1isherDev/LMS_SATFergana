"""
Serializers for the questionbank app.
"""
from rest_framework import serializers
from apps.questionbank.models import Question, QuestionAttempt


class QuestionSerializer(serializers.ModelSerializer):
    """Detailed serializer for Question model."""
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'question_type_display', 'skill_tag', 'difficulty',
            'question_text', 'question_image', 'options', 'correct_answer', 'explanation',
            'estimated_time_seconds', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_options(self, value):
        """Validate options JSON structure."""
        import json
        
        # Convert string to dict if needed
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Options must be valid JSON")
        
        # Check required keys
        required_keys = ['A', 'B', 'C', 'D']
        if not all(key in value for key in required_keys):
            raise serializers.ValidationError("Options must contain A, B, C, and D keys")
        
        return value
    
    def validate(self, attrs):
        """Validate question data."""
        if attrs.get('estimated_time_seconds', 0) <= 0:
            raise serializers.ValidationError("Estimated time must be greater than 0")
        
        # Validate correct answer against options
        if 'options' in attrs and 'correct_answer' in attrs:
            valid_answers = ['A', 'B', 'C', 'D']
            if attrs['correct_answer'] not in valid_answers:
                raise serializers.ValidationError("Correct answer must be one of: A, B, C, D")
        
        return attrs


class QuestionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for question lists."""
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'question_type_display', 'skill_tag',
            'difficulty', 'estimated_time_seconds', 'is_active', 'created_at'
        ]


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Serializer for students (excludes correct answer and explanation)."""
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'question_type_display', 'skill_tag', 'difficulty',
            'question_text', 'question_image', 'options', 'estimated_time_seconds'
        ]


class QuestionAttemptSerializer(serializers.ModelSerializer):
    """Serializer for recording question attempts."""
    student_email = serializers.CharField(source='student.email', read_only=True)
    question_info = QuestionStudentSerializer(source='question', read_only=True)
    
    class Meta:
        model = QuestionAttempt
        fields = [
            'id', 'question', 'question_info', 'student', 'student_email',
            'selected_answer', 'is_correct', 'time_spent_seconds',
            'attempted_at', 'context', 'created_at'
        ]
        read_only_fields = ['id', 'is_correct', 'created_at']
    
    def validate_selected_answer(self, value):
        """Validate selected answer."""
        valid_answers = ['A', 'B', 'C', 'D']
        if value not in valid_answers:
            raise serializers.ValidationError("Selected answer must be A, B, C, or D")
        return value
    
    def validate_time_spent_seconds(self, value):
        """Validate time spent."""
        if value < 0:
            raise serializers.ValidationError("Time spent cannot be negative")
        return value
    
    def validate(self, attrs):
        """Validate attempt data."""
        # Check if question exists and is active
        question = attrs.get('question')
        if question and not question.is_active:
            raise serializers.ValidationError("Cannot attempt inactive question")
        
        return attrs


class QuestionAttemptCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating question attempts (simplified)."""
    
    class Meta:
        model = QuestionAttempt
        fields = ['question', 'selected_answer', 'time_spent_seconds', 'context']
    
    def validate_question(self, value):
        """Validate question is active."""
        if not value.is_active:
            raise serializers.ValidationError("Cannot attempt inactive question")
        return value
    
    def validate_selected_answer(self, value):
        """Validate selected answer."""
        valid_answers = ['A', 'B', 'C', 'D']
        if value not in valid_answers:
            raise serializers.ValidationError("Selected answer must be A, B, C, or D")
        return value
    
    def validate_time_spent_seconds(self, value):
        """Validate time spent."""
        if value < 0:
            raise serializers.ValidationError("Time spent cannot be negative")
        return value
    
    def create(self, validated_data):
        """Create attempt with current student."""
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)


class QuestionStatsSerializer(serializers.Serializer):
    """Serializer for question statistics."""
    question_id = serializers.IntegerField()
    question_type = serializers.CharField()
    skill_tag = serializers.CharField()
    difficulty = serializers.IntegerField()
    total_attempts = serializers.IntegerField()
    correct_attempts = serializers.IntegerField()
    accuracy_percentage = serializers.FloatField()
    average_time_seconds = serializers.FloatField()


class StudentProgressSerializer(serializers.Serializer):
    """Serializer for student progress statistics."""
    question_type = serializers.CharField()
    total_attempts = serializers.IntegerField()
    correct_attempts = serializers.IntegerField()
    accuracy_percentage = serializers.FloatField()
    average_time_seconds = serializers.FloatField()
    skill_breakdown = serializers.DictField()
