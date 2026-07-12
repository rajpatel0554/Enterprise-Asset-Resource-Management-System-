from django.db import models
from django.contrib.auth.models import AbstractUser

class Department(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    name = models.CharField(max_length=255)
    parent_department = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_departments'
    )
    head = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = [
        ('Employee', 'Employee'),
        ('DepartmentHead', 'DepartmentHead'),
        ('AssetManager', 'AssetManager'),
        ('Admin', 'Admin'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
