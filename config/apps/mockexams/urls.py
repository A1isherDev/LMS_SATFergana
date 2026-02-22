"""
URL configuration for mockexams app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.mockexams.views import (
    MockExamViewSet, 
    MockExamAttemptViewSet,
    ExamAnalyticsViewSet,
    ExamPerformanceViewSet
)
from apps.mockexams.bluebook_sat_views import (
    BluebookExamViewSet,
    BluebookExamAttemptViewSet,
    BluebookAnalyticsViewSet,
    BluebookManagementViewSet,
    BluebookModuleViewSet
)


router = DefaultRouter()
router.register(r'mock-exams', MockExamViewSet, basename='mock-exam')
router.register(r'mock-exam-attempts', MockExamAttemptViewSet, basename='mock-exam-attempt')
router.register(r'exam-analytics', ExamAnalyticsViewSet, basename='exam-analytics')
router.register(r'exam-performance', ExamPerformanceViewSet, basename='exam-performance')

# Bluebook Digital SAT endpoints
bluebook_router = DefaultRouter()
bluebook_router.register(r'exams', BluebookExamViewSet, basename='bluebook-exam')
bluebook_router.register(r'attempts', BluebookExamAttemptViewSet, basename='bluebook-attempt')
bluebook_router.register(r'analytics', BluebookAnalyticsViewSet, basename='bluebook-analytics')
bluebook_router.register(r'management', BluebookManagementViewSet, basename='bluebook-management')
bluebook_router.register(r'modules', BluebookModuleViewSet, basename='bluebook-module')

urlpatterns = [
    path('', include(router.urls)),
    path('bluebook/', include(bluebook_router.urls)),
]
