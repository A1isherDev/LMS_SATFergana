#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.rankings.models import Ranking

# Delete and regenerate rankings
print('Deleting existing rankings...')
Ranking.objects.all().delete()

print('Generating new rankings with updated data...')
weekly_rankings = Ranking.update_rankings('WEEKLY')
print(f'Generated {len(weekly_rankings)} weekly rankings')

# Show the rankings
print('\nWeekly Rankings:')
for ranking in weekly_rankings:
    print(f'  {ranking.student.email} - Rank {ranking.rank} - {ranking.total_points} points')
