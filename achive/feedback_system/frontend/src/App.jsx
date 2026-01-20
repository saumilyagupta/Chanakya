import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ColdStartSetup from './pages/ColdStartSetup'
import QuestionSetup from './pages/QuestionSetup'
import LiveSession from './pages/LiveSession'
import ClassSummary from './pages/ClassSummary'
import StudentProfile from './pages/StudentProfile'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/setup" replace />} />
          <Route path="setup" element={<ColdStartSetup />} />
          <Route path="questions/:classId" element={<QuestionSetup />} />
          <Route path="session/:sessionId" element={<LiveSession />} />
          <Route path="summary/:sessionId" element={<ClassSummary />} />
          <Route path="student/:studentId" element={<StudentProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
