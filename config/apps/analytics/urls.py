"""
URL configuration for analytics app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.analytics.views import (
    StudentProgressViewSet,
    WeakAreaViewSet,
    StudySessionViewSet,
    AnalyticsViewSet,
    dashboard_stats,
    system_health,
    system_stats,
    system_logs
)


router = DefaultRouter()
router.register(r'student-progress', StudentProgressViewSet, basename='student-progress')
router.register(r'weak-areas', WeakAreaViewSet, basename='weak-areas')
router.register(r'study-sessions', StudySessionViewSet, basename='study-sessions')
# AnalyticsViewSet is a GenericViewSet with custom actions, no need to register with router

urlpatterns = [
    path('analytics/', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('system/health/', system_health, name='system-health'),
    path('system/stats/', system_stats, name='system-stats'),
    path('system/logs/', system_logs, name='system-logs'),
    # AnalyticsViewSet actions (since it's a GenericViewSet)
    path('analytics/student_summary/', AnalyticsViewSet.as_view({'get': 'student_summary'}), name='analytics-student-summary'),
    path('analytics/class_analytics/<int:class_id>/', AnalyticsViewSet.as_view({'get': 'class_analytics'}), name='analytics-class-analytics'),
]
