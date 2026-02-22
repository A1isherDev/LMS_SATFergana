"""
Custom permission classes for role-based access control.
"""
from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """
    Permission class to check if user is a student.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'STUDENT'
        )


class IsMainTeacher(permissions.BasePermission):
    """
    Permission class to check if user is a main teacher.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'MAIN_TEACHER'
        )


class IsSupportTeacher(permissions.BasePermission):
    """
    Permission class to check if user is a support teacher.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'SUPPORT_TEACHER'
        )


class IsTeacher(permissions.BasePermission):
    """
    Permission class to check if user is any kind of teacher.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_teacher
        )


class IsAdmin(permissions.BasePermission):
    """
    Permission class to check if user is an admin.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_admin
        )


class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Permission class to check if user is a teacher or admin.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_teacher)
        )


class IsClassTeacher(permissions.BasePermission):
    """
    Permission class to check if user is the teacher of a specific class.
    Usage: Check in view's has_object_permission method.
    """
    def has_object_permission(self, request, view, obj):
        # Check if object has a 'class' attribute (homework, etc.)
        if hasattr(obj, 'class_obj'):
            class_obj = obj.class_obj
        elif hasattr(obj, 'class'):
            class_obj = getattr(obj, 'class')
        elif hasattr(obj, 'teacher'):
            # Object is the class itself
            class_obj = obj
        else:
            return False
        
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(class_obj, 'teacher') and
            class_obj.teacher == request.user
        )


class IsStudentInClass(permissions.BasePermission):
    """
    Permission class to check if user is a student in a specific class.
    Usage: Check in view's has_object_permission method.
    """
    def has_object_permission(self, request, view, obj):
        # Check if object has a 'class' attribute
        if hasattr(obj, 'class_obj'):
            class_obj = obj.class_obj
        elif hasattr(obj, 'class'):
            class_obj = getattr(obj, 'class')
        elif hasattr(obj, 'students'):
            # Object is the class itself
            class_obj = obj
        else:
            return False
        
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(class_obj, 'students') and
            request.user in class_obj.students.all()
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission class to allow read-only access to all users,
    but write access only to the owner of the object.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only to the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'student'):
            return obj.student == request.user
        elif hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        elif hasattr(obj, 'assigned_by'):
            return obj.assigned_by == request.user
        
        return False
