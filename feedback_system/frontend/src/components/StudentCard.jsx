import { Link } from 'react-router-dom'
import StarRating from './StarRating'
import './StudentCard.css'

function StudentCard({ student, onUpdate, onDelete, showActions = true }) {
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

  return (
    <div className="student-card">
      <div className="student-avatar" style={{ backgroundColor: getAvatarColor(student.name) }}>
        {getInitials(student.name)}
      </div>
      
      <div className="student-info">
        <Link to={`/student/${student.id}`} className="student-name">
          {student.name}
        </Link>
        
        <div className="student-meta">
          <span className={`badge ${getLevelBadgeClass(student.level)}`}>
            {student.level}
          </span>
          <span className="confidence-label">
            Confidence: {student.confidence.toFixed(1)}
          </span>
        </div>
        
        <div className="student-confidence">
          <StarRating 
            value={Math.round(student.confidence)} 
            readonly 
            size="small" 
          />
        </div>
      </div>
      
      {showActions && (
        <div className="student-actions">
          {onUpdate && (
            <button 
              className="btn-icon btn-secondary" 
              onClick={() => onUpdate(student)}
              title="Edit student"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          {onDelete && (
            <button 
              className="btn-icon btn-secondary" 
              onClick={() => onDelete(student.id)}
              title="Delete student"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentCard
