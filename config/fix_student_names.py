#!/usr/bin/env python
"""
Fix student names to have proper first names and bios
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

# Name mappings based on emails
name_mappings = {
    'email@gmail.com': ('Emma', 'Smith'),
    'emma@example.com': ('Emma', 'Johnson'),
    'michael@example.com': ('Michael', 'Chen'),
    'sarah@example.com': ('Sarah', 'Williams'),
    'david@example.com': ('David', 'Brown'),
    'lisa@example.com': ('Lisa', 'Anderson'),
    'charlotte@example.com': ('Charlotte', 'Harris'),
    'logan@example.com': ('Logan', 'Nguyen'),
    'owen@example.com': ('Owen', 'Garcia'),
    'amelia@example.com': ('Amelia', 'Taylor'),
    'jacob@example.com': ('Jacob', 'Martinez'),
    'wyatt@example.com': ('Wyatt', 'Rodriguez'),
    'harper@example.com': ('Harper', 'Hernandez'),
    'jackson@example.com': ('Jackson', 'Lopez'),
    'emily@example.com': ('Emily', 'Gonzalez'),
    'mateo@example.com': ('Mateo', 'Wilson'),
    'sofia@example.com': ('Sofia', 'Anderson'),
    'james@example.com': ('James', 'Thomas'),
    'sofia@example.com': ('Sofia', 'Moore'),
    'daniel@example.com': ('Daniel', 'Jackson'),
    'nora@example.com': ('Nora', 'Martin'),
    'jack@example.com': ('Jack', 'White'),
    'daniel@example.com': ('Daniel', 'Gonzalez'),
    'mia@example.com': ('Mia', 'Flores'),
    'nora@example.com': ('Nora', 'Wright'),
    'chloe@example.com': ('Chloe', 'Allen'),
    'madison@example.com': ('Madison', 'Taylor'),
    'wyatt@example.com': ('Wyatt', 'Anderson'),
    'emily@example.com': ('Emily', 'Nelson'),
    'benjamin@example.com': ('Benjamin', 'Adams'),
    'amelia@example.com': ('Amelia', 'Wright'),
    'emily@example.com': ('Emily', 'Hall'),
    'alexander@example.com': ('Alexander', 'Anderson'),
    'madison@example.com': ('Madison', 'Rodriguez'),
    'sebastian@example.com': ('Sebastian', 'Allen'),
    'lucas@example.com': ('Lucas', 'Jackson'),
    'ava@example.com': ('Ava', 'Wright'),
    'william@example.com': ('William', 'Clark'),
    'nora@example.com': ('Nora', 'White'),
    'abigail@example.com': ('Abigail', 'Allen'),
    'sebastian@example.com': ('Sebastian', 'Brown'),
    'mia@example.com': ('Mia', 'Lewis'),
    'carter@example.com': ('Carter', 'Thompson'),
    'jackson@example.com': ('Jackson', 'Garcia'),
    'jackson@example.com': ('Jackson', 'Nguyen'),
    'henry@example.com': ('Henry', 'Torres'),
    'wyatt@example.com': ('Wyatt', 'Adams'),
    'leo@example.com': ('Leo', 'King'),
    'william@example.com': ('William', 'Ramirez'),
    'jackson@example.com': ('Jackson', 'Martin'),
    'charlotte@example.com': ('Charlotte', 'Jones'),
    'carter@example.com': ('Carter', 'Martinez'),
    'noah@example.com': ('Noah', 'Anderson'),
    'mia@example.com': ('Mia', 'Scott'),
    'jackson@example.com': ('Jackson', 'Nguyen'),
    'abigail@example.com': ('Abigail', 'Anderson'),
    'charlotte@example.com': ('Charlotte', 'Campbell')
}

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

def fix_student_names():
    """Fix student names to have proper first names and bios"""
    print("Fixing student names...")
    
    students = User.objects.filter(role='STUDENT').order_by('id')
    updated_count = 0
    
    for i, student in enumerate(students):
        if i < len(bios):
            bio = bios[i]
            
            # Extract name from email if not in mappings
            if student.email in name_mappings:
                first_name, last_name = name_mappings[student.email]
            else:
                # Extract from email
                email_parts = student.email.split('@')[0].split('.')
                first_name = email_parts[0].title() if len(email_parts) > 0 else 'Student'
                last_name = email_parts[1].title() if len(email_parts) > 1 else 'User'
            
            # Update student with proper name and bio
            student.first_name = f"{first_name}|{bio}"
            student.last_name = last_name
            student.save()
            
            updated_count += 1
            print(f"Updated {i+1}: {first_name} {last_name} - {bio}")
        else:
            break
    
    print(f"\n✅ Successfully fixed {updated_count} students!")
    print("📝 Students now have proper names and bios.")

if __name__ == "__main__":
    fix_student_names()
