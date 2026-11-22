const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const STATUSES = ['todo', 'in_progress', 'done'];

// Load a task only if the current user belongs to its project
async function loadTask(taskId, userId) {
    const result = await pool.query(
        `SELECT t.*
         FROM tasks t
         JOIN project_members pm ON pm.project_id = t.project_id
         WHERE t.id = $1 AND pm.user_id = $2`,
        [taskId, userId]
    );
    return result.rows[0] || null;
}

router.patch('/:id', async (req, res) => {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId < 1) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }

    const { title, description, status, assignee_id, due_date } = req.body;
    if (status !== undefined && !STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const task = await loadTask(taskId, req.userId);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        if (assignee_id) {
            const member = await pool.query(
                'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
                [task.project_id, assignee_id]
            );
            if (!member.rows[0]) {
                return res.status(400).json({ error: 'Assignee must be a member of the project' });
            }
        }

        const result = await pool.query(
            `UPDATE tasks
             SET title = $1, description = $2, status = $3, assignee_id = $4, due_date = $5,
              reminder_sent_at = CASE WHEN $5::date IS DISTINCT FROM due_date THEN NULL ELSE reminder_sent_at END
             WHERE id = $6
             RETURNING *`,
            [
                title !== undefined ? title : task.title,
                description !== undefined ? description : task.description,
                status !== undefined ? status : task.status,
                assignee_id !== undefined ? assignee_id : task.assignee_id,
                due_date !== undefined ? due_date : task.due_date,
                taskId,
            ]
        );
        res.json({ task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId < 1) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }

    try {
        const task = await loadTask(taskId, req.userId);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;