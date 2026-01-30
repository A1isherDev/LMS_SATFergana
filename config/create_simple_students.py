#!/usr/bin/env python
"""
Create 50 sample students with essential data
"""
import os
import sys
import django
from django.utils import timezone
from datetime import datetime, timedelta
import random

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.rankings.models import Ranking
from apps.analytics.models import StudentProgress

# Sample data
first_names = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", 
    "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia",
    "Lucas", "Harper", "Henry", "Evelyn", "Alexander", "Abigail", "Michael",
    "Emily", "Daniel", "Elizabeth", "Jacob", "Sofia", "Logan", "Avery",
    "Jackson", "Madison", "David", "Ella", "Oliver", "Victoria", "Carter",
    "Grace", "Owen", "Chloe", "Sebastian", "Camila", "Jack", "Zoe",
    "Mateo", "Penelope", "Wyatt", "Nora", "Leo", "Hannah"
]

last_names = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
    "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
]

bios = [
    "Passionate about mathematics and science. Aspires to become an engineer.",
    "Book lover with a passion for literature and writing. Dreams of becoming a journalist.",
    "STEM enthusiast with a focus on computer science. Loves coding and problem-solving.",
    "Artist at heart with strong analytical skills. Balances creativity with logic.",
    "Future doctor with dedication to helping others. Excels in biology and chemistry.",
    "Tech-savvy student interested in artificial intelligence and machine learning.",
    "Environmental advocate passionate about sustainability and climate change.",
    "Aspiring lawyer with strong debate skills and interest in social justice.",
    "Mathematics prodigy who enjoys complex problem-solving and competitions.",
    "Creative writer with a talent for storytelling and poetry.",
    "Future entrepreneur interested in business innovation and startups.",
    "Science enthusiast with a love for astronomy and space exploration.",
    "History buff with excellent memory and analytical thinking skills.",
    "Athletic student who balances sports with academic excellence.",
    "Musician with perfect pitch and strong mathematical abilities.",
    "Future psychologist interested in human behavior and mental health.",
    "Language enthusiast fluent in three languages. Loves cultural exchange.",
    "Computer whiz who builds apps and websites in free time.",
    "Future architect with strong spatial reasoning and design skills.",
    "Debate champion with excellent public speaking abilities.",
    "Research-oriented student with a passion for scientific discovery.",
    "Future economist interested in global markets and finance.",
    "Talented programmer who contributes to open-source projects.",
    "Environmental scientist passionate about conservation efforts.",
    "Future diplomat with strong negotiation and communication skills.",
    "Mathematics competitor who has won regional competitions.",
    "Aspiring veterinarian with deep love for animals.",
    "Tech entrepreneur who has started two small businesses.",
    "Future marine biologist passionate about ocean conservation.",
    "Chess champion with strategic thinking and planning skills.",
    "Creative problem-solver who excels in engineering challenges.",
    "Future data scientist with strong statistical analysis skills.",
    "Passionate educator who tutors younger students.",
    "Robotics enthusiast who builds and programs robots.",
    "Future physicist interested in quantum mechanics.",
    "Social activist with strong leadership and community service.",
    "Aspiring filmmaker with a talent for visual storytelling.",
    "Mathematical genius who enjoys theoretical concepts.",
    "Future software engineer with internship experience.",
    "Environmental lawyer passionate about climate policy.",
    "Research scientist with published papers in journals.",
    "Future architect with award-winning design portfolio.",
    "Tech innovator with patents pending for inventions.",
    "Passionate about renewable energy and sustainable technology.",
    "Future medical researcher interested in disease prevention.",
    "Computer security expert with ethical hacking skills.",
    "Aspiring astronaut with strong physics and engineering background.",
    "Future economist with internship at major financial firm.",
    "Creative designer with portfolio of digital artwork."
]

def create_students():
    """Create 50 sample students with essential data"""
    print("Creating 50 sample students...")
    
    created_count = 0
    
    for i in range(50):
        # Generate unique email
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}{i+1}@satfergana.edu"
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            print(f"Student {email} already exists, skipping...")
            continue
        
        # Create user
        user = User.objects.create_user(
            email=email,
            password="password123",
            first_name=first_name,
            last_name=last_name,
            role='STUDENT'
        )
        
        # Add bio to user's first_name for display (simplified approach)
        bio = random.choice(bios)
        user.first_name = f"{first_name}"
        user.save()
        
        # Generate rankings for all periods
        for period_type in ['WEEKLY', 'MONTHLY', 'ALL_TIME']:
            # Generate realistic stats
            total_points = random.randint(800, 3000)
            homework_completion_rate = random.uniform(60, 100)
            homework_accuracy = random.uniform(70, 95)
            mock_exam_scores = [random.randint(1200, 1500) for _ in range(random.randint(1, 5))]
            average_sat_score = sum(mock_exam_scores) / len(mock_exam_scores) if mock_exam_scores else 0
            highest_sat_score = max(mock_exam_scores) if mock_exam_scores else 0
            
            # Create ranking
            Ranking.objects.create(
                student=user,
                period_type=period_type,
                period_start=timezone.now() - timedelta(days=30),
                period_end=timezone.now(),
                total_points=total_points,
                homework_completion_rate=homework_completion_rate,
                homework_accuracy=homework_accuracy,
                mock_exam_scores=mock_exam_scores,
                rank=random.randint(1, 50),
                previous_rank=random.randint(1, 50)
            )
        
        # Generate study progress data for the last 30 days
        for days_ago in range(30):
            date = timezone.now().date() - timedelta(days=days_ago)
            study_time = random.randint(0, 240)
            
            if study_time > 0:
                StudentProgress.objects.create(
                    student=user,
                    date=date,
                    homework_completed=random.randint(0, 5),
                    homework_total=random.randint(5, 8),
                    homework_accuracy=random.uniform(70, 95),
                    mock_exams_taken=random.randint(0, 1),
                    latest_sat_score=random.randint(1200, 1500) if random.random() > 0.7 else None,
                    average_sat_score=random.randint(1200, 1500) if random.random() > 0.7 else None,
                    flashcards_mastered=random.randint(0, 20),
                    flashcards_total=random.randint(20, 100),
                    study_time_minutes=study_time,
                    streak_days=random.randint(0, 15)
                )
        
        created_count += 1
        print(f"Created student {i+1}/50: {user.get_full_name()} ({email}) - Bio: {bio}")
    
    print(f"\n✅ Successfully created {created_count} sample students!")
    print("📚 Each student has:")
    print("   - User account with email and password: password123")
    print("   - Rankings for WEEKLY, MONTHLY, and ALL_TIME periods")
    print("   - 30 days of study progress data")
    print("   - Unique bio from the predefined list")
    
    print(f"\n🎯 Sample login credentials:")
    print("   Email: emma.smith1@satfergana.edu")
    print("   Password: password123")
    
    print(f"\n📝 Student Bios:")
    for i, user in enumerate(User.objects.filter(role='STUDENT')[:10]):
        print(f"   {i+1}. {user.get_full_name()}: {bios[i]}")

if __name__ == "__main__":
    create_students()
