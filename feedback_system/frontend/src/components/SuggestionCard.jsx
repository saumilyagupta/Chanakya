import './SuggestionCard.css'

function SuggestionCard({ suggestion, onAsk, onSkip, loading = false }) {
  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'badge-easy'
      case 'hard': return 'badge-hard'
      default: return 'badge-medium'
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

  if (loading) {
    return (
      <div className="suggestion-card loading">
        <div className="suggestion-loading">
          <div className="spinner"></div>
          <p>Finding next student...</p>
        </div>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className="suggestion-card empty">
        <div className="suggestion-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 15h8"/>
            <circle cx="9" cy="9" r="1" fill="currentColor"/>
            <circle cx="15" cy="9" r="1" fill="currentColor"/>
          </svg>
          <p>All students have been called!</p>
          <span>Great participation in this session.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="suggestion-card scale-in">
      <div className="suggestion-header">
        <span className="suggestion-label">Ask Next</span>
        <span className={`badge badge-lg ${getDifficultyClass(suggestion.difficulty)}`}>
          {suggestion.difficulty}
        </span>
      </div>
      
      <div className="suggestion-student">
        <div 
          className="suggestion-avatar" 
          style={{ backgroundColor: getAvatarColor(suggestion.student_name) }}
        >
          {getInitials(suggestion.student_name)}
        </div>
        <div className="suggestion-name">{suggestion.student_name}</div>
      </div>
      
      {suggestion.question_text && (
        <div className="suggestion-question">
          <div className="question-label">Suggested Question</div>
          <div className="question-text">"{suggestion.question_text}"</div>
        </div>
      )}
      
      <div className="suggestion-reason">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        <span>{suggestion.reason}</span>
      </div>
      
      <div className="suggestion-actions">
        <button className="btn btn-secondary btn-lg" onClick={onSkip}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 4l10 8-10 8V4z"/>
            <line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
          Skip
        </button>
        <button className="btn btn-primary btn-lg" onClick={onAsk}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Ask Question
        </button>
      </div>
    </div>
  )
}

export default SuggestionCard
