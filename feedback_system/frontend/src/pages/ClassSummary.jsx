import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { analyticsApi } from '../api/client'
import StarRating from '../components/StarRating'
import './ClassSummary.css'

function ClassSummary() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    loadSummary()
  }, [sessionId])
  
  const loadSummary = async () => {
    try {
      const data = await analyticsApi.getSessionSummary(sessionId)
      setSummary(data)
    } catch (error) {
      console.error('Failed to load summary:', error)
      setError('Failed to load session summary')
    } finally {
      setLoading(false)
    }
  }
  
  const formatDuration = (minutes) => {
    if (minutes < 1) return 'Less than a minute'
    if (minutes < 60) return `${Math.round(minutes)} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading summary...</p>
      </div>
    )
  }
  
  if (error || !summary) {
    return (
      <div className="error-container">
        <h2>{error || 'Summary not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="class-summary">
      <div className="page-header">
        <button className="btn btn-secondary back-btn" onClick={() => navigate('/setup')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Classes
        </button>
        <div>
          <h1>Session Summary</h1>
          <p>{summary.topic}</p>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon participation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-value">{summary.participation_percentage.toFixed(0)}%</span>
            <span className="metric-label">Participation</span>
          </div>
          <div className="metric-detail">
            {summary.students_called} of {summary.students_called + summary.students_not_called} students
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon questions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-value">{summary.total_questions_asked}</span>
            <span className="metric-label">Questions Asked</span>
          </div>
          <div className="metric-detail">
            {formatDuration(summary.duration_minutes)}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon rating">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-value">{summary.average_rating.toFixed(1)}</span>
            <span className="metric-label">Avg Rating</span>
          </div>
          <div className="metric-detail">
            <StarRating value={Math.round(summary.average_rating)} readonly size="small" />
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon improved">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-value">{summary.students_improved.length}</span>
            <span className="metric-label">Students Improved</span>
          </div>
          <div className="metric-detail">
            This session
          </div>
        </div>
      </div>
      
      {/* Difficulty Distribution */}
      <div className="section-card">
        <h2>Difficulty Distribution</h2>
        <div className="difficulty-bars">
          {['easy', 'medium', 'hard'].map((diff) => {
            const count = summary.difficulty_distribution[diff] || 0
            const total = summary.total_questions_asked || 1
            const percentage = (count / total) * 100
            
            return (
              <div key={diff} className="difficulty-row">
                <span className={`badge badge-${diff}`}>{diff}</span>
                <div className="bar-container">
                  <div 
                    className={`bar ${diff}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Student Lists */}
      <div className="students-grid">
        {/* Students Who Improved */}
        <div className="section-card improved-section">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            Improved
          </h2>
          {summary.students_improved.length === 0 ? (
            <p className="empty-message">No students improved this session</p>
          ) : (
            <div className="student-list">
              {summary.students_improved.map((s) => (
                <Link 
                  key={s.student_id}
                  to={`/student/${s.student_id}`}
                  className="student-summary-item improved"
                >
                  <span className="student-name">{s.student_name}</span>
                  <span className="confidence-change positive">
                    +{s.confidence_change.toFixed(1)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Students Needing Attention */}
        <div className="section-card attention-section">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Needs Attention
          </h2>
          {summary.students_need_attention.length === 0 ? (
            <p className="empty-message">All students are doing well!</p>
          ) : (
            <div className="student-list">
              {summary.students_need_attention.map((s) => (
                <Link 
                  key={s.student_id}
                  to={`/student/${s.student_id}`}
                  className="student-summary-item attention"
                >
                  <span className="student-name">{s.student_name}</span>
                  {s.times_called === 0 ? (
                    <span className="not-called">Not called</span>
                  ) : (
                    <span className="confidence-change negative">
                      {s.confidence_change.toFixed(1)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* All Students */}
      <div className="section-card full-width">
        <h2>All Student Performance</h2>
        <div className="all-students-table">
          <div className="table-header">
            <span>Student</span>
            <span>Times Called</span>
            <span>Avg Rating</span>
            <span>Change</span>
            <span>Homework</span>
          </div>
          {summary.all_student_summaries.map((s) => {
            const getHomeworkLevel = () => {
              if (s.times_called === 0) return null
              if (s.average_rating < 2.5) return 'easy'
              if (s.average_rating < 4) return 'medium'
              return 'hard'
            }
            const homeworkLevel = getHomeworkLevel()
            
            return (
              <Link 
                key={s.student_id}
                to={`/student/${s.student_id}`}
                className="table-row"
              >
                <span className="student-name">{s.student_name}</span>
                <span>{s.times_called}</span>
                <span>
                  {s.times_called > 0 ? (
                    <StarRating value={Math.round(s.average_rating)} readonly size="small" />
                  ) : (
                    '-'
                  )}
                </span>
                <span className={`confidence-change ${s.confidence_change > 0 ? 'positive' : s.confidence_change < 0 ? 'negative' : ''}`}>
                  {s.confidence_change > 0 ? '+' : ''}{s.confidence_change.toFixed(1)}
                </span>
                <span>
                  {homeworkLevel ? (
                    <span className={`badge badge-${homeworkLevel} homework-badge`}>
                      {homeworkLevel === 'easy' ? 'Easy' : homeworkLevel === 'medium' ? 'Medium' : 'Hard'}
                    </span>
                  ) : (
                    '-'
                  )}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ClassSummary
