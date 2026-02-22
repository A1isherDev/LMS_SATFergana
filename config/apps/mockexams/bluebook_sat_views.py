"""
Bluebook-compliant viewsets for Digital SAT mock exams.
Follows the exact structure and rules of the official Digital SAT.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.db.models import Q, Count, Avg
from django.utils import timezone
from apps.questionbank.models import Question
from apps.mockexams.bluebook_models import (
    BluebookExam, BluebookSection, BluebookModule, 
    BluebookExamAttempt, BluebookQuestionResponse
)
from django_filters.rest_framework import DjangoFilterBackend
from apps.mockexams.bluebook_serializers import (
    BluebookExamSerializer, BluebookSectionSerializer, 
    BluebookModuleSerializer, BluebookExamAttemptSerializer,
    BluebookExamAttemptCreateSerializer, BluebookModuleSubmissionSerializer,
    BluebookExamStartSerializer, BluebookExamStatusSerializer,
    BluebookExamResultSerializer, BluebookExamListSerializer,
    BluebookModuleStatusSerializer
)
from apps.common.permissions import IsStudent, IsTeacherOrAdmin


class BluebookExamViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Bluebook Digital SAT exams.
    Follows official Digital SAT structure.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        """Get exams based on user role."""
        user = self.request.user
        if user.role in ['MAIN_TEACHER', 'SUPPORT_TEACHER', 'ADMIN']:
            return BluebookExam.objects.all()
        else:
            return BluebookExam.objects.filter(is_active=True)
    
    def get_serializer_class(self):
        """Get appropriate serializer based on action."""
        if self.action == 'list':
            return BluebookExamListSerializer
        return BluebookExamSerializer
    
    @extend_schema(
        summary="Create Digital SAT exam",
        description="Create a new Bluebook Digital SAT exam with fixed structure.",
        tags=["Bluebook Digital SAT"]
    )
    def create(self, request, *args, **kwargs):
        """Create a new Digital SAT exam with standard structure."""
        if request.user.role not in ['MAIN_TEACHER', 'SUPPORT_TEACHER', 'ADMIN']:
            return Response(
                {"detail": "Only teachers and admins can create exams"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exam = serializer.save()
        
        # Create standard Digital SAT structure
        self._create_digital_sat_structure(exam)
        
        return Response(
            BluebookExamSerializer(exam).data,
            status=status.HTTP_201_CREATED
        )
    
    def _create_digital_sat_structure(self, exam):
        """Create the standard Digital SAT structure for an exam."""
        # Create Reading & Writing Section
        rw_section = BluebookSection.objects.create(
            exam=exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64  # 32 + 32
        )
        
        # Create Reading & Writing Modules
        rw_module1 = BluebookModule.objects.create(
            section=rw_section,
            module_order=1,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        rw_module2 = BluebookModule.objects.create(
            section=rw_section,
            module_order=2,
            time_limit_minutes=32,
            difficulty_level='BASELINE'  # Will be set adaptively
        )
        
        # Create Math Section
        math_section = BluebookSection.objects.create(
            exam=exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70  # 35 + 35
        )
        
        # Create Math Modules
        math_module1 = BluebookModule.objects.create(
            section=math_section,
            module_order=1,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )
        
        math_module2 = BluebookModule.objects.create(
            section=math_section,
            module_order=2,
            time_limit_minutes=35,
            difficulty_level='BASELINE'  # Will be set adaptively
        )
    
    @extend_schema(
        summary="Get exam structure",
        description="Get the complete Digital SAT structure with sections and modules.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['get'])
    def structure(self, request, pk=None):
        """Get the complete exam structure."""
        exam = self.get_object()
        
        sections = exam.sections.all()
        serializer = BluebookSectionSerializer(sections, many=True)
        
        return Response({
            'exam': BluebookExamSerializer(exam).data,
            'sections': serializer.data
        })
    
    @extend_schema(
        summary="Start exam attempt",
        description="Start a new attempt at this Digital SAT exam.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['post'])
    def start_attempt(self, request, pk=None):
        """Start a new attempt at this exam."""
        exam = self.get_object()
        
        # Check if user already has active attempt
        existing_attempt = BluebookExamAttempt.objects.filter(
            exam=exam, student=request.user, is_completed=False
        ).first()
        
        if existing_attempt:
            return Response(
                {"detail": "You already have an active attempt for this exam"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=exam,
            student=request.user
        )
        
        return Response(
            BluebookExamAttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED
        )


class BluebookExamAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Bluebook Digital SAT exam attempts.
    Enforces strict Digital SAT rules and navigation.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BluebookExamAttemptSerializer
    
    def get_queryset(self):
        """Get attempts for current user."""
        user = self.request.user
        if user.role in ['MAIN_TEACHER', 'SUPPORT_TEACHER', 'ADMIN']:
            return BluebookExamAttempt.objects.all()
        else:
            return BluebookExamAttempt.objects.filter(student=user)
    
    @extend_schema(
        summary="Start the exam",
        description="Start the Digital SAT exam and begin Module 1.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['post'])
    def start_exam(self, request, pk=None):
        """Start the exam."""
        attempt = self.get_object()
        
        if attempt.student != request.user:
            return Response(
                {"detail": "You can only start your own attempts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if attempt.started_at:
            return Response(
                {"detail": "Exam has already been started"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            attempt.start_exam()
            serializer = BluebookExamStatusSerializer(attempt)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Get current status",
        description="Get current exam status and progress.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get current exam status."""
        attempt = self.get_object()
        
        if attempt.student != request.user:
            return Response(
                {"detail": "You can only view your own attempts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BluebookExamStatusSerializer(attempt)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get current module",
        description="Get the current module with questions and status.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['get'])
    def current_module(self, request, pk=None):
        """Get current module details."""
        attempt = self.get_object()
        
        if attempt.student != request.user:
            return Response(
                {"detail": "You can only view your own attempts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not attempt.current_module:
            return Response(
                {"detail": "No current module"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = BluebookModuleStatusSerializer(
            attempt.current_module,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @extend_schema(
        summary="Submit module answers",
        description="Submit answers for the current module.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['post'])
    def submit_module(self, request, pk=None):
        """Submit current module answers."""
        attempt = self.get_object()
        
        if attempt.student != request.user:
            return Response(
                {"detail": "You can only submit your own attempts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not attempt.current_module:
            return Response(
                {"detail": "No current module to submit"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if time has expired
        if attempt.current_module_time_remaining <= 0:
            return Response(
                {"detail": "Module time has expired"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = BluebookModuleSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Submit module answers
            attempt.submit_module(serializer.validated_data['answers'])
            
            # Handle flagged questions
            if 'flagged_questions' in serializer.validated_data:
                for question_id in serializer.validated_data['flagged_questions']:
                    attempt.flag_question(question_id, flagged=True)
            
            # Return updated status
            status_serializer = BluebookExamStatusSerializer(attempt)
            return Response(status_serializer.data)
            
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Flag question",
        description="Flag or unflag a question for review.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['post'])
    def flag_question(self, request, pk=None):
        """Flag a question for review."""
        attempt = self.get_object()
        
        if attempt.student != request.user:
            return Response(
                {"detail": "You can only flag questions in your own attempts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        question_id = request.data.get('question_id')
        flagged = request.data.get('flagged', True)
        
        if not question_id:
            return Response(
                {"detail": "question_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attempt.flag_question(question_id, flagged)
        
        return Response({
            'flagged': flagged,
            'question_id': question_id
        })
    
    @extend_schema(
        summary="Get exam results",
        description="Get detailed results for completed exam.",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get exam results."""
        attempt = self.get_object()
        
        if attempt.student != request.user:
            return Response(
                {"detail": "You can only view your own results"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not attempt.is_completed:
            return Response(
                {"detail": "Exam has not been completed yet"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = BluebookExamResultSerializer(attempt)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Complete exam",
        description="Manually complete the exam (for testing or emergency).",
        tags=["Bluebook Digital SAT"]
    )
    @action(detail=True, methods=['post'])
    def complete_exam(self, request, pk=None):
        """Complete the exam."""
        attempt = self.get_object()
        
        if attempt.student != request.user:
            return Response(
                {"detail": "You can only complete your own attempts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if attempt.is_completed:
            return Response(
                {"detail": "Exam is already completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            attempt.complete_exam()
            serializer = BluebookExamResultSerializer(attempt)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class BluebookAnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for Bluebook Digital SAT analytics and insights.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get performance analytics",
        description="Get performance analytics for Digital SAT attempts.",
        tags=["Bluebook Digital SAT Analytics"]
    )
    @action(detail=False, methods=['get'])
    def performance_analytics(self, request):
        """Get performance analytics."""
        user = request.user
        
        # Get completed attempts
        attempts = BluebookExamAttempt.objects.filter(
            student=user,
            is_completed=True
        ).order_by('-submitted_at')
        
        if not attempts.exists():
            return Response({
                'message': 'No completed attempts found',
                'analytics': {}
            })
        
        # Calculate analytics
        analytics = {
            'total_attempts': attempts.count(),
            'average_total_score': attempts.aggregate(Avg('total_score'))['total_score__avg'] or 0,
            'average_rw_score': attempts.aggregate(Avg('reading_writing_score'))['reading_writing_score__avg'] or 0,
            'average_math_score': attempts.aggregate(Avg('math_score'))['math_score__avg'] or 0,
            'highest_score': attempts.aggregate(max_score=Max('total_score'))['max_score'] or 0,
            'lowest_score': attempts.aggregate(min_score=Min('total_score'))['min_score'] or 0,
            'recent_attempts': []
        }
        
        # Recent attempts with details
        for attempt in attempts[:5]:
            analytics['recent_attempts'].append({
                'id': attempt.id,
                'exam_title': attempt.exam.title,
                'submitted_at': attempt.submitted_at,
                'total_score': attempt.total_score,
                'reading_writing_score': attempt.reading_writing_score,
                'math_score': attempt.math_score,
                'duration_seconds': attempt.duration_seconds
            })
        
        return Response(analytics)
    
    @extend_schema(
        summary="Get adaptive performance",
        description="Get adaptive module performance analysis.",
        tags=["Bluebook Digital SAT Analytics"]
    )
    @action(detail=False, methods=['get'])
    def adaptive_performance(self, request):
        """Get adaptive module performance."""
        user = request.user
        
        attempts = BluebookExamAttempt.objects.filter(
            student=user,
            is_completed=True
        ).prefetch_related('responses__module')
        
        adaptive_stats = {
            'reading_writing': {
                'easier_modules': {'count': 0, 'avg_score': 0},
                'harder_modules': {'count': 0, 'avg_score': 0}
            },
            'math': {
                'easier_modules': {'count': 0, 'avg_score': 0},
                'harder_modules': {'count': 0, 'avg_score': 0}
            }
        }
        
        for attempt in attempts:
            # Analyze adaptive module performance
            for response in attempt.responses.all():
                module = response.module
                if module.is_adaptive:
                    section_type = module.section_type
                    difficulty = module.difficulty_level
                    
                    if section_type in adaptive_stats and difficulty in adaptive_stats[section_type]:
                        adaptive_stats[section_type][difficulty]['count'] += 1
        
        return Response(adaptive_stats)


class BluebookManagementViewSet(viewsets.ViewSet):
    """
    ViewSet for managing Bluebook Digital SAT exams (admin only).
    """
    permission_classes = [IsTeacherOrAdmin]
    
    @extend_schema(
        summary="Get exam statistics",
        description="Get statistics for Digital SAT exams.",
        tags=["Bluebook Digital SAT Management"]
    )
    @action(detail=False, methods=['get'])
    def exam_statistics(self, request):
        """Get exam statistics."""
        stats = {
            'total_exams': BluebookExam.objects.count(),
            'active_exams': BluebookExam.objects.filter(is_active=True).count(),
            'total_attempts': BluebookExamAttempt.objects.count(),
            'completed_attempts': BluebookExamAttempt.objects.filter(is_completed=True).count(),
            'active_attempts': BluebookExamAttempt.objects.filter(is_completed=False).count(),
            'average_score': BluebookExamAttempt.objects.filter(
                is_completed=True
            ).aggregate(Avg('total_score'))['total_score__avg'] or 0
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Populate exam with questions",
        description="Populate an exam with appropriate questions.",
        tags=["Bluebook Digital SAT Management"]
    )
    @action(detail=True, methods=['post'])
    def populate_questions(self, request, pk=None):
        """Populate exam with questions from the Question Bank."""
        exam = self.get_object()
        
        # Get all modules for this exam
        modules = BluebookModule.objects.filter(section__exam=exam)
        
        total_added = 0
        for module in modules:
            section_type = module.section.section_type
            
            # Map section_type to question_type
            q_type = 'MATH' if section_type == 'MATH' else 'READING'
            
            # Pick a mix of difficulties for baseline, or specific for adaptive
            # Digital SAT Baseline modules (Module 1) usually have mixed difficulty
            # Adaptive modules (Module 2) are either all Easy/Med or all Hard
            
            queryset = Question.objects.filter(question_type=q_type, is_active=True).order_by('?')
            
            # Logic for difficulty mix
            if module.difficulty_level == 'BASELINE':
                # baseline: 27 questions for RW, 22 for Math
                count = 27 if section_type == 'READING_WRITING' else 22
                selected = queryset[:count]
            elif module.difficulty_level == 'EASY':
                selected = queryset.filter(difficulty__lte=2)[:27]
            else: # HARD
                selected = queryset.filter(difficulty__gte=3)[:27]
            
            module.questions.add(*selected)
            total_added += selected.count()
            
        return Response({
            'message': f'Successfully populated {total_added} questions across modules',
            'exam_id': exam.id
        })


class BluebookModuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for individual Bluebook modules.
    Allows manual question management by admins.
    """
    queryset = BluebookModule.objects.all()
    serializer_class = BluebookModuleSerializer
    permission_classes = [IsTeacherOrAdmin]

    @extend_schema(
        summary="Update module questions",
        description="Manually set the questions for a specific module.",
        tags=["Bluebook Digital SAT Management"]
    )
    @action(detail=True, methods=['post'])
    def set_questions(self, request, pk=None):
        """Set questions for a module."""
        module = self.get_object()
        question_ids = request.data.get('question_ids', [])
        
        if not isinstance(question_ids, list):
            return Response(
                {"detail": "question_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verify all questions exist and are active
        questions = Question.objects.filter(id__in=question_ids, is_active=True)
        if questions.count() != len(question_ids):
            return Response(
                {"detail": "One or more question IDs are invalid or inactive"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        module.questions.set(questions)
        return Response({
            'message': f'Successfully set {questions.count()} questions for module {module.id}',
            'module_id': module.id
        })
