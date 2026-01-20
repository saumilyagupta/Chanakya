from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db, ClassSession, Student, Question, StudentResponse as DBStudentResponse
from models import (
    SessionCreate, SessionResponse, SuggestionResponse,
    ResponseCreate
)
from engines.selection import get_next_student_suggestion
from engines.confidence import update_student_confidence

router = APIRouter()


@router.post("/start", response_model=SessionResponse)
def start_session(session_data: SessionCreate, db: Session = Depends(get_db)):
    """Start a new class session."""
    # End any active sessions for this class
    active_sessions = db.query(ClassSession).filter(
        ClassSession.class_id == session_data.class_id,
        ClassSession.is_active == True
    ).all()
    
    for session in active_sessions:
        session.is_active = False
        session.ended_at = datetime.utcnow()
    
    # Create new session
    db_session = ClassSession(
        class_id=session_data.class_id,
        topic=session_data.topic,
        is_active=True
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get session details."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/next", response_model=SuggestionResponse)
def get_next_suggestion(session_id: int, db: Session = Depends(get_db)):
    """Get the next student suggestion for questioning."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Get suggestion from selection engine
    suggestion = get_next_student_suggestion(db, session)
    
    if suggestion is None:
        raise HTTPException(status_code=404, detail="No more students to suggest")
    
    return suggestion


@router.post("/{session_id}/respond")
def submit_response(session_id: int, response_data: ResponseCreate, db: Session = Depends(get_db)):
    """Submit a student's response/rating."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    student = db.query(Student).filter(Student.id == response_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create response record
    db_response = DBStudentResponse(
        session_id=session_id,
        student_id=response_data.student_id,
        question_id=response_data.question_id,
        rating=response_data.rating,
        difficulty_asked=response_data.difficulty_asked,
        skipped=response_data.skipped
    )
    db.add(db_response)
    
    # Update student's confidence and streaks
    if not response_data.skipped:
        update_student_confidence(db, student, response_data.rating, session.topic)
    
    # Update last answered timestamp
    student.last_answered_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Response recorded successfully"}


@router.post("/{session_id}/skip")
def skip_student(session_id: int, student_id: int, db: Session = Depends(get_db)):
    """Skip a student without asking them a question."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Record skip
    db_response = DBStudentResponse(
        session_id=session_id,
        student_id=student_id,
        question_id=None,
        rating=0,
        difficulty_asked="easy",
        skipped=True
    )
    db.add(db_response)
    db.commit()
    
    return {"message": "Student skipped"}


@router.post("/{session_id}/end", response_model=SessionResponse)
def end_session(session_id: int, db: Session = Depends(get_db)):
    """End a class session."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    session.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.get("/active/{class_id}", response_model=SessionResponse)
def get_active_session(class_id: int, db: Session = Depends(get_db)):
    """Get the active session for a class, if any."""
    session = db.query(ClassSession).filter(
        ClassSession.class_id == class_id,
        ClassSession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
    
    return session
