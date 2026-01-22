// TrueAxis Bowling - Score Tracker App

// Game data storage
let games = JSON.parse(localStorage.getItem('bowlingGames')) || [];

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
        updateMainStats();
        displayRecentGames();
    } else if (screenId === 'inputScreen') {
        resetInputForm();
    } else if (screenId === 'historyScreen') {
        displayHistoryList();
    } else if (screenId === 'statsScreen') {
        updateStatsScreen();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const dateInput = document.getElementById('gameDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Load saved games and update displays
    updateMainStats();
    displayRecentGames();

    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item:not(.center-btn)');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Initialize welcome animation
    initWelcomeAnimation();
});

// Save a new game
function saveGame() {
    const dateInput = document.getElementById('gameDate');
    const locationInput = document.getElementById('gameLocation');
    const scoreInput = document.getElementById('finalScore');
    const strikesInput = document.getElementById('strikes');
    const sparesInput = document.getElementById('spares');
    const notesInput = document.getElementById('gameNotes');

    const score = parseInt(scoreInput.value);

    // Validate score
    if (isNaN(score) || score < 0 || score > 300) {
        alert('Please enter a valid score between 0 and 300');
        return;
    }

    const game = {
        id: Date.now(),
        date: dateInput.value || new Date().toISOString().split('T')[0],
        location: locationInput.value.trim(),
        score: score,
        strikes: parseInt(strikesInput.value) || 0,
        spares: parseInt(sparesInput.value) || 0,
        notes: notesInput.value.trim()
    };

    games.unshift(game); // Add to beginning of array
    saveGamesToStorage();

    showScreen('mainScreen');
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

// Save games to localStorage
function saveGamesToStorage() {
    localStorage.setItem('bowlingGames', JSON.stringify(games));
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
    const emptyState = document.getElementById('emptyState');

    if (games.length === 0) {
        container.innerHTML = '';
        container.appendChild(createEmptyState());
        return;
    }

    const recentGames = games.slice(0, 5); // Show only 5 most recent
    container.innerHTML = recentGames.map(game => createGameCard(game)).join('');
}

// Create empty state element
function createEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.id = 'emptyState';
    div.innerHTML = `
        <i class="fas fa-bowling-ball"></i>
        <p>No games recorded yet</p>
        <span>Tap the + button to add your first game</span>
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
        <div class="session-item" onclick="viewGameDetails(${game.id})">
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

// Update stats screen
function updateStatsScreen() {
    if (games.length === 0) {
        document.getElementById('statsAvg').textContent = '--';
        document.getElementById('statsHigh').textContent = '--';
        document.getElementById('statsLow').textContent = '--';
        document.getElementById('statsStrikes').textContent = '0';
        document.getElementById('statsSpares').textContent = '0';
        document.getElementById('statsGames').textContent = '0';
        updateDistributionBars([0, 0, 0, 0, 0]);
        return;
    }

    const scores = games.map(g => g.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const high = Math.max(...scores);
    const low = Math.min(...scores);
    const totalStrikes = games.reduce((sum, g) => sum + g.strikes, 0);
    const totalSpares = games.reduce((sum, g) => sum + g.spares, 0);

    document.getElementById('statsAvg').textContent = avg;
    document.getElementById('statsHigh').textContent = high;
    document.getElementById('statsLow').textContent = low;
    document.getElementById('statsStrikes').textContent = totalStrikes;
    document.getElementById('statsSpares').textContent = totalSpares;
    document.getElementById('statsGames').textContent = games.length;

    // Calculate score distribution
    const distribution = [0, 0, 0, 0, 0];
    games.forEach(game => {
        if (game.score <= 100) distribution[0]++;
        else if (game.score <= 150) distribution[1]++;
        else if (game.score <= 200) distribution[2]++;
        else if (game.score <= 250) distribution[3]++;
        else distribution[4]++;
    });

    updateDistributionBars(distribution);
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

// View game details (placeholder for future feature)
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
function clearAllGames() {
    if (confirm('Are you sure you want to delete all game data? This cannot be undone.')) {
        games = [];
        saveGamesToStorage();
        updateMainStats();
        displayRecentGames();
        showScreen('mainScreen');
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
    a.download = `bowling-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Welcome screen animation
function initWelcomeAnimation() {
    // Logo animation handled by CSS
}

// Utility function for haptic feedback (for mobile devices)
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

// Export functions for external use
window.showScreen = showScreen;
window.saveGame = saveGame;
window.clearAllGames = clearAllGames;
window.exportData = exportData;
window.viewGameDetails = viewGameDetails;
