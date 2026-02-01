"""
URL configuration for flashcards app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.flashcards.views import FlashcardViewSet, FlashcardProgressViewSet


router = DefaultRouter()
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')
router.register(r'flashcard-progress', FlashcardProgressViewSet, basename='flashcard-progress')

urlpatterns = [
    path('flashcards/', include(router.urls)),
]
