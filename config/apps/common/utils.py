"""
Common utility functions for the SAT LMS platform.
Includes SAT score conversion and spaced repetition algorithm.
"""
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, Any
from django.utils import timezone


# SAT Score Conversion Tables
# These are based on official SAT scoring tables
# Math: 0-58 raw points → 200-800 scaled score
# Reading+Writing: 0-96 raw points → 200-800 scaled score (combined)

MATH_RAW_TO_SCALED = {
    # Raw score: Scaled score
    0: 200, 1: 200, 2: 210, 3: 220, 4: 230, 5: 240, 6: 250, 7: 260, 8: 270, 9: 280,
    10: 290, 11: 300, 12: 310, 13: 320, 14: 330, 15: 340, 16: 350, 17: 360, 18: 370, 19: 380,
    20: 390, 21: 400, 22: 410, 23: 420, 24: 430, 25: 440, 26: 450, 27: 460, 28: 470, 29: 480,
    30: 490, 31: 500, 32: 510, 33: 520, 34: 530, 35: 540, 36: 550, 37: 560, 38: 570, 39: 580,
    40: 590, 41: 600, 42: 610, 43: 620, 44: 630, 45: 640, 46: 650, 47: 660, 48: 670, 49: 680,
    50: 690, 51: 700, 52: 720, 53: 730, 54: 740, 55: 750, 56: 760, 57: 780, 58: 800
}

READING_WRITING_RAW_TO_SCALED = {
    # Raw score: Scaled score
    0: 200, 1: 200, 2: 200, 3: 210, 4: 220, 5: 230, 6: 240, 7: 250, 8: 260, 9: 270,
    10: 280, 11: 290, 12: 300, 13: 310, 14: 320, 15: 330, 16: 340, 17: 350, 18: 360, 19: 370,
    20: 380, 21: 390, 22: 400, 23: 410, 24: 420, 25: 430, 26: 440, 27: 450, 28: 460, 29: 470,
    30: 480, 31: 490, 32: 500, 33: 510, 34: 520, 35: 530, 36: 540, 37: 550, 38: 560, 39: 570,
    40: 580, 41: 590, 42: 600, 43: 610, 44: 620, 45: 630, 46: 640, 47: 650, 48: 660, 49: 670,
    50: 680, 51: 690, 52: 700, 53: 710, 54: 720, 55: 730, 56: 740, 57: 750, 58: 760, 59: 770,
    60: 780, 61: 790, 62: 800, 63: 800, 64: 800, 65: 800, 66: 800, 67: 800, 68: 800, 69: 800,
    70: 800, 71: 800, 72: 800, 73: 800, 74: 800, 75: 800, 76: 800, 77: 800, 78: 800, 79: 800,
    80: 800, 81: 800, 82: 800, 83: 800, 84: 800, 85: 800, 86: 800, 87: 800, 88: 800, 89: 800,
    90: 800, 91: 800, 92: 800, 93: 800, 94: 800, 95: 800, 96: 800
}


def convert_math_raw_to_scaled(raw_score: int) -> int:
    """
    Convert Math raw score (0-58) to scaled score (200-800).
    
    Args:
        raw_score: Raw score from 0 to 58
        
    Returns:
        Scaled score from 200 to 800
        
    Raises:
        ValueError: If raw_score is out of valid range
    """
    if raw_score < 0 or raw_score > 58:
        raise ValueError(f"Math raw score must be between 0 and 58, got {raw_score}")
    
    return MATH_RAW_TO_SCALED.get(raw_score, 200)


def convert_reading_writing_raw_to_scaled(raw_score: int) -> int:
    """
    Convert Reading+Writing raw score (0-96) to scaled score (200-800).
    
    Args:
        raw_score: Raw score from 0 to 96
        
    Returns:
        Scaled score from 200 to 800
        
    Raises:
        ValueError: If raw_score is out of valid range
    """
    if raw_score < 0 or raw_score > 96:
        raise ValueError(f"Reading+Writing raw score must be between 0 and 96, got {raw_score}")
    
    return READING_WRITING_RAW_TO_SCALED.get(raw_score, 200)


def convert_raw_to_scaled_sat(raw_score: int, section: str) -> int:
    """
    Convert raw score to scaled score for a specific SAT section.
    
    Args:
        raw_score: Raw score
        section: 'math', 'reading_writing', or 'reading'/'writing'
        
    Returns:
        Scaled score from 200 to 800
        
    Raises:
        ValueError: If raw_score is out of valid range or section is invalid
    """
    if section == 'math':
        if raw_score < 0 or raw_score > 58:
            raise ValueError(f"Math raw score must be between 0 and 58, got {raw_score}")
        return MATH_RAW_TO_SCALED.get(raw_score, 200)
    elif section in ['reading_writing', 'reading', 'writing']:
        if raw_score < 0 or raw_score > 96:
            raise ValueError(f"Reading+Writing raw score must be between 0 and 96, got {raw_score}")
        return READING_WRITING_RAW_TO_SCALED.get(raw_score, 200)
    else:
        raise ValueError(f"Invalid section: {section}. Must be 'math', 'reading_writing', 'reading', or 'writing'")


def convert_to_sat_score(math_raw: int, reading_raw: int, writing_raw: int) -> Dict[str, int]:
    """
    Convert raw scores to SAT scaled scores and calculate total.
    
    Args:
        math_raw: Math raw score (0-58)
        reading_raw: Reading raw score (0-52)
        writing_raw: Writing raw score (0-44)
        
    Returns:
        Dictionary with:
        - math_scaled: Math scaled score (200-800)
        - reading_scaled: Reading scaled score (200-800)
        - writing_scaled: Writing scaled score (200-800)
        - reading_writing_scaled: Combined Reading+Writing scaled score (200-800)
        - total_sat_score: Total SAT score (400-1600)
        
    Raises:
        ValueError: If any raw score is out of valid range
    """
    # Validate ranges
    if math_raw < 0 or math_raw > 58:
        raise ValueError(f"Math raw score must be between 0 and 58, got {math_raw}")
    if reading_raw < 0 or reading_raw > 52:
        raise ValueError(f"Reading raw score must be between 0 and 52, got {reading_raw}")
    if writing_raw < 0 or writing_raw > 44:
        raise ValueError(f"Writing raw score must be between 0 and 44, got {writing_raw}")
    
    # Convert Math
    math_scaled = convert_math_raw_to_scaled(math_raw)
    
    # Convert Reading and Writing separately (for reference)
    # Note: Reading and Writing are combined for the final score
    reading_writing_raw = reading_raw + writing_raw
    reading_writing_scaled = convert_reading_writing_raw_to_scaled(reading_writing_raw)
    
    # Calculate total SAT score
    total_sat_score = math_scaled + reading_writing_scaled
    
    return {
        'math_scaled': math_scaled,
        'reading_raw': reading_raw,
        'writing_raw': writing_raw,
        'reading_writing_raw': reading_writing_raw,
        'reading_writing_scaled': reading_writing_scaled,
        'total_sat_score': total_sat_score
    }


def calculate_days_until_exam(exam_date: datetime) -> Optional[int]:
    """
    Calculate the number of days until the SAT exam.
    
    Args:
        exam_date: The date of the SAT exam
        
    Returns:
        Number of days until exam, or None if exam date is in the past
    """
    if exam_date is None:
        return None
    
    now = timezone.now()
    if isinstance(exam_date, datetime):
        # Ensure both are timezone-aware
        if timezone.is_naive(exam_date):
            exam_date = timezone.make_aware(exam_date)
        delta = exam_date - now
        days = delta.days
        return days if days >= 0 else None
    return None


# Spaced Repetition Algorithm (SM-2 variant)
# Quality scale: 0-5
# 0 = complete blackout
# 1 = incorrect response, but remembered after seeing answer
# 2 = incorrect response, but correct one seemed familiar
# 3 = correct response, but with difficulty
# 4 = correct response after hesitation
# 5 = perfect recall

def calculate_spaced_repetition(
    quality: int,
    ease_factor: float,
    interval_days: int,
    review_count: int
) -> Tuple[float, int, datetime]:
    """
    Calculate next review date using SM-2 spaced repetition algorithm.
    
    Args:
        quality: Quality of recall (0-5)
        ease_factor: Current ease factor (typically starts at 2.5)
        interval_days: Current interval in days
        review_count: Number of times the item has been reviewed
        
    Returns:
        Tuple of (new_ease_factor, new_interval_days, next_review_date)
        
    Raises:
        ValueError: If quality is not in range 0-5
    """
    if quality < 0 or quality > 5:
        raise ValueError(f"Quality must be between 0 and 5, got {quality}")
    
    # Update ease factor based on quality
    # If quality < 3, decrease ease factor
    # If quality >= 3, ease factor stays the same or increases slightly
    if quality < 3:
        # Failed recall - decrease ease factor
        new_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ease_factor = max(1.3, new_ease_factor)  # Minimum ease factor is 1.3
    else:
        # Successful recall - ease factor can increase slightly
        new_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ease_factor = max(1.3, new_ease_factor)
    
    # Calculate new interval
    if quality < 3:
        # Failed recall - reset interval to 1 day
        new_interval_days = 1
    elif review_count == 0:
        # First review
        new_interval_days = 1
    elif review_count == 1:
        # Second review
        new_interval_days = 6
    else:
        # Subsequent reviews
        new_interval_days = int(interval_days * new_ease_factor)
        new_interval_days = max(1, new_interval_days)  # Minimum 1 day
    
    # Calculate next review date
    now = timezone.now()
    next_review_date = now + timedelta(days=new_interval_days)
    
    return (new_ease_factor, new_interval_days, next_review_date)


def get_initial_spaced_repetition_values() -> Dict[str, Any]:
    """
    Get initial values for spaced repetition algorithm.
    
    Returns:
        Dictionary with initial ease_factor, interval_days, and review_count
    """
    return {
        'ease_factor': 2.5,  # Standard starting ease factor
        'interval_days': 1,  # Start with 1 day interval
        'review_count': 0,   # No reviews yet
        'is_mastered': False
    }
def log_action(user, action, resource_type, resource_id=None, description=None, changes=None, request=None):
    """
    Utility function to create an AuditLog entry.
    
    Args:
        user: User performing the action
        action: Action type from AuditLog.ACTION_CHOICES
        resource_type: Type of resource affected
        resource_id: ID of the resource affected
        description: Text description of the action
        changes: Dictionary of changes made
        request: HttpRequest object to extract IP and User Agent
    """
    from apps.common.models import AuditLog
    
    log_data = {
        'user': user,
        'action': action,
        'resource_type': resource_type,
        'resource_id': str(resource_id) if resource_id else None,
        'description': description,
        'changes': changes or {},
    }
    
    if request:
        log_data['ip_address'] = request.META.get('REMOTE_ADDR')
        log_data['user_agent'] = request.META.get('HTTP_USER_AGENT')

    return AuditLog.objects.create(**log_data)
