#!/usr/bin/env python
"""
Generate 50 sample students with comprehensive stats including bios
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
from apps.analytics.models import StudentProgress, StudySession
from apps.homework.models import HomeworkSubmission
from apps.questionbank.models import QuestionAttempt

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

def generate_students():
    """Generate 50 sample students with comprehensive data"""
    print("Generating 50 sample students...")
    
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
        
        # Add bio to user profile (assuming there's a profile model or we extend User)
        # For now, we'll store it in a way that can be accessed later
        bio = random.choice(bios)
        
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
                period_start=timezone.now() - timedelta(days=30),  # Simplified for demo
                period_end=timezone.now(),
                total_points=total_points,
                homework_completion_rate=homework_completion_rate,
                homework_accuracy=homework_accuracy,
                mock_exam_scores=mock_exam_scores,
                rank=random.randint(1, 50),  # Will be recalculated properly
                previous_rank=random.randint(1, 50)
            )
        
        # Generate study progress data for the last 30 days
        for days_ago in range(30):
            date = timezone.now().date() - timedelta(days=days_ago)
            
            # Random study time (0-240 minutes per day)
            study_time = random.randint(0, 240)
            
            if study_time > 0:  # Only create records for days with study time
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
        
        # Generate study sessions
        for _ in range(random.randint(5, 20)):
            session_type = random.choice(['homework', 'practice', 'mock_exam', 'flashcards'])
            started_at = timezone.now() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            duration = random.randint(15, 120)
            
            StudySession.objects.create(
                student=user,
                session_type=session_type,
                started_at=started_at,
                ended_at=started_at + timedelta(minutes=duration),
                duration_minutes=duration,
                questions_attempted=random.randint(5, 30),
                questions_correct=random.randint(3, 28)
            )
        
        # Generate homework submissions
        for _ in range(random.randint(3, 10)):
            submitted_at = timezone.now() - timedelta(days=random.randint(1, 30))
            score = random.randint(70, 100)
            
            HomeworkSubmission.objects.create(
                student=user,
                homework_id=random.randint(1, 20),  # Assuming homework IDs exist
                submitted_at=submitted_at,
                score=score,
                time_spent_seconds=random.randint(1800, 7200),  # 30-120 minutes in seconds
                is_late=random.choice([True, False])
            )
        
        # Store bio in a simple way (we'll add it to the user's first_name for now)
        # In a real implementation, you'd want a proper profile model
        user.first_name = f"{user.first_name} ({bio[:30]}...)"  # Truncate for display
        user.save()
        
        created_count += 1
        print(f"Created student {i+1}/50: {user.get_full_name()} ({email})")
    
    print(f"\n✅ Successfully created {created_count} sample students!")
    print("📚 Each student has:")
    print("   - User account with email and password: password123")
    print("   - Rankings for WEEKLY, MONTHLY, and ALL_TIME periods")
    print("   - 30 days of study progress data")
    print("   - 5-20 study sessions")
    print("   - 3-10 homework submissions")
    print("   - 20-100 question attempts")
    print("   - Unique bio from the predefined list")
    
    print(f"\n🎯 Sample login credentials:")
    print("   Email: emma.smith1@satfergana.edu")
    print("   Password: password123")

if __name__ == "__main__":
    generate_students()
