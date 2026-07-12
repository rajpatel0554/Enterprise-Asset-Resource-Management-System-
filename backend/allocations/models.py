from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from assets.models import Asset

class Allocation(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='allocations')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='allocations')
    allocated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='managed_allocations')
    allocated_at = models.DateTimeField(auto_now_add=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['asset'], 
                condition=models.Q(is_active=True), 
                name='unique_active_allocation_per_asset'
            )
        ]

    def __str__(self):
        return f"{self.asset.tag} to {self.employee.username}"

class TransferRequest(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Completed', 'Completed')
    )
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='transfer_requests')
    from_employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='outgoing_transfers')
    to_employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='incoming_transfers')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_transfers')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    request_date = models.DateTimeField(auto_now_add=True)
    reason = models.TextField()

    def __str__(self):
        return f"Transfer {self.asset.tag}: {self.from_employee} -> {self.to_employee}"

class AssetBooking(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='bookings')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    purpose = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")

        # Check for overlaps
        overlapping = AssetBooking.objects.filter(
            asset=self.asset,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        )
        if self.pk:
            overlapping = overlapping.exclude(pk=self.pk)
            
        if overlapping.exists():
            raise ValidationError("This asset is already booked during this time period.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.asset.tag} booked by {self.employee.username} ({self.start_time} - {self.end_time})"
