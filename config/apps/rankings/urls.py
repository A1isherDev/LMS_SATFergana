"""
URL configuration for rankings app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.rankings.views import RankingViewSet


router = DefaultRouter()
router.register(r'', RankingViewSet, basename='ranking')

urlpatterns = [
    path('rankings/', include(router.urls)),
]
