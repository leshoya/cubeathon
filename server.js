const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize database
const db = new Database('bowling.db');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT,
        score INTEGER NOT NULL,
        strikes INTEGER DEFAULT 0,
        spares INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

// Auth middleware
function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
    if (!session) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = session.user_id;
    next();
}

// ============ AUTH ROUTES ============

// Register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (username.length < 3 || password.length < 4) {
        return res.status(400).json({ error: 'Username must be 3+ chars, password 4+ chars' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(userId, username, hashedPassword);

    const token = uuidv4();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);

    res.json({ token, userId, username });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = uuidv4();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);

    res.json({ token, userId: user.id, username: user.username });
});

// Logout
app.post('/api/logout', authenticate, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.json({ success: true });
});

// Get current user
app.get('/api/me', authenticate, (req, res) => {
    const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(req.userId);
    res.json(user);
});

// ============ GAME ROUTES ============

// Get all games for user
app.get('/api/games', authenticate, (req, res) => {
    const games = db.prepare('SELECT * FROM games WHERE user_id = ? ORDER BY date DESC, created_at DESC').all(req.userId);
    res.json(games);
});

// Add new game
app.post('/api/games', authenticate, (req, res) => {
    const { date, location, score, strikes, spares, notes } = req.body;

    if (score === undefined || score < 0 || score > 300) {
        return res.status(400).json({ error: 'Valid score (0-300) required' });
    }

    const gameId = uuidv4();
    const gameDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
        INSERT INTO games (id, user_id, date, location, score, strikes, spares, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(gameId, req.userId, gameDate, location || '', score, strikes || 0, spares || 0, notes || '');

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    res.json(game);
});

// Get single game
app.get('/api/games/:id', authenticate, (req, res) => {
    const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
});

// Update game
app.put('/api/games/:id', authenticate, (req, res) => {
    const { date, location, score, strikes, spares, notes } = req.body;

    const existing = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
        return res.status(404).json({ error: 'Game not found' });
    }

    db.prepare(`
        UPDATE games SET date = ?, location = ?, score = ?, strikes = ?, spares = ?, notes = ?
        WHERE id = ? AND user_id = ?
    `).run(
        date || existing.date,
        location !== undefined ? location : existing.location,
        score !== undefined ? score : existing.score,
        strikes !== undefined ? strikes : existing.strikes,
        spares !== undefined ? spares : existing.spares,
        notes !== undefined ? notes : existing.notes,
        req.params.id,
        req.userId
    );

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    res.json(game);
});

// Delete game
app.delete('/api/games/:id', authenticate, (req, res) => {
    const result = db.prepare('DELETE FROM games WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ success: true });
});

// Delete all games for user
app.delete('/api/games', authenticate, (req, res) => {
    db.prepare('DELETE FROM games WHERE user_id = ?').run(req.userId);
    res.json({ success: true });
});

// ============ STATS ROUTE ============

app.get('/api/stats', authenticate, (req, res) => {
    const games = db.prepare('SELECT * FROM games WHERE user_id = ?').all(req.userId);

    if (games.length === 0) {
        return res.json({
            totalGames: 0,
            avgScore: null,
            highScore: null,
            lowScore: null,
            totalStrikes: 0,
            totalSpares: 0,
            distribution: [0, 0, 0, 0, 0]
        });
    }

    const scores = games.map(g => g.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highScore = Math.max(...scores);
    const lowScore = Math.min(...scores);
    const totalStrikes = games.reduce((sum, g) => sum + g.strikes, 0);
    const totalSpares = games.reduce((sum, g) => sum + g.spares, 0);

    const distribution = [0, 0, 0, 0, 0];
    games.forEach(game => {
        if (game.score <= 100) distribution[0]++;
        else if (game.score <= 150) distribution[1]++;
        else if (game.score <= 200) distribution[2]++;
        else if (game.score <= 250) distribution[3]++;
        else distribution[4]++;
    });

    res.json({
        totalGames: games.length,
        avgScore,
        highScore,
        lowScore,
        totalStrikes,
        totalSpares,
        distribution
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`TrueAxis Bowling server running at http://localhost:${PORT}`);
});
