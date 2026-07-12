import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import Department
from assets.models import AssetCategory, Asset, AssetStatusLog
from allocations.models import Allocation, TransferRequest, AssetBooking
from maintenance.models import MaintenanceRequest
from audits.models import AuditCycle, AuditEntry

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

        sys_admin, created = User.objects.get_or_create(username='admin', defaults={
            'email': 'admin@example.com',
            'role': 'Admin',
            'is_staff': True,
            'is_superuser': True,
        })
        if created:
            sys_admin.set_password('admin123')
            sys_admin.save()
            self.stdout.write('Created Superuser: admin (password: admin123)')

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
        created_assets = []
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
                created_assets.append(asset)
                self.stdout.write(f'Created Asset: {asset.tag} - {asset.name}')
                
                AssetStatusLog.objects.create(
                    asset=asset,
                    new_status=a['status'],
                    changed_by=sys_admin,
                    notes='Seeded initial asset data'
                )

                if a['name'] == 'MacBook Air M1':
                    Allocation.objects.create(
                        asset=asset,
                        employee=User.objects.get(username='john.doe'),
                        allocated_by=sys_admin,
                        is_active=True,
                        notes='Initial allocation'
                    )
                elif a['name'] == 'Standing Desk':
                    Allocation.objects.create(
                        asset=asset,
                        employee=User.objects.get(username='bob.manager'),
                        allocated_by=sys_admin,
                        is_active=True,
                        notes='Initial allocation'
                    )
        else:
            created_assets = list(Asset.objects.all())

        # 5. Seed Maintenance Requests
        if MaintenanceRequest.objects.count() == 0 and len(created_assets) > 0:
            # Let's assign requests to some assets
            laptop_asset = next((a for a in created_assets if 'ThinkPad' in a.name or 'MacBook' in a.name), created_assets[0])
            vehicle_asset = next((a for a in created_assets if 'Ford' in a.name), created_assets[0])

            MaintenanceRequest.objects.create(
                asset=laptop_asset,
                reported_by=User.objects.get(username='john.doe'),
                issue_description='The screen occasionally flickers when opened beyond 90 degrees.',
                status='In Progress',
                priority='Medium'
            )
            MaintenanceRequest.objects.create(
                asset=vehicle_asset,
                reported_by=User.objects.get(username='bob.manager'),
                issue_description='Annual standard maintenance service and oil change required.',
                status='Open',
                priority='Low'
            )
            self.stdout.write('Created Maintenance Requests.')

        # 6. Seed Bookings
        if AssetBooking.objects.count() == 0 and len(created_assets) > 0:
            available_assets = [a for a in created_assets if a.status == 'Available']
            if available_assets:
                booking_asset = available_assets[0]
                now = timezone.now()
                # Booking 1: Today
                AssetBooking.objects.create(
                    asset=booking_asset,
                    employee=User.objects.get(username='john.doe'),
                    start_time=now + timedelta(hours=2),
                    end_time=now + timedelta(hours=4),
                    purpose='Client presentation and demo run.'
                )
                # Booking 2: Tomorrow
                tomorrow = now + timedelta(days=1)
                AssetBooking.objects.create(
                    asset=booking_asset,
                    employee=User.objects.get(username='bob.manager'),
                    start_time=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=12, minute=0, second=0, microsecond=0),
                    purpose='Q3 Financial reviews session.'
                )
                self.stdout.write('Created Asset Bookings.')

        # 7. Seed Transfer Requests
        if TransferRequest.objects.count() == 0 and len(created_assets) > 0:
            allocated_assets = [a for a in created_assets if a.status == 'Allocated']
            if allocated_assets:
                transfer_asset = allocated_assets[0]
                # Let's transfer it from John Doe to Bob Manager
                from_user = User.objects.get(username='john.doe')
                to_user = User.objects.get(username='bob.manager')
                TransferRequest.objects.create(
                    asset=transfer_asset,
                    from_employee=from_user,
                    to_employee=to_user,
                    requested_by=from_user,
                    status='Pending',
                    reason='Bob needs this laptop for testing the new application server deployment.'
                )
                self.stdout.write('Created Transfer Request.')

        # 8. Seed Audit Cycles & Entries
        if AuditCycle.objects.count() == 0 and len(created_assets) > 0:
            cycle = AuditCycle.objects.create(
                name='Q3 2026 IT Asset Verification',
                created_by=sys_admin,
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=30),
                status='In Progress',
                notes='Standard quarterly physical audit of high-value electronic equipment.'
            )
            for asset in created_assets:
                AuditEntry.objects.create(
                    audit_cycle=cycle,
                    asset=asset,
                    status='Pending'
                )
            self.stdout.write(f'Created Audit Cycle: {cycle.name} with {len(created_assets)} assets.')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))

