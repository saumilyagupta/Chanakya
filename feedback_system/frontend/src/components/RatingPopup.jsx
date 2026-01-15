import { useState } from 'react'
import StarRating from './StarRating'
import './RatingPopup.css'

function RatingPopup({ studentName, difficulty, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  
  const handleSubmit = async () => {
    if (rating === 0) return
    
    setSubmitting(true)
    await onSubmit(rating)
    setSubmitting(false)
  }
  
  const getRatingLabel = (rating) => {
    switch (rating) {
      case 5: return 'Excellent! Perfect answer'
      case 4: return 'Good answer'
      case 3: return 'Acceptable'
      case 2: return 'Needs improvement'
      case 1: return 'Struggled/No answer'
      default: return 'Tap stars to rate'
    }
  }
  
  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'badge-easy'
      case 'hard': return 'badge-hard'
      default: return 'badge-medium'
    }
  }

  return (
    <div className="rating-popup-overlay" onClick={onCancel}>
      <div className="rating-popup scale-in" onClick={e => e.stopPropagation()}>
        <div className="rating-header">
          <h3>Rate {studentName}'s Answer</h3>
          <span className={`badge ${getDifficultyClass(difficulty)}`}>
            {difficulty} question
          </span>
        </div>
        
        <div className="rating-content">
          <div className="rating-stars">
            <StarRating 
              value={rating} 
              onChange={setRating}
              size="xlarge"
            />
          </div>
          
          <p className={`rating-label ${rating > 0 ? 'active' : ''}`}>
            {getRatingLabel(rating)}
          </p>
        </div>
        
        <div className="rating-actions">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (
              <>
                <span className="spinner small"></span>
                Submitting...
              </>
            ) : (
              <>
                Submit Rating
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingPopup
