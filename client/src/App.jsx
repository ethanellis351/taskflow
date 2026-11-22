import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import AuthPage from './AuthPage';
import ProjectsPage from './ProjectsPage';
import ProjectPage from './ProjectPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/" element={<Protected><ProjectsPage /></Protected>} />
          <Route path="/projects/:id" element={<Protected><ProjectPage /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}