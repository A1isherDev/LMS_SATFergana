"""
Views for the questionbank app.
"""
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from apps.analytics.models import WeakArea, StudentProgress
from apps.questionbank.models import Question, QuestionAttempt
from apps.questionbank.serializers import (
    QuestionSerializer,
    QuestionListSerializer,
    QuestionStudentSerializer,
    QuestionAttemptSerializer,
    QuestionAttemptCreateSerializer,
    QuestionStatsSerializer,
    StudentProgressSerializer
)
from apps.common.permissions import IsTeacherOrAdmin, IsStudent
from apps.common.views import AuditLogMixin


class QuestionViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for Question model.
    Different access levels for teachers/admins vs students.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['question_text', 'skill_tag']
    filterset_fields = ['question_type', 'skill_tag', 'difficulty', 'is_active']
    
    @extend_schema(
        summary="List questions",
        description="Retrieve a list of SAT questions based on user role and filters. Admins/teachers see all, students see only active questions.",
        tags=["Question Bank"],
        parameters=[
            OpenApiParameter(
                name='question_type',
                type=OpenApiTypes.STR,
                enum=['MATH', 'READING', 'WRITING'],
                description='Filter by SAT section',
                required=False
            ),
            OpenApiParameter(
                name='difficulty',
                type=OpenApiTypes.INT,
                enum=[1, 2, 3, 4, 5],
                description='Filter by difficulty level (1-5)',
                required=False
            ),
            OpenApiParameter(
                name='skill_tag',
                type=OpenApiTypes.STR,
                description='Filter by skill tag',
                required=False
            )
        ]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return Question.objects.all()
        elif user.is_teacher:
            # Main and Support teachers have access to all questions
            return Question.objects.all()
        elif user.is_student:
            return Question.objects.filter(is_active=True)
        else:
            return Question.objects.none()

    @extend_schema(
        summary="Get topic counts",
        description="Get count of questions grouped by question type and skill tag.",
        tags=["Question Bank"],
        responses={200: {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'question_type': {'type': 'string'},
                    'skill_tag': {'type': 'string'},
                    'count': {'type': 'integer'}
                }
            }
        }}
    )
    @action(detail=False, methods=['get'])
    def topic_counts(self, request):
        """Get count of questions grouped by type and skill tag."""
        queryset = self.get_queryset()
        
        # Aggregate counts
        counts = queryset.values('question_type', 'skill_tag').annotate(
            count=Count('id')
        ).order_by('question_type', 'skill_tag')
        
        return Response(list(counts))
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action and user role."""
        user = self.request.user
        
        if self.action == 'list':
            return QuestionListSerializer
        elif user.is_student and self.action in ['retrieve']:
            return QuestionStudentSerializer
        return QuestionSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    @extend_schema(
        summary="Get practice questions",
        description="Get questions for practice mode. Returns questions suitable for student practice with filters.",
        tags=["Question Bank"],
        parameters=[
            OpenApiParameter(
                name='question_type',
                type=OpenApiTypes.STR,
                enum=['MATH', 'READING', 'WRITING'],
                description='Filter by SAT section',
                required=False
            ),
            OpenApiParameter(
                name='difficulty',
                type=OpenApiTypes.INT,
                enum=[1, 2, 3, 4, 5],
                description='Filter by difficulty level (1-5)',
                required=False
            ),
            OpenApiParameter(
                name='count',
                type=OpenApiTypes.INT,
                description='Number of questions to return',
                required=False
            )
        ],
        responses={200: QuestionStudentSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def practice(self, request):
        """Get questions for practice mode (student view)."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can access practice questions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        question_type = request.query_params.get('question_type')
        skill_tag = request.query_params.get('skill_tag')
        difficulty = request.query_params.get('difficulty')
        count = int(request.query_params.get('count', 10))
        
        # Build queryset
        queryset = Question.objects.filter(is_active=True)
        
        if question_type:
            queryset = queryset.filter(question_type=question_type)
        if skill_tag:
            queryset = queryset.filter(skill_tag=skill_tag)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Exclude questions the student has already attempted in practice mode
        attempted_questions = QuestionAttempt.objects.filter(
            student=request.user,
            context='PRACTICE'
        ).values_list('question_id', flat=True)
        
        queryset = queryset.exclude(id__in=attempted_questions)
        
        # Limit results
        questions = queryset.order_by('?')[:count]
        
        serializer = QuestionStudentSerializer(questions, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Attempt question",
        description="Record an attempt at a question. Tracks student answers and provides feedback.",
        tags=["Question Bank"],
        request=QuestionAttemptCreateSerializer,
        responses={201: {
            'type': 'object',
            'properties': {
                'correct': {'type': 'boolean'},
                'feedback': {'type': 'string'},
                'explanation': {'type': 'string'}
            }
        }}
    )
    @action(detail=True, methods=['post'])
    def attempt(self, request, pk=None):
        """Record an attempt at a question."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can attempt questions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        question = self.get_object()
        
        # Check if question is active
        if not question.is_active:
            return Response(
                {"detail": "Cannot attempt inactive question"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = QuestionAttemptCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Override question with the one from URL
        serializer.validated_data['question'] = question
        
        attempt = serializer.save()
        
        # Trigger analytics updates
        try:
            WeakArea.analyze_student_weak_areas(request.user)
            StudentProgress.update_daily_progress(request.user)
        except Exception as e:
            # Don't fail the attempt if analytics fails
            print(f"Analytics update failed: {e}")
        
        # Return attempt result with explanation
        response_data = {
            'attempt': QuestionAttemptSerializer(attempt).data,
            'is_correct': attempt.is_correct,
            'correct_answer': question.correct_answer,
            'explanation': question.explanation
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        summary="Get question statistics",
        description="Get question statistics and analytics (teachers/admins only).",
        tags=["Question Bank"],
        responses={200: QuestionStatsSerializer}
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get question statistics (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can view question statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get filter parameters
        question_type = request.query_params.get('question_type')
        skill_tag = request.query_params.get('skill_tag')
        difficulty = request.query_params.get('difficulty')
        
        # Build queryset with annotations
        queryset = Question.objects.annotate(
            total_attempts=Count('attempts'),
            correct_attempts=Count('attempts', filter=Q(attempts__is_correct=True)),
            avg_time=Avg('attempts__time_spent_seconds')
        )
        
        if question_type:
            queryset = queryset.filter(question_type=question_type)
        if skill_tag:
            queryset = queryset.filter(skill_tag=skill_tag)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Format results
        questions_with_stats = []
        for q in queryset:
            accuracy = (q.correct_attempts / q.total_attempts * 100) if q.total_attempts > 0 else 0
            questions_with_stats.append({
                'question_id': q.id,
                'question_type': q.get_question_type_display(),
                'skill_tag': q.skill_tag,
                'difficulty': q.difficulty,
                'total_attempts': q.total_attempts,
                'correct_attempts': q.correct_attempts,
                'accuracy_percentage': round(accuracy, 2),
                'average_time_seconds': round(q.avg_time or 0, 2)
            })
        
        return Response(questions_with_stats)


class QuestionAttemptViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for QuestionAttempt model.
    Students can only see their own attempts.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="List question attempts",
        description="Retrieve a list of question attempts based on user role. Students see their own attempts, teachers/admins see all.",
        tags=["Question Bank"],
        parameters=[
            OpenApiParameter(
                name='question',
                type=OpenApiTypes.INT,
                description='Filter by question ID',
                required=False
            ),
            OpenApiParameter(
                name='is_correct',
                type=OpenApiTypes.BOOL,
                description='Filter by correctness',
                required=False
            )
        ]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return QuestionAttempt.objects.select_related('question', 'student').all()
        elif user.is_teacher:
            return QuestionAttempt.objects.select_related('question', 'student').all()
        elif user.is_student:
            return QuestionAttempt.objects.filter(
                student=user
            ).select_related('question')
        else:
            return QuestionAttempt.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return QuestionAttemptCreateSerializer
        return QuestionAttemptSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action == 'create':
            return [IsStudent()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Create attempt and return result with explanation for practice feedback."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt = serializer.save()
        question = attempt.question
        response_data = {
            **QuestionAttemptSerializer(attempt).data,
            'is_correct': attempt.is_correct,
            'correct_answer': question.correct_answer,
            'explanation': question.explanation,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Get my progress",
        description="Get current student's progress statistics across all question attempts.",
        tags=["Question Bank"],
        responses={200: StudentProgressSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        """Get current student's progress statistics."""
        if not request.user.is_student:
            return Response([], status=status.HTTP_200_OK)
        
        student = request.user
        
        # Get progress by question type
        question_types = ['MATH', 'READING', 'WRITING']
        progress_data = []
        
        for q_type in question_types:
            attempts = QuestionAttempt.objects.filter(
                student=student,
                question__question_type=q_type
            )
            
            total_attempts = attempts.count()
            correct_attempts = attempts.filter(is_correct=True).count()
            accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
            avg_time = attempts.aggregate(avg_time=Avg('time_spent_seconds'))['avg_time'] or 0
            
            # Get skill breakdown
            skill_stats = {}
            for skill in attempts.values('question__skill_tag').annotate(
                skill_count=Count('id'),
                skill_correct=Count('id', filter=Q(is_correct=True))
            ):
                skill_name = skill['question__skill_tag']
                skill_accuracy = (skill['skill_correct'] / skill['skill_count'] * 100) if skill['skill_count'] > 0 else 0
                skill_stats[skill_name] = {
                    'attempts': skill['skill_count'],
                    'accuracy': round(skill_accuracy, 2)
                }
            
            progress_data.append({
                'question_type': q_type,
                'total_attempts': total_attempts,
                'correct_attempts': correct_attempts,
                'accuracy_percentage': round(accuracy, 2),
                'average_time_seconds': round(avg_time, 2),
                'skill_breakdown': skill_stats
            })
        
        serializer = StudentProgressSerializer(progress_data, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get recent attempts",
        description="Get recent question attempts for the current student.",
        tags=["Question Bank"],
        parameters=[
            OpenApiParameter(
                name='limit',
                type=OpenApiTypes.INT,
                description='Number of recent attempts to return',
                required=False
            )
        ],
        responses={200: QuestionAttemptSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent attempts for the current student."""
        if not request.user.is_student:
            return Response([], status=status.HTTP_200_OK)
        
        limit = int(request.query_params.get('limit', 20))
        attempts = QuestionAttempt.objects.filter(
            student=request.user
        ).select_related('question').order_by('-attempted_at')[:limit]
        
        serializer = QuestionAttemptSerializer(attempts, many=True)
        return Response(serializer.data)
