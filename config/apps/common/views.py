# Common views and utilities
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint for monitoring"""
    return JsonResponse({
        "status": "healthy",
        "message": "SAT Fergana API is running",
        "version": "1.0.0"
    })
