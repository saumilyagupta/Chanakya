const API_BASE = '/api'

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP error ${response.status}`)
  }
  return response.json()
}

// Classes API
export const classesApi = {
  getAll: () => 
    fetch(`${API_BASE}/classes`).then(handleResponse),
  
  get: (id) => 
    fetch(`${API_BASE}/classes/${id}`).then(handleResponse),
  
  create: (data) => 
    fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  update: (id, data) => 
    fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  delete: (id) => 
    fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' }).then(handleResponse)
}

// Students API
export const studentsApi = {
  getByClass: (classId) => 
    fetch(`${API_BASE}/students/class/${classId}`).then(handleResponse),
  
  get: (id) => 
    fetch(`${API_BASE}/students/${id}`).then(handleResponse),
  
  getProfile: (id) => 
    fetch(`${API_BASE}/students/${id}/profile`).then(handleResponse),
  
  create: (classId, data) => 
    fetch(`${API_BASE}/students/class/${classId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  createBulk: (classId, students) => 
    fetch(`${API_BASE}/students/class/${classId}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students })
    }).then(handleResponse),
  
  update: (id, data) => 
    fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  delete: (id) => 
    fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' }).then(handleResponse)
}

// Questions API
export const questionsApi = {
  getByTopic: (topic) => 
    fetch(`${API_BASE}/questions/topic/${encodeURIComponent(topic)}`).then(handleResponse),
  
  getTopics: () => 
    fetch(`${API_BASE}/questions/topics`).then(handleResponse),
  
  generate: (data) => 
    fetch(`${API_BASE}/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  create: (data) => 
    fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  createBulk: (questions) => 
    fetch(`${API_BASE}/questions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions })
    }).then(handleResponse),
  
  update: (id, data) => 
    fetch(`${API_BASE}/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  delete: (id) => 
    fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' }).then(handleResponse)
}

// Sessions API
export const sessionsApi = {
  get: (id) => 
    fetch(`${API_BASE}/sessions/${id}`).then(handleResponse),
  
  getActive: (classId) => 
    fetch(`${API_BASE}/sessions/active/${classId}`).then(handleResponse),
  
  start: (data) => 
    fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  getNext: (sessionId) => 
    fetch(`${API_BASE}/sessions/${sessionId}/next`).then(handleResponse),
  
  respond: (sessionId, data) => 
    fetch(`${API_BASE}/sessions/${sessionId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  skip: (sessionId, studentId) => 
    fetch(`${API_BASE}/sessions/${sessionId}/skip?student_id=${studentId}`, {
      method: 'POST'
    }).then(handleResponse),
  
  end: (sessionId) => 
    fetch(`${API_BASE}/sessions/${sessionId}/end`, {
      method: 'POST'
    }).then(handleResponse)
}

// Analytics API
export const analyticsApi = {
  getSessionSummary: (sessionId) => 
    fetch(`${API_BASE}/analytics/session/${sessionId}/summary`).then(handleResponse),
  
  getClassDashboard: (classId) => 
    fetch(`${API_BASE}/analytics/class/${classId}/dashboard`).then(handleResponse),
  
  getClassHistory: (classId, limit = 10) => 
    fetch(`${API_BASE}/analytics/class/${classId}/history?limit=${limit}`).then(handleResponse),
  
  getStudentProgress: (studentId) => 
    fetch(`${API_BASE}/analytics/student/${studentId}/progress`).then(handleResponse)
}
