"""
Views for the users app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile, Invitation
from apps.users.serializers import (
    UserSerializer,
    StudentProfileSerializer,
    RegisterSerializer,
    LoginSerializer,
    InvitationSerializer,
    InvitationCreateSerializer
)
from apps.common.permissions import IsTeacherOrAdmin, IsStudent, IsAdmin
from apps.common.views import AuditLogMixin
from apps.common.utils import log_action

User = get_user_model()



class UserViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for User model.
    Users can view and update their own profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="List users",
        description="Retrieve a list of users based on user role. Admins see all users, teachers see students, students see themselves.",
        tags=["Users"]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return User.objects.all()
        elif user.is_teacher:
            # Teachers can see students
            return User.objects.filter(role='STUDENT')
        else:
            # Students can only see themselves
            return User.objects.filter(id=user.id)
    
    @extend_schema(
        summary="Get or update current user profile",
        description="Retrieve or update the current authenticated user's profile information.",
        tags=["Users"],
        methods=["GET", "PATCH"]
    )
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user's profile."""
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
    
    @extend_schema(
        summary="Update user streak",
        description="Update the current user's daily activity streak. Automatically calculates consecutive days of activity.",
        tags=["Users"],
        responses={200: {
            'type': 'object',
            'properties': {
                'streak_count': {'type': 'integer', 'description': 'Current streak count'},
                'streak_display': {'type': 'string', 'description': 'Formatted streak display'},
                'last_active_date': {'type': 'string', 'format': 'date', 'description': 'Last active date'}
            }
        }}
    )
    @action(detail=False, methods=['post'])
    def update_streak(self, request):
        """Update current user's streak."""
        user = request.user
        user.update_streak()
        
        return Response({
            'streak_count': user.streak_count,
            'streak_display': user.get_streak_display(),
            'last_active_date': user.last_active_date
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_support_teacher(self, request, pk=None):
        """Assign this support teacher to a main teacher."""
        support_teacher = self.get_object()
        if support_teacher.role != 'SUPPORT_TEACHER':
            return Response(
                {"detail": "Only users with SUPPORT_TEACHER role can be assigned to a main teacher"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        main_teacher_id = request.data.get('main_teacher_id')
        if not main_teacher_id:
            return Response(
                {"detail": "main_teacher_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            main_teacher = User.objects.get(id=main_teacher_id, role='MAIN_TEACHER')
            support_teacher.assigned_main_teacher = main_teacher
            support_teacher.save()
            
            return Response(
                {"detail": f"Successfully assigned {support_teacher.email} to {main_teacher.email}"},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Main teacher not found or invalid role"},
                status=status.HTTP_404_NOT_FOUND
            )


class StudentProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudentProfile model.
    Students can view and update their own profile.
    Teachers/Admins can view all student profiles.
    """
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin or user.is_teacher:
            return StudentProfile.objects.select_related('user').all()
        elif user.is_student:
            return StudentProfile.objects.filter(user=user)
        else:
            return StudentProfile.objects.none()
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'exam_date', 'me']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current student's profile."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can access their profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
             # Create profile if it doesn't exist
            profile = StudentProfile.objects.create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def exam_date(self, request):
        """Update SAT exam date."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can update their exam date"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
            profile = StudentProfile.objects.create(user=request.user)
        
        exam_date = request.data.get('sat_exam_date')
        # Allow clearing the date if explicit null is sent, or just error if field missing?
        # The original code errored if None.
        if exam_date is None:
            return Response(
                {"detail": "sat_exam_date field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.sat_exam_date = exam_date
        profile.save()
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class RegisterView(APIView):
    """
    User registration endpoint with invitation code.
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Register new user",
        description="Register a new user using a valid invitation code. Creates user account and returns JWT tokens.",
        tags=["Authentication"],
        request=RegisterSerializer,
        responses={201: {
            'type': 'object',
            'properties': {
                'user': {'$ref': '#/components/schemas/User'},
                'tokens': {
                    'type': 'object',
                    'properties': {
                        'access': {'type': 'string'},
                        'refresh': {'type': 'string'}
                    }
                }
            }
        }}
    )
    def post(self, request):
        """Register a new user with invitation code."""
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        log_action(
            user=user,
            action='CREATE',
            resource_type='User',
            resource_id=user.id,
            description=f"User registered with email {user.email}",
            request=request
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    User login endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="User login",
        description="Authenticate user with email and password. Returns JWT tokens for authenticated session.",
        tags=["Authentication"],
        request=LoginSerializer,
        responses={200: {
            'type': 'object',
            'properties': {
                'user': {'$ref': '#/components/schemas/User'},
                'tokens': {
                    'type': 'object',
                    'properties': {
                        'access': {'type': 'string'},
                        'refresh': {'type': 'string'}
                    }
                }
            }
        }}
    )
    def post(self, request):
        """Authenticate user and return JWT tokens."""
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        log_action(
            user=user,
            action='LOGIN',
            resource_type='User',
            resource_id=user.id,
            description=f"User {user.email} logged in",
            request=request
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class InvitationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for Invitation model.
    Only Admins can create and manage invitations.
    """
    permission_classes = [IsAdmin]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return InvitationCreateSerializer
        return InvitationSerializer
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return Invitation.objects.select_related('invited_by', 'used_by').all()
        elif user.is_teacher:
            # Teachers can only see invitations they created
            return Invitation.objects.filter(invited_by=user).select_related('invited_by', 'used_by')
        else:
            return Invitation.objects.none()
    
    def perform_create(self, serializer):
        """Set invited_by to current user."""
        serializer.save(invited_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend invitation (regenerate code and update expiration)."""
        invitation = self.get_object()
        
        if invitation.is_used:
            return Response(
                {"detail": "Cannot resend used invitation"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate new code
        invitation.code = Invitation.generate_code()
        invitation.save()
        
        serializer = self.get_serializer(invitation)
        return Response(serializer.data)
