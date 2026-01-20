from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db, Student, Class, StudentResponse as DBStudentResponse, ClassSession
from models import (
    StudentCreate, StudentBulkCreate, StudentResponse, 
    StudentUpdate, StudentProfileResponse
)

router = APIRouter()


@router.post("/class/{class_id}", response_model=StudentResponse)
def create_student(class_id: int, student_data: StudentCreate, db: Session = Depends(get_db)):
    """Add a single student to a class."""
    # Verify class exists
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Set initial confidence based on level
    initial_confidence = {
        "weak": 1.5,
        "medium": 2.5,
        "strong": 4.0
    }.get(student_data.level, 2.5)
    
    if student_data.confidence != 2.5:  # User provided custom confidence
        initial_confidence = student_data.confidence
    
    db_student = Student(
        class_id=class_id,
        name=student_data.name,
        level=student_data.level,
        confidence=initial_confidence
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.post("/class/{class_id}/bulk", response_model=List[StudentResponse])
def create_students_bulk(class_id: int, data: StudentBulkCreate, db: Session = Depends(get_db)):
    """Add multiple students to a class at once."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    created_students = []
    for student_data in data.students:
        initial_confidence = {
            "weak": 1.5,
            "medium": 2.5,
            "strong": 4.0
        }.get(student_data.level, 2.5)
        
        if student_data.confidence != 2.5:
            initial_confidence = student_data.confidence
            
        db_student = Student(
            class_id=class_id,
            name=student_data.name,
            level=student_data.level,
            confidence=initial_confidence
        )
        db.add(db_student)
        created_students.append(db_student)
    
    db.commit()
    for s in created_students:
        db.refresh(s)
    
    return created_students


@router.get("/class/{class_id}", response_model=List[StudentResponse])
def get_class_students(class_id: int, db: Session = Depends(get_db)):
    """Get all students in a class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = db.query(Student).filter(Student.class_id == class_id).all()
    return students


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a specific student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/profile", response_model=StudentProfileResponse)
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    """Get detailed student profile with history and stats."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all responses for this student
    responses = db.query(DBStudentResponse).filter(
        DBStudentResponse.student_id == student_id,
        DBStudentResponse.skipped == False
    ).order_by(DBStudentResponse.answered_at.desc()).all()
    
    total_responses = len(responses)
    average_rating = 0.0
    if total_responses > 0:
        average_rating = sum(r.rating for r in responses) / total_responses
    
    # Calculate participation rate (sessions participated / total sessions for their class)
    total_sessions = db.query(ClassSession).filter(
        ClassSession.class_id == student.class_id
    ).count()
    
    sessions_participated = db.query(DBStudentResponse.session_id).filter(
        DBStudentResponse.student_id == student_id
    ).distinct().count()
    
    participation_rate = 0.0
    if total_sessions > 0:
        participation_rate = (sessions_participated / total_sessions) * 100
    
    # Calculate improvement trend (compare recent vs older ratings)
    improvement_trend = 0.0
    if total_responses >= 4:
        recent_avg = sum(r.rating for r in responses[:len(responses)//2]) / (len(responses)//2)
        older_avg = sum(r.rating for r in responses[len(responses)//2:]) / (len(responses) - len(responses)//2)
        improvement_trend = recent_avg - older_avg
    
    # Recent history with question text and topic
    recent_history = []
    for r in responses[:10]:
        question_text = None
        topic = None
        if r.question:
            question_text = r.question.text
        if r.session:
            topic = r.session.topic
        recent_history.append({
            "session_id": r.session_id,
            "rating": r.rating,
            "difficulty": r.difficulty_asked,
            "answered_at": r.answered_at.isoformat() if r.answered_at else None,
            "question_text": question_text,
            "topic": topic
        })
    
    return StudentProfileResponse(
        student=student,
        total_responses=total_responses,
        average_rating=round(average_rating, 2),
        participation_rate=round(participation_rate, 1),
        improvement_trend=round(improvement_trend, 2),
        recent_history=recent_history
    )


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student_data: StudentUpdate, db: Session = Depends(get_db)):
    """Update a student's information."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student_data.name is not None:
        student.name = student_data.name
    if student_data.level is not None:
        student.level = student_data.level
    if student_data.confidence is not None:
        student.confidence = student_data.confidence
    
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Delete a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}
