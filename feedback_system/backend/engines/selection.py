"""
Student Selection Engine

This engine implements the priority scoring algorithm for selecting
which student should be asked next during a class session.

Priority Factors:
- Ability level (weak students get higher priority)
- Time since last answer
- Current confidence level
- Recent wrong streak
- Topic weakness
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from database import Student, Question, ClassSession, StudentResponse as DBStudentResponse
from models import SuggestionResponse


def calculate_priority_score(
    student: Student,
    session: ClassSession,
    session_responses: list,
    db: Session
) -> float:
    """
    Calculate priority score for a student.
    Higher score = should be asked sooner.
    """
    score = 0.0
    
    # 1. Low confidence boost (weak students prioritized)
    # Confidence is 1-5, so (5 - confidence) gives 0-4
    confidence_boost = (5 - student.confidence) * 3
    score += confidence_boost
    
    # 2. Level bonus (weak > medium > strong)
    level_bonus = {
        "weak": 5.0,
        "medium": 2.0,
        "strong": 0.0
    }
    score += level_bonus.get(student.level, 2.0)
    
    # 3. Time since last answer
    if student.last_answered_at:
        days_since = (datetime.utcnow() - student.last_answered_at).days
        # Cap at 7 days to prevent extreme scores
        days_since = min(days_since, 7)
        score += days_since * 2
    else:
        # Never answered - high priority
        score += 14  # Equivalent to 7 days
    
    # 4. Consecutive wrong streak penalty/boost
    if student.consecutive_wrong > 0:
        # Student is struggling - give easier questions but still call them
        score += min(student.consecutive_wrong * 1.5, 6)
    
    # 5. Topic weakness bonus
    topic_performance = student.topic_performance or {}
    topic_score = topic_performance.get(session.topic, 2.5)  # Default middle
    if topic_score < 2.5:
        score += (2.5 - topic_score) * 2  # Weak in this topic
    
    # 6. Already answered in this session penalty
    student_session_responses = [r for r in session_responses if r.student_id == student.id]
    times_called = len(student_session_responses)
    score -= times_called * 5  # Significant penalty for repeat calls
    
    # 7. Very recent answer penalty (within last 5 minutes)
    if student_session_responses:
        last_response = max(student_session_responses, key=lambda r: r.answered_at or datetime.min)
        if last_response.answered_at:
            minutes_since = (datetime.utcnow() - last_response.answered_at).total_seconds() / 60
            if minutes_since < 5:
                score -= (5 - minutes_since) * 2
    
    return score


def determine_difficulty(student: Student, session: ClassSession) -> str:
    """
    Determine appropriate difficulty level for a student.
    """
    # Base difficulty on student level
    if student.level == "weak":
        base_difficulty = "easy"
    elif student.level == "strong":
        base_difficulty = "hard"
    else:
        base_difficulty = "medium"
    
    # Adjust based on consecutive correct answers
    if student.consecutive_correct >= 3:
        # Upgrade difficulty
        if base_difficulty == "easy":
            return "medium"
        elif base_difficulty == "medium":
            return "hard"
    
    # Adjust based on consecutive wrong answers
    if student.consecutive_wrong >= 2:
        # Downgrade difficulty
        if base_difficulty == "hard":
            return "medium"
        elif base_difficulty == "medium":
            return "easy"
    
    # Check topic-specific performance
    topic_performance = student.topic_performance or {}
    topic_score = topic_performance.get(session.topic, 2.5)
    
    if topic_score < 2.0 and base_difficulty != "easy":
        # Weak in this topic, go easier
        if base_difficulty == "hard":
            return "medium"
        return "easy"
    elif topic_score > 4.0 and base_difficulty != "hard":
        # Strong in this topic, go harder
        if base_difficulty == "easy":
            return "medium"
        return "hard"
    
    return base_difficulty


def generate_reason(student: Student, priority_score: float, difficulty: str) -> str:
    """
    Generate a human-readable reason for the suggestion.
    """
    reasons = []
    
    # Level-based reason
    if student.level == "weak":
        reasons.append("Needs confidence building")
    elif student.level == "strong":
        reasons.append("Can handle challenge")
    
    # Participation reason
    if student.last_answered_at is None:
        reasons.append("hasn't answered yet")
    else:
        days_since = (datetime.utcnow() - student.last_answered_at).days
        if days_since >= 2:
            reasons.append(f"last answered {days_since} days ago")
    
    # Streak reason
    if student.consecutive_correct >= 2:
        reasons.append(f"{student.consecutive_correct} correct streak")
    elif student.consecutive_wrong >= 2:
        reasons.append("needs encouragement")
    
    # Confidence reason
    if student.confidence < 2.0:
        reasons.append("low confidence")
    elif student.confidence > 4.0:
        reasons.append("high confidence")
    
    if not reasons:
        reasons.append("fair turn")
    
    return "; ".join(reasons).capitalize()


def get_next_student_suggestion(
    db: Session,
    session: ClassSession
) -> Optional[SuggestionResponse]:
    """
    Get the next student suggestion for the session.
    Returns the student with highest priority score.
    """
    # Get all students in the class
    students = db.query(Student).filter(Student.class_id == session.class_id).all()
    
    if not students:
        return None
    
    # Get all responses for this session
    session_responses = db.query(DBStudentResponse).filter(
        DBStudentResponse.session_id == session.id
    ).all()
    
    # Calculate priority scores for each student
    student_scores = []
    for student in students:
        score = calculate_priority_score(student, session, session_responses, db)
        student_scores.append((student, score))
    
    # Sort by score (highest first)
    student_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Get the top student
    selected_student, priority_score = student_scores[0]
    
    # Determine difficulty
    difficulty = determine_difficulty(selected_student, session)
    
    # Try to find a question for this topic and difficulty
    question = db.query(Question).filter(
        Question.topic == session.topic,
        Question.difficulty == difficulty
    ).first()
    
    # If no question for exact difficulty, try adjacent difficulties
    if not question:
        adjacent = {"easy": ["medium"], "medium": ["easy", "hard"], "hard": ["medium"]}
        for adj_diff in adjacent.get(difficulty, []):
            question = db.query(Question).filter(
                Question.topic == session.topic,
                Question.difficulty == adj_diff
            ).first()
            if question:
                break
    
    # Generate reason
    reason = generate_reason(selected_student, priority_score, difficulty)
    
    return SuggestionResponse(
        student_id=selected_student.id,
        student_name=selected_student.name,
        difficulty=difficulty,
        question_id=question.id if question else None,
        question_text=question.text if question else None,
        reason=reason,
        priority_score=round(priority_score, 2)
    )
