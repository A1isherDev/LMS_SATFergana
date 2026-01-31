"""
Views for the analytics app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q, Count, Avg, F, Sum
from django.utils import timezone
from django.db.models.functions import TruncDate
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend
from apps.analytics.models import StudentProgress, WeakArea, StudySession
from apps.homework.models import Homework, HomeworkSubmission
from apps.mockexams.models import MockExam, MockExamAttempt
from apps.flashcards.models import Flashcard
from apps.users.models import User
from apps.analytics.serializers import (
    StudentProgressSerializer,
    WeakAreaSerializer,
    StudySessionSerializer,
    ProgressChartSerializer,
    WeakAreaAnalysisSerializer,
    StudyTimeAnalysisSerializer,
    PerformanceTrendSerializer,
    StudentAnalyticsSummarySerializer,
    ClassAnalyticsSerializer,
    StudySessionCreateSerializer,
    StudySessionUpdateSerializer
)
from apps.common.permissions import IsTeacherOrAdmin, IsStudent


class StudentProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for StudentProgress model.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'date']
    ordering_fields = ['date', 'homework_completion_rate', 'homework_accuracy']
    ordering = ['-date']
    
    @extend_schema(
        summary="List student progress",
        description="Retrieve student progress data based on user role. Admins see all, teachers see their students, students see their own progress.",
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='student',
                type=OpenApiTypes.INT,
                description='Filter by student ID',
                required=False
            ),
            OpenApiParameter(
                name='date',
                type=OpenApiTypes.DATE,
                description='Filter by date',
                required=False
            )
        ]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return StudentProgress.objects.select_related('student').all()
        elif user.is_teacher:
            return StudentProgress.objects.select_related('student').all()
        elif user.is_student:
            return StudentProgress.objects.filter(student=user).select_related('student')
        else:
            return StudentProgress.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        return StudentProgressSerializer
    
    @extend_schema(
        summary="Get my progress",
        description="Get current student's progress history across all learning activities.",
        tags=["Analytics"],
        responses={200: StudentProgressSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        """Get current student's progress history."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their own progress"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get progress for last 30 days
        cutoff_date = timezone.now().date() - timezone.timedelta(days=30)
        progress_records = StudentProgress.objects.filter(
            student=request.user,
            date__gte=cutoff_date
        ).order_by('date')
        
        serializer = StudentProgressSerializer(progress_records, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get progress chart data",
        description="Get progress data formatted for charts and visualizations.",
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='days',
                type=OpenApiTypes.INT,
                description='Number of days to include in chart',
                required=False
            )
        ],
        responses={200: ProgressChartSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def progress_chart(self, request):
        """Get progress data for charts."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their progress charts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get progress for last 30 days
        cutoff_date = timezone.now().date() - timezone.timedelta(days=30)
        progress_records = StudentProgress.objects.filter(
            student=request.user,
            date__gte=cutoff_date
        ).order_by('date')
        
        chart_data = []
        for record in progress_records:
            chart_data.append({
                'date': record.date,
                'homework_completion_rate': record.homework_completion_rate,
                'homework_accuracy': record.homework_accuracy,
                'sat_score': record.latest_sat_score,
                'flashcard_mastery_rate': record.flashcard_mastery_rate,
                'study_time_minutes': record.study_time_minutes
            })
        
        serializer = ProgressChartSerializer(chart_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_progress(self, request):
        """Update today's progress for current student."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can update their own progress"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        date_str = request.data.get('date')
        if date_str:
            try:
                date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            date = timezone.now().date()
        
        progress = StudentProgress.update_daily_progress(request.user, date)
        serializer = StudentProgressSerializer(progress)
        return Response(serializer.data)


class WeakAreaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for WeakArea model.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'area_type']
    ordering = ['-weakness_score']
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return WeakArea.objects.select_related('student').all()
        elif user.is_teacher:
            return WeakArea.objects.select_related('student').all()
        elif user.is_student:
            return WeakArea.objects.filter(student=user).select_related('student')
        else:
            return WeakArea.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        return WeakAreaSerializer
    
    @action(detail=False, methods=['get'])
    def my_weak_areas(self, request):
        """Get current student's weak areas."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their own weak areas"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        weak_areas = WeakArea.objects.filter(student=request.user).order_by('-weakness_score')
        
        # Convert to analysis format
        analysis_data = []
        for area in weak_areas:
            analysis_data.append({
                'area_type': area.area_type,
                'subcategory': area.subcategory,
                'weakness_score': area.weakness_score,
                'accuracy_rate': area.accuracy_rate,
                'question_count': area.question_count,
                'improvement_suggestion': self._get_improvement_suggestion(area)
            })
        
        serializer = WeakAreaAnalysisSerializer(analysis_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def analyze_weak_areas(self, request):
        """Trigger weak area analysis for current student."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can analyze their own weak areas"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            WeakArea.analyze_student_weak_areas(request.user)
            
            # Return updated weak areas
            weak_areas = WeakArea.objects.filter(student=request.user).order_by('-weakness_score')
            serializer = WeakAreaSerializer(weak_areas, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"detail": f"Failed to analyze weak areas: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def start_study_session(self, request):
        """Start a new study session."""
        try:
            session_type = request.data.get('session_type', 'practice')
            
            # Check if there's already an active session
            active_session = StudySession.objects.filter(
                student=request.user,
                ended_at__isnull=True
            ).first()
            
            if active_session:
                return Response({
                    'detail': 'You already have an active study session',
                    'session_id': active_session.id,
                    'started_at': active_session.started_at
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create new study session
            session = StudySession.objects.create(
                student=request.user,
                session_type=session_type,
                started_at=timezone.now()
            )
            
            return Response({
                'session_id': session.id,
                'session_type': session.session_type,
                'started_at': session.started_at
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"detail": f"Failed to start study session: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def end_study_session(self, request):
        """End the current study session."""
        try:
            session_id = request.data.get('session_id')
            
            if session_id:
                # End specific session
                session = StudySession.objects.filter(
                    id=session_id,
                    student=request.user,
                    ended_at__isnull=True
                ).first()
            else:
                # End any active session
                session = StudySession.objects.filter(
                    student=request.user,
                    ended_at__isnull=True
                ).first()
            
            if not session:
                return Response(
                    {"detail": "No active study session found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update session
            session.ended_at = timezone.now()
            session.duration_minutes = int((session.ended_at - session.started_at).total_seconds() / 60)
            
            # Update study progress for today
            today = timezone.now().date()
            progress, created = StudentProgress.objects.get_or_create(
                student=request.user,
                date=today,
                defaults={
                    'study_time_minutes': session.duration_minutes,
                    'streak_days': 1
                }
            )
            
            if not created:
                progress.study_time_minutes += session.duration_minutes
                progress.save()
            
            session.save()
            
            # Calculate updated streak
            updated_streak = calculate_study_streak(
                StudySession.objects.filter(
                    student=request.user,
                    ended_at__isnull=False
                ).order_by('-started_at')
            )
            
            return Response({
                'session_id': session.id,
                'duration_minutes': session.duration_minutes,
                'session_type': session.session_type,
                'updated_streak': updated_streak
            })
            
        except Exception as e:
            return Response(
                {"detail": f"Failed to end study session: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active_session(self, request):
        """Get current active study session."""
        try:
            active_session = StudySession.objects.filter(
                student=request.user,
                ended_at__isnull=True
            ).first()
            
            if not active_session:
                return Response({'active_session': None})
            
            # Calculate current duration
            current_duration = int((timezone.now() - active_session.started_at).total_seconds() / 60)
            
            return Response({
                'active_session': {
                    'id': active_session.id,
                    'session_type': active_session.session_type,
                    'started_at': active_session.started_at,
                    'current_duration_minutes': current_duration
                }
            })
            
        except Exception as e:
            return Response(
                {"detail": f"Failed to get active session: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @staticmethod
    def _get_improvement_suggestion(weak_area):
        """Get improvement suggestion for a weak area."""
        suggestions = {
            'MATH': {
                'Algebra': 'Practice algebraic equations and inequalities daily',
                'Geometry': 'Review geometric formulas and practice coordinate geometry',
                'Statistics & Probability': 'Focus on data interpretation and probability rules',
                'General Math': 'Practice mixed math problems and review fundamentals'
            },
            'READING': {
                'Main Idea': 'Practice identifying main ideas in passages',
                'Inference': 'Work on drawing logical conclusions from text',
                'Vocabulary in Context': 'Study SAT vocabulary and practice context clues',
                'General Reading': 'Read diverse passages and practice active reading'
            },
            'WRITING': {
                'Grammar': 'Review grammar rules and practice sentence correction',
                'Punctuation': 'Study punctuation rules and common errors',
                'Style & Tone': 'Practice identifying author\'s tone and style',
                'General Writing': 'Practice editing and proofreading skills'
            }
        }
        
        return suggestions.get(weak_area.area_type, {}).get(
            weak_area.subcategory,
            'Practice regularly and review fundamentals'
        )


class StudySessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudySession model.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'session_type']
    ordering = ['-started_at']
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return StudySession.objects.select_related('student').all()
        elif user.is_teacher:
            return StudySession.objects.select_related('student').all()
        elif user.is_student:
            return StudySession.objects.filter(student=user).select_related('student')
        else:
            return StudySession.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return StudySessionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StudySessionUpdateSerializer
        return StudySessionSerializer
    
    @action(detail=False, methods=['get'])
    def my_sessions(self, request):
        """Get current student's study sessions."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their own sessions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get sessions for last 30 days
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        sessions = StudySession.objects.filter(
            student=request.user,
            started_at__gte=cutoff_date
        ).order_by('-started_at')
        
        serializer = StudySessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def study_time_analysis(self, request):
        """Get study time analysis for current student."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their study time analysis"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get sessions for last 30 days
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        sessions = StudySession.objects.filter(
            student=request.user,
            started_at__gte=cutoff_date,
            ended_at__isnull=False
        )
        
        total_study_time = sessions.aggregate(
            total_time=Sum('duration_minutes')
        )['total_time'] or 0
        
        average_daily_time = total_study_time / 30 if total_study_time > 0 else 0
        
        # Get current streak
        current_progress = StudentProgress.objects.filter(
            student=request.user
        ).order_by('-date').first()
        
        study_streak = current_progress.streak_days if current_progress else 0
        
        # Find most productive day
        sessions_by_day = sessions.annotate(
            date=TruncDate('started_at')
        ).values('date').annotate(
            day_total=Sum('duration_minutes')
        ).order_by('-day_total').first()
        
        most_productive_day = sessions_by_day['date'].strftime('%A') if sessions_by_day else 'N/A'
        
        # Session type breakdown
        session_breakdown = sessions.values('session_type').annotate(
            total_time=Sum('duration_minutes')
        ).order_by('-total_time')
        
        breakdown_dict = {
            item['session_type']: item['total_time']
            for item in session_breakdown
        }
        
        analysis_data = {
            'total_study_time': total_study_time,
            'average_daily_time': round(average_daily_time, 2),
            'study_streak': study_streak,
            'most_productive_day': most_productive_day,
            'session_type_breakdown': breakdown_dict
        }
        
        serializer = StudyTimeAnalysisSerializer(analysis_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End a study session."""
        session = self.get_object()
        
        # Check if session belongs to current student
        if session.student != request.user:
            return Response(
                {"detail": "You can only end your own sessions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        session.end_session()
        serializer = StudySessionSerializer(session)
        return Response(serializer.data)


class AnalyticsViewSet(viewsets.GenericViewSet):
    """
    Generic ViewSet for comprehensive analytics.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get student summary",
        description="Get comprehensive analytics summary for current student including progress, weak areas, and study patterns.",
        tags=["Analytics"],
        responses={200: StudentAnalyticsSummarySerializer}
    )
    @action(detail=False, methods=['get'])
    def student_summary(self, request):
        """Get comprehensive analytics summary for current student"""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their analytics summary"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student = request.user
        
        # Get current progress
        current_progress = StudentProgress.objects.filter(
            student=student
        ).order_by('-date').first()
        
        # Get target SAT score
        from apps.users.models import StudentProfile
        profile = getattr(student, 'student_profile', None)
        target_score = profile.target_sat_score if profile else 1200
        
        current_score = current_progress.latest_sat_score if current_progress else 0
        score_gap = target_score - current_score
        
        # Get weak areas
        weak_areas = WeakArea.objects.filter(student=student).order_by('-weakness_score')[:5]
        
        weak_area_analysis = []
        for area in weak_areas:
            weak_area_analysis.append({
                'area_type': area.area_type,
                'subcategory': area.subcategory,
                'weakness_score': area.weakness_score,
                'accuracy_rate': area.accuracy_rate,
                'question_count': area.question_count,
                'improvement_suggestion': WeakAreaViewSet._get_improvement_suggestion(area)
            })
        
        # Calculate performance trends
        trends = self._calculate_performance_trends(student)
        
        # Get recent progress
        cutoff_date = timezone.now().date() - timezone.timedelta(days=30)
        recent_progress = StudentProgress.objects.filter(
            student=student,
            date__gte=cutoff_date
        ).order_by('date')
        
        recent_progress_data = []
        for record in recent_progress:
            recent_progress_data.append({
                'date': record.date,
                'homework_completion_rate': record.homework_completion_rate,
                'homework_accuracy': record.homework_accuracy,
                'sat_score': record.latest_sat_score,
                'flashcard_mastery_rate': record.flashcard_mastery_rate,
                'study_time_minutes': record.study_time_minutes
            })
        
        summary_data = {
            'student_id': student.id,
            'student_name': student.get_full_name() or student.email,
            'current_sat_score': current_score,
            'target_sat_score': target_score,
            'score_gap': score_gap,
            'homework_completion_rate': current_progress.homework_completion_rate if current_progress else 0,
            'homework_accuracy': current_progress.homework_accuracy if current_progress else 0,
            'flashcard_mastery_rate': current_progress.flashcard_mastery_rate if current_progress else 0,
            'study_streak': current_progress.streak_days if current_progress else 0,
            'total_study_time': StudySession.objects.filter(
                student=student,
                ended_at__isnull=False
            ).aggregate(total=Sum('duration_minutes'))['total'] or 0,
            'weak_areas': weak_area_analysis,
            'performance_trends': trends,
            'recent_progress': recent_progress_data
        }
        
        serializer = StudentAnalyticsSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def class_analytics(self, request):
        """Get class-level analytics (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can view class analytics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        class_id = request.query_params.get('class_id')
        
        if not class_id:
            return Response(
                {"detail": "Class ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.classes.models import Class
        
        try:
            class_obj = Class.objects.get(id=class_id)
            
            # Check if user is the teacher or admin
            if not request.user.is_admin and class_obj.teacher != request.user:
                return Response(
                    {"detail": "You can only view analytics for your own classes"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get class students
            students = class_obj.students.all()
            
            # Calculate class metrics
            student_ids = students.values_list('id', flat=True)
            
            # Get latest SAT scores
            latest_scores = StudentProgress.objects.filter(
                student_id__in=student_ids
            ).order_by('student', '-date').distinct('student')
            
            sat_scores = [p.latest_sat_score for p in latest_scores if p.latest_sat_score]
            average_sat_score = sum(sat_scores) / len(sat_scores) if sat_scores else 0
            
            # Get homework metrics
            homework_progress = StudentProgress.objects.filter(
                student_id__in=student_ids
            ).order_by('student', '-date').distinct('student')
            
            completion_rates = [p.homework_completion_rate for p in homework_progress]
            accuracy_rates = [p.homework_accuracy for p in homework_progress]
            
            avg_completion = sum(completion_rates) / len(completion_rates) if completion_rates else 0
            avg_accuracy = sum(accuracy_rates) / len(accuracy_rates) if accuracy_rates else 0
            
            # Find top performer
            top_performer = None
            if sat_scores:
                top_student_id = latest_scores[
                    max(range(len(latest_scores)), 
                    key=lambda i: latest_scores[i].latest_sat_score or 0)
                ].student.id
                
                top_student = students.get(id=top_student_id)
                top_performer = {
                    'name': top_student.get_full_name() or top_student.email,
                    'email': top_student.email,
                    'sat_score': max(sat_scores)
                }
            
            # Find struggling students (bottom 25%)
            struggling_count = max(1, len(students) // 4)
            struggling_students = []
            
            if sat_scores:
                sorted_scores = sorted(sat_scores)
                cutoff_score = sorted_scores[struggling_count - 1] if struggling_count > 0 else 0
                
                for progress in latest_scores:
                    if progress.latest_sat_score and progress.latest_sat_score <= cutoff_score:
                        struggling_students.append({
                            'name': progress.student.get_full_name() or progress.student.email,
                            'email': progress.student.email,
                            'sat_score': progress.latest_sat_score
                        })
            
            # Get class weak areas
            class_weak_areas = WeakArea.objects.filter(
                student_id__in=student_ids
            ).values('area_type', 'subcategory').annotate(
                avg_weakness=Avg('weakness_score')
            ).order_by('-avg_weakness')[:5]
            
            weak_areas_list = [
                f"{area['area_type']} - {area['subcategory']}"
                for area in class_weak_areas
            ]
            
            # Study time stats
            study_time_stats = StudySession.objects.filter(
                student_id__in=student_ids,
                ended_at__isnull=False
            ).aggregate(
                total_time=Sum('duration_minutes'),
                avg_session=Avg('duration_minutes'),
                session_count=Count('id')
            )
            
            analytics_data = {
                'class_id': class_obj.id,
                'class_name': class_obj.name,
                'total_students': students.count(),
                'average_sat_score': round(average_sat_score, 2),
                'average_homework_completion': round(avg_completion, 2),
                'average_homework_accuracy': round(avg_accuracy, 2),
                'top_performer': top_performer,
                'struggling_students': struggling_students,
                'class_weak_areas': weak_areas_list,
                'study_time_stats': study_time_stats
            }
            
            serializer = ClassAnalyticsSerializer(analytics_data)
            return Response(serializer.data)
            
        except Class.DoesNotExist:
            return Response(
                {"detail": "Class not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @staticmethod
    def _calculate_performance_trends(student):
        """Calculate performance trends for a student."""
        # Get progress for last 30 days and previous 30 days
        current_cutoff = timezone.now().date() - timezone.timedelta(days=30)
        previous_cutoff = timezone.now().date() - timezone.timedelta(days=60)
        
        current_progress = StudentProgress.objects.filter(
            student=student,
            date__gte=current_cutoff
        )
        
        previous_progress = StudentProgress.objects.filter(
            student=student,
            date__gte=previous_cutoff,
            date__lt=current_cutoff
        )
        
        # Calculate trends
        current_avg_sat = current_progress.aggregate(
            avg=Avg('latest_sat_score')
        )['avg'] or 0
        
        previous_avg_sat = previous_progress.aggregate(
            avg=Avg('latest_sat_score')
        )['avg'] or 0
        
        current_avg_accuracy = current_progress.aggregate(
            avg=Avg('homework_accuracy')
        )['avg'] or 0
        
        previous_avg_accuracy = previous_progress.aggregate(
            avg=Avg('homework_accuracy')
        )['avg'] or 0
        
        # Determine trend direction
        sat_trend = 'stable'
        if current_avg_sat > previous_avg_sat + 20:
            sat_trend = 'improving'
        elif current_avg_sat < previous_avg_sat - 20:
            sat_trend = 'declining'
        
        accuracy_trend = 'stable'
        if current_avg_accuracy > previous_avg_accuracy + 5:
            accuracy_trend = 'improving'
        elif current_avg_accuracy < previous_avg_accuracy - 5:
            accuracy_trend = 'declining'
        
        # Calculate overall trend score
        trend_score = 0
        if sat_trend == 'improving':
            trend_score += 1
        elif sat_trend == 'declining':
            trend_score -= 1
        
        if accuracy_trend == 'improving':
            trend_score += 1
        elif accuracy_trend == 'declining':
            trend_score -= 1
        
        return {
            'period': '30_days',
            'sat_score_trend': sat_trend,
            'homework_accuracy_trend': accuracy_trend,
            'flashcard_mastery_trend': 'stable',  # Could be calculated similarly
            'overall_trend_score': trend_score
        }


@extend_schema(
    summary="Get dashboard statistics",
    description="Get dashboard statistics for the current user based on their role.",
    tags=["Analytics"],
    responses={200: {
        'type': 'object',
        'properties': {
            'total_students': {'type': 'integer'},
            'active_classes': {'type': 'integer'},
            'pending_homework': {'type': 'integer'},
            'average_score': {'type': 'number'}
        }
    }}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the current user.
    Different data based on user role (student/teacher/admin).
    """
    user = request.user
    
    if user.role == 'STUDENT':
        return get_student_dashboard_stats(user)
    elif user.role == 'TEACHER':
        return get_teacher_dashboard_stats(user)
    elif user.role == 'ADMIN':
        return get_admin_dashboard_stats(user)
    
    return Response({'error': 'Invalid user role'}, status=400)


def get_student_dashboard_stats(student):
    """Get dashboard statistics for a student."""
    now = timezone.now()
    
    # Homework stats
    student_homework = Homework.objects.filter(
        class_obj__students=student,
        is_published=True
    )
    
    total_homework = student_homework.count()
    completed_homework = HomeworkSubmission.objects.filter(
        homework__in=student_homework,
        student=student,
        submitted_at__isnull=False
    ).count()
    
    homework_completion = (completed_homework / total_homework * 100) if total_homework > 0 else 0
    
    # Mock exam stats
    exam_attempts = MockExamAttempt.objects.filter(student=student)
    completed_attempts = exam_attempts.filter(is_completed=True)
    
    average_score = 0
    if completed_attempts.exists():
        average_score = completed_attempts.aggregate(avg_score=Avg('sat_score'))['avg_score'] or 0
    
    # Study streak (simplified - in real app, track daily activity)
    study_sessions = StudySession.objects.filter(
        student=student,
        started_at__gte=now - timedelta(days=30)
    ).order_by('-started_at')
    
    study_streak = calculate_study_streak(study_sessions)
    
    # Today's study time
    today_study = StudySession.objects.filter(
        student=student,
        started_at__date=now.date()
    ).aggregate(total_time=Sum('duration_minutes'))['total_time'] or 0
    
    # Next exam (find most recent upcoming exam)
    next_exam_date = None
    student_profile = getattr(student, 'studentprofile', None)
    if student_profile and student_profile.sat_exam_date:
        next_exam_date = student_profile.sat_exam_date
    
    # Weak areas (from recent performance)
    weak_areas = get_weak_areas(student)
    
    # Recent activity
    recent_activity = get_recent_activity(student)
    
    return Response({
        'homeworkCompletion': round(homework_completion, 1),
        'averageScore': round(average_score),
        'studyStreak': study_streak,
        'studyTimeToday': today_study,
        'nextExamDate': next_exam_date or (now + timedelta(days=120)).isoformat().split('T')[0],
        'weakAreas': weak_areas,
        'recentActivity': recent_activity
    })


def get_teacher_dashboard_stats(teacher):
    """Get dashboard statistics for a teacher."""
    now = timezone.now()
    
    # Classes taught
    classes_count = teacher.taught_classes.count()
    total_students = teacher.taught_classes.aggregate(
        total=Sum('students__count')
    )['total'] or 0
    
    # Homework assigned
    homework_assigned = Homework.objects.filter(assigned_by=teacher).count()
    homework_published = Homework.objects.filter(assigned_by=teacher, is_published=True).count()
    
    # Recent submissions to grade
    pending_submissions = HomeworkSubmission.objects.filter(
        homework__assigned_by=teacher,
        submitted_at__isnull=False,
        score__isnull=True
    ).count()
    
    # Student performance overview
    avg_class_score = HomeworkSubmission.objects.filter(
        homework__assigned_by=teacher,
        score__isnull=False
    ).aggregate(avg_score=Avg('score'))['avg_score'] or 0
    
    return Response({
        'classesCount': classes_count,
        'totalStudents': total_students,
        'homeworkAssigned': homework_assigned,
        'homeworkPublished': homework_published,
        'pendingSubmissions': pending_submissions,
        'averageClassScore': round(avg_class_score, 1)
    })


def get_admin_dashboard_stats(admin):
    """Get dashboard statistics for an admin."""
    now = timezone.now()
    
    # Overall stats
    total_users = User.objects.count()
    total_students = User.objects.filter(role='STUDENT').count()
    total_teachers = User.objects.filter(role='TEACHER').count()
    
    # Content stats
    total_homework = Homework.objects.count()
    total_questions = 0  # Add question count
    total_flashcards = Flashcard.objects.count()
    
    # Activity stats
    today_sessions = StudySession.objects.filter(started_at__date=now.date()).count()
    weekly_sessions = StudySession.objects.filter(
        started_at__gte=now - timedelta(days=7)
    ).count()
    
    return Response({
        'totalUsers': total_users,
        'totalStudents': total_students,
        'totalTeachers': total_teachers,
        'totalHomework': total_homework,
        'totalQuestions': total_questions,
        'totalFlashcards': total_flashcards,
        'todaySessions': today_sessions,
        'weeklySessions': weekly_sessions
    })


def calculate_study_streak(sessions):
    """Calculate study streak from sessions."""
    if not sessions.exists():
        return 0
    
    streak = 0
    current_date = timezone.now().date()
    
    # Filter sessions that have ended (completed sessions)
    completed_sessions = sessions.filter(ended_at__isnull=False)
    
    for session in completed_sessions:
        if session.ended_at.date() == current_date - timedelta(days=streak):
            streak += 1
        else:
            break
    
    return streak


def get_weak_areas(student):
    """Get weak areas based on recent performance."""
    # This is a simplified version - in real app, analyze performance by subject
    weak_areas = []
    
    # Check homework performance by subject
    recent_submissions = HomeworkSubmission.objects.filter(
        student=student,
        submitted_at__gte=timezone.now() - timedelta(days=30),
        score__isnull=False
    )
    
    if recent_submissions.exists():
        avg_score = recent_submissions.aggregate(avg=Avg('score'))['avg'] or 0
        if avg_score < 70:
            weak_areas.append('Math')
        if avg_score < 60:
            weak_areas.append('Reading')
    
    return weak_areas[:3]  # Return top 3 weak areas


def get_recent_activity(student):
    """Get recent activity for student."""
    activities = []
    now = timezone.now()
    
    # Recent homework submissions
    recent_submissions = HomeworkSubmission.objects.filter(
        student=student,
        submitted_at__gte=now - timedelta(days=7)
    ).order_by('-submitted_at')[:3]
    
    for submission in recent_submissions:
        activities.append({
            'type': 'homework',
            'description': f'Completed {submission.homework.title}',
            'timestamp': submission.submitted_at.isoformat()
        })
    
    # Recent exam attempts
    recent_attempts = MockExamAttempt.objects.filter(
        student=student,
        submitted_at__gte=now - timedelta(days=7)
    ).order_by('-submitted_at')[:2]
    
    for attempt in recent_attempts:
        activities.append({
            'type': 'mock_exam',
            'description': f'Scored {attempt.sat_score} on {attempt.mock_exam.title}',
            'timestamp': attempt.submitted_at.isoformat()
        })
    
    # Recent flashcard reviews (placeholder - FlashcardReview model doesn't exist yet)
    # recent_reviews = FlashcardReview.objects.filter(
    #     student=student,
    #     reviewed_at__gte=now - timedelta(days=7)
    # ).order_by('-reviewed_at')[:2]
    
    # For now, create placeholder activity
    for i in range(2):
        activities.append({
            'type': 'flashcard',
            'description': f'Reviewed {25 + i * 5} flashcards',
            'timestamp': (now - timedelta(days=i + 1)).isoformat()
        })
    
    # Sort by timestamp and return latest 5
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    return activities[:5]
