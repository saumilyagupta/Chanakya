import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { classesApi, questionsApi, sessionsApi } from '../api/client'
import './QuestionSetup.css'

function QuestionSetup() {
  const { classId } = useParams()
  const navigate = useNavigate()
  
  const [classInfo, setClassInfo] = useState(null)
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState({ easy: [], medium: [], hard: [] })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  
  // Question generation counts
  const [questionCounts, setQuestionCounts] = useState({ easy: 3, medium: 3, hard: 3 })
  
  // Add question form
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState('medium')
  
  useEffect(() => {
    loadClassInfo()
  }, [classId])
  
  const loadClassInfo = async () => {
    try {
      const data = await classesApi.get(classId)
      setClassInfo(data)
    } catch (error) {
      console.error('Failed to load class:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadQuestionsForTopic = async (topicName) => {
    try {
      const data = await questionsApi.getByTopic(topicName)
      setQuestions(data)
    } catch (error) {
      console.error('Failed to load questions:', error)
      setQuestions({ easy: [], medium: [], hard: [] })
    }
  }
  
  const updateQuestionCount = (difficulty, delta) => {
    setQuestionCounts(prev => ({
      ...prev,
      [difficulty]: Math.max(0, Math.min(10, prev[difficulty] + delta))
    }))
  }
  
  const handleGenerateQuestions = async () => {
    if (!topic.trim() || !classInfo) return
    
    setGenerating(true)
    try {
      const data = await questionsApi.generate({
        topic: topic.trim(),
        subject: classInfo.subject,
        easy_count: questionCounts.easy,
        medium_count: questionCounts.medium,
        hard_count: questionCounts.hard
      })
      setQuestions(data)
    } catch (error) {
      console.error('Failed to generate questions:', error)
      // Still try to load any existing questions
      await loadQuestionsForTopic(topic.trim())
    } finally {
      setGenerating(false)
    }
  }
  
  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!newQuestionText.trim() || !topic.trim()) return
    
    try {
      const newQuestion = await questionsApi.create({
        topic: topic.trim(),
        difficulty: newQuestionDifficulty,
        text: newQuestionText.trim()
      })
      
      setQuestions(prev => ({
        ...prev,
        [newQuestionDifficulty]: [...prev[newQuestionDifficulty], newQuestion]
      }))
      
      setNewQuestionText('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add question:', error)
    }
  }
  
  const handleUpdateQuestion = async (e) => {
    e.preventDefault()
    if (!editingQuestion || !newQuestionText.trim()) return
    
    try {
      const updated = await questionsApi.update(editingQuestion.id, {
        topic: topic.trim(),
        difficulty: newQuestionDifficulty,
        text: newQuestionText.trim()
      })
      
      // Remove from old difficulty, add to new
      setQuestions(prev => {
        const newQuestions = { ...prev }
        Object.keys(newQuestions).forEach(diff => {
          newQuestions[diff] = newQuestions[diff].filter(q => q.id !== editingQuestion.id)
        })
        newQuestions[updated.difficulty] = [...newQuestions[updated.difficulty], updated]
        return newQuestions
      })
      
      resetForm()
    } catch (error) {
      console.error('Failed to update question:', error)
    }
  }
  
  const handleDeleteQuestion = async (questionId, difficulty) => {
    try {
      await questionsApi.delete(questionId)
      setQuestions(prev => ({
        ...prev,
        [difficulty]: prev[difficulty].filter(q => q.id !== questionId)
      }))
    } catch (error) {
      console.error('Failed to delete question:', error)
    }
  }
  
  const startEditQuestion = (question) => {
    setEditingQuestion(question)
    setNewQuestionText(question.text)
    setNewQuestionDifficulty(question.difficulty)
    setShowAddForm(true)
  }
  
  const resetForm = () => {
    setNewQuestionText('')
    setNewQuestionDifficulty('medium')
    setEditingQuestion(null)
    setShowAddForm(false)
  }
  
  const handleStartClass = async () => {
    if (!topic.trim()) return
    
    const totalQuestions = questions.easy.length + questions.medium.length + questions.hard.length
    if (totalQuestions === 0) {
      alert('Please add at least one question before starting the class')
      return
    }
    
    try {
      const session = await sessionsApi.start({
        class_id: parseInt(classId),
        topic: topic.trim()
      })
      navigate(`/session/${session.id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }
  
  const getTotalQuestions = () => {
    return questions.easy.length + questions.medium.length + questions.hard.length
  }
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading class...</p>
      </div>
    )
  }
  
  if (!classInfo) {
    return (
      <div className="error-container">
        <h2>Class not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="question-setup">
      <div className="page-header">
        <button className="btn btn-secondary back-btn" onClick={() => navigate('/setup')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </button>
        <div>
          <h1>Question Setup</h1>
          <p>{classInfo.name} • {classInfo.subject}</p>
        </div>
      </div>
      
      {/* Topic Input */}
      <div className="topic-section card">
        <h2>Today's Topic</h2>
        <div className="topic-input-group">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Rotational Motion, Photosynthesis, Fractions..."
            className="topic-input"
          />
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleGenerateQuestions}
            disabled={!topic.trim() || generating}
          >
            {generating ? (
              <>
                <span className="spinner small white"></span>
                Generating...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                Generate Questions
              </>
            )}
          </button>
        </div>
        
        {/* Question Count Controls */}
        <div className="question-count-controls">
          <span className="controls-label">Questions to generate:</span>
          <div className="count-controls-group">
            {['easy', 'medium', 'hard'].map((diff) => (
              <div key={diff} className={`count-control ${diff}`}>
                <span className={`badge badge-${diff}`}>{diff}</span>
                <div className="count-adjuster">
                  <button 
                    type="button"
                    className="count-btn"
                    onClick={() => updateQuestionCount(diff, -1)}
                    disabled={questionCounts[diff] <= 0}
                  >
                    −
                  </button>
                  <span className="count-value">{questionCounts[diff]}</span>
                  <button 
                    type="button"
                    className="count-btn"
                    onClick={() => updateQuestionCount(diff, 1)}
                    disabled={questionCounts[diff] >= 10}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <span className="total-label">Total: {questionCounts.easy + questionCounts.medium + questionCounts.hard}</span>
        </div>
      </div>
      
      {/* Questions Lists */}
      {topic && (
        <div className="questions-section fade-in">
          <div className="questions-header">
            <h2>Questions for: {topic}</h2>
            <div className="questions-meta">
              <span className="question-count">{getTotalQuestions()} questions</span>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Question
              </button>
            </div>
          </div>
          
          {showAddForm && (
            <form 
              className="add-question-form card fade-in"
              onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
            >
              <h3>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
              
              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Enter your question..."
                  rows={3}
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Difficulty</label>
                <div className="difficulty-buttons">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      className={`diff-btn ${newQuestionDifficulty === diff ? 'active' : ''} ${diff}`}
                      onClick={() => setNewQuestionDifficulty(diff)}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingQuestion ? 'Update' : 'Add Question'}
                </button>
              </div>
            </form>
          )}
          
          <div className="questions-grid">
            {['easy', 'medium', 'hard'].map((difficulty) => (
              <div key={difficulty} className={`questions-column ${difficulty}`}>
                <div className="column-header">
                  <span className={`badge badge-${difficulty}`}>{difficulty}</span>
                  <span className="count">{questions[difficulty].length}</span>
                </div>
                
                <div className="questions-list">
                  {questions[difficulty].length === 0 ? (
                    <div className="empty-column">
                      <p>No {difficulty} questions</p>
                    </div>
                  ) : (
                    questions[difficulty].map((q) => (
                      <div key={q.id} className="question-item">
                        <p>{q.text}</p>
                        <div className="question-actions">
                          <button 
                            className="action-btn"
                            onClick={() => startEditQuestion(q)}
                            title="Edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteQuestion(q.id, difficulty)}
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Start Class Button */}
          <div className="start-class-section">
            <button 
              className="btn btn-accent btn-lg start-btn"
              onClick={handleStartClass}
              disabled={getTotalQuestions() === 0}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Class Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionSetup
