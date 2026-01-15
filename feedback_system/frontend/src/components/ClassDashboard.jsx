import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../api/client'
import StarRating from './StarRating'
import './ClassDashboard.css'

function ClassDashboard({ classId }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [sessionHistory, setSessionHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  useEffect(() => {
    if (classId) {
      loadDashboard()
    }
  }, [classId])
  
  const loadDashboard = async () => {
    setLoading(true)
    try {
      const data = await analyticsApi.getClassDashboard(classId)
      setDashboard(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadSessionHistory = async () => {
    if (sessionHistory.length > 0) {
      setShowAllSessions(!showAllSessions)
      return
    }
    
    setLoadingHistory(true)
    try {
      const data = await analyticsApi.getClassHistory(classId, 20)
      setSessionHistory(data.history || [])
      setShowAllSessions(true)
    } catch (error) {
      console.error('Failed to load session history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    )
  }
  
  if (!dashboard || !dashboard.has_data) {
    return (
      <div className="dashboard-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M18 17V9"/>
          <path d="M13 17V5"/>
          <path d="M8 17v-3"/>
        </svg>
        <p>No session data yet</p>
        <span>Start a class session to see statistics</span>
      </div>
    )
  }

  return (
    <div className="class-dashboard fade-in">
      {/* Quick Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-value">{dashboard.total_students}</span>
          <span className="stat-label">Students</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{dashboard.avg_confidence.toFixed(1)}</span>
          <span className="stat-label">Avg Confidence</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{dashboard.total_sessions}</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{dashboard.all_time_avg_rating.toFixed(1)}</span>
          <span className="stat-label">Avg Rating</span>
        </div>
      </div>
      
      {/* Level Distribution */}
      <div className="distribution-section">
        <h4>Student Levels</h4>
        <div className="level-bars">
          <div className="level-bar-row">
            <span className="level-label weak">Weak</span>
            <div className="level-bar-track">
              <div 
                className="level-bar-fill weak" 
                style={{ width: `${(dashboard.level_distribution.weak / dashboard.total_students) * 100}%` }}
              />
            </div>
            <span className="level-count">{dashboard.level_distribution.weak}</span>
          </div>
          <div className="level-bar-row">
            <span className="level-label medium">Medium</span>
            <div className="level-bar-track">
              <div 
                className="level-bar-fill medium" 
                style={{ width: `${(dashboard.level_distribution.medium / dashboard.total_students) * 100}%` }}
              />
            </div>
            <span className="level-count">{dashboard.level_distribution.medium}</span>
          </div>
          <div className="level-bar-row">
            <span className="level-label strong">Strong</span>
            <div className="level-bar-track">
              <div 
                className="level-bar-fill strong" 
                style={{ width: `${(dashboard.level_distribution.strong / dashboard.total_students) * 100}%` }}
              />
            </div>
            <span className="level-count">{dashboard.level_distribution.strong}</span>
          </div>
        </div>
      </div>
      
      {/* Improvement Section */}
      {dashboard.improvement && (
        <div className="improvement-section">
          <h4>Improvement from Last Session</h4>
          <div className="improvement-cards">
            <div className={`improvement-card ${dashboard.improvement.participation_improved ? 'positive' : 'negative'}`}>
              <div className="improvement-icon">
                {dashboard.improvement.participation_improved ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                    <polyline points="17 18 23 18 23 12"/>
                  </svg>
                )}
              </div>
              <div className="improvement-content">
                <span className="improvement-value">
                  {dashboard.improvement.participation_change > 0 ? '+' : ''}
                  {dashboard.improvement.participation_change}
                </span>
                <span className="improvement-label">Participation</span>
              </div>
            </div>
            
            <div className={`improvement-card ${dashboard.improvement.rating_improved ? 'positive' : 'negative'}`}>
              <div className="improvement-icon">
                {dashboard.improvement.rating_improved ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )}
              </div>
              <div className="improvement-content">
                <span className="improvement-value">
                  {dashboard.improvement.rating_change > 0 ? '+' : ''}
                  {dashboard.improvement.rating_change.toFixed(1)}
                </span>
                <span className="improvement-label">Avg Rating</span>
              </div>
            </div>
          </div>
          <p className="comparison-note">
            Compared to: {dashboard.improvement.previous_session.topic} 
            ({new Date(dashboard.improvement.previous_session.date).toLocaleDateString()})
          </p>
        </div>
      )}
      
      {/* Last Session */}
      {dashboard.last_session && (
        <div className="last-session-section">
          <div className="section-header">
            <h4>Last Session</h4>
            <button 
              className="see-more-btn"
              onClick={loadSessionHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? 'Loading...' : showAllSessions ? 'Hide History' : 'See All Sessions'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={showAllSessions ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
              </svg>
            </button>
          </div>
          <div className="last-session-card">
            <div className="session-topic">{dashboard.last_session.topic}</div>
            <div className="session-date">
              {new Date(dashboard.last_session.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div className="session-stats">
              <span>{dashboard.last_session.total_questions} questions</span>
              <span>{dashboard.last_session.participation}/{dashboard.total_students} participated</span>
              <span>
                <StarRating value={Math.round(dashboard.last_session.avg_rating)} readonly size="small" />
              </span>
            </div>
            <Link to={`/summary/${dashboard.last_session.session_id}`} className="view-summary-link">
              View Full Summary →
            </Link>
          </div>
          
          {/* Session History List */}
          {showAllSessions && sessionHistory.length > 0 && (
            <div className="session-history-list">
              <h5>All Sessions</h5>
              {sessionHistory.map((session) => (
                <div key={session.session_id} className="session-history-item">
                  <div className="session-history-main">
                    <div className="session-history-topic">{session.topic}</div>
                    <div className="session-history-date">
                      {new Date(session.started_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="session-history-stats">
                    <span className="stat-pill">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      {session.questions_asked} Q
                    </span>
                    <span className="stat-pill rating">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      {session.average_rating.toFixed(1)}
                    </span>
                    {session.is_active && (
                      <span className="stat-pill active">Active</span>
                    )}
                  </div>
                  <Link to={`/summary/${session.session_id}`} className="session-history-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Top Performers & Needs Attention */}
      <div className="highlights-grid">
        {dashboard.top_performers.length > 0 && (
          <div className="highlight-section">
            <h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Top Performers
            </h4>
            <div className="student-highlights">
              {dashboard.top_performers.map((s, index) => (
                <Link key={s.id} to={`/student/${s.id}`} className="highlight-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{s.name}</span>
                  <span className={`badge badge-${s.level === 'strong' ? 'strong' : s.level === 'medium' ? 'medium-level' : 'weak'}`}>
                    {s.confidence.toFixed(1)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {dashboard.needs_attention.length > 0 && (
          <div className="highlight-section attention">
            <h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Needs Attention
            </h4>
            <div className="student-highlights">
              {dashboard.needs_attention.slice(0, 3).map((s) => (
                <Link key={s.id} to={`/student/${s.id}`} className="highlight-item">
                  <span className="name">{s.name}</span>
                  <span className="attention-reason">
                    {s.consecutive_wrong >= 2 ? `${s.consecutive_wrong} wrong streak` : `Low: ${s.confidence.toFixed(1)}`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassDashboard
