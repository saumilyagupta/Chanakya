"""
Reflection Router

Handles API endpoints for class reflection analysis:
- POST /analyze - Submit transcript and get AI feedback
- GET /{id} - Get a specific reflection
- GET /history - List past reflections
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db, ClassReflection
from models import (
    ReflectionCreate, ReflectionResponse, ReflectionFeedback,
    ReflectionListItem, ReflectionHistoryResponse
)
from engines.reflection_analyzer import analyze_class_transcript

router = APIRouter()


@router.post("/analyze", response_model=ReflectionResponse)
async def analyze_class(reflection_data: ReflectionCreate, db: Session = Depends(get_db)):
    """
    Analyze a class transcript and generate AI feedback.
    
    Accepts the transcript along with class metadata (topic, subject, level),
    sends it to the LLM for analysis, and returns structured feedback.
    """
    try:
        # Get AI analysis
        feedback = await analyze_class_transcript(
            transcript=reflection_data.transcript,
            topic=reflection_data.topic,
            subject=reflection_data.subject,
            class_level=reflection_data.class_level
        )
        
        # Save to database
        db_reflection = ClassReflection(
            topic=reflection_data.topic,
            subject=reflection_data.subject,
            class_level=reflection_data.class_level,
            transcript=reflection_data.transcript,
            feedback_json=feedback
        )
        db.add(db_reflection)
        db.commit()
        db.refresh(db_reflection)
        
        # Return response with feedback
        return ReflectionResponse(
            id=db_reflection.id,
            topic=db_reflection.topic,
            subject=db_reflection.subject,
            class_level=db_reflection.class_level,
            transcript=db_reflection.transcript,
            feedback=ReflectionFeedback(**feedback),
            created_at=db_reflection.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze transcript: {str(e)}")


@router.get("/history", response_model=ReflectionHistoryResponse)
def get_reflection_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get a list of past class reflections.
    
    Returns a paginated list of reflections with basic info.
    """
    # Get total count
    total = db.query(ClassReflection).count()
    
    # Get reflections ordered by most recent
    reflections = db.query(ClassReflection).order_by(
        ClassReflection.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Convert to list items
    items = []
    for r in reflections:
        feedback = r.feedback_json or {}
        items.append(ReflectionListItem(
            id=r.id,
            topic=r.topic,
            subject=r.subject,
            class_level=r.class_level,
            created_at=r.created_at,
            strengths_count=len(feedback.get("strengths", [])),
            issues_count=len(feedback.get("issues", []))
        ))
    
    return ReflectionHistoryResponse(reflections=items, total=total)


@router.get("/{reflection_id}", response_model=ReflectionResponse)
def get_reflection(reflection_id: int, db: Session = Depends(get_db)):
    """
    Get a specific reflection by ID.
    """
    reflection = db.query(ClassReflection).filter(
        ClassReflection.id == reflection_id
    ).first()
    
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")
    
    feedback = reflection.feedback_json or {
        "strengths": [],
        "issues": [],
        "classroom_atmosphere": "Unknown",
        "topic_feedback": [],
        "suggestions": []
    }
    
    return ReflectionResponse(
        id=reflection.id,
        topic=reflection.topic,
        subject=reflection.subject,
        class_level=reflection.class_level,
        transcript=reflection.transcript,
        feedback=ReflectionFeedback(**feedback),
        created_at=reflection.created_at
    )


@router.delete("/{reflection_id}")
def delete_reflection(reflection_id: int, db: Session = Depends(get_db)):
    """
    Delete a reflection by ID.
    """
    reflection = db.query(ClassReflection).filter(
        ClassReflection.id == reflection_id
    ).first()
    
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")
    
    db.delete(reflection)
    db.commit()
    
    return {"message": "Reflection deleted successfully"}




