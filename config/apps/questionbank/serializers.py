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
            'estimated_time_seconds', 'is_active', 'is_math_input', 'created_at', 'updated_at'
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
    """Lightweight serializer for question lists (includes question_text for card preview)."""
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'question_type_display', 'skill_tag',
<<<<<<< HEAD
            'difficulty', 'question_text', 'estimated_time_seconds', 'is_active', 'is_math_input', 'created_at'
=======
            'difficulty', 'question_text', 'options', 'estimated_time_seconds',
            'is_active', 'created_at', 'tags'
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
        ]

    def get_tags(self, obj):
        """Return skill_tag as a list for frontend compatibility."""
        return [obj.skill_tag] if obj.skill_tag else []


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Serializer for students (excludes correct answer and explanation)."""
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'question_type_display', 'skill_tag', 'difficulty',
            'question_text', 'question_image', 'options', 'estimated_time_seconds', 'is_math_input'
        ]


class QuestionReviewSerializer(serializers.ModelSerializer):
    """Serializer for students to review (includes correct answer and explanation)."""
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'question_type_display', 'skill_tag', 'difficulty',
            'question_text', 'question_image', 'options', 'correct_answer', 'explanation',
            'estimated_time_seconds', 'is_math_input'
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
    """Serializer for creating question attempts. Accepts time_taken_seconds/attempt_type from frontend."""
    time_taken_seconds = serializers.IntegerField(required=False, min_value=0)
    attempt_type = serializers.CharField(required=False, default='PRACTICE')

    class Meta:
        model = QuestionAttempt
        fields = ['question', 'selected_answer', 'time_spent_seconds', 'time_taken_seconds', 'context', 'attempt_type']

    def validate_question(self, value):
        """Validate question is active."""
        if not value.is_active:
            raise serializers.ValidationError("Cannot attempt inactive question")
        return value
<<<<<<< HEAD
    

    
    def validate_time_spent_seconds(self, value):
        """Validate time spent."""
        if value < 0:
            raise serializers.ValidationError("Time spent cannot be negative")
        return value
    
=======

    def validate_selected_answer(self, value):
        """Validate selected answer."""
        valid_answers = ['A', 'B', 'C', 'D']
        if value not in valid_answers:
            raise serializers.ValidationError("Selected answer must be A, B, C, or D")
        return value

    def validate(self, attrs):
        """Map time_taken_seconds -> time_spent_seconds, attempt_type -> context."""
        if 'time_taken_seconds' in attrs and 'time_spent_seconds' not in attrs:
            attrs['time_spent_seconds'] = attrs.pop('time_taken_seconds', 0)
        if 'attempt_type' in attrs:
            attrs['context'] = attrs.pop('attempt_type', 'PRACTICE')
        if attrs.get('time_spent_seconds', 0) < 0:
            raise serializers.ValidationError({"time_spent_seconds": "Time spent cannot be negative"})
        return attrs

>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
    def create(self, validated_data):
        """Create attempt with current student and set is_correct."""
        validated_data.pop('time_taken_seconds', None)
        validated_data.pop('attempt_type', None)
        validated_data['student'] = self.context['request'].user
        question = validated_data['question']
        validated_data['is_correct'] = (validated_data.get('selected_answer') == question.correct_answer)
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
