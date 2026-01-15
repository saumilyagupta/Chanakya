from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db, Question
from models import (
    QuestionCreate, QuestionBulkCreate, QuestionResponse,
    QuestionGenerateRequest, QuestionsByDifficulty
)
from engines.ai_questions import generate_questions_for_topic

router = APIRouter()


@router.post("/", response_model=QuestionResponse)
def create_question(question_data: QuestionCreate, db: Session = Depends(get_db)):
    """Create a single question."""
    db_question = Question(
        topic=question_data.topic,
        difficulty=question_data.difficulty,
        text=question_data.text
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.post("/bulk", response_model=List[QuestionResponse])
def create_questions_bulk(data: QuestionBulkCreate, db: Session = Depends(get_db)):
    """Create multiple questions at once."""
    created_questions = []
    for q in data.questions:
        db_question = Question(
            topic=q.topic,
            difficulty=q.difficulty,
            text=q.text
        )
        db.add(db_question)
        created_questions.append(db_question)
    
    db.commit()
    for q in created_questions:
        db.refresh(q)
    
    return created_questions


@router.post("/generate", response_model=QuestionsByDifficulty)
async def generate_questions(request: QuestionGenerateRequest, db: Session = Depends(get_db)):
    """Generate questions using AI for a given topic."""
    try:
        generated = await generate_questions_for_topic(
            topic=request.topic,
            subject=request.subject,
            easy_count=request.easy_count,
            medium_count=request.medium_count,
            hard_count=request.hard_count
        )
        
        # Save generated questions to database
        saved_questions = {"easy": [], "medium": [], "hard": []}
        
        for difficulty in ["easy", "medium", "hard"]:
            for q_text in generated.get(difficulty, []):
                db_question = Question(
                    topic=request.topic,
                    difficulty=difficulty,
                    text=q_text
                )
                db.add(db_question)
                db.commit()
                db.refresh(db_question)
                saved_questions[difficulty].append(db_question)
        
        return QuestionsByDifficulty(
            easy=saved_questions["easy"],
            medium=saved_questions["medium"],
            hard=saved_questions["hard"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")


@router.get("/topic/{topic}", response_model=QuestionsByDifficulty)
def get_questions_by_topic(topic: str, db: Session = Depends(get_db)):
    """Get all questions for a topic, grouped by difficulty."""
    questions = db.query(Question).filter(Question.topic == topic).all()
    
    result = {"easy": [], "medium": [], "hard": []}
    for q in questions:
        if q.difficulty in result:
            result[q.difficulty].append(q)
    
    return QuestionsByDifficulty(
        easy=result["easy"],
        medium=result["medium"],
        hard=result["hard"]
    )


@router.get("/topics")
def get_all_topics(db: Session = Depends(get_db)):
    """Get all unique topics."""
    topics = db.query(Question.topic).distinct().all()
    return {"topics": [t[0] for t in topics]}


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(question_id: int, question_data: QuestionCreate, db: Session = Depends(get_db)):
    """Update a question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    question.topic = question_data.topic
    question.difficulty = question_data.difficulty
    question.text = question_data.text
    
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    """Delete a question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}
