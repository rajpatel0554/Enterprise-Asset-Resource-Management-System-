import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import Department
from assets.models import AssetCategory, Asset, AssetStatusLog

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with initial demo data for AssetFlow'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database with demo data...')

        # 1. Departments
        departments_data = [
            'Engineering', 'Human Resources', 'Finance', 'Operations', 'IT Support'
        ]
        departments = {}
        for d in departments_data:
            dept, created = Department.objects.get_or_create(name=d)
            departments[d] = dept
            if created:
                self.stdout.write(f'Created Department: {d}')

        # 2. Users (Employees)
        users_data = [
            {'username': 'john.doe', 'email': 'john@example.com', 'role': 'Employee', 'dept': 'Engineering'},
            {'username': 'jane.smith', 'email': 'jane@example.com', 'role': 'AssetManager', 'dept': 'IT Support'},
            {'username': 'bob.manager', 'email': 'bob@example.com', 'role': 'DepartmentHead', 'dept': 'Finance'},
        ]
        for u in users_data:
            user, created = User.objects.get_or_create(username=u['username'], defaults={
                'email': u['email'],
                'role': u['role'],
                'department': departments[u['dept']]
            })
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created User: {u["username"]} ({u["role"]})')

        sys_admin = User.objects.filter(username='admin').first()

        # 3. Asset Categories
        categories_data = [
            {'name': 'Laptops', 'desc': 'MacBooks, ThinkPads, and Dells'},
            {'name': 'Monitors', 'desc': '24-inch and 27-inch displays'},
            {'name': 'Furniture', 'desc': 'Desks, Chairs, and Cabinets'},
            {'name': 'Vehicles', 'desc': 'Company cars and vans'},
        ]
        categories = {}
        for c in categories_data:
            cat, created = AssetCategory.objects.get_or_create(name=c['name'], defaults={'description': c['desc']})
            categories[c['name']] = cat
            if created:
                self.stdout.write(f'Created Category: {c["name"]}')

        # 4. Assets
        if Asset.objects.count() == 0:
            assets_to_create = [
                {'name': 'MacBook Pro 16" M2', 'cat': 'Laptops', 'status': 'Available', 'cost': 2499.00},
                {'name': 'MacBook Air M1', 'cat': 'Laptops', 'status': 'Allocated', 'cost': 999.00},
                {'name': 'ThinkPad T14', 'cat': 'Laptops', 'status': 'Maintenance', 'cost': 1299.00},
                {'name': 'Dell UltraSharp 27"', 'cat': 'Monitors', 'status': 'Available', 'cost': 450.00},
                {'name': 'Ergonomic Mesh Chair', 'cat': 'Furniture', 'status': 'Available', 'cost': 200.00},
                {'name': 'Ford Transit Van', 'cat': 'Vehicles', 'status': 'Available', 'cost': 35000.00},
                {'name': 'Standing Desk', 'cat': 'Furniture', 'status': 'Allocated', 'cost': 500.00},
                {'name': 'Dell XPS 15', 'cat': 'Laptops', 'status': 'Out of Service', 'cost': 1800.00},
            ]

            for a in assets_to_create:
                asset = Asset.objects.create(
                    name=a['name'],
                    category=categories[a['cat']],
                    status=a['status'],
                    cost=a['cost'],
                    purchase_date=timezone.now().date() - timedelta(days=random.randint(30, 365))
                )
                self.stdout.write(f'Created Asset: {asset.tag} - {asset.name}')
                
                # We skip manual AssetStatusLog creation here because the view/serializer handles it
                # or we can manually insert the initial log if created directly via ORM
                AssetStatusLog.objects.create(
                    asset=asset,
                    new_status=a['status'],
                    changed_by=sys_admin,
                    notes='Seeded initial asset data'
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
