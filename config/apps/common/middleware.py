# TenantMiddleware removed. Organization context is no longer needed.


class SubscriptionMiddleware:
    """
    Middleware that checks if a student has an active subscription.
    If the subscription is expired or account is frozen, restrict access.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and request.user.is_student:
            if not request.user.has_active_subscription:
                # Exclude specific paths like logout or public info if any
                allowed_paths = ['/api/users/logout/', '/api/users/me/']
                if not any(request.path.startswith(path) for path in allowed_paths):
                    from django.http import JsonResponse
                    return JsonResponse(
                        {
                            "detail": "Your subscription has expired or your account is frozen. Please contact administration for payment.",
                            "code": "subscription_expired"
                        },
                        status=403
                    )

        return self.get_response(request)
