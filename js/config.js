// ===========================
// Configuration & Constants
// ===========================

const CONFIG = {
    // Default game settings
    DEFAULT_TIMER: 60,
    DEFAULT_MODE: 'classic',
    POINTS_PER_CORRECT: 10,
    POINTS_PER_SKIP: 0,
    
    // Animation durations (ms)
    ANIMATION_DURATION: 300,
    TIMER_UPDATE_INTERVAL: 1000,
    
    // Local storage keys
    STORAGE_KEYS: {
        HIGH_SCORE: 'scienceDescribeIt_highScore',
        LAST_WORKSHEET: 'scienceDescribeIt_lastWorksheet',
        SETTINGS: 'scienceDescribeIt_settings'
    },
    
    // Difficulty settings
    DIFFICULTY: {
        EASY: {
            name: 'Easy',
            color: '#10b981',
            minKeywords: 6,
            timeBonus: 1.2
        },
        MEDIUM: {
            name: 'Medium',
            color: '#f59e0b',
            minKeywords: 4,
            timeBonus: 1.0
        },
        HARD: {
            name: 'Hard',
            color: '#ef4444',
            minKeywords: 3,
            timeBonus: 0.8
        }
    },
    
    // Game modes
    MODES: {
        CLASSIC: {
            name: 'Classic',
            description: 'Play through all words in the worksheet'
        },
        RANDOM: {
            name: 'Random',
            description: 'Random selection of 10 words',
            wordCount: 10
        },
        DIFFICULTY: {
            name: 'By Difficulty',
            description: 'Filter words by difficulty level'
        }
    },
    
    // Sound effects (optional - can be extended)
    SOUNDS: {
        CORRECT: '✅',
        SKIP: '⏭️',
        TIME_WARNING: '⏰',
        GAME_END: '🎉'
    },
    
    // Validation rules for worksheets
    VALIDATION: {
        MIN_KEYWORDS: 2,
        MAX_KEYWORDS: 15,
        MIN_TARGET_LENGTH: 2,
        MAX_TARGET_LENGTH: 50
    }
};

// ===========================
// Utility Functions
// ===========================

const Utils = {
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray: function(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    /**
     * Format time in MM:SS format
     */
    formatTime: function(seconds) {
        if (seconds === 0) return '∞';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Calculate accuracy percentage
     */
    calculateAccuracy: function(correct, total) {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    },
    
    /**
     * Sanitize text to prevent XSS
     */
    sanitizeText: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Validate worksheet structure
     */
    validateWorksheet: function(worksheet) {
        const errors = [];
        
        // Check required fields
        if (!worksheet.title) errors.push('Missing title');
        if (!worksheet.subject) errors.push('Missing subject');
        if (!worksheet.words || !Array.isArray(worksheet.words)) {
            errors.push('Missing or invalid words array');
            return { valid: false, errors };
        }
        if (worksheet.words.length === 0) {
            errors.push('No words in worksheet');
        }
        
        // Validate each word
        worksheet.words.forEach((word, index) => {
            if (!word.target) {
                errors.push(`Word ${index + 1}: Missing target`);
            } else {
                if (word.target.length < CONFIG.VALIDATION.MIN_TARGET_LENGTH) {
                    errors.push(`Word ${index + 1}: Target too short`);
                }
                if (word.target.length > CONFIG.VALIDATION.MAX_TARGET_LENGTH) {
                    errors.push(`Word ${index + 1}: Target too long`);
                }
            }
            
            if (!word.keywords || !Array.isArray(word.keywords)) {
                errors.push(`Word ${index + 1}: Missing or invalid keywords`);
            } else {
                if (word.keywords.length < CONFIG.VALIDATION.MIN_KEYWORDS) {
                    errors.push(`Word ${index + 1}: Not enough keywords (minimum ${CONFIG.VALIDATION.MIN_KEYWORDS})`);
                }
                if (word.keywords.length > CONFIG.VALIDATION.MAX_KEYWORDS) {
                    errors.push(`Word ${index + 1}: Too many keywords (maximum ${CONFIG.VALIDATION.MAX_KEYWORDS})`);
                }
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Save to local storage
     */
    saveToStorage: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },
    
    /**
     * Load from local storage
     */
    loadFromStorage: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return defaultValue;
        }
    },
    
    /**
     * Show toast notification (simple version)
     */
    showToast: function(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    /**
     * Deep clone object
     */
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * Get random elements from array
     */
    getRandomElements: function(array, count) {
        const shuffled = this.shuffleArray(array);
        return shuffled.slice(0, Math.min(count, array.length));
    },
    
    /**
     * Filter array by difficulty
     */
    filterByDifficulty: function(words, difficulty) {
        return words.filter(word => 
            (word.difficulty || 'medium').toLowerCase() === difficulty.toLowerCase()
        );
    },
    
    /**
     * Get difficulty color
     */
    getDifficultyColor: function(difficulty) {
        const diff = (difficulty || 'medium').toUpperCase();
        return CONFIG.DIFFICULTY[diff]?.color || CONFIG.DIFFICULTY.MEDIUM.color;
    },
    
    /**
     * Format number with commas
     */
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    /**
     * Check if target word is contained in text (for validation)
     */
    containsTarget: function(text, target) {
        const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanText.includes(cleanTarget);
    }
};

// ===========================
// Animation CSS (injected)
// ===========================

const animationStyles = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }
    
    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-10px);
        }
        75% {
            transform: translateX(10px);
        }
    }
    
    .pulse {
        animation: pulse 0.5s ease;
    }
    
    .shake {
        animation: shake 0.5s ease;
    }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// ===========================
// Export for use in game.js
// ===========================

// Make available globally
window.CONFIG = CONFIG;
window.Utils = Utils;

console.log('✅ Config loaded successfully');
