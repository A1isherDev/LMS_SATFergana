"""
Create default superuser and test accounts for SAT Fergana platform.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import Student, Teacher, Class

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default superuser and test accounts'

    def handle(self, *args, **options):
        # Create superuser
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@satfergana.com',
                password='Admin123!',
                first_name='Admin',
                last_name='User',
                user_type='admin'
            )
            self.stdout.write(
                self.style.SUCCESS('✅ Superuser created: admin@satfergana.com / Admin123!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️  Superuser already exists')
            )

        # Create test teacher
        if not User.objects.filter(username='teacher').exists():
            teacher_user = User.objects.create_user(
                username='teacher',
                email='teacher@satfergana.com',
                password='Teacher123!',
                first_name='John',
                last_name='Smith',
                user_type='teacher'
            )
            
            # Create teacher profile
            teacher_profile = Teacher.objects.create(
                user=teacher_user,
                employee_id='T001',
                department='Mathematics',
                phone_number='+1234567890'
            )
            
            # Create a class for the teacher
            test_class = Class.objects.create(
                name='SAT Math Prep - Class A',
                grade_level=11,
                teacher=teacher_profile,
                class_code='MATH101',
                schedule='Mon-Wed-Fri 10:00-11:30'
            )
            
            self.stdout.write(
                self.style.SUCCESS('✅ Teacher created: teacher@satfergana.com / Teacher123!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️  Teacher already exists')
            )

        # Create test student
        if not User.objects.filter(username='student').exists():
            student_user = User.objects.create_user(
                username='student',
                email='student@satfergana.com',
                password='Student123!',
                first_name='Jane',
                last_name='Doe',
                user_type='student'
            )
            
            # Create student profile
            student_profile = Student.objects.create(
                user=student_user,
                student_id='S001',
                grade_level=11,
                gpa=3.8,
                phone_number='+1234567891'
            )
            
            # Add student to the test class
            test_class = Class.objects.get(class_code='MATH101')
            test_class.students.add(student_profile)
            
            self.stdout.write(
                self.style.SUCCESS('✅ Student created: student@satfergana.com / Student123!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️  Student already exists')
            )

        self.stdout.write(
            self.style.SUCCESS('\n🎯 Default Accounts Created:')
        )
        self.stdout.write(
            self.style.SUCCESS('📋 Login Credentials:')
        )
        self.stdout.write(
            self.style.SUCCESS('🔑 Admin: admin@satfergana.com / Admin123!')
        )
        self.stdout.write(
            self.style.SUCCESS('👨‍🏫 Teacher: teacher@satfergana.com / Teacher123!')
        )
        self.stdout.write(
            self.style.SUCCESS('👩‍🎓 Student: student@satfergana.com / Student123!')
        )
