import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import AuthPage from './AuthPage';

function Home() {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: 600, margin: '4rem auto' }}>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/" element={<Protected><Home /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}