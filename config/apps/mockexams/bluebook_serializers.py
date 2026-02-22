"""
Bluebook-compliant serializers for Digital SAT mock exams.
Follows the exact structure of the official Digital SAT.
"""
from rest_framework import serializers
from django.utils import timezone
from apps.mockexams.bluebook_models import (
    BluebookExam, BluebookSection, BluebookModule, 
    BluebookExamAttempt, BluebookQuestionResponse
)
# from apps.questionbank.serializers import QuestionStudentSerializer  # Moved to inline to avoid circular import


class BluebookExamSerializer(serializers.ModelSerializer):
    """Serializer for Bluebook Digital SAT exams."""
    
    class Meta:
        model = BluebookExam
        fields = [
            'id', 'title', 'description', 'is_active', 
            'total_duration_minutes', 'created_at'
        ]
        read_only_fields = ['created_at']


class BluebookSectionSerializer(serializers.ModelSerializer):
    """Serializer for Bluebook Digital SAT sections."""
    modules = serializers.SerializerMethodField()
    
    class Meta:
        model = BluebookSection
        fields = [
            'id', 'section_type', 'section_order', 
            'total_duration_minutes', 'modules'
        ]
    
    def get_modules(self, obj):
        """Get modules for this section."""
        modules = obj.modules.all()
        return BluebookModuleSerializer(modules, many=True).data


class BluebookModuleSerializer(serializers.ModelSerializer):
    """Serializer for Bluebook Digital SAT modules."""
    # questions = QuestionStudentSerializer(many=True, read_only=True)
    questions = serializers.SerializerMethodField()
    is_adaptive = serializers.ReadOnlyField()
    section_type = serializers.ReadOnlyField()
    
    class Meta:
        model = BluebookModule
        fields = [
            'id', 'module_order', 'time_limit_minutes', 
            'difficulty_level', 'questions', 'is_adaptive', 'section_type'
        ]

    def get_questions(self, obj):
        from apps.questionbank.serializers import QuestionStudentSerializer
        return QuestionStudentSerializer(obj.questions.all(), many=True).data


class BluebookQuestionResponseSerializer(serializers.ModelSerializer):
    """Serializer for individual question responses."""
    # question = QuestionStudentSerializer(read_only=True)
    question = serializers.SerializerMethodField()
    
    class Meta:
        model = BluebookQuestionResponse
        fields = [
            'id', 'question', 'selected_answer', 'is_correct',
            'time_spent_seconds', 'is_flagged', 'answer_order'
        ]
        read_only_fields = ['is_correct']

    def get_question(self, obj):
        from apps.questionbank.serializers import QuestionStudentSerializer
        return QuestionStudentSerializer(obj.question).data


class BluebookExamAttemptSerializer(serializers.ModelSerializer):
    """Serializer for Bluebook exam attempts."""
    exam = BluebookExamSerializer(read_only=True)
    current_section = BluebookSectionSerializer(read_only=True)
    current_module = BluebookModuleSerializer(read_only=True)
    completed_modules = BluebookModuleSerializer(many=True, read_only=True)
    responses = BluebookQuestionResponseSerializer(many=True, read_only=True)
    duration_seconds = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    current_module_time_remaining = serializers.ReadOnlyField()
    current_progress = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    flagged_questions = serializers.SerializerMethodField()
    
    class Meta:
        model = BluebookExamAttempt
        fields = [
            'id', 'exam', 'student', 'started_at', 'submitted_at',
            'current_section', 'current_module', 'completed_modules',
            'reading_writing_difficulty', 'math_difficulty',
            'module_answers', 'module_time_spent',
            'is_completed', 'is_paused', 'reading_writing_score',
            'math_score', 'total_score', 'responses', 'duration_seconds',
            'is_active', 'current_module_time_remaining', 'current_progress',
            'status', 'remaining_seconds', 'answers', 'flagged_questions'
        ]
        read_only_fields = [
            'student', 'started_at', 'submitted_at', 'is_completed',
            'reading_writing_score', 'math_score', 'total_score'
        ]
    
    def get_status(self, obj):
        if obj.is_completed:
            return 'COMPLETED'
        if not obj.started_at:
            return 'CREATED'
        return 'STARTED'
    
    def get_remaining_seconds(self, obj):
        return obj.current_module_time_remaining if obj.current_module else 0
    
    def get_answers(self, obj):
        if not obj.current_module:
            return {}
        module_id = str(obj.current_module.id)
        return obj.module_answers.get(module_id, {})
    
    def get_flagged_questions(self, obj):
        if not obj.current_module:
            return []
        module_id = str(obj.current_module.id)
        return obj.flagged_questions.get(module_id, [])


class BluebookExamAttemptCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Bluebook exam attempts."""
    
    class Meta:
        model = BluebookExamAttempt
        fields = ['exam']
    
    def create(self, validated_data):
        """Create a new exam attempt."""
        user = self.context['request'].user
        exam = validated_data['exam']
        
        # Check if user already has an attempt for this exam
        existing_attempt = BluebookExamAttempt.objects.filter(
            exam=exam, student=user
        ).first()
        
        if existing_attempt and not existing_attempt.is_completed:
            raise serializers.ValidationError(
                "You already have an active attempt for this exam"
            )
        
        # Create new attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=exam,
            student=user
        )
        
        return attempt


class BluebookModuleSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting module answers."""
    answers = serializers.DictField(
        child=serializers.CharField(max_length=50),
        help_text="Dictionary of question_id: selected_answer"
    )
    flagged_questions = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of flagged question IDs"
    )
    time_spent_seconds = serializers.IntegerField(
        required=False,
        help_text="Total time spent on this module"
    )


class BluebookExamStartSerializer(serializers.Serializer):
    """Serializer for starting a Bluebook exam."""
    
    def validate(self, attrs):
        """Validate exam can be started."""
        attempt = self.instance
        
        if attempt.started_at:
            raise serializers.ValidationError("Exam has already been started")
        
        return attrs
    
    def save(self):
        """Start the exam."""
        attempt = self.instance
        attempt.start_exam()
        return attempt


class BluebookExamStatusSerializer(serializers.ModelSerializer):
    """Serializer for getting exam status."""
    exam = BluebookExamSerializer(read_only=True)
    current_section = BluebookSectionSerializer(read_only=True)
    current_module = BluebookModuleSerializer(read_only=True)
    completed_modules = BluebookModuleSerializer(many=True, read_only=True)
    duration_seconds = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    current_module_time_remaining = serializers.ReadOnlyField()
    current_progress = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    flagged_questions = serializers.SerializerMethodField()
    
    class Meta:
        model = BluebookExamAttempt
        fields = [
            'id', 'exam', 'started_at', 'submitted_at',
            'current_section', 'current_module', 'completed_modules',
            'reading_writing_difficulty', 'math_difficulty',
            'is_completed', 'is_paused', 'reading_writing_score',
            'math_score', 'total_score', 'duration_seconds',
            'is_active', 'current_module_time_remaining', 'current_progress',
            'status', 'remaining_seconds', 'answers', 'flagged_questions'
        ]
    
    def get_status(self, obj):
        if obj.is_completed:
            return 'COMPLETED'
        if not obj.started_at:
            return 'CREATED'
        return 'STARTED'
    
    def get_remaining_seconds(self, obj):
        return obj.current_module_time_remaining if obj.current_module else 0
    
    def get_answers(self, obj):
        if not obj.current_module:
            return {}
        module_id = str(obj.current_module.id)
        return obj.module_answers.get(module_id, {})
    
    def get_flagged_questions(self, obj):
        if not obj.current_module:
            return []
        module_id = str(obj.current_module.id)
        return obj.flagged_questions.get(module_id, [])


class BluebookExamResultSerializer(serializers.ModelSerializer):
    """Serializer for exam results with detailed analytics."""
    exam = BluebookExamSerializer(read_only=True)
    responses = BluebookQuestionResponseSerializer(many=True, read_only=True)
    duration_seconds = serializers.ReadOnlyField()
    completed_at = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()
    
    # Performance analytics
    reading_writing_accuracy = serializers.SerializerMethodField()
    math_accuracy = serializers.SerializerMethodField()
    overall_accuracy = serializers.SerializerMethodField()
    section_breakdown = serializers.SerializerMethodField()
    time_analysis = serializers.SerializerMethodField()
    
    class Meta:
        model = BluebookExamAttempt
        fields = [
            'id', 'exam', 'started_at', 'submitted_at', 'completed_at', 'status',
            'reading_writing_difficulty', 'math_difficulty',
            'reading_writing_score', 'math_score', 'total_score',
            'responses', 'duration_seconds', 'modules',
            'reading_writing_accuracy', 'math_accuracy', 'overall_accuracy',
            'section_breakdown', 'time_analysis'
        ]
    
    def get_completed_at(self, obj):
        return obj.submitted_at.isoformat() if obj.submitted_at else None
    
    def get_status(self, obj):
        return 'COMPLETED' if obj.is_completed else 'IN_PROGRESS'
    
    def get_modules(self, obj):
        """Build modules array for frontend results page from module_answers."""
        modules_out = []
        for section in obj.exam.sections.all():
            for module in section.modules.all():
                module_id_str = str(module.id)
                answers_dict = obj.module_answers.get(module_id_str, {})
                flagged_list = obj.flagged_questions.get(module_id_str, [])
                questions_out = []
                for q in module.questions.all():
                    selected = answers_dict.get(str(q.id)) or answers_dict.get(q.id)
                    opts = q.options or {}
                    if not isinstance(opts, dict):
                        opts = {}
                    options_array = [opts.get(k) for k in ['A', 'B', 'C', 'D'] if opts.get(k)]
                    correct_text = options_array[ord(q.correct_answer) - 65] if q.correct_answer in ('A', 'B', 'C', 'D') and len(options_array) > ord(q.correct_answer) - 65 else q.correct_answer
                    selected_text = None
                    if selected:
                        if selected in ('A', 'B', 'C', 'D') and len(options_array) > ord(selected) - 65:
                            selected_text = options_array[ord(selected) - 65]
                        else:
                            selected_text = selected
                    is_correct = (selected == q.correct_answer or selected_text == correct_text) if selected else False
                    questions_out.append({
                        'id': q.id,
                        'question_text': q.question_text,
                        'question_type': q.question_type,
                        'options': options_array,
                        'correct_answer': correct_text,
                        'selected_answer': selected_text,
                        'is_correct': is_correct,
                        'explanation': getattr(q, 'explanation', '') or '',
                        'is_flagged': q.id in flagged_list,
                    })
                modules_out.append({
                    'id': module.id,
                    'title': f'Module {module.module_order}',
                    'section': section.section_type.replace('_', ' & '),
                    'questions': questions_out,
                    'score': sum(1 for q in questions_out if q['is_correct']),
                    'max_score': len(questions_out),
                })
        return modules_out
    
    def get_reading_writing_accuracy(self, obj):
        """Calculate Reading & Writing accuracy."""
        rw_correct = 0
        rw_total = 0
        
        for response in obj.responses.all():
            if response.module.section_type == 'READING_WRITING':
                rw_total += 1
                if response.is_correct:
                    rw_correct += 1
        
        return (rw_correct / rw_total * 100) if rw_total > 0 else 0
    
    def get_math_accuracy(self, obj):
        """Calculate Math accuracy."""
        math_correct = 0
        math_total = 0
        
        for response in obj.responses.all():
            if response.module.section_type == 'MATH':
                math_total += 1
                if response.is_correct:
                    math_correct += 1
        
        return (math_correct / math_total * 100) if math_total > 0 else 0
    
    def get_overall_accuracy(self, obj):
        """Calculate overall accuracy."""
        total_correct = sum(1 for r in obj.responses.all() if r.is_correct)
        total_questions = obj.responses.count()
        return (total_correct / total_questions * 100) if total_questions > 0 else 0
    
    def get_section_breakdown(self, obj):
        """Get detailed section breakdown."""
        breakdown = {}
        
        for section in obj.exam.sections.all():
            section_data = {
                'section_type': section.section_type,
                'modules': []
            }
            
            for module in section.modules.all():
                module_responses = obj.responses.filter(module=module)
                module_correct = sum(1 for r in module_responses if r.is_correct)
                module_total = module_responses.count()
                module_time = obj.module_time_spent.get(str(module.id), 0)
                
                section_data['modules'].append({
                    'module_order': module.module_order,
                    'difficulty_level': module.difficulty_level,
                    'questions_answered': module_total,
                    'correct_answers': module_correct,
                    'accuracy': (module_correct / module_total * 100) if module_total > 0 else 0,
                    'time_spent_seconds': module_time,
                    'time_limit_seconds': module.time_limit_minutes * 60
                })
            
            breakdown[section.section_type] = section_data
        
        return breakdown
    
    def get_time_analysis(self, obj):
        """Get time usage analysis."""
        total_time = obj.duration_seconds
        time_by_section = {}
        time_by_module = {}
        
        for section in obj.exam.sections.all():
            section_time = 0
            for module in section.modules.all():
                module_time = obj.module_time_spent.get(str(module.id), 0)
                time_by_module[str(module.id)] = {
                    'time_spent': module_time,
                    'time_limit': module.time_limit_minutes * 60,
                    'efficiency': (module_time / (module.time_limit_minutes * 60)) * 100
                }
                section_time += module_time
            
            time_by_section[section.section_type] = {
                'time_spent': section_time,
                'time_limit': section.total_duration_minutes * 60,
                'efficiency': (section_time / (section.total_duration_minutes * 60)) * 100
            }
        
        return {
            'total_time_seconds': total_time,
            'total_time_limit_seconds': obj.exam.total_duration_minutes * 60,
            'overall_efficiency': (total_time / (obj.exam.total_duration_minutes * 60)) * 100,
            'time_by_section': time_by_section,
            'time_by_module': time_by_module
        }


class BluebookExamListSerializer(serializers.ModelSerializer):
    """Serializer for listing Bluebook exams with attempt status."""
    has_active_attempt = serializers.SerializerMethodField()
    active_attempt_id = serializers.SerializerMethodField()
    completed_attempts = serializers.SerializerMethodField()
    
    class Meta:
        model = BluebookExam
        fields = [
            'id', 'title', 'description', 'is_active',
            'total_duration_minutes', 'has_active_attempt',
            'active_attempt_id', 'completed_attempts', 'created_at'
        ]
    
    def get_has_active_attempt(self, obj):
        """Check if user has active attempt."""
        user = self.context['request'].user
        return BluebookExamAttempt.objects.filter(
            exam=obj, student=user, is_completed=False
        ).exists()
    
    def get_active_attempt_id(self, obj):
        """Get active attempt id for resume."""
        user = self.context['request'].user
        attempt = BluebookExamAttempt.objects.filter(
            exam=obj, student=user, is_completed=False
        ).first()
        return attempt.id if attempt else None
    
    def get_completed_attempts(self, obj):
        """Count completed attempts."""
        user = self.context['request'].user
        return BluebookExamAttempt.objects.filter(
            exam=obj, student=user, is_completed=True
        ).count()


class BluebookModuleStatusSerializer(serializers.ModelSerializer):
    """Serializer for current module status."""
    # questions = QuestionStudentSerializer(many=True, read_only=True)
    questions = serializers.SerializerMethodField()
    time_remaining_seconds = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    flagged_questions = serializers.SerializerMethodField()
    
    class Meta:
        model = BluebookModule
        fields = [
            'id', 'module_order', 'time_limit_minutes', 
            'difficulty_level', 'questions', 'is_adaptive',
            'time_remaining_seconds', 'progress_percentage',
            'flagged_questions'
        ]

    def get_questions(self, obj):
        from apps.questionbank.serializers import QuestionStudentSerializer
        return QuestionStudentSerializer(obj.questions.all(), many=True).data
    
    def get_time_remaining_seconds(self, obj):
        """Get remaining time for this module."""
        request = self.context.get('request')
        if not request:
            return obj.time_limit_minutes * 60
        
        user = request.user
        attempt = BluebookExamAttempt.objects.filter(
            student=user, current_module=obj, is_completed=False
        ).first()
        
        if attempt and attempt.current_module_start_time:
            elapsed = (timezone.now() - attempt.current_module_start_time).total_seconds()
            remaining = max(0, (obj.time_limit_minutes * 60) - elapsed)
            return int(remaining)
        
        return obj.time_limit_minutes * 60
    
    def get_progress_percentage(self, obj):
        """Get progress percentage for this module."""
        request = self.context.get('request')
        if not request:
            return 0
        
        user = request.user
        attempt = BluebookExamAttempt.objects.filter(
            student=user, current_module=obj, is_completed=False
        ).first()
        
        if attempt:
            return attempt.get_module_progress(obj.id)
        
        return 0
    
    def get_flagged_questions(self, obj):
        """Get flagged questions for this module."""
        request = self.context.get('request')
        if not request:
            return []
        
        user = request.user
        attempt = BluebookExamAttempt.objects.filter(
            student=user, current_module=obj, is_completed=False
        ).first()
        
        if attempt:
            return attempt.flagged_questions.get(str(obj.id), [])
        
        return []
