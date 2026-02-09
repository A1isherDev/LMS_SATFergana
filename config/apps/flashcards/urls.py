"""
URL configuration for flashcards app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.flashcards.views import FlashcardViewSet, FlashcardProgressViewSet


router = DefaultRouter()
router.register(r'progress', FlashcardProgressViewSet, basename='flashcard-progress')
router.register(r'', FlashcardViewSet, basename='flashcard')

urlpatterns = [
    path('flashcards/', include(router.urls)),
]
