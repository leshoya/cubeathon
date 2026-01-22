// TrueAxis Bowling - Score Tracker App

const API_URL = 'http://localhost:3000/api';

// Auth state
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let games = [];

// API helper
async function api(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Screen Navigation
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Update displays when showing certain screens
    if (screenId === 'mainScreen') {
        loadGames();
    } else if (screenId === 'inputScreen') {
        resetInputForm();
    } else if (screenId === 'historyScreen') {
        displayHistoryList();
    } else if (screenId === 'statsScreen') {
        loadStats();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    if (authToken) {
        checkAuth();
    }

    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item:not(.center-btn)');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
});

// Check if auth token is valid
async function checkAuth() {
    try {
        currentUser = await api('/me');
        updateUserDisplay();
    } catch (error) {
        logout();
    }
}

// Update user display
function updateUserDisplay() {
    const usernameEl = document.getElementById('displayUsername');
    if (usernameEl && currentUser) {
        usernameEl.textContent = currentUser.username;
    }
}

// Register
async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const errorEl = document.getElementById('regError');

    errorEl.textContent = '';

    if (!username || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }

    try {
        const data = await api('/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = data.token;
        currentUser = { id: data.userId, username: data.username };
        localStorage.setItem('authToken', authToken);

        updateUserDisplay();
        showScreen('mainScreen');
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

// Login
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    errorEl.textContent = '';

    if (!username || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }

    try {
        const data = await api('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = data.token;
        currentUser = { id: data.userId, username: data.username };
        localStorage.setItem('authToken', authToken);

        updateUserDisplay();
        showScreen('mainScreen');
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

// Logout
async function logout() {
    try {
        if (authToken) {
            await api('/logout', { method: 'POST' });
        }
    } catch (error) {
        // Ignore errors
    }

    authToken = null;
    currentUser = null;
    games = [];
    localStorage.removeItem('authToken');
    showScreen('welcomeScreen');
}

// Load games from API
async function loadGames() {
    try {
        games = await api('/games');
        updateMainStats();
        displayRecentGames();
    } catch (error) {
        console.error('Failed to load games:', error);
    }
}

// Load stats from API
async function loadStats() {
    try {
        const stats = await api('/stats');
        document.getElementById('statsAvg').textContent = stats.avgScore ?? '--';
        document.getElementById('statsHigh').textContent = stats.highScore ?? '--';
        document.getElementById('statsLow').textContent = stats.lowScore ?? '--';
        document.getElementById('statsStrikes').textContent = stats.totalStrikes;
        document.getElementById('statsSpares').textContent = stats.totalSpares;
        document.getElementById('statsGames').textContent = stats.totalGames;
        updateDistributionBars(stats.distribution);
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Save a new game
async function saveGame() {
    const dateInput = document.getElementById('gameDate');
    const locationInput = document.getElementById('gameLocation');
    const scoreInput = document.getElementById('finalScore');
    const strikesInput = document.getElementById('strikes');
    const sparesInput = document.getElementById('spares');
    const notesInput = document.getElementById('gameNotes');

    const score = parseInt(scoreInput.value);

    if (isNaN(score) || score < 0 || score > 300) {
        alert('Please enter a valid score between 0 and 300');
        return;
    }

    try {
        await api('/games', {
            method: 'POST',
            body: JSON.stringify({
                date: dateInput.value || new Date().toISOString().split('T')[0],
                location: locationInput.value.trim(),
                score: score,
                strikes: parseInt(strikesInput.value) || 0,
                spares: parseInt(sparesInput.value) || 0,
                notes: notesInput.value.trim()
            })
        });

        showScreen('mainScreen');
    } catch (error) {
        alert('Failed to save game: ' + error.message);
    }
}

// Reset input form
function resetInputForm() {
    const dateInput = document.getElementById('gameDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    document.getElementById('gameLocation').value = '';
    document.getElementById('finalScore').value = '';
    document.getElementById('strikes').value = '';
    document.getElementById('spares').value = '';
    document.getElementById('gameNotes').value = '';
}

// Update main screen stats
function updateMainStats() {
    const avgScoreEl = document.getElementById('avgScore');
    const highScoreEl = document.getElementById('highScore');
    const totalGamesEl = document.getElementById('totalGames');

    if (games.length === 0) {
        avgScoreEl.textContent = '--';
        highScoreEl.textContent = '--';
        totalGamesEl.textContent = '0';
        return;
    }

    const scores = games.map(g => g.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const high = Math.max(...scores);

    avgScoreEl.textContent = avg;
    highScoreEl.textContent = high;
    totalGamesEl.textContent = games.length;
}

// Display recent games on main screen
function displayRecentGames() {
    const container = document.getElementById('recentGames');

    if (games.length === 0) {
        container.innerHTML = '';
        container.appendChild(createEmptyState());
        return;
    }

    const recentGames = games.slice(0, 5);
    container.innerHTML = recentGames.map(game => createGameCard(game)).join('');
}

// Create empty state element
function createEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = `
        <i class="fas fa-bowling-ball"></i>
        <p>No games recorded yet</p>
        <span>Tap + to add your first game</span>
    `;
    return div;
}

// Create game card HTML
function createGameCard(game) {
    const date = new Date(game.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    return `
        <div class="session-item" onclick="viewGameDetails('${game.id}')">
            <div class="session-icon">
                <i class="fas fa-bowling-ball"></i>
            </div>
            <div class="session-info">
                <h4>${game.location || 'Game'}</h4>
                <p>${formattedDate} - ${game.strikes}X ${game.spares}/</p>
            </div>
            <div class="session-score">
                <span class="score">${game.score}</span>
                <span class="score-label">Score</span>
            </div>
        </div>
    `;
}

// Display history list
function displayHistoryList() {
    const container = document.getElementById('historyList');

    if (games.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bowling-ball"></i>
                <p>No games recorded yet</p>
                <span>Add your first game to see it here</span>
            </div>
        `;
        return;
    }

    container.innerHTML = games.map(game => createGameCard(game)).join('');
}

// Update distribution bars
function updateDistributionBars(distribution) {
    const maxCount = Math.max(...distribution, 1);

    for (let i = 0; i < 5; i++) {
        const fill = document.getElementById(`dist${i}`);
        if (fill) {
            const percentage = (distribution[i] / maxCount) * 100;
            fill.style.height = `${percentage}%`;
        }
    }
}

// View game details
function viewGameDetails(gameId) {
    const game = games.find(g => g.id === gameId);
    if (game) {
        const details = `
Score: ${game.score}
Date: ${game.date}
Location: ${game.location || 'Not specified'}
Strikes: ${game.strikes}
Spares: ${game.spares}
Notes: ${game.notes || 'None'}
        `.trim();
        alert(details);
    }
}

// Clear all games
async function clearAllGames() {
    if (confirm('Are you sure you want to delete all game data? This cannot be undone.')) {
        try {
            await api('/games', { method: 'DELETE' });
            games = [];
            updateMainStats();
            displayRecentGames();
        } catch (error) {
            alert('Failed to clear games: ' + error.message);
        }
    }
}

// Export data
function exportData() {
    if (games.length === 0) {
        alert('No data to export');
        return;
    }

    const dataStr = JSON.stringify(games, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `trueaxis-bowling-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Utility function for haptic feedback
function triggerHaptic() {
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

// Add click feedback to buttons
document.addEventListener('click', (e) => {
    if (e.target.matches('button, .session-item, .setting-item')) {
        triggerHaptic();
    }
});

// Export functions for global use
window.showScreen = showScreen;
window.saveGame = saveGame;
window.clearAllGames = clearAllGames;
window.exportData = exportData;
window.viewGameDetails = viewGameDetails;
window.login = login;
window.register = register;
window.logout = logout;
