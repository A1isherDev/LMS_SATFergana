#!/usr/bin/env python
"""
Add bios to existing students by storing them in a simple way
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

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

def add_bios_to_students():
    """Add bios to existing students"""
    print("Adding bios to existing students...")
    
    students = User.objects.filter(role='STUDENT').order_by('id')
    updated_count = 0
    
    for i, student in enumerate(students):
        if i < len(bios):
            # Store bio in a way that can be accessed via API
            # We'll use the first_name field to include bio info for now
            # In a real implementation, you'd want to add a proper bio field to the User model
            original_first_name = student.first_name.split(' (')[0]  # Remove any existing bio
            bio = bios[i]
            
            # Store bio in the first_name field with a separator
            student.first_name = f"{original_first_name}|{bio}"
            student.save()
            
            updated_count += 1
            print(f"Updated {i+1}: {original_first_name} - {bio}")
        else:
            break
    
    print(f"\n✅ Successfully added bios to {updated_count} students!")
    print("📝 Bios are now stored and will be displayed in the rankings.")

if __name__ == "__main__":
    add_bios_to_students()
