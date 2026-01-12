from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db, ClassSession, Student, StudentResponse as DBStudentResponse
from models import SessionSummaryResponse, StudentSummary

router = APIRouter()


@router.get("/session/{session_id}/summary", response_model=SessionSummaryResponse)
def get_session_summary(session_id: int, db: Session = Depends(get_db)):
    """Get comprehensive summary of a class session."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all students in the class
    all_students = db.query(Student).filter(Student.class_id == session.class_id).all()
    total_students = len(all_students)
    
    # Get all responses for this session (excluding skips)
    responses = db.query(DBStudentResponse).filter(
        DBStudentResponse.session_id == session_id,
        DBStudentResponse.skipped == False
    ).all()
    
    # Calculate duration
    end_time = session.ended_at or datetime.utcnow()
    duration_minutes = (end_time - session.started_at).total_seconds() / 60
    
    # Students who participated
    students_called_ids = set(r.student_id for r in responses)
    students_called = len(students_called_ids)
    students_not_called = total_students - students_called
    
    # Participation percentage
    participation_percentage = (students_called / total_students * 100) if total_students > 0 else 0
    
    # Average rating
    total_rating = sum(r.rating for r in responses)
    average_rating = total_rating / len(responses) if responses else 0
    
    # Difficulty distribution
    difficulty_distribution = {"easy": 0, "medium": 0, "hard": 0}
    for r in responses:
        if r.difficulty_asked in difficulty_distribution:
            difficulty_distribution[r.difficulty_asked] += 1
    
    # Per-student summaries
    student_summaries = []
    students_improved = []
    students_need_attention = []
    
    for student in all_students:
        student_responses = [r for r in responses if r.student_id == student.id]
        times_called = len(student_responses)
        
        if times_called > 0:
            avg_rating = sum(r.rating for r in student_responses) / times_called
            
            # Calculate confidence change during this session
            # This is a simplified calculation
            confidence_change = 0.0
            for r in student_responses:
                if r.rating >= 4:
                    confidence_change += 0.3
                elif r.rating >= 3:
                    confidence_change += 0.1
                elif r.rating == 2:
                    confidence_change -= 0.1
                else:
                    confidence_change -= 0.3
            
            improved = confidence_change > 0
            
            summary = StudentSummary(
                student_id=student.id,
                student_name=student.name,
                times_called=times_called,
                average_rating=round(avg_rating, 2),
                confidence_change=round(confidence_change, 2),
                improved=improved
            )
            student_summaries.append(summary)
            
            if improved:
                students_improved.append(summary)
            elif confidence_change < 0:
                students_need_attention.append(summary)
        else:
            # Student wasn't called
            summary = StudentSummary(
                student_id=student.id,
                student_name=student.name,
                times_called=0,
                average_rating=0.0,
                confidence_change=0.0,
                improved=False
            )
            student_summaries.append(summary)
            students_need_attention.append(summary)
    
    return SessionSummaryResponse(
        session_id=session_id,
        topic=session.topic,
        duration_minutes=round(duration_minutes, 1),
        total_questions_asked=len(responses),
        participation_percentage=round(participation_percentage, 1),
        students_called=students_called,
        students_not_called=students_not_called,
        average_rating=round(average_rating, 2),
        difficulty_distribution=difficulty_distribution,
        students_improved=students_improved,
        students_need_attention=students_need_attention,
        all_student_summaries=student_summaries
    )


@router.get("/class/{class_id}/history")
def get_class_history(class_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Get recent session history for a class."""
    sessions = db.query(ClassSession).filter(
        ClassSession.class_id == class_id
    ).order_by(ClassSession.started_at.desc()).limit(limit).all()
    
    history = []
    for session in sessions:
        responses = db.query(DBStudentResponse).filter(
            DBStudentResponse.session_id == session.id,
            DBStudentResponse.skipped == False
        ).all()
        
        avg_rating = sum(r.rating for r in responses) / len(responses) if responses else 0
        
        history.append({
            "session_id": session.id,
            "topic": session.topic,
            "started_at": session.started_at.isoformat(),
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "is_active": session.is_active,
            "questions_asked": len(responses),
            "average_rating": round(avg_rating, 2)
        })
    
    return {"history": history}


@router.get("/student/{student_id}/progress")
def get_student_progress(student_id: int, db: Session = Depends(get_db)):
    """Get a student's progress over time."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    responses = db.query(DBStudentResponse).filter(
        DBStudentResponse.student_id == student_id,
        DBStudentResponse.skipped == False
    ).order_by(DBStudentResponse.answered_at).all()
    
    # Build progress timeline
    progress = []
    running_confidence = student.confidence
    
    for r in responses:
        progress.append({
            "session_id": r.session_id,
            "rating": r.rating,
            "difficulty": r.difficulty_asked,
            "answered_at": r.answered_at.isoformat() if r.answered_at else None
        })
    
    return {
        "student_id": student_id,
        "student_name": student.name,
        "current_level": student.level,
        "current_confidence": student.confidence,
        "total_responses": len(responses),
        "progress": progress
    }
