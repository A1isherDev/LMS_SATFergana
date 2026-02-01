"""
URL configuration for mockexams app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.mockexams.views import MockExamViewSet, MockExamAttemptViewSet


router = DefaultRouter()
router.register(r'mock-exams', MockExamViewSet, basename='mock-exam')
router.register(r'mock-exam-attempts', MockExamAttemptViewSet, basename='mock-exam-attempt')

urlpatterns = [
    path('mock-exams/', include(router.urls)),
]
