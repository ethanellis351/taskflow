const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const STATUSES = ['todo', 'in progress', 'done'];

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

async function getRole(projectId, userId) {
    const result = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
    );
    return result.rows[0] ? result.rows[0].role : null;
}

// Create a project (the creator becomes its owner)
router.post('/', async (req, res) => {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const created = await client.query(
            'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
            [name.trim(), description || null, req.userId]
        );
        const project = created.rows[0];
        await client.query(
            "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')",
            [project.id, req.userId]
        );
        await client.query('COMMIT');
        res.status(201).json({ project });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// List the current user's projects
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, pm.role
             FROM projects p
             JOIN project_members pm ON pm.project_id = p.id
             WHERE pm.user_id = $1
             ORDER BY p.created_at DESC`,
            [req.userId]
        );
        res.json({ projects: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get one project with its members and tasks
router.get('/:id', async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ error: 'Invalid project ID' });

    try {
        const role = await getRole(projectId, req.userId);
        if (!role) return res.status(404).json({ error: 'Project not found' });

        const [project, members, tasks] = await Promise.all([
            pool.query('SELECT * FROM projects WHERE id = $1', [projectId]),
            pool.query(
                `SELECT u.id, u.name, u.email, pm.role
                 FROM project_members pm
                 JOIN users u ON u.id = pm.user_id
                 WHERE pm.project_id = $1`,
                [projectId]
            ),
            pool.query(
                'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at',
                [projectId]
            ),
        ]);

        res.json({
            project: project.rows[0],
            members: members.rows,
            tasks: tasks.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a member by email (owner only)
router.post('/:id/members', async (req, res) => {
    const projectId = parseId(req.params.id);
    const { email } = req.body;
    if(!projectId || !email) {
        return res.status(400).json({ error: 'Project ID and member email are required' });
    }

    try {
        const role = await getRole(projectId, req.userId);
        if (!role) return res.status(404).json({ error: 'Project not found' });
        if (role !== 'owner') {
            return res.status(403).json({ error: 'Only the project owner can add members' });
        }

        const found = await pool.query(
            'SELECT id, name, email FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        const user = found.rows[0];
        if (!user) return res.status(404).json({ error: 'NO user with that email' });

        await pool.query(
            'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)',
            [projectId, user.id]
        );
        res.status(201).json({ member: user });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'That user is already a member' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a task in a project
router.post('/:id/tasks', async (req, res) => {
    const projectId = parseId(req.params.id);
    const { title, description, status, assignee_id, due_date } = req.body;
    if (!projectId || !title || !title.trim()) {
        return res.status(400).json({ error: 'Project ID and task title are required' });
    }
    if (status && !STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const role = await getRole(projectId, req.userId);
        if (!role) return res.status(404).json({ error: 'Project not found' });

        if (assignee_id) {
            const assigneeRole = await getRole(projectId, assignee_id);
            if (!assigneeRole) {
                return res.status(400).json({ error: 'Assignee must be a project member' });
            }
        }

        const result = await pool.query(
            `INSERT INTO tasks (project_id, title, description, status, assignee_id, due_date)
             VALUES ($1, $2, $3, COALESCE($4, 'todo'), $5, $6)
             RETURNING *`,
            [
                projectId,
                title.trim(),
                description || null,
                status || null,
                assignee_id || null,
                due_date || null,
            ]
        );
        res.status(201).json({ task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a project (owner only)
router.delete('/:id', async (req, res) => {
  const projectId = parseId(req.params.id);
  if (!projectId) return res.status(400).json({ error: 'Invalid project id.' });

  try {
    const role = await getRole(projectId, req.userId);
    if (!role) return res.status(404).json({ error: 'Project not found.' });
    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only the project owner can delete a project.' });
    }

    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;