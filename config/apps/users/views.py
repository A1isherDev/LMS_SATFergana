"""
Views for the users app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
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
from apps.common.permissions import IsTeacherOrAdmin, IsStudent

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model.
    Users can view and update their own profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return User.objects.all()
        elif user.is_teacher:
            # Teachers can see students in their classes
            return User.objects.filter(role='STUDENT')
        else:
            # Students can only see themselves
            return User.objects.filter(id=user.id)
    
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
        elif self.action in ['update', 'partial_update']:
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
            return Response(
                {"detail": "Student profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class RegisterView(APIView):
    """
    User registration endpoint with invitation code.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Register a new user with invitation code."""
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
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
    
    def post(self, request):
        """Authenticate user and return JWT tokens."""
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class InvitationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Invitation model.
    Teachers and Admins can create invitations.
    """
    permission_classes = [IsTeacherOrAdmin]
    
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


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User profile management.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return User.objects.all()
        elif user.is_teacher:
            return User.objects.filter(role='STUDENT')
        else:
            return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get', 'patch'])
    def profile(self, request):
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


class StudentProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudentProfile model.
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
        if exam_date is None:
            return Response(
                {"detail": "sat_exam_date field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.sat_exam_date = exam_date
        profile.save()
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
