"""
Serializers for the users app.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import User, StudentProfile, Invitation
from apps.common.utils import calculate_days_until_exam


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    streak_display = serializers.CharField(source='get_streak_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'role_display',
            'date_joined', 'is_active', 'invited_by',
            'last_active_date', 'streak_count', 'streak_display',
            'phone_number', 'date_of_birth', 'grade_level', 'bio'
        ]
        read_only_fields = ['id', 'date_joined', 'is_active', 'last_active_date', 'streak_count']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for StudentProfile model."""
    user = UserSerializer(read_only=True)
    days_until_exam = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'target_sat_score', 'estimated_current_score',
            'sat_exam_date', 'days_until_exam', 'weak_areas', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_days_until_exam(self, obj):
        """Calculate days until exam."""
        return calculate_days_until_exam(obj.sat_exam_date)
    
    def validate_target_sat_score(self, value):
        """Validate target SAT score range."""
        if not (400 <= value <= 1600):
            raise serializers.ValidationError("Target SAT score must be between 400 and 1600")
        return value
    
    def validate_estimated_current_score(self, value):
        """Validate estimated current score range."""
        if not (400 <= value <= 1600):
            raise serializers.ValidationError("Estimated current score must be between 400 and 1600")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration with invitation code."""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    invitation_code = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=20)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    grade_level = serializers.CharField(required=False, allow_blank=True, max_length=20)
    bio = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'invitation_code',
            'first_name', 'last_name', 'phone_number', 'date_of_birth', 
            'grade_level', 'bio'
        ]
    
    def validate_invitation_code(self, value):
        """Validate invitation code."""
        try:
            invitation = Invitation.objects.get(code=value)
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Invalid invitation code")
        
        if not invitation.is_valid():
            raise serializers.ValidationError("Invitation code is expired or already used")
        
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        return attrs
    
    def create(self, validated_data):
        """Create user and mark invitation as used."""
        invitation_code = validated_data.pop('invitation_code')
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Get invitation
        invitation = Invitation.objects.get(code=invitation_code)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            role=invitation.role,
            invitation_code=invitation_code,
            invited_by=invitation.invited_by,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            date_of_birth=validated_data.get('date_of_birth'),
            grade_level=validated_data.get('grade_level', ''),
            bio=validated_data.get('bio', ''),
        )
        
        # Mark invitation as used
        invitation.mark_as_used(user)
        
        # Create student profile if role is STUDENT
        if user.role == 'STUDENT':
            StudentProfile.objects.create(user=user)
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate credentials."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            
            if not user:
                raise serializers.ValidationError("Invalid email or password")
            
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError("Must include email and password")
        
        return attrs


class InvitationSerializer(serializers.ModelSerializer):
    """Serializer for Invitation model."""
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)
    used_by_email = serializers.EmailField(source='used_by.email', read_only=True)
    is_valid_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Invitation
        fields = [
            'id', 'code', 'invited_by', 'invited_by_email', 'email', 'role',
            'is_used', 'used_by', 'used_by_email', 'used_at', 'expires_at',
            'is_valid_status', 'created_at'
        ]
        read_only_fields = ['id', 'code', 'created_at', 'used_by', 'used_at']
    
    def get_is_valid_status(self, obj):
        """Get invitation validity status."""
        return obj.is_valid()
    
    def validate_email(self, value):
        """Check if user with this email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value


class InvitationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invitations."""
    expires_at = serializers.DateTimeField(required=False)
    
    class Meta:
        model = Invitation
        fields = ['id', 'code', 'email', 'role', 'expires_at']
        read_only_fields = ['id', 'code']
    
    def validate_email(self, value):
        """Check if user with this email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value
    
    def create(self, validated_data):
        """Create invitation with current user as inviter and default expiration."""
        from datetime import timedelta
        from django.utils import timezone
        
        # Set default expiration to 30 days if not provided
        if 'expires_at' not in validated_data:
            validated_data['expires_at'] = timezone.now() + timedelta(days=30)
        
        validated_data['invited_by'] = self.context['request'].user
        return super().create(validated_data)
