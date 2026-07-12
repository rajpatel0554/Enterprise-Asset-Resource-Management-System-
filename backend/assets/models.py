from django.db import models
from django.conf import settings

class AssetCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Asset Categories'

    def __str__(self):
        return self.name

class Asset(models.Model):
    STATUS_CHOICES = (
        ('Available', 'Available'),
        ('Allocated', 'Allocated'),
        ('Maintenance', 'Maintenance'),
        ('Reserved', 'Reserved'),
        ('Out of Service', 'Out of Service'),
        ('Disposed', 'Disposed'),
        ('Lost', 'Lost'),
    )

    tag = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(AssetCategory, on_delete=models.PROTECT, related_name='assets')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    purchase_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tag} - {self.name}"

    def save(self, *args, **kwargs):
        # Auto-tag generation AF-0001, etc. is typically handled in serializers/services, 
        # but can also be safely done here if tag is empty on creation.
        if not self.tag:
            super().save(*args, **kwargs) # Save to get ID
            self.tag = f"AF-{str(self.id).zfill(4)}"
            super().save(update_fields=['tag'])
        else:
            super().save(*args, **kwargs)


class AssetStatusLog(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='status_logs')
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.asset.tag}: {self.old_status} -> {self.new_status}"
