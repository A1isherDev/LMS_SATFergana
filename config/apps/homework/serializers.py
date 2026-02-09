"""
Serializers for the homework app.
"""
from rest_framework import serializers
from apps.homework.models import Homework, HomeworkSubmission
from apps.questionbank.serializers import QuestionStudentSerializer


class HomeworkSerializer(serializers.ModelSerializer):
    """Detailed serializer for Homework model."""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    teacher_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='assigned_by.email', read_only=True)
    total_questions = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    questions = QuestionStudentSerializer(many=True, read_only=True)
    question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of question IDs to include in homework"
    )
    submission_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    difficulty_level = serializers.CharField(read_only=True)
    
    class Meta:
        model = Homework
        fields = [
            'id', 'title', 'description', 'class_obj', 'class_name',
            'assigned_by', 'teacher_name', 'teacher_email', 'due_date',
            'questions', 'question_ids', 'max_score', 'is_published',
            'total_questions', 'is_overdue', 'days_until_due',
            'submission_count', 'average_score', 'difficulty_level',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_submission_count(self, obj):
        """Get number of submissions for this homework."""
        return obj.submissions.filter(submitted_at__isnull=False).count()
    
    def get_average_score(self, obj):
        """Get average score for submitted homework."""
        from django.db.models import Avg
        submitted = obj.submissions.filter(submitted_at__isnull=False, score__isnull=False)
        if submitted.exists():
            return submitted.aggregate(avg_score=Avg('score'))['avg_score']
        return 0
    
    def validate_class_obj(self, value):
        """Validate that user is the teacher of the class."""
        user = self.context['request'].user
        if not user.is_admin and value.teacher != user:
            raise serializers.ValidationError("You can only assign homework to your own classes")
        return value
    
    def validate_due_date(self, value):
        """Validate that due date is in the future."""
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Due date must be in the future")
        return value
    
    def validate_question_ids(self, value):
        """Validate question IDs."""
        if not value:
            return value
        
        from apps.questionbank.models import Question
        
        # Check if all questions exist and are active
        invalid_ids = []
        inactive_ids = []
        
        for question_id in value:
            try:
                question = Question.objects.get(id=question_id)
                if not question.is_active:
                    inactive_ids.append(question_id)
            except Question.DoesNotExist:
                invalid_ids.append(question_id)
        
        if invalid_ids:
            raise serializers.ValidationError(f"Invalid question IDs: {invalid_ids}")
        
        if inactive_ids:
            raise serializers.ValidationError(f"Inactive question IDs: {inactive_ids}")
        
        return value
    
    def create(self, validated_data):
        """Create homework with questions."""
        question_ids = validated_data.pop('question_ids', [])
        homework = super().create(validated_data)
        
        # Add questions to homework
        if question_ids:
            from apps.questionbank.models import Question
            questions = Question.objects.filter(id__in=question_ids)
            homework.questions.set(questions)
            homework.calculate_max_score()
        
        return homework
    
    def update(self, instance, validated_data):
        """Update homework with questions."""
        question_ids = validated_data.pop('question_ids', None)
        homework = super().update(instance, validated_data)
        
        # Update questions if provided
        if question_ids is not None:
            from apps.questionbank.models import Question
            questions = Question.objects.filter(id__in=question_ids)
            homework.questions.set(questions)
            homework.calculate_max_score()
        
        return homework


class HomeworkListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for homework lists."""
    teacher_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    total_questions = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    difficulty_level = serializers.CharField(read_only=True)
    
    class_obj = serializers.SerializerMethodField()
    assigned_by = serializers.SerializerMethodField()
    submission = serializers.SerializerMethodField()
    
    class Meta:
        model = Homework
        fields = [
            'id', 'title', 'description', 'class_obj', 'assigned_by', 
            'teacher_name', 'due_date', 'max_score', 'is_published', 
            'total_questions', 'is_overdue', 'days_until_due', 
            'difficulty_level', 'submission', 'created_at'
        ]

    def get_class_obj(self, obj):
        """Get summarized class object."""
        return {
            'id': obj.class_obj.id,
            'name': obj.class_obj.name
        }

    def get_assigned_by(self, obj):
        """Get summarized teacher object."""
        return {
            'id': obj.assigned_by.id,
            'first_name': obj.assigned_by.first_name,
            'last_name': obj.assigned_by.last_name
        }

    def get_submission(self, obj):
        """Get current student's submission status and score."""
        user = self.context['request'].user
        if not user.is_authenticated or not hasattr(user, 'role') or user.role != 'STUDENT':
            return None
        
        try:
            submission = obj.submissions.get(student=user)
            return {
                'id': submission.id,
                'is_submitted': submission.is_submitted,
                'score': submission.score,
                'max_score': obj.max_score,
                'accuracy_percentage': submission.accuracy_percentage,
                'is_late': submission.is_late,
                'submitted_at': submission.submitted_at
            }
        except HomeworkSubmission.DoesNotExist:
            return None


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for homework submissions."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    homework_title = serializers.CharField(source='homework.title', read_only=True)
    is_submitted = serializers.ReadOnlyField()
    accuracy_percentage = serializers.ReadOnlyField()
    answer_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = HomeworkSubmission
        fields = [
            'id', 'homework', 'homework_title', 'student', 'student_name',
            'student_email', 'submitted_at', 'is_submitted', 'is_late',
            'score', 'accuracy_percentage', 'answers', 'time_spent_seconds',
            'feedback', 'answer_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_late', 'score', 'created_at', 'updated_at'
        ]
    
    def get_answer_summary(self, obj):
        """Get answer summary with correctness."""
        return obj.get_answer_summary()
    
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


class HomeworkSubmissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating homework submissions."""
    
    class Meta:
        model = HomeworkSubmission
        fields = ['answers', 'time_spent_seconds']
    
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
    
    def create(self, validated_data):
        """Create submission with current student and homework."""
        homework = self.context['homework']
        student = self.context['request'].user
        
        # Check if submission already exists
        submission, created = HomeworkSubmission.objects.get_or_create(
            homework=homework,
            student=student,
            defaults=validated_data
        )
        
        if not created:
            # Update existing submission
            for key, value in validated_data.items():
                setattr(submission, key, value)
            submission.save()
        
        return submission


class HomeworkSubmissionDetailSerializer(HomeworkSubmissionSerializer):
    """Detailed serializer for homework submissions with questions."""
    homework = HomeworkSerializer(read_only=True)
    
    class Meta(HomeworkSubmissionSerializer.Meta):
        fields = HomeworkSubmissionSerializer.Meta.fields + ['homework']


class HomeworkStatsSerializer(serializers.Serializer):
    """Serializer for homework statistics."""
    total_homework = serializers.IntegerField()
    completed_homework = serializers.IntegerField()
    pending_homework = serializers.IntegerField()
    late_submissions = serializers.IntegerField()
    average_score = serializers.FloatField()
    average_accuracy = serializers.FloatField()


class StudentHomeworkProgressSerializer(serializers.Serializer):
    """Serializer for student homework progress."""
    homework_id = serializers.IntegerField()
    homework_title = serializers.CharField()
    due_date = serializers.DateTimeField()
    is_submitted = serializers.BooleanField()
    is_late = serializers.BooleanField()
    score = serializers.IntegerField(allow_null=True)
    accuracy_percentage = serializers.FloatField()
    days_until_due = serializers.IntegerField()
