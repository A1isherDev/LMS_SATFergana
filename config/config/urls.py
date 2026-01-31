"""
URL configuration for SAT LMS platform.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API routes
    path('api/', include('apps.common.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.classes.urls')),
    path('api/', include('apps.homework.urls')),
    path('api/', include('apps.questionbank.urls')),
    path('api/', include('apps.mockexams.urls')),
    path('api/', include('apps.flashcards.urls')),
    path('api/', include('apps.rankings.urls')),
    path('api/', include('apps.analytics.urls')),
    
    # JWT token endpoints
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
