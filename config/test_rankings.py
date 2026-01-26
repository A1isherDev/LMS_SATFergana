#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.rankings.models import Ranking
from apps.users.models import User

print("=== TESTING RANKINGS API ===")

# Get weekly rankings
weekly_rankings = Ranking.objects.filter(period_type='WEEKLY').order_by('rank')
print(f'Weekly rankings count: {weekly_rankings.count()}')

for ranking in weekly_rankings[:3]:
    print(f'Rank {ranking.rank}: {ranking.student.email} - {ranking.total_points} points')
    print(f'  Rank change: {ranking.rank_change_display}')
    print(f'  Class: {getattr(ranking, "class_name", "N/A")}')

print("\n=== TESTING API RESPONSE FORMAT ===")
# Test what the API should return
entries = []
for ranking in weekly_rankings:
    entries.append({
        'student_id': ranking.student.id,
        'student_name': ranking.student.get_full_name() or ranking.student.email,
        'student_email': ranking.student.email,
        'rank': ranking.rank,
        'rank_change': ranking.rank_change,
        'rank_change_display': ranking.rank_change_display,
        'total_points': ranking.total_points,
        'homework_completion_rate': ranking.homework_completion_rate,
        'homework_accuracy': ranking.homework_accuracy,
        'class_name': getattr(ranking, 'class_name', 'General')
    })

print(f'API would return {len(entries)} entries')
if entries:
    print(f'First entry: {entries[0]}')
