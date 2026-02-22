from django.db import models
from django.utils import timezone
from datetime import timedelta
from apps.common.models import TenantModel

class Payment(TenantModel):
    """
    Model for recording manual payments by students.
    Administrators record these payments to extend subscriptions.
    """
    METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('OTHER', 'Other'),
    ]

    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='payments',
        limit_choices_to={'role': 'STUDENT'},
        help_text="Student who made the payment"
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        help_text="Amount paid"
    )
    payment_date = models.DateField(
        default=timezone.now,
        help_text="Date the payment was received"
    )
    recorded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_payments',
        help_text="Admin who recorded this payment"
    )
    method = models.CharField(
        max_length=20, 
        choices=METHOD_CHOICES, 
        default='CASH'
    )
    notes = models.TextField(blank=True, null=True)

    class Meta(TenantModel.Meta):
        db_table = 'payments'
        ordering = ['-payment_date', '-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"Payment of {self.amount} by {self.student.email} on {self.payment_date}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Automatically extend student subscription by 30 days
            self.student.subscription_end_date = self.payment_date + timedelta(days=30)
            self.student.is_frozen = False # Reactivate if frozen
            self.student.save(update_fields=['subscription_end_date', 'is_frozen'])
            
            # Log the action
            from apps.common.utils import log_action
            log_action(
                user=self.recorded_by,
                action='UPDATE',
                resource_type='User',
                resource_id=self.student.id,
                description=f"Recorded payment of {self.amount} and extended subscription to {self.student.subscription_end_date}"
            )
