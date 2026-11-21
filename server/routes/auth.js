const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if(!name || !email || !password || password.length < 8) {
        return res.status(400).json({
            error: 'Name, email, and password (at least 8 characters) are required'
        });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email', [name, email.toLowerCase(), hash]
        );
        const user = result.rows[0];
        res.status(201).json({ user, token: signToken(user) });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'That email is already registered' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [
            email.toLowerCase(),
        ]);
        const user = result.rows[0];
        const valid = user && (await bcrypt.compare(password, user.password_hash));
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.json({
            user: { id: user.id, name: user.name, email: user.email },
            token: signToken(user),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [req.userId]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;