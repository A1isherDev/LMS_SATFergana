"""
Views for the mockexams app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from apps.mockexams.models import MockExam, MockExamAttempt
from apps.mockexams.serializers import (
    MockExamSerializer,
    MockExamListSerializer,
    MockExamAttemptSerializer,
    MockExamAttemptCreateSerializer,
    MockExamAttemptDetailSerializer,
    MockExamAttemptReviewSerializer,
    MockExamSectionSerializer,
    MockExamSubmissionSerializer,
    MockExamStatsSerializer,
    StudentMockExamProgressSerializer
)
from apps.questionbank.serializers import QuestionStudentSerializer
from apps.common.permissions import IsTeacherOrAdmin, IsStudent
from apps.common.views import AuditLogMixin

# Import Bluebook views
from .bluebook_views import ExamAnalyticsViewSet, ExamPerformanceViewSet


class MockExamViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for MockExam model.
    Different access levels for teachers/admins vs students.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exam_type', 'is_active']
    search_fields = ['title', 'description']
    
    @extend_schema(
        summary="List mock exams",
        description="Retrieve a list of mock SAT exams based on user role. Admins/teachers see all, students see only active exams.",
        tags=["Mock Exams"],
        parameters=[
            OpenApiParameter(
                name='exam_type',
                type=OpenApiTypes.STR,
                enum=['FULL_LENGTH', 'SECTION', 'PRACTICE'],
                description='Filter by exam type',
                required=False
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                description='Filter by active status',
                required=False
            )
        ]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        base_queryset = MockExam.objects.prefetch_related('math_questions', 'reading_questions', 'writing_questions')
        
        if user.is_admin:
            return base_queryset.all()
        elif user.is_dept_lead:
            # Department leads see exams for their department
            return base_queryset.filter(department=user.department)
        elif user.is_teacher:
            # Teachers see all (collaborative creation/assignment)
            return base_queryset.all()
        elif user.is_student:
            # Students see only active exams
            return base_queryset.filter(is_active=True)
        else:
            return MockExam.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return MockExamListSerializer
        return MockExamSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    @extend_schema(
        summary="Start mock exam",
        description="Start a new attempt at a mock exam. Creates an exam attempt and returns the attempt details.",
        tags=["Mock Exams"],
        responses={201: MockExamAttemptDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a mock exam attempt."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can start mock exams"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mock_exam = self.get_object()
        
        # Check if exam is active
        if not mock_exam.is_active:
            return Response(
                {"detail": "This exam is not currently available"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if student already has an attempt
        existing_attempt = MockExamAttempt.objects.filter(
            mock_exam=mock_exam,
            student=request.user
        ).first()
        
        if existing_attempt and existing_attempt.is_completed:
            return Response(
                {"detail": "You have already completed this exam"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or get existing attempt
        serializer = MockExamAttemptCreateSerializer(
            data={},
            context={'mock_exam': mock_exam, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        attempt = serializer.save()
        
        return Response(
            MockExamAttemptDetailSerializer(attempt).data,
            status=status.HTTP_201_CREATED
        )
    
    @extend_schema(
        summary="Get exam sections",
        description="Get exam sections with questions for a specific attempt. Returns questions organized by sections.",
        tags=["Mock Exams"],
        responses={200: MockExamSectionSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def sections(self, request, pk=None):
        """Get exam sections with questions for a specific attempt."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view exam sections"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mock_exam = self.get_object()
        
        # Get student's attempt
        try:
            attempt = MockExamAttempt.objects.get(
                mock_exam=mock_exam,
                student=request.user
            )
        except MockExamAttempt.DoesNotExist:
            return Response(
                {"detail": "No attempt found for this exam"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if attempt.is_completed:
            return Response(
                {"detail": "This exam has already been completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sections = []
        
        # Get sections based on exam type
        if mock_exam.exam_type in ['FULL', 'MATH_ONLY']:
            math_questions = mock_exam.get_section_questions('math')
            if math_questions:
                sections.append({
                    'section': 'math',
                    'questions': QuestionStudentSerializer(math_questions, many=True).data,
                    'time_limit_seconds': mock_exam.get_section_time_limit('math'),
                    'progress_percentage': attempt.get_section_progress('math')
                })
        
        if mock_exam.exam_type in ['FULL', 'READING_WRITING_ONLY']:
            reading_questions = mock_exam.get_section_questions('reading')
            if reading_questions:
                sections.append({
                    'section': 'reading',
                    'questions': QuestionStudentSerializer(reading_questions, many=True).data,
                    'time_limit_seconds': mock_exam.get_section_time_limit('reading'),
                    'progress_percentage': attempt.get_section_progress('reading')
                })
            
            writing_questions = mock_exam.get_section_questions('writing')
            if writing_questions:
                sections.append({
                    'section': 'writing',
                    'questions': QuestionStudentSerializer(writing_questions, many=True).data,
                    'time_limit_seconds': mock_exam.get_section_time_limit('writing'),
                    'progress_percentage': attempt.get_section_progress('writing')
                })
        
        return Response(sections)
    
    @extend_schema(
        summary="Submit exam section",
        description="Submit answers for a specific section of the mock exam.",
        tags=["Mock Exams"],
        request=MockExamSubmissionSerializer,
        responses={200: {
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'section_score': {'type': 'integer'}
            }
        }}
    )
    @action(detail=True, methods=['post'])
    def submit_section(self, request, pk=None):
        """Submit answers for a specific section."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can submit exam sections"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mock_exam = self.get_object()
        
        # Get student's attempt
        try:
            attempt = MockExamAttempt.objects.get(
                mock_exam=mock_exam,
                student=request.user
            )
        except MockExamAttempt.DoesNotExist:
            return Response(
                {"detail": "No attempt found for this exam"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if attempt.is_completed:
            return Response(
                {"detail": "This exam has already been completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate section submission
        serializer = MockExamSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        section = serializer.validated_data['section']
        answers = serializer.validated_data['answers']
        time_spent = serializer.validated_data['time_spent_seconds']
        
        # Update attempt with section answers
        if not attempt.answers:
            attempt.answers = {}
        
        attempt.answers[section] = answers
        
        if not attempt.time_spent_by_section:
            attempt.time_spent_by_section = {}
        
        attempt.time_spent_by_section[section] = time_spent
        
        attempt.save()
        
        # Check if all sections are completed
        all_sections_completed = True
        if mock_exam.exam_type in ['FULL', 'MATH_ONLY']:
            if 'math' not in attempt.answers:
                all_sections_completed = False
        
        if mock_exam.exam_type in ['FULL', 'READING_WRITING_ONLY']:
            if 'reading' not in attempt.answers or 'writing' not in attempt.answers:
                all_sections_completed = False
        
        response_data = {
            'section_submitted': section,
            'overall_progress': attempt.get_overall_progress(),
            'all_sections_completed': all_sections_completed
        }
        
        return Response(response_data)
    
    @action(detail=True, methods=['post'])
    def submit_exam(self, request, pk=None):
        """Submit the entire exam and calculate scores."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can submit exams"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mock_exam = self.get_object()
        
        # Get student's attempt
        try:
            attempt = MockExamAttempt.objects.get(
                mock_exam=mock_exam,
                student=request.user
            )
        except MockExamAttempt.DoesNotExist:
            return Response(
                {"detail": "No attempt found for this exam"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if attempt.is_completed:
            return Response(
                {"detail": "This exam has already been completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Submit the exam
        attempt.submit_exam()
        
        return Response(
            MockExamAttemptDetailSerializer(attempt).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Alias for submit_exam to maintain compatibility."""
        return self.submit_exam(request, pk)


class MockExamAttemptViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for MockExamAttempt model.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="List mock exam attempts",
        description="Retrieve a list of mock exam attempts based on user role. Students see their own attempts, teachers/admins see all.",
        tags=["Mock Exams"],
        parameters=[
            OpenApiParameter(
                name='mock_exam',
                type=OpenApiTypes.INT,
                description='Filter by mock exam ID',
                required=False
            ),
            OpenApiParameter(
                name='is_completed',
                type=OpenApiTypes.BOOL,
                description='Filter by completion status',
                required=False
            )
        ]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        base_queryset = MockExamAttempt.objects.select_related('mock_exam', 'student')
        
        if user.is_admin:
            return base_queryset.all()
        elif user.is_dept_lead:
            # Department leads see attempts for exams in their department
            return base_queryset.filter(mock_exam__department=user.department)
        elif user.is_teacher:
            # Teachers see all attempts (collaborative grading)
            return base_queryset.all()
        elif user.is_student:
            return base_queryset.filter(student=user)
        else:
            return MockExamAttempt.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['retrieve']:
            return MockExamAttemptDetailSerializer
        return MockExamAttemptSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    @extend_schema(
        summary="Get my exam attempts",
        description="Get current student's mock exam attempts and progress.",
        tags=["Mock Exams"],
        responses={200: StudentMockExamProgressSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def my_attempts(self, request):
        """Get current student's mock exam attempts."""
        if not request.user.is_student:
             return Response([], status=status.HTTP_200_OK)
        
        attempts = MockExamAttempt.objects.filter(
            student=request.user
        ).select_related('mock_exam').order_by('-started_at')
        
        progress_data = []
        
        for attempt in attempts:
            progress_data.append({
                'exam_id': attempt.mock_exam.id,
                'exam_title': attempt.mock_exam.title,
                'exam_type': attempt.mock_exam.exam_type,
                'started_at': attempt.started_at,
                'submitted_at': attempt.submitted_at,
                'is_completed': attempt.is_completed,
                'sat_score': attempt.sat_score,
                'overall_progress': attempt.get_overall_progress(),
                'duration_seconds': int(attempt.duration_seconds)
            })
        
        serializer = StudentMockExamProgressSerializer(progress_data, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def review(self, request, pk=None):
        """Get detailed exam attempt review for individual questions."""
        attempt = self.get_object()
        
        # Security check: only allow review of completed exams
        if not attempt.is_completed:
            return Response(
                {"detail": "Attempt must be completed for review"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Security check: students can only review their own attempts
        if request.user.is_student and attempt.student != request.user:
            return Response(
                {"detail": "You can only review your own attempts"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = MockExamAttemptReviewSerializer(attempt)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get mock exam statistics (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can view statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filter by exam type if specified
        exam_type = request.query_params.get('exam_type')
        
        queryset = MockExamAttempt.objects.all()
        if exam_type:
            queryset = queryset.filter(mock_exam__exam_type=exam_type)
        
        # Calculate statistics
        total_attempts = queryset.count()
        completed_attempts = queryset.filter(is_completed=True).count()
        
        completed_queryset = queryset.filter(is_completed=True)
        
        avg_sat_score = completed_queryset.aggregate(
            avg_score=Avg('sat_score')
        )['avg_score'] or 0
        
        avg_math_score = completed_queryset.aggregate(
            avg_score=Avg('math_scaled_score')
        )['avg_score'] or 0
        
        avg_reading_score = completed_queryset.aggregate(
            avg_score=Avg('reading_scaled_score')
        )['avg_score'] or 0
        
        avg_writing_score = completed_queryset.aggregate(
            avg_score=Avg('writing_scaled_score')
        )['avg_score'] or 0
        
        # Calculate score distribution
        score_ranges = {
            '400-600': 0,
            '600-800': 0,
            '800-1000': 0,
            '1000-1200': 0,
            '1200-1400': 0,
            '1400-1600': 0
        }
        
        for attempt in completed_queryset:
            if attempt.sat_score:
                if attempt.sat_score < 600:
                    score_ranges['400-600'] += 1
                elif attempt.sat_score < 800:
                    score_ranges['600-800'] += 1
                elif attempt.sat_score < 1000:
                    score_ranges['800-1000'] += 1
                elif attempt.sat_score < 1200:
                    score_ranges['1000-1200'] += 1
                elif attempt.sat_score < 1400:
                    score_ranges['1200-1400'] += 1
                else:
                    score_ranges['1400-1600'] += 1
        
        stats_data = {
            'total_attempts': total_attempts,
            'completed_attempts': completed_attempts,
            'average_sat_score': round(avg_sat_score, 2),
            'average_math_score': round(avg_math_score, 2),
            'average_reading_score': round(avg_reading_score, 2),
            'average_writing_score': round(avg_writing_score, 2),
            'score_distribution': score_ranges
        }
        
        serializer = MockExamStatsSerializer(stats_data)
        return Response(serializer.data)
