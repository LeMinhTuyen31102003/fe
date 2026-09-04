import { Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import { useTheme } from './hooks/useTheme'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage'
import TeacherClassesPage from './pages/teacher/TeacherClassesPage'
import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherOverviewPage from './pages/teacher/TeacherOverviewPage'
import TeacherSettingsPage from './pages/teacher/TeacherSettingsPage'
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage'
import TeacherTuitionPage from './pages/teacher/TeacherTuitionPage'
import StudentClassPage from './pages/student/StudentClassPage'
import StudentHomePage from './pages/student/StudentHomePage'
import StudentLayout from './pages/student/StudentLayout'
import StudentSchedulePage from './pages/student/StudentSchedulePage'

function App() {
  const { theme } = useTheme()

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<TeacherLayout />}>
          <Route index element={<TeacherOverviewPage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="classes" element={<TeacherClassesPage />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="tuition" element={<TeacherTuitionPage />} />
          <Route path="settings" element={<TeacherSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentHomePage />} />
          <Route path="schedule" element={<StudentSchedulePage />} />
          <Route path="class" element={<StudentClassPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" closeButton duration={5000} theme={theme} richColors />
    </>
  )
}

export default App
