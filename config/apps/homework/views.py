"""
Views for the homework app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from apps.homework.models import Homework, HomeworkSubmission
from apps.homework.serializers import (
    HomeworkSerializer,
    HomeworkListSerializer,
    HomeworkSubmissionSerializer,
    HomeworkSubmissionCreateSerializer,
    HomeworkSubmissionDetailSerializer,
    HomeworkStatsSerializer,
    StudentHomeworkProgressSerializer
)
from apps.common.permissions import IsTeacherOrAdmin, IsClassTeacher, IsStudent


class HomeworkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Homework model.
    Different access levels for teachers/admins vs students.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_obj', 'assigned_by', 'is_published']
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return Homework.objects.select_related('class_obj', 'assigned_by').prefetch_related('questions').all()
        elif user.is_teacher:
            return Homework.objects.filter(
                assigned_by=user
            ).select_related('class_obj', 'assigned_by').prefetch_related('questions')
        elif user.is_student:
            # Students can see published homework for their classes
            return Homework.objects.filter(
                class_obj__students=user,
                is_published=True
            ).select_related('class_obj', 'assigned_by').prefetch_related('questions')
        else:
            return Homework.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return HomeworkListSerializer
        return HomeworkSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Set assigned_by to current user."""
        serializer.save(assigned_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit homework for the current student."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can submit homework"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        homework = self.get_object()
        
        # Check if student is enrolled in the class
        if not homework.class_obj.students.filter(id=request.user.id).exists():
            return Response(
                {"detail": "You are not enrolled in this class"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create submission
        submission, created = HomeworkSubmission.objects.get_or_create(
            homework=homework,
            student=request.user,
            defaults={'answers': {}, 'time_spent_seconds': 0}
        )
        
        # Check if already submitted
        if submission.is_submitted:
            return Response(
                {"detail": "Homework already submitted"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate and update submission data
        serializer = HomeworkSubmissionCreateSerializer(
            data=request.data,
            context={'homework': homework, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Update submission
        for key, value in serializer.validated_data.items():
            setattr(submission, key, value)
        
        submission.submit()
        
        return Response(
            HomeworkSubmissionDetailSerializer(submission).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def my_submission(self, request, pk=None):
        """Get current student's submission for this homework."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their submissions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        homework = self.get_object()
        
        try:
            submission = HomeworkSubmission.objects.get(
                homework=homework,
                student=request.user
            )
            serializer = HomeworkSubmissionDetailSerializer(submission)
            return Response(serializer.data)
        except HomeworkSubmission.DoesNotExist:
            return Response(
                {"detail": "No submission found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for this homework (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can view all submissions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        homework = self.get_object()
        
        # Check if user is the teacher of the class or admin
        if not request.user.is_admin and homework.class_obj.teacher != request.user:
            return Response(
                {"detail": "You can only view submissions for your own classes"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submissions = homework.submissions.select_related('student').all()
        serializer = HomeworkSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def provide_feedback(self, request, pk=None):
        """Provide feedback on a submission (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can provide feedback"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        homework = self.get_object()
        
        # Check if user is the teacher of the class or admin
        if not request.user.is_admin and homework.class_obj.teacher != request.user:
            return Response(
                {"detail": "You can only provide feedback for your own classes"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submission_id = request.data.get('submission_id')
        feedback = request.data.get('feedback')
        
        if not submission_id or not feedback:
            return Response(
                {"detail": "Both submission_id and feedback are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            submission = HomeworkSubmission.objects.get(
                id=submission_id,
                homework=homework
            )
            submission.feedback = feedback
            submission.save()
            
            return Response(
                {"detail": "Feedback provided successfully"},
                status=status.HTTP_200_OK
            )
        except HomeworkSubmission.DoesNotExist:
            return Response(
                {"detail": "Submission not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class HomeworkSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for HomeworkSubmission model.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return HomeworkSubmission.objects.select_related('homework', 'student').all()
        elif user.is_teacher:
            # Teachers can see submissions for their classes
            return HomeworkSubmission.objects.filter(
                homework__class_obj__teacher=user
            ).select_related('homework', 'student')
        elif user.is_student:
            return HomeworkSubmission.objects.filter(
                student=user
            ).select_related('homework')
        else:
            return HomeworkSubmission.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['retrieve']:
            return HomeworkSubmissionDetailSerializer
        return HomeworkSubmissionSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        """Get current student's homework progress."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their progress"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student = request.user
        
        # Get all homework for student's classes
        homework_list = Homework.objects.filter(
            class_obj__students=student,
            is_published=True
        ).select_related('class_obj')
        
        progress_data = []
        
        for homework in homework_list:
            try:
                submission = HomeworkSubmission.objects.get(
                    homework=homework,
                    student=student
                )
                is_submitted = submission.is_submitted
                is_late = submission.is_late
                score = submission.score
                accuracy = submission.accuracy_percentage
            except HomeworkSubmission.DoesNotExist:
                submission = None
                is_submitted = False
                is_late = False
                score = None
                accuracy = 0.0
            
            progress_data.append({
                'homework_id': homework.id,
                'homework_title': homework.title,
                'due_date': homework.due_date,
                'is_submitted': is_submitted,
                'is_late': is_late,
                'score': score,
                'accuracy_percentage': accuracy,
                'days_until_due': homework.days_until_due
            })
        
        serializer = StudentHomeworkProgressSerializer(progress_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get homework statistics (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can view statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = request.user
        
        # Filter by class if specified
        class_id = request.query_params.get('class_id')
        
        if user.is_admin and class_id:
            homework_queryset = Homework.objects.filter(class_obj_id=class_id)
        elif user.is_teacher:
            homework_queryset = Homework.objects.filter(assigned_by=user)
            if class_id:
                homework_queryset = homework_queryset.filter(class_obj_id=class_id)
        else:
            homework_queryset = Homework.objects.none()
        
        # Calculate statistics
        total_homework = homework_queryset.count()
        
        submissions = HomeworkSubmission.objects.filter(
            homework__in=homework_queryset
        )
        
        completed_submissions = submissions.filter(submitted_at__isnull=False)
        late_submissions = completed_submissions.filter(is_late=True)
        
        total_submissions = submissions.count()
        completed_count = completed_submissions.count()
        late_count = late_submissions.count()
        
        # Calculate averages
        avg_score = completed_submissions.aggregate(
            avg_score=Avg('score')
        )['avg_score'] or 0
        
        avg_accuracy = completed_submissions.aggregate(
            avg_accuracy=Avg('score') * 100.0 / F('homework__max_score')
        )['avg_accuracy'] or 0
        
        stats_data = {
            'total_homework': total_homework,
            'completed_homework': completed_count,
            'pending_homework': total_submissions - completed_count,
            'late_submissions': late_count,
            'average_score': round(avg_score, 2),
            'average_accuracy': round(avg_accuracy, 2)
        }
        
        serializer = HomeworkStatsSerializer(stats_data)
        return Response(serializer.data)
