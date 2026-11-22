import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';

const COLUMNS = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

export default function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  useEffect(() => {
    api(`/projects/${id}`)
      .then((data) => {
        setProject(data.project);
        setMembers(data.members);
        setTasks(data.tasks);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const isOwner = project && project.owner_id === user.id;
  const nameOf = (userId) => members.find((m) => m.id === userId)?.name;

  async function addTask(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/projects/${id}/tasks`, {
        method: 'POST',
        body: {
          title,
          assignee_id: assigneeId ? Number(assigneeId) : null,
          due_date: dueDate || null,
        },
      });
      setTasks([...tasks, data.task]);
      setTitle('');
      setAssigneeId('');
      setDueDate('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function moveTask(task, status) {
    setError('');
    try {
      const data = await api(`/tasks/${task.id}`, { method: 'PATCH', body: { status } });
      setTasks(tasks.map((t) => (t.id === task.id ? data.task : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(task) {
    setError('');
    try {
      await api(`/tasks/${task.id}`, { method: 'DELETE' });
      setTasks(tasks.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function addMember(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/projects/${id}/members`, {
        method: 'POST',
        body: { email: memberEmail },
      });
      setMembers([...members, { ...data.member, role: 'member' }]);
      setMemberEmail('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!project) {
    return (
      <div style={{ maxWidth: 640, margin: '3rem auto' }}>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : <p>Loading...</p>}
        <Link to="/">Back to projects</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem' }}>
      <Link to="/">&larr; All projects</Link>
      <h1>{project.name}</h1>
      <p>Members: {members.map((m) => m.name).join(', ')}</p>

      {isOwner && (
        <form onSubmit={addMember} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="Add a member by email"
            required
          />
          <button type="submit">Add member</button>
        </form>
      )}

      <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task title" required />
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button type="submit">Add task</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {COLUMNS.map((col, colIndex) => (
          <section key={col.status} style={{ border: '1px solid #888', borderRadius: 6, padding: '0.75rem' }}>
            <h2 style={{ marginTop: 0 }}>{col.label}</h2>
            {tasks
              .filter((t) => t.status === col.status)
              .map((task) => (
                <div key={task.id} style={{ border: '1px solid #aaa', borderRadius: 4, padding: '0.5rem', marginBottom: '0.5rem' }}>
                  <strong>{task.title}</strong>
                  {task.assignee_id && <div>Assigned to {nameOf(task.assignee_id)}</div>}
                  {task.due_date && <div>Due {task.due_date.slice(0, 10)}</div>}
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {colIndex > 0 && (
                      <button onClick={() => moveTask(task, COLUMNS[colIndex - 1].status)}>&larr;</button>
                    )}
                    {colIndex < COLUMNS.length - 1 && (
                      <button onClick={() => moveTask(task, COLUMNS[colIndex + 1].status)}>&rarr;</button>
                    )}
                    <button onClick={() => deleteTask(task)} style={{ marginLeft: 'auto' }}>Delete</button>
                  </div>
                </div>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}