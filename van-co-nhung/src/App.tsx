import { Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import TeacherClassesPage from './pages/teacher/TeacherClassesPage'
import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherOverviewPage from './pages/teacher/TeacherOverviewPage'
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<TeacherLayout />}>
          <Route index element={<TeacherOverviewPage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="classes" element={<TeacherClassesPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" closeButton duration={5000} theme="light" richColors />
    </>
  )
}

export default App
