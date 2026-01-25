"""
URL configuration for homework app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.homework.views import HomeworkViewSet, HomeworkSubmissionViewSet


router = DefaultRouter()
router.register(r'homework', HomeworkViewSet, basename='homework')
router.register(r'submissions', HomeworkSubmissionViewSet, basename='homework-submission')

urlpatterns = [
    path('', include(router.urls)),
]
