"""
Views for the classes app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count, Avg, F, Sum
from apps.classes.models import Class
from apps.classes.serializers import (
    ClassSerializer,
    ClassListSerializer,
    ClassEnrollmentSerializer,
    ClassLeaderboardSerializer,
    ClassLeaderboardEntrySerializer
)
from apps.common.permissions import IsTeacherOrAdmin, IsClassTeacher, IsStudentInClass


class ClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Class model.
    Different access levels based on user role.
    """
    permission_classes = [permissions.IsAuthenticated]
    
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
        elif self.action in ['leaderboard']:
            return [IsStudentInClass() | IsClassTeacher()]
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
