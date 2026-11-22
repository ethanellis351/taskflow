import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/projects')
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/projects', { method: 'POST', body: { name } });
      setProjects([{ ...data.project, role: 'owner' }, ...projects]);
      setName('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.name}" and all of its tasks? This cannot be undone.`)) {
      return;
    }
    setError('');
    try {
      await api(`/projects/${project.id}`, { method: 'DELETE' });
      setProjects(projects.filter((p) => p.id !== project.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '3rem auto', padding: '0 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Your projects</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>{user.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
          required
          style={{ flex: 1 }}
        />
        <button type="submit">Create</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && projects.length === 0 && <p>No projects yet. Create your first one above.</p>}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
        {projects.map((p) => (
          <li key={p.id} style={{ border: '1px solid #888', borderRadius: 6, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to={`/projects/${p.id}`} style={{ flex: 1 }}>{p.name}</Link>
            <span style={{ opacity: 0.7 }}>{p.role}</span>
            {p.role === 'owner' && <button onClick={() => handleDelete(p)}>Delete</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}