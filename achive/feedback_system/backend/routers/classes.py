from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Class, Student
from models import ClassCreate, ClassResponse, ClassListResponse

router = APIRouter()


@router.post("/", response_model=ClassResponse)
def create_class(class_data: ClassCreate, db: Session = Depends(get_db)):
    """Create a new class."""
    db_class = Class(
        name=class_data.name,
        subject=class_data.subject
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return ClassResponse(
        id=db_class.id,
        name=db_class.name,
        subject=db_class.subject,
        created_at=db_class.created_at,
        student_count=0
    )


@router.get("/", response_model=ClassListResponse)
def get_all_classes(db: Session = Depends(get_db)):
    """Get all classes with student counts."""
    classes = db.query(Class).all()
    result = []
    for c in classes:
        student_count = db.query(Student).filter(Student.class_id == c.id).count()
        result.append(ClassResponse(
            id=c.id,
            name=c.name,
            subject=c.subject,
            created_at=c.created_at,
            student_count=student_count
        ))
    return ClassListResponse(classes=result)


@router.get("/{class_id}", response_model=ClassResponse)
def get_class(class_id: int, db: Session = Depends(get_db)):
    """Get a specific class by ID."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    student_count = db.query(Student).filter(Student.class_id == class_id).count()
    return ClassResponse(
        id=db_class.id,
        name=db_class.name,
        subject=db_class.subject,
        created_at=db_class.created_at,
        student_count=student_count
    )


@router.put("/{class_id}", response_model=ClassResponse)
def update_class(class_id: int, class_data: ClassCreate, db: Session = Depends(get_db)):
    """Update a class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db_class.name = class_data.name
    db_class.subject = class_data.subject
    db.commit()
    db.refresh(db_class)
    
    student_count = db.query(Student).filter(Student.class_id == class_id).count()
    return ClassResponse(
        id=db_class.id,
        name=db_class.name,
        subject=db_class.subject,
        created_at=db_class.created_at,
        student_count=student_count
    )


@router.delete("/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    """Delete a class and all its students."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db.delete(db_class)
    db.commit()
    return {"message": "Class deleted successfully"}
