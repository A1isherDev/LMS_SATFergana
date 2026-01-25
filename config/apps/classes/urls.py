"""
URL configuration for classes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.classes.views import ClassViewSet


router = DefaultRouter()
router.register(r'classes', ClassViewSet, basename='class')

urlpatterns = [
    path('', include(router.urls)),
]
