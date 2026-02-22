"""
Serializers for the mockexams app.
"""
from rest_framework import serializers
from apps.mockexams.models import MockExam, MockExamAttempt
# from apps.questionbank.serializers import QuestionStudentSerializer  # Moved to inline to avoid circular import


class MockExamSerializer(serializers.ModelSerializer):
    """Detailed serializer for MockExam model."""
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    total_questions = serializers.ReadOnlyField()
    total_time_seconds = serializers.ReadOnlyField()
    total_questions = serializers.ReadOnlyField()
    total_time_seconds = serializers.ReadOnlyField()
    # math_questions = QuestionStudentSerializer(many=True, read_only=True)
    # reading_questions = QuestionStudentSerializer(many=True, read_only=True)
    # writing_questions = QuestionStudentSerializer(many=True, read_only=True)
    math_questions = serializers.SerializerMethodField()
    reading_questions = serializers.SerializerMethodField()
    writing_questions = serializers.SerializerMethodField()
    math_question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of math question IDs"
    )
    reading_question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of reading question IDs"
    )
    writing_question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of writing question IDs"
    )
    
    class Meta:
        model = MockExam
        fields = [
            'id', 'title', 'description', 'exam_type', 'exam_type_display',
            'math_questions', 'reading_questions', 'writing_questions',
            'math_question_ids', 'reading_question_ids', 'writing_question_ids',
            'math_time_limit', 'reading_time_limit', 'writing_time_limit',
            'is_active', 'total_questions', 'total_time_seconds',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_math_questions(self, obj):
        from apps.questionbank.serializers import QuestionStudentSerializer
        return QuestionStudentSerializer(obj.math_questions.all(), many=True).data

    def get_reading_questions(self, obj):
        from apps.questionbank.serializers import QuestionStudentSerializer
        return QuestionStudentSerializer(obj.reading_questions.all(), many=True).data

    def get_writing_questions(self, obj):
        from apps.questionbank.serializers import QuestionStudentSerializer
        return QuestionStudentSerializer(obj.writing_questions.all(), many=True).data
    
    def validate_question_ids(self, value, question_type):
        """Validate question IDs for a specific type."""
        if not value:
            return value
        
        from apps.questionbank.models import Question
        
        # Check if all questions exist and are active
        invalid_ids = []
        inactive_ids = []
        wrong_type_ids = []
        
        for question_id in value:
            try:
                question = Question.objects.get(id=question_id)
                if not question.is_active:
                    inactive_ids.append(question_id)
                elif question.question_type != question_type:
                    wrong_type_ids.append(question_id)
            except Question.DoesNotExist:
                invalid_ids.append(question_id)
        
        error_messages = []
        if invalid_ids:
            error_messages.append(f"Invalid question IDs: {invalid_ids}")
        if inactive_ids:
            error_messages.append(f"Inactive question IDs: {inactive_ids}")
        if wrong_type_ids:
            error_messages.append(f"Wrong type question IDs: {wrong_type_ids}")
        
        if error_messages:
            raise serializers.ValidationError(" ".join(error_messages))
        
        return value
    
    def validate_math_question_ids(self, value):
        """Validate math question IDs."""
        return self.validate_question_ids(value, 'MATH')
    
    def validate_reading_question_ids(self, value):
        """Validate reading question IDs."""
        return self.validate_question_ids(value, 'READING')
    
    def validate_writing_question_ids(self, value):
        """Validate writing question IDs."""
        return self.validate_question_ids(value, 'WRITING')
    
    def validate(self, attrs):
        """Validate exam data based on exam type."""
        exam_type = attrs.get('exam_type', 'FULL')
        
        if exam_type == 'FULL':
            if not attrs.get('math_question_ids'):
                raise serializers.ValidationError("Full exam must have math questions")
            if not attrs.get('reading_question_ids'):
                raise serializers.ValidationError("Full exam must have reading questions")
            if not attrs.get('writing_question_ids'):
                raise serializers.ValidationError("Full exam must have writing questions")
        elif exam_type == 'MATH_ONLY':
            if not attrs.get('math_question_ids'):
                raise serializers.ValidationError("Math-only exam must have math questions")
        elif exam_type == 'READING_WRITING_ONLY':
            if not attrs.get('reading_question_ids'):
                raise serializers.ValidationError("Reading & Writing exam must have reading questions")
            if not attrs.get('writing_question_ids'):
                raise serializers.ValidationError("Reading & Writing exam must have writing questions")
        
        # Validate time limits
        if attrs.get('math_time_limit', 0) <= 0:
            raise serializers.ValidationError("Math time limit must be greater than 0")
        if attrs.get('reading_time_limit', 0) <= 0:
            raise serializers.ValidationError("Reading time limit must be greater than 0")
        if attrs.get('writing_time_limit', 0) <= 0:
            raise serializers.ValidationError("Writing time limit must be greater than 0")
        
        return attrs
    
    def create(self, validated_data):
        """Create mock exam with questions."""
        math_question_ids = validated_data.pop('math_question_ids', [])
        reading_question_ids = validated_data.pop('reading_question_ids', [])
        writing_question_ids = validated_data.pop('writing_question_ids', [])
        
        mock_exam = super().create(validated_data)
        
        # Add questions to exam
        from apps.questionbank.models import Question
        
        if math_question_ids:
            math_questions = Question.objects.filter(id__in=math_question_ids)
            mock_exam.math_questions.set(math_questions)
        
        if reading_question_ids:
            reading_questions = Question.objects.filter(id__in=reading_question_ids)
            mock_exam.reading_questions.set(reading_questions)
        
        if writing_question_ids:
            writing_questions = Question.objects.filter(id__in=writing_question_ids)
            mock_exam.writing_questions.set(writing_questions)
        
        return mock_exam
    
    def update(self, instance, validated_data):
        """Update mock exam with questions."""
        math_question_ids = validated_data.pop('math_question_ids', None)
        reading_question_ids = validated_data.pop('reading_question_ids', None)
        writing_question_ids = validated_data.pop('writing_question_ids', None)
        
        mock_exam = super().update(instance, validated_data)
        
        # Update questions if provided
        from apps.questionbank.models import Question
        
        if math_question_ids is not None:
            math_questions = Question.objects.filter(id__in=math_question_ids)
            mock_exam.math_questions.set(math_questions)
        
        if reading_question_ids is not None:
            reading_questions = Question.objects.filter(id__in=reading_question_ids)
            mock_exam.reading_questions.set(reading_questions)
        
        if writing_question_ids is not None:
            writing_questions = Question.objects.filter(id__in=writing_question_ids)
            mock_exam.writing_questions.set(writing_questions)
        
        return mock_exam


class MockExamListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for mock exam lists."""
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    total_questions = serializers.ReadOnlyField()
    total_time_seconds = serializers.ReadOnlyField()
    
    class Meta:
        model = MockExam
        fields = [
            'id', 'title', 'exam_type', 'exam_type_display',
            'is_active', 'total_questions', 'total_time_seconds',
            'created_at'
        ]


class MockExamAttemptSerializer(serializers.ModelSerializer):
    """Serializer for mock exam attempts."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    exam_title = serializers.CharField(source='mock_exam.title', read_only=True)
    exam_type = serializers.CharField(source='mock_exam.exam_type', read_only=True)
    duration_seconds = serializers.ReadOnlyField()
    is_over_time = serializers.ReadOnlyField()
    overall_progress = serializers.ReadOnlyField()
    
    class Meta:
        model = MockExamAttempt
        fields = [
            'id', 'mock_exam', 'exam_title', 'exam_type', 'student',
            'student_name', 'student_email', 'started_at', 'submitted_at',
            'duration_seconds', 'is_over_time', 'is_completed',
            'math_raw_score', 'reading_raw_score', 'writing_raw_score',
            'total_raw_score', 'math_scaled_score', 'reading_scaled_score',
            'writing_scaled_score', 'sat_score', 'overall_progress',
            'answers', 'time_spent_by_section',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'started_at', 'submitted_at', 'is_completed',
            'math_raw_score', 'reading_raw_score', 'writing_raw_score',
            'total_raw_score', 'math_scaled_score', 'reading_scaled_score',
            'writing_scaled_score', 'sat_score', 'created_at', 'updated_at'
        ]


class MockExamAttemptCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating mock exam attempts."""
    
    class Meta:
        model = MockExamAttempt
        fields = []
    
    def create(self, validated_data):
        """Create attempt with current student and mock exam."""
        mock_exam = self.context['mock_exam']
        student = self.context['request'].user
        
        # Check if attempt already exists
        attempt, created = MockExamAttempt.objects.get_or_create(
            mock_exam=mock_exam,
            student=student,
            defaults={
                'answers': {},
                'time_spent_by_section': {}
            }
        )
        
        return attempt


class MockExamAttemptDetailSerializer(MockExamAttemptSerializer):
    """Detailed serializer for mock exam attempts with exam info."""
    mock_exam = MockExamSerializer(read_only=True)
    
    class Meta(MockExamAttemptSerializer.Meta):
        fields = MockExamAttemptSerializer.Meta.fields


class MockExamAttemptReviewSerializer(MockExamAttemptSerializer):
    """
    Detailed serializer for mock exam attempts with full question info (for review).
    Includes correct answers and explanations.
    """
    class MockExamReviewSerializer(MockExamSerializer):
        math_questions = serializers.SerializerMethodField()
        reading_questions = serializers.SerializerMethodField()
        writing_questions = serializers.SerializerMethodField()

        def get_math_questions(self, obj):
            from apps.questionbank.serializers import QuestionReviewSerializer
            return QuestionReviewSerializer(obj.math_questions.all(), many=True).data

        def get_reading_questions(self, obj):
            from apps.questionbank.serializers import QuestionReviewSerializer
            return QuestionReviewSerializer(obj.reading_questions.all(), many=True).data

        def get_writing_questions(self, obj):
            from apps.questionbank.serializers import QuestionReviewSerializer
            return QuestionReviewSerializer(obj.writing_questions.all(), many=True).data

    mock_exam = MockExamReviewSerializer(read_only=True)

    class Meta(MockExamAttemptSerializer.Meta):
        fields = MockExamAttemptSerializer.Meta.fields


class MockExamSectionSerializer(serializers.Serializer):
    """Serializer for individual exam sections."""
    section = serializers.CharField()
    # questions = QuestionStudentSerializer(many=True)
    questions = serializers.SerializerMethodField()
    time_limit_seconds = serializers.IntegerField()
    progress_percentage = serializers.FloatField()

    def get_questions(self, obj):
        from apps.questionbank.serializers import QuestionStudentSerializer
        # obj is assumed to be a dict or object with 'questions' attribute
        questions = obj.get('questions', []) if isinstance(obj, dict) else getattr(obj, 'questions', [])
        return QuestionStudentSerializer(questions, many=True).data


class MockExamSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting exam sections."""
    section = serializers.CharField()
    answers = serializers.DictField(
        help_text="Answers for this section: {question_id: selected_answer}"
    )
    time_spent_seconds = serializers.IntegerField()
    
    def validate_section(self, value):
        """Validate section name."""
        valid_sections = ['math', 'reading', 'writing']
        if value not in valid_sections:
            raise serializers.ValidationError(f"Invalid section. Must be one of: {valid_sections}")
        return value
    
    def validate_answers(self, value):
        """Validate answers format."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Answers must be a dictionary")
        
        # Validate answer choices
        valid_answers = ['A', 'B', 'C', 'D']
        for question_id, answer in value.items():
            if answer not in valid_answers:
                raise serializers.ValidationError(
                    f"Invalid answer '{answer}' for question {question_id}. Must be A, B, C, or D"
                )
        
        return value
    
    def validate_time_spent_seconds(self, value):
        """Validate time spent."""
        if value < 0:
            raise serializers.ValidationError("Time spent cannot be negative")
        return value


class MockExamStatsSerializer(serializers.Serializer):
    """Serializer for mock exam statistics."""
    total_attempts = serializers.IntegerField()
    completed_attempts = serializers.IntegerField()
    average_sat_score = serializers.FloatField()
    average_math_score = serializers.FloatField()
    average_reading_score = serializers.FloatField()
    average_writing_score = serializers.FloatField()
    score_distribution = serializers.DictField()


class StudentMockExamProgressSerializer(serializers.Serializer):
    """Serializer for student mock exam progress."""
    exam_id = serializers.IntegerField()
    exam_title = serializers.CharField()
    exam_type = serializers.CharField()
    started_at = serializers.DateTimeField()
    submitted_at = serializers.DateTimeField(allow_null=True)
    is_completed = serializers.BooleanField()
    sat_score = serializers.IntegerField(allow_null=True)
    overall_progress = serializers.FloatField()
    duration_seconds = serializers.IntegerField()
