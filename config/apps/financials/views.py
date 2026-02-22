from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from apps.financials.models import Payment
from apps.financials.serializers import PaymentSerializer, PaymentCreateSerializer
from apps.common.permissions import IsAdmin

class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for recording and viewing manual payments.
    Only Admins can record payments.
    Students can see their own payments.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Payment.objects.all()
        return Payment.objects.filter(student=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
