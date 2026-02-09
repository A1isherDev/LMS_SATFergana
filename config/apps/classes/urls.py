"""
URL configuration for classes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.classes.views import ClassViewSet, ClassResourceViewSet


router = DefaultRouter()
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'class-resources', ClassResourceViewSet, basename='class-resource')

urlpatterns = [
    path('', include(router.urls)),
]
