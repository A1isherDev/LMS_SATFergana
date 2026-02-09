"""
Views for the classes app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.utils import timezone
from django.db.models import Q, Count, Avg, F, Sum
from django.contrib.contenttypes.models import ContentType
from apps.classes.models import Class, Announcement
from apps.classes.serializers import (
    ClassSerializer,
    ClassListSerializer,
    ClassEnrollmentSerializer,
    ClassLeaderboardSerializer,
    ClassLeaderboardEntrySerializer,
    ClassLeaderboardSerializer,
    ClassLeaderboardEntrySerializer,
    AnnouncementSerializer,
    ClassResourceSerializer
)
from apps.classes.models import ClassResource
from apps.common.permissions import IsTeacherOrAdmin, IsClassTeacher, IsStudentInClass


class ClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Class model.
    Different access levels based on user role.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="List classes",
        description="Retrieve a list of classes based on user role. Admins see all, teachers see their classes, students see enrolled classes.",
        tags=["Classes"]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return Class.objects.select_related('teacher').prefetch_related('students').all()
        elif user.is_teacher:
            return Class.objects.filter(
                teacher=user
            ).select_related('teacher').prefetch_related('students')
        elif user.is_student:
            return Class.objects.filter(
                students=user,
                is_active=True
            ).select_related('teacher').prefetch_related('students')
        else:
            return Class.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ClassListSerializer
        return ClassSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        elif self.action in ['enroll_students', 'remove_students']:
            return [IsClassTeacher()]
        elif self.action in ['leaderboard', 'announcements']:
            return [IsStudentInClass() | IsClassTeacher()]
        elif self.action in ['post_announcement']:
            return [IsClassTeacher()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Set teacher to current user if not provided and set default dates."""
        from datetime import date, timedelta
        
        # Set default dates if not provided
        validated_data = serializer.validated_data
        if 'start_date' not in validated_data:
            validated_data['start_date'] = date.today()
        if 'end_date' not in validated_data:
            validated_data['end_date'] = date.today() + timedelta(days=180)  # 6 months default
            
        if self.request.user.is_teacher:
            serializer.save(teacher=self.request.user, **validated_data)
        else:
            serializer.save(**validated_data)
    
    @extend_schema(
        summary="Enroll students in class",
        description="Enroll multiple students in a class. Only teachers and admins can enroll students.",
        tags=["Classes"],
        request=ClassEnrollmentSerializer,
        responses={200: {
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'enrolled_count': {'type': 'integer'}
            }
        }}
    )
    @action(detail=True, methods=['post'])
    def enroll_students(self, request, pk=None):
        """Enroll students in the class."""
        class_obj = self.get_object()
        
        # Check if class is full
        if class_obj.is_full:
            return Response(
                {"detail": "Class is at maximum capacity"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ClassEnrollmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        student_ids = serializer.validated_data['student_ids']
        students_to_enroll = []
        
        for student_id in student_ids:
            if not class_obj.students.filter(id=student_id).exists():
                students_to_enroll.append(student_id)
        
        # Check capacity
        available_spots = class_obj.max_students - class_obj.current_student_count
        if len(students_to_enroll) > available_spots:
            return Response(
                {"detail": f"Only {available_spots} spots available"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Enroll students
        class_obj.students.add(*students_to_enroll)
        
        return Response({
            "detail": f"Successfully enrolled {len(students_to_enroll)} students",
            "enrolled_count": len(students_to_enroll)
        })
    
    @extend_schema(
        summary="Remove students from class",
        description="Remove multiple students from a class. Only teachers and admins can remove students.",
        tags=["Classes"],
        request=ClassEnrollmentSerializer,
        responses={200: {
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'removed_count': {'type': 'integer'}
            }
        }}
    )
    @action(detail=True, methods=['post'])
    def remove_students(self, request, pk=None):
        """Remove students from the class."""
        class_obj = self.get_object()
        
        serializer = ClassEnrollmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        student_ids = serializer.validated_data['student_ids']
        removed_count = 0
        
        for student_id in student_ids:
            if class_obj.students.filter(id=student_id).exists():
                class_obj.students.remove(student_id)
                removed_count += 1
        
        return Response({
            "detail": f"Successfully removed {removed_count} students",
            "removed_count": removed_count
        })
    
    @extend_schema(
        summary="Get class leaderboard",
        description="Get class leaderboard for different time periods. Shows student rankings within the class.",
        tags=["Classes"],
        parameters=[
            OpenApiParameter(
                name='period_type',
                type=OpenApiTypes.STR,
                enum=['WEEKLY', 'MONTHLY', 'ALL_TIME'],
                description='Time period for leaderboard',
                required=False
            )
        ]
    )
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Get class leaderboard for different time periods."""
        class_obj = self.get_object()
        period = request.query_params.get('period', 'all_time')
        
        # Validate period
        valid_periods = ['weekly', 'monthly', 'all_time']
        if period not in valid_periods:
            return Response(
                {"detail": f"Invalid period. Must be one of: {valid_periods}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get students in the class
        students = class_obj.students.all()
        
        # Calculate leaderboard data
        leaderboard_data = []
        
        for student in students:
            # Get homework completion and accuracy
            from apps.homework.models import HomeworkSubmission
            homework_stats = HomeworkSubmission.objects.filter(
                homework__class_obj=class_obj,
                student=student
            ).aggregate(
                total_homework=Count('id'),
                completed_homework=Count('id', filter=Q(submitted_at__isnull=False)),
                avg_score=Avg('score')
            )
            
            # Get mock exam scores
            from apps.mockexams.models import MockExamAttempt
            mock_stats = MockExamAttempt.objects.filter(
                student=student,
                is_completed=True
            ).aggregate(
                avg_sat_score=Avg('sat_score'),
                total_attempts=Count('id')
            )
            
            # Calculate completion rate
            completion_rate = 0
            if homework_stats['total_homework'] > 0:
                completion_rate = (homework_stats['completed_homework'] / homework_stats['total_homework']) * 100
            
            # Calculate accuracy
            accuracy = 0
            if homework_stats['avg_score'] is not None:
                # Assuming max score per homework is 100
                accuracy = min(homework_stats['avg_score'], 100)
            
            # Calculate total points (simple scoring system)
            total_points = 0
            total_points += completion_rate * 10  # 10 points per % completion
            total_points += accuracy * 5  # 5 points per % accuracy
            if mock_stats['avg_sat_score']:
                total_points += mock_stats['avg_sat_score'] / 10  # 1 point per 10 SAT points
            
            leaderboard_data.append({
                'student_id': student.id,
                'student_name': student.get_full_name() or student.email,
                'student_email': student.email,
                'total_points': int(total_points),
                'homework_completion_rate': round(completion_rate, 2),
                'homework_accuracy': round(accuracy, 2),
                'average_mock_score': mock_stats['avg_sat_score'] or 0,
                'rank': 0  # Will be set after sorting
            })
        
        # Sort by total points and assign ranks
        leaderboard_data.sort(key=lambda x: x['total_points'], reverse=True)
        for idx, entry in enumerate(leaderboard_data, 1):
            entry['rank'] = idx
        
        response_data = {
            'class_id': class_obj.id,
            'class_name': class_obj.name,
            'period': period,
            'leaderboard': leaderboard_data,
            'total_students': len(leaderboard_data),
            'generated_at': timezone.now()
        }
        
        serializer = ClassLeaderboardSerializer(response_data)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get my classes",
        description="Get classes for the current user. Teachers see their classes, students see enrolled classes.",
        tags=["Classes"]
    )
    @action(detail=False, methods=['get'])
    def my_classes(self, request):
        """Get classes for the current user."""
        user = request.user
        
        if user.is_student:
            classes = self.get_queryset()
        elif user.is_teacher:
            classes = Class.objects.filter(
                teacher=user
            ).select_related('teacher').prefetch_related('students')
        else:
            classes = Class.objects.none()
        
        serializer = ClassListSerializer(classes, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Post class announcement",
        description="Post a new announcement for the class. Only the class teacher can post announcements.",
        tags=["Classes"],
        request=AnnouncementSerializer,
        responses={201: AnnouncementSerializer}
    )
    @action(detail=True, methods=['post'])
    def post_announcement(self, request, pk=None):
        """Post a new announcement for the class."""
        class_obj = self.get_object()
        serializer = AnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        announcement = serializer.save(
            class_obj=class_obj,
            teacher=request.user
        )
        
        # Trigger notifications for all students in the class
        from apps.notifications.models import Notification
        class_content_type = ContentType.objects.get_for_model(Class)
        
        notifications = [
            Notification(
                recipient=student,
                actor=request.user,
                verb=f"posted a new announcement in {class_obj.name}",
                target_content_type=class_content_type,
                target_object_id=class_obj.id
            )
            for student in class_obj.students.all()
        ]
        Notification.objects.bulk_create(notifications)
        
        return Response(
            AnnouncementSerializer(announcement).data,
            status=status.HTTP_201_CREATED
        )

    @extend_schema(
        summary="Get class announcements",
        description="Get all active announcements for the class.",
        tags=["Classes"],
        responses={200: AnnouncementSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def announcements(self, request, pk=None):
        """Get all active announcements for the class."""
        class_obj = self.get_object()
        announcements = class_obj.announcements.filter(is_active=True)
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get class gradebook",
        description="Get detailed gradebook for the class including all students and assignments.",
        tags=["Classes"]
    )
    @action(detail=True, methods=['get'])
    def gradebook(self, request, pk=None):
        """Get detailed gradebook for the class."""
        class_obj = self.get_object()
        
        # Verify permissions - only teacher or admin
        if not (request.user.is_admin or request.user == class_obj.teacher):
            return Response(
                {"detail": "You do not have permission to view the gradebook."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        students = class_obj.students.all().order_by('last_name', 'first_name')
        assignments = class_obj.homework_assignments.filter(is_published=True).order_by('due_date')
        
        # Build structure: 
        # { 
        #   students: [{id, name, email}], 
        #   assignments: [{id, title, max_score, due_date}],
        #   grades: { student_id: { assignment_id: { score, submitted_at, is_late } } }
        # }
        
        grade_data = {}
        
        from apps.homework.models import HomeworkSubmission
        submissions = HomeworkSubmission.objects.filter(
            homework__class_obj=class_obj
        ).select_related('student', 'homework')
        
        for sub in submissions:
            if sub.student.id not in grade_data:
                grade_data[sub.student.id] = {}
            
            grade_data[sub.student.id][sub.homework.id] = {
                'score': sub.score,
                'submitted_at': sub.submitted_at,
                'is_late': sub.is_late,
                'status': 'SUBMITTED' if sub.submitted_at else 'PENDING'
            }
            
        response_data = {
            'students': [{
                'id': s.id, 
                'name': s.get_full_name(), 
                'email': s.email
            } for s in students],
            'assignments': [{
                'id': a.id, 
                'title': a.title, 
                'max_score': a.max_score,
                'due_date': a.due_date
            } for a in assignments],
            'grades': grade_data
        }
        
        return Response(response_data)


class ClassResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Class Resources.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClassResourceSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return ClassResource.objects.all()
        elif user.is_teacher:
            # Teachers see resources for classes they teach
            return ClassResource.objects.filter(class_obj__teacher=user)
        elif user.is_student:
             # Students see resources for classes they are enrolled in
            return ClassResource.objects.filter(class_obj__students=user)
        return ClassResource.objects.none()

    def perform_create(self, serializer):
        # Ensure only teacher of the class can add resources
        class_obj = serializer.validated_data['class_obj']
        if not self.request.user == class_obj.teacher and not self.request.user.is_admin:
             raise permissions.PermissionDenied("Only the class teacher can add resources.")
        serializer.save(teacher=self.request.user)

