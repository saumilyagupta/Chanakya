import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionsApi } from '../api/client'
import SuggestionCard from '../components/SuggestionCard'
import RatingPopup from '../components/RatingPopup'
import './LiveSession.css'

function LiveSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [session, setSession] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchingNext, setFetchingNext] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [questionsAsked, setQuestionsAsked] = useState(0)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    loadSession()
  }, [sessionId])
  
  const loadSession = async () => {
    try {
      const data = await sessionsApi.get(sessionId)
      setSession(data)
      if (data.is_active) {
        fetchNextSuggestion()
      } else {
        setSessionEnded(true)
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      setError('Session not found')
      setLoading(false)
    }
  }
  
  const fetchNextSuggestion = useCallback(async () => {
    setFetchingNext(true)
    try {
      const data = await sessionsApi.getNext(sessionId)
      setSuggestion(data)
      setError(null)
    } catch (error) {
      if (error.message.includes('No more students')) {
        setSuggestion(null)
      } else {
        console.error('Failed to get suggestion:', error)
      }
    } finally {
      setFetchingNext(false)
      setLoading(false)
    }
  }, [sessionId])
  
  const handleAsk = () => {
    setShowRating(true)
  }
  
  const handleSkip = async () => {
    if (!suggestion) return
    
    try {
      await sessionsApi.skip(sessionId, suggestion.student_id)
      fetchNextSuggestion()
    } catch (error) {
      console.error('Failed to skip:', error)
    }
  }
  
  const handleRatingSubmit = async (rating) => {
    if (!suggestion) return
    
    try {
      await sessionsApi.respond(sessionId, {
        student_id: suggestion.student_id,
        question_id: suggestion.question_id,
        rating: rating,
        difficulty_asked: suggestion.difficulty,
        skipped: false
      })
      
      setQuestionsAsked(prev => prev + 1)
      setShowRating(false)
      fetchNextSuggestion()
    } catch (error) {
      console.error('Failed to submit response:', error)
    }
  }
  
  const handleEndSession = async () => {
    if (!confirm('End this class session?')) return
    
    try {
      await sessionsApi.end(sessionId)
      setSessionEnded(true)
      navigate(`/summary/${sessionId}`)
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }
  
  const handleViewSummary = () => {
    navigate(`/summary/${sessionId}`)
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showRating) return
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (suggestion) handleAsk()
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        if (suggestion) handleSkip()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleEndSession()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [suggestion, showRating])
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading session...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>{error}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="live-session">
      {/* Session Header */}
      <div className="session-header">
        <div className="session-info">
          <h1>{session?.topic}</h1>
          <div className="session-stats">
            <div className="stat">
              <span className="stat-value">{questionsAsked}</span>
              <span className="stat-label">Questions Asked</span>
            </div>
            <div className="stat">
              <div className={`status-indicator ${session?.is_active ? 'active' : ''}`}>
                <span className="pulse"></span>
                {session?.is_active ? 'Live' : 'Ended'}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-secondary end-btn"
          onClick={sessionEnded ? handleViewSummary : handleEndSession}
        >
          {sessionEnded ? (
            <>
              View Summary
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </>
          ) : (
            <>
              End Session
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
            </>
          )}
        </button>
      </div>
      
      {/* Main Content */}
      <div className="session-content">
        {sessionEnded ? (
          <div className="session-ended">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2>Session Complete!</h2>
            <p>You asked {questionsAsked} questions in this session.</p>
            <button className="btn btn-primary btn-lg" onClick={handleViewSummary}>
              View Class Summary
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            <SuggestionCard 
              suggestion={suggestion}
              loading={fetchingNext}
              onAsk={handleAsk}
              onSkip={handleSkip}
            />
            
            {/* Keyboard Shortcuts Help */}
            <div className="shortcuts-help">
              <span><kbd>Enter</kbd> Ask</span>
              <span><kbd>S</kbd> Skip</span>
              <span><kbd>Esc</kbd> End Session</span>
            </div>
          </>
        )}
      </div>
      
      {/* Rating Popup */}
      {showRating && suggestion && (
        <RatingPopup 
          studentName={suggestion.student_name}
          difficulty={suggestion.difficulty}
          onSubmit={handleRatingSubmit}
          onCancel={() => setShowRating(false)}
        />
      )}
    </div>
  )
}

export default LiveSession
