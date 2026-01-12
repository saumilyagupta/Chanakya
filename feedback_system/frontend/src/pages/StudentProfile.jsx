import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentsApi, analyticsApi } from '../api/client'
import StarRating from '../components/StarRating'
import './StudentProfile.css'

function StudentProfile() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    loadData()
  }, [studentId])
  
  const loadData = async () => {
    try {
      const [profileData, progressData] = await Promise.all([
        studentsApi.getProfile(studentId),
        analyticsApi.getStudentProgress(studentId)
      ])
      setProfile(profileData)
      setProgress(progressData)
    } catch (error) {
      console.error('Failed to load student data:', error)
      setError('Student not found')
    } finally {
      setLoading(false)
    }
  }
  
  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'weak': return 'badge-weak'
      case 'strong': return 'badge-strong'
      default: return 'badge-medium-level'
    }
  }
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  const getAvatarColor = (name) => {
    const colors = [
      '#E57373', '#81C784', '#64B5F6', '#FFD54F', 
      '#BA68C8', '#4DB6AC', '#FF8A65', '#A1887F'
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }
  
  const getTrendIcon = (trend) => {
    if (trend > 0) {
      return (
        <svg className="trend-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      )
    } else if (trend < 0) {
      return (
        <svg className="trend-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
          <polyline points="17 18 23 18 23 12"/>
        </svg>
      )
    }
    return (
      <svg className="trend-stable" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    )
  }
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading student profile...</p>
      </div>
    )
  }
  
  if (error || !profile) {
    return (
      <div className="error-container">
        <h2>{error || 'Student not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>
          Go Back
        </button>
      </div>
    )
  }
  
  const student = profile.student

  return (
    <div className="student-profile">
      <div className="page-header">
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </button>
      </div>
      
      {/* Profile Header */}
      <div className="profile-header card">
        <div 
          className="profile-avatar"
          style={{ backgroundColor: getAvatarColor(student.name) }}
        >
          {getInitials(student.name)}
        </div>
        
        <div className="profile-info">
          <h1>{student.name}</h1>
          <div className="profile-meta">
            <span className={`badge badge-lg ${getLevelBadgeClass(student.level)}`}>
              {student.level}
            </span>
            <span className="confidence-display">
              <span className="confidence-label">Confidence:</span>
              <StarRating value={Math.round(student.confidence)} readonly size="small" />
              <span className="confidence-value">{student.confidence.toFixed(1)}</span>
            </span>
          </div>
        </div>
        
        <div className="profile-trend">
          {getTrendIcon(profile.improvement_trend)}
          <span className={profile.improvement_trend > 0 ? 'positive' : profile.improvement_trend < 0 ? 'negative' : ''}>
            {profile.improvement_trend > 0 ? 'Improving' : profile.improvement_trend < 0 ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{profile.total_responses}</span>
            <span className="stat-label">Total Responses</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon rating">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{profile.average_rating.toFixed(1)}</span>
            <span className="stat-label">Average Rating</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon participation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{profile.participation_rate.toFixed(0)}%</span>
            <span className="stat-label">Participation Rate</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon streak">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {student.consecutive_correct > 0 ? student.consecutive_correct : student.consecutive_wrong}
            </span>
            <span className="stat-label">
              {student.consecutive_correct > 0 ? 'Correct Streak' : 'Needs Help'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Topic Performance */}
      {student.topic_performance && Object.keys(student.topic_performance).length > 0 && (
        <div className="section-card">
          <h2>Topic Performance</h2>
          <div className="topics-grid">
            {Object.entries(student.topic_performance).map(([topic, score]) => (
              <div key={topic} className="topic-item">
                <span className="topic-name">{topic}</span>
                <div className="topic-score">
                  <StarRating value={Math.round(score)} readonly size="small" />
                  <span className="score-value">{score.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent History */}
      <div className="section-card">
        <h2>Recent Activity</h2>
        {profile.recent_history.length === 0 ? (
          <p className="empty-message">No recent activity</p>
        ) : (
          <div className="history-list">
            {profile.recent_history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-rating">
                  <StarRating value={item.rating} readonly size="small" />
                </div>
                <div className="history-info">
                  <span className={`badge badge-${item.difficulty}`}>
                    {item.difficulty}
                  </span>
                  <span className="history-date">
                    {item.answered_at 
                      ? new Date(item.answered_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Unknown date'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Progress Timeline */}
      {progress && progress.progress.length > 0 && (
        <div className="section-card">
          <h2>Progress Timeline</h2>
          <div className="timeline">
            {progress.progress.slice(-10).map((item, index) => (
              <div 
                key={index} 
                className={`timeline-point ${item.rating >= 4 ? 'good' : item.rating <= 2 ? 'poor' : 'average'}`}
              >
                <div className="timeline-marker">
                  <span className="rating-num">{item.rating}</span>
                </div>
                <span className="timeline-diff">{item.difficulty}</span>
              </div>
            ))}
          </div>
          <p className="timeline-note">Last {Math.min(10, progress.progress.length)} responses</p>
        </div>
      )}
    </div>
  )
}

export default StudentProfile
