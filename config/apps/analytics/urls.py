"""
URL configuration for analytics app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.analytics.views import (
    StudentProgressViewSet,
    WeakAreaViewSet,
    StudySessionViewSet,
    AnalyticsViewSet
)


router = DefaultRouter()
router.register(r'student-progress', StudentProgressViewSet, basename='student-progress')
router.register(r'weak-areas', WeakAreaViewSet, basename='weak-areas')
router.register(r'study-sessions', StudySessionViewSet, basename='study-sessions')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
