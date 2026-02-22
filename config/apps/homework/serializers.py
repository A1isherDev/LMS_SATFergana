"""
Serializers for the homework app.
"""
from rest_framework import serializers
from apps.homework.models import Homework, HomeworkSubmission
# from apps.questionbank.serializers import QuestionStudentSerializer  # Moved to inline to avoid circular import


class HomeworkSerializer(serializers.ModelSerializer):
    """Detailed serializer for Homework model."""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    teacher_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='assigned_by.email', read_only=True)
    total_questions = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    # questions = QuestionStudentSerializer(many=True, read_only=True)  # Using method field for inline import
    questions = serializers.SerializerMethodField()
    question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of question IDs to include in homework"
    )
    submission_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    difficulty_level = serializers.CharField(read_only=True)
    user_submission = serializers.SerializerMethodField()
    homework_stats = serializers.SerializerMethodField()
    submissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Homework
        fields = [
            'id', 'title', 'description', 'class_obj', 'class_name',
            'assigned_by', 'teacher_name', 'teacher_email', 'due_date',
            'questions', 'question_ids', 'max_score', 'is_published',
            'total_questions', 'is_overdue', 'days_until_due',
            'submission_count', 'average_score', 'difficulty_level',
            'user_submission', 'homework_stats', 'submissions', 'created_at', 'updated_at'
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
    
<<<<<<< HEAD
    def get_questions(self, obj):
        """Get questions with student view."""
        from apps.questionbank.serializers import QuestionStudentSerializer
        return QuestionStudentSerializer(obj.questions.all(), many=True).data
=======
    def get_user_submission(self, obj):
        """Current user's submission for this homework (for students)."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or getattr(request.user, 'role', None) != 'STUDENT':
            return None
        try:
            sub = obj.submissions.get(student=request.user)
            return {
                'id': sub.id,
                'student': {'id': request.user.id, 'first_name': request.user.first_name, 'last_name': request.user.last_name, 'email': request.user.email},
                'submitted_at': sub.submitted_at,
                'score': sub.score,
                'max_score': obj.max_score,
                'is_late': sub.is_late,
                'answers': sub.answers or {},
                'time_spent_seconds': sub.time_spent_seconds or 0,
            }
        except HomeworkSubmission.DoesNotExist:
            return None
    
    def get_homework_stats(self, obj):
        """Stats for teacher view."""
        from django.db.models import Avg
        subs = obj.submissions.filter(submitted_at__isnull=False)
        count = subs.count()
        avg = subs.aggregate(a=Avg('score'))['a'] or 0
        on_time = subs.filter(is_late=False).count()
        return {
            'submission_count': count,
            'average_score': int(avg),
            'average_time_spent': int(subs.aggregate(a=Avg('time_spent_seconds'))['a'] or 0),
            'on_time_submission_rate': (on_time / count * 100) if count else 100,
        }
    
    def get_submissions(self, obj):
        """Submissions list for teacher/admin."""
        request = self.context.get('request')
        if not request or not (getattr(request.user, 'is_teacher', False) or getattr(request.user, 'is_admin', False)):
            return []
        subs = obj.submissions.select_related('student').all().order_by('-submitted_at')
        return [
            {
                'id': s.id,
                'student': {'id': s.student.id, 'first_name': s.student.first_name, 'last_name': s.student.last_name, 'email': s.student.email},
                'submitted_at': s.submitted_at,
                'score': s.score,
                'max_score': obj.max_score,
                'is_late': s.is_late,
                'answers': s.answers or {},
                'time_spent_seconds': s.time_spent_seconds or 0,
            }
            for s in subs
        ]
    
    def to_representation(self, instance):
        """Inject class_obj as { id, name } for frontend."""
        data = super().to_representation(instance)
        if instance.class_obj_id:
            data['class_obj'] = {'id': instance.class_obj.id, 'name': instance.class_obj.name}
        return data
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
    
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
            'feedback', 'submission_file', 'answer_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_late', 'score', 'created_at', 'updated_at'
        ]
    
    def get_answer_summary(self, obj):
        """Get answer summary with correctness."""
        return obj.get_answer_summary()
    
    def validate_answers(self, value):
        """Validate answers format."""
        import json
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Answers must be valid JSON")

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
        fields = ['answers', 'time_spent_seconds', 'submission_file']
    
    def validate_answers(self, value):
        """Validate answers format."""
        import json
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Answers must be valid JSON string")

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
