"""
URL configuration for questionbank app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.questionbank.views import QuestionViewSet, QuestionAttemptViewSet


router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'attempts', QuestionAttemptViewSet, basename='question-attempt')

urlpatterns = [
    path('questionbank/', include(router.urls)),
]
