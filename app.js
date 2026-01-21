// BowlGuide - Laser Bowling Assistant App

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
}

// Tag Selection
document.addEventListener('DOMContentLoaded', () => {
    // Quick tags interaction
    const tags = document.querySelectorAll('.quick-tags .tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
        });
    });

    // Shot type selection
    const shotTypes = document.querySelectorAll('.shot-type');
    shotTypes.forEach(type => {
        type.addEventListener('click', () => {
            shotTypes.forEach(t => t.classList.remove('active'));
            type.classList.add('active');
        });
    });

    // Toggle switches
    const toggles = document.querySelectorAll('.toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    });

    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item:not(.center-btn)');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Slider value updates
    const positionSlider = document.getElementById('positionSlider');
    const curveSlider = document.getElementById('curveSlider');

    if (positionSlider) {
        positionSlider.addEventListener('input', (e) => {
            updateLaserPosition(e.target.value);
        });
    }

    if (curveSlider) {
        curveSlider.addEventListener('input', (e) => {
            updateLaserCurve(e.target.value);
        });
    }

    // Activate laser button
    const activateBtn = document.querySelector('.activate-btn');
    if (activateBtn) {
        activateBtn.addEventListener('click', () => {
            activateBtn.classList.toggle('activated');
            if (activateBtn.classList.contains('activated')) {
                activateBtn.innerHTML = '<i class="fas fa-stop"></i><span>Deactivate Laser</span>';
                activateBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                activateLaser();
            } else {
                activateBtn.innerHTML = '<i class="fas fa-power-off"></i><span>Activate Laser</span>';
                activateBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                deactivateLaser();
            }
        });
    }

    // Initialize welcome animation
    initWelcomeAnimation();
});

// Update laser position based on slider
function updateLaserPosition(value) {
    const laserLine = document.querySelector('.laser-line');
    const targetPoint = document.querySelector('.target-point');

    if (laserLine && targetPoint) {
        // Calculate rotation angle based on position
        const angle = (value - 50) * 0.3;
        laserLine.style.transform = `translateX(-50%) rotate(${angle}deg)`;

        // Update target point position
        const offsetX = (value - 50) * 0.8;
        targetPoint.style.left = `calc(50% - 10px + ${offsetX}px)`;

        // Update angle display
        const angleValue = document.querySelector('.angle-value');
        if (angleValue) {
            angleValue.textContent = `${Math.abs(angle * 2).toFixed(1)}°`;
        }
    }
}

// Update laser curve intensity
function updateLaserCurve(value) {
    const laserLine = document.querySelector('.laser-line');

    if (laserLine) {
        // Adjust the visual appearance based on curve intensity
        const intensity = value / 100;
        const blur = 15 + (intensity * 20);
        laserLine.style.boxShadow = `0 0 ${blur}px #10b981, 0 0 ${blur * 2}px #10b981`;
    }
}

// Activate laser visual effects
function activateLaser() {
    const laserLine = document.querySelector('.laser-line');
    const targetPoint = document.querySelector('.target-point');
    const infoBadge = document.querySelector('.info-badge');

    if (laserLine) {
        laserLine.style.opacity = '1';
        laserLine.style.animation = 'laserGlow 0.5s ease-in-out infinite';
    }

    if (targetPoint) {
        targetPoint.style.borderColor = '#ef4444';
        targetPoint.style.animation = 'targetPulse 0.5s ease-in-out infinite';
    }

    if (infoBadge) {
        infoBadge.innerHTML = '<i class="fas fa-broadcast-tower"></i><span>Laser active - Guide ready</span>';
        infoBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        infoBadge.style.color = '#ef4444';
    }
}

// Deactivate laser
function deactivateLaser() {
    const laserLine = document.querySelector('.laser-line');
    const targetPoint = document.querySelector('.target-point');
    const infoBadge = document.querySelector('.info-badge');

    if (laserLine) {
        laserLine.style.animation = 'laserGlow 1.5s ease-in-out infinite';
    }

    if (targetPoint) {
        targetPoint.style.borderColor = '#10b981';
        targetPoint.style.animation = 'targetPulse 2s ease-in-out infinite';
    }

    if (infoBadge) {
        infoBadge.innerHTML = '<i class="fas fa-check-circle"></i><span>Optimal angle detected</span>';
        infoBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        infoBadge.style.color = '#10b981';
    }
}

// Welcome screen animation
function initWelcomeAnimation() {
    const pins = document.querySelectorAll('.pin');

    pins.forEach((pin, index) => {
        pin.style.animation = `pinFloat ${1.5 + (index * 0.1)}s ease-in-out infinite`;
        pin.style.animationDelay = `${index * 0.1}s`;
    });

    // Add pin floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pinFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
    `;
    document.head.appendChild(style);
}

// Utility function for haptic feedback (for mobile devices)
function triggerHaptic() {
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

// Add click feedback to buttons
document.addEventListener('click', (e) => {
    if (e.target.matches('button, .tag, .toggle, .guide-card, .session-item')) {
        triggerHaptic();
    }
});

// Swipe navigation for welcome screens (future implementation)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        // Swipe detected - can be used for carousel navigation
        if (diff > 0) {
            // Swiped left
            console.log('Swipe left');
        } else {
            // Swiped right
            console.log('Swipe right');
        }
    }
}

// Search functionality
const searchData = [
    // Techniques
    { type: 'technique', title: 'Strike Shot Guide', desc: 'Perfect pocket targeting', icon: 'fa-bullseye', color: 'purple', keywords: ['strike', 'pocket', 'target', 'guide'] },
    { type: 'technique', title: 'Spare Conversion', desc: 'Pick up any spare', icon: 'fa-bowling-ball', color: 'pink', keywords: ['spare', 'conversion', 'pick', 'pin'] },
    { type: 'technique', title: 'Hook Shot Basics', desc: 'Master the curve', icon: 'fa-sync-alt', color: 'green', keywords: ['hook', 'curve', 'spin', 'rotation'] },
    { type: 'technique', title: 'Straight Ball Technique', desc: 'Consistency and control', icon: 'fa-arrows-alt-h', color: 'blue', keywords: ['straight', 'control', 'beginner', 'basic'] },
    { type: 'technique', title: 'Split Pickup Strategy', desc: 'Tackle difficult splits', icon: 'fa-random', color: 'orange', keywords: ['split', 'difficult', '7-10', 'pickup'] },
    // Resources
    { type: 'resource', title: 'Lane Oil Patterns', desc: 'Understanding lane conditions', icon: 'fa-book', color: 'orange', keywords: ['oil', 'lane', 'pattern', 'condition'] },
    { type: 'resource', title: 'Video Tutorials', desc: 'Step-by-step guides', icon: 'fa-video', color: 'blue', keywords: ['video', 'tutorial', 'learn', 'watch'] },
    { type: 'resource', title: 'Angle Calculator', desc: 'Find your perfect angle', icon: 'fa-calculator', color: 'teal', keywords: ['angle', 'calculator', 'math', 'entry'] },
    { type: 'resource', title: 'Ball Selection Guide', desc: 'Choose the right equipment', icon: 'fa-circle', color: 'purple', keywords: ['ball', 'equipment', 'weight', 'coverstock'] },
    { type: 'resource', title: 'Practice Drills', desc: 'Improve your game', icon: 'fa-dumbbell', color: 'green', keywords: ['practice', 'drill', 'improve', 'training'] },
    { type: 'resource', title: 'Scoring System', desc: 'How bowling scoring works', icon: 'fa-trophy', color: 'pink', keywords: ['score', 'scoring', 'points', 'frame'] }
];

let searchTimeout;

function handleSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filterSearchResults(query);
    }, 150);
}

function filterSearchResults(query) {
    const searchResults = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');

    if (!query || query.length < 1) {
        resetSearchResults();
        return;
    }

    const lowerQuery = query.toLowerCase();
    const matchedTechniques = searchData.filter(item =>
        item.type === 'technique' &&
        (item.title.toLowerCase().includes(lowerQuery) ||
         item.desc.toLowerCase().includes(lowerQuery) ||
         item.keywords.some(k => k.includes(lowerQuery)))
    );

    const matchedResources = searchData.filter(item =>
        item.type === 'resource' &&
        (item.title.toLowerCase().includes(lowerQuery) ||
         item.desc.toLowerCase().includes(lowerQuery) ||
         item.keywords.some(k => k.includes(lowerQuery)))
    );

    updateSearchResultsUI(matchedTechniques, matchedResources);
}

function updateSearchResultsUI(techniques, resources) {
    const searchResults = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    const categories = searchResults.querySelectorAll('.search-category');

    // Clear existing items
    categories.forEach(cat => cat.remove());
    noResults.style.display = 'none';

    if (techniques.length === 0 && resources.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    let html = '';

    if (techniques.length > 0) {
        html += '<div class="search-category"><span class="category-label">Techniques</span>';
        techniques.forEach(item => {
            html += createSearchItemHTML(item);
        });
        html += '</div>';
    }

    if (resources.length > 0) {
        html += '<div class="search-category"><span class="category-label">Resources</span>';
        resources.forEach(item => {
            html += createSearchItemHTML(item);
        });
        html += '</div>';
    }

    noResults.insertAdjacentHTML('beforebegin', html);
}

function createSearchItemHTML(item) {
    return `
        <div class="search-item" data-type="${item.type}" onclick="selectSearchItem('${item.title}')">
            <div class="search-item-icon ${item.color}"><i class="fas ${item.icon}"></i></div>
            <div class="search-item-info">
                <span class="search-item-title">${item.title}</span>
                <span class="search-item-desc">${item.desc}</span>
            </div>
        </div>
    `;
}

function resetSearchResults() {
    const searchResults = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    const categories = searchResults.querySelectorAll('.search-category');

    categories.forEach(cat => cat.remove());
    noResults.style.display = 'none';

    // Restore default results
    const defaultTechniques = searchData.filter(i => i.type === 'technique').slice(0, 3);
    const defaultResources = searchData.filter(i => i.type === 'resource').slice(0, 3);
    updateSearchResultsUI(defaultTechniques, defaultResources);
}

function showSearchResults() {
    const searchResults = document.getElementById('searchResults');
    searchResults.classList.add('active');
    resetSearchResults();
}

function hideSearchResults() {
    setTimeout(() => {
        const searchResults = document.getElementById('searchResults');
        searchResults.classList.remove('active');
    }, 200);
}

function selectSearchItem(title) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = title;

    // Navigate to laser screen for techniques
    const item = searchData.find(i => i.title === title);
    if (item && item.type === 'technique') {
        showScreen('laserScreen');
    }

    hideSearchResults();
}

// Export functions for external use
window.showScreen = showScreen;
window.updateLaserPosition = updateLaserPosition;
window.updateLaserCurve = updateLaserCurve;
window.handleSearch = handleSearch;
window.showSearchResults = showSearchResults;
window.hideSearchResults = hideSearchResults;
window.selectSearchItem = selectSearchItem;
