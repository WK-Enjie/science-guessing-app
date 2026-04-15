// ===========================
// Game State Management
// ===========================

class GameState {
    constructor() {
        this.worksheet = null;
        this.currentWords = [];
        this.currentWordIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.skippedCount = 0;
        this.timerDuration = CONFIG.DEFAULT_TIMER;
        this.timerRemaining = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.gameMode = CONFIG.DEFAULT_MODE;
        this.results = [];
        this.isDescriberView = true;
    }
    
    reset() {
        this.currentWordIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.skippedCount = 0;
        this.results = [];
        this.stopTimer();
    }
    
    loadWorksheet(worksheet) {
        console.log('Loading worksheet into state:', worksheet.title);
        this.worksheet = worksheet;
        this.prepareWords();
    }
    
    prepareWords() {
        if (!this.worksheet) {
            console.error('No worksheet to prepare!');
            return;
        }
        
        let words = [...this.worksheet.words];
        console.log('Original words count:', words.length);
        
        // Apply game mode filters
        if (this.gameMode === 'random') {
            words = Utils.getRandomElements(words, CONFIG.MODES.RANDOM.wordCount);
            console.log('Random mode: selected', words.length, 'words');
        } else if (this.gameMode === 'difficulty') {
            const difficulty = document.getElementById('difficulty-filter').value;
            words = Utils.filterByDifficulty(words, difficulty);
            console.log('Difficulty mode:', difficulty, '- selected', words.length, 'words');
        }
        
        // Shuffle words
        this.currentWords = Utils.shuffleArray(words);
        console.log('Words prepared and shuffled:', this.currentWords.length);
    }
    
    getCurrentWord() {
        return this.currentWords[this.currentWordIndex];
    }
    
    hasNextWord() {
        return this.currentWordIndex < this.currentWords.length - 1;
    }
    
    nextWord() {
        if (this.hasNextWord()) {
            this.currentWordIndex++;
            return true;
        }
        return false;
    }
    
    startTimer() {
        this.stopTimer();
        this.timerRemaining = this.timerDuration;
        
        if (this.timerDuration === 0) {
            console.log('No timer mode - timer disabled');
            return; // No timer mode
        }
        
        console.log('Starting timer:', this.timerDuration, 'seconds');
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.timerRemaining--;
                this.updateTimerDisplay();
                
                if (this.timerRemaining <= 0) {
                    this.onTimeUp();
                }
            }
        }, CONFIG.TIMER_UPDATE_INTERVAL);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            console.log('Timer stopped');
        }
    }
    
    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = Utils.formatTime(this.timerRemaining);
            
            // Add warning color when time is low
            if (this.timerRemaining <= 10 && this.timerRemaining > 0) {
                timerElement.style.color = 'var(--danger-color)';
                timerElement.classList.add('pulse');
            } else {
                timerElement.style.color = 'var(--primary-color)';
                timerElement.classList.remove('pulse');
            }
        }
    }
    
    onTimeUp() {
        console.log('Time up!');
        this.stopTimer();
        this.recordResult(false, true); // timeout
        
        if (this.hasNextWord()) {
            Utils.showToast('Time\'s up! Moving to next word...', 'warning');
            setTimeout(() => {
                this.nextWord();
                game.displayCurrentWord();
                this.startTimer();
            }, 1500);
        } else {
            this.endGame();
        }
    }
    
    recordResult(correct, timeout = false) {
        const word = this.getCurrentWord();
        this.results.push({
            word: word.target,
            correct: correct,
            timeout: timeout,
            keywords: word.keywords,
            difficulty: word.difficulty || 'medium'
        });
        
        if (correct) {
            this.correctCount++;
            this.score += CONFIG.POINTS_PER_CORRECT;
        } else if (!timeout) {
            this.skippedCount++;
        }
        
        console.log('Result recorded:', { correct, timeout, score: this.score });
    }
    
    endGame() {
        console.log('Game ending...');
        this.stopTimer();
        game.showResults();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log('Game paused:', this.isPaused);
    }
}

// ===========================
// Game Controller
// ===========================

class Game {
    constructor() {
        this.state = new GameState();
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        console.log('Game initialized');
    }
    
    initializeElements() {
        // Screens
        this.screens = {
            menu: document.getElementById('menu-screen'),
            game: document.getElementById('game-screen'),
            results: document.getElementById('results-screen')
        };
        
        // Menu elements
        this.elements = {
            worksheetInfo: document.getElementById('worksheet-info'),
            gameSettings: document.getElementById('game-settings'),
            wsTitle: document.getElementById('ws-title'),
            wsSubject: document.getElementById('ws-subject'),
            wsLevel: document.getElementById('ws-level'),
            wsCount: document.getElementById('ws-count'),
            wsDescription: document.getElementById('ws-description'),
            
            // Settings
            timerDuration: document.getElementById('timer-duration'),
            gameMode: document.getElementById('game-mode'),
            difficultyFilter: document.getElementById('difficulty-filter'),
            
            // Game elements
            currentRound: document.getElementById('current-round'),
            totalRounds: document.getElementById('total-rounds'),
            score: document.getElementById('score'),
            timer: document.getElementById('timer'),
            targetWord: document.getElementById('target-word'),
            wordHint: document.getElementById('word-hint'),
            wordHintGuesser: document.getElementById('word-hint-guesser'),
            keywordsList: document.getElementById('keywords-list'),
            difficultyDisplay: document.getElementById('difficulty-display'),
            
            // Views
            describerView: document.getElementById('describer-view'),
            guesserView: document.getElementById('guesser-view'),
            
            // Results
            finalScore: document.getElementById('final-score'),
            correctCount: document.getElementById('correct-count'),
            skippedCount: document.getElementById('skipped-count'),
            accuracy: document.getElementById('accuracy'),
            reviewList: document.getElementById('review-list'),
            
            // Modal
            pauseModal: document.getElementById('pause-modal')
        };
        
        console.log('Elements initialized');
    }
    
    attachEventListeners() {
        // Worksheet loading
        document.querySelectorAll('.worksheet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const file = e.target.dataset.file;
                console.log('Worksheet button clicked:', file);
                this.loadWorksheetFromFile(file);
            });
        });
        
        document.getElementById('file-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });
        
        // Settings
        this.elements.gameMode.addEventListener('change', (e) => {
            const isDifficulty = e.target.value === 'difficulty';
            this.elements.difficultyFilter.disabled = !isDifficulty;
        });
        
        // Game controls
        document.getElementById('start-game-btn').addEventListener('click', () => {
            console.log('Start game button clicked');
            try {
                this.startGame();
            } catch (error) {
                console.error('Error starting game:', error);
                Utils.showToast('Error starting game: ' + error.message, 'error');
            }
        });
        
        document.getElementById('toggle-view-btn').addEventListener('click', () => {
            this.toggleView();
        });
        
        document.getElementById('correct-btn').addEventListener('click', () => {
            this.handleCorrect();
        });
        
        document.getElementById('skip-btn').addEventListener('click', () => {
            this.handleSkip();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.showPauseModal();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitGame();
        });
        
        // Pause modal
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('quit-from-pause-btn').addEventListener('click', () => {
            this.quitGame();
        });
        
        // Results
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.playAgain();
        });
        
        document.getElementById('new-worksheet-btn').addEventListener('click', () => {
            this.returnToMenu();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.screens.game.classList.contains('active')) {
                if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.handleCorrect();
                } else if (e.code === 'KeyS' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.handleSkip();
                } else if (e.code === 'KeyV' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.toggleView();
                }
            }
        });
        
        console.log('Event listeners attached');
    }
    
    loadSettings() {
        const settings = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.SETTINGS);
        if (settings) {
            if (settings.timerDuration) {
                this.elements.timerDuration.value = settings.timerDuration;
            }
            if (settings.gameMode) {
                this.elements.gameMode.value = settings.gameMode;
            }
        }
    }
    
    saveSettings() {
        const settings = {
            timerDuration: parseInt(this.elements.timerDuration.value),
            gameMode: this.elements.gameMode.value
        };
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.SETTINGS, settings);
    }
    
    async loadWorksheetFromFile(filePath) {
        try {
            console.log('Attempting to load:', filePath);
            
            const response = await fetch(filePath, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const worksheet = await response.json();
            console.log('Worksheet loaded successfully:', worksheet.title);
            
            this.processWorksheet(worksheet);
        } catch (error) {
            console.error('Error loading worksheet:', error);
            
            // More specific error messages
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                Utils.showToast('Network error: Check your internet connection or file URL', 'error');
            } else if (error.name === 'SyntaxError') {
                Utils.showToast('Invalid JSON format in worksheet file', 'error');
            } else {
                Utils.showToast(`Failed to load worksheet: ${error.message}`, 'error');
            }
        }
    }
    
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('File selected:', file.name);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const worksheet = JSON.parse(e.target.result);
                this.processWorksheet(worksheet);
            } catch (error) {
                console.error('Error parsing worksheet:', error);
                Utils.showToast('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    processWorksheet(worksheet) {
        console.log('Processing worksheet:', worksheet);
        
        // Validate worksheet
        const validation = Utils.validateWorksheet(worksheet);
        if (!validation.valid) {
            console.error('Validation errors:', validation.errors);
            Utils.showToast('Invalid worksheet: ' + validation.errors[0], 'error');
            return;
        }
        
        console.log('Validation passed!');
        
        // Load worksheet into state
        this.state.loadWorksheet(worksheet);
        
        console.log('Worksheet loaded into state');
        
        // Display worksheet info
        this.displayWorksheetInfo(worksheet);
        
        console.log('Worksheet info displayed');
        
        // Show game settings
        this.elements.worksheetInfo.classList.remove('hidden');
        this.elements.gameSettings.classList.remove('hidden');
        
        console.log('Settings shown');
        
        Utils.showToast('Worksheet loaded successfully!', 'success');
    }
    
    displayWorksheetInfo(worksheet) {
        this.elements.wsTitle.textContent = worksheet.title;
        this.elements.wsSubject.textContent = worksheet.subject;
        this.elements.wsLevel.textContent = worksheet.level || 'Not specified';
        this.elements.wsCount.textContent = worksheet.words.length;
        this.elements.wsDescription.textContent = worksheet.description || '';
        
        console.log('Worksheet info updated in UI');
    }
    
    startGame() {
        console.log('=== STARTING GAME ===');
        
        // Save settings
        this.saveSettings();
        
        // Get settings
        this.state.timerDuration = parseInt(this.elements.timerDuration.value);
        this.state.gameMode = this.elements.gameMode.value;
        
        console.log('Timer duration:', this.state.timerDuration);
        console.log('Game mode:', this.state.gameMode);
        
        // Prepare game
        this.state.reset();
        this.state.prepareWords();
        
        console.log('Words prepared:', this.state.currentWords.length);
        
        if (this.state.currentWords.length === 0) {
            Utils.showToast('No words available for selected mode', 'error');
            return;
        }
        
        // Update UI
        this.elements.totalRounds.textContent = this.state.currentWords.length;
        this.elements.currentRound.textContent = '1';
        this.elements.score.textContent = '0';
        
        console.log('UI updated');
        
        // Show game screen
        this.showScreen('game');
        
        console.log('Game screen shown');
        
        // Display first word
        this.displayCurrentWord();
        
        console.log('First word displayed');
        
        // Start timer
        this.state.startTimer();
        
        console.log('Timer started');
        console.log('=== GAME STARTED ===');
    }
    
    displayCurrentWord() {
        const word = this.state.getCurrentWord();
        console.log('Displaying word:', word);
        
        if (!word) {
            console.error('No word to display!');
            Utils.showToast('Error: No word available', 'error');
            return;
        }
        
        // Update round counter
        this.elements.currentRound.textContent = this.state.currentWordIndex + 1;
        
        // Update target word
        this.elements.targetWord.textContent = word.target.toUpperCase();
        
        // Update hint
        const hint = word.hint || 'Scientific concept';
        this.elements.wordHint.textContent = hint;
        this.elements.wordHintGuesser.textContent = hint;
        
        // Update difficulty
        const difficulty = word.difficulty || 'medium';
        this.elements.difficultyDisplay.textContent = `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
        this.elements.difficultyDisplay.style.background = Utils.getDifficultyColor(difficulty);
        
        // Update keywords
        this.displayKeywords(word.keywords);
        
        // Update score
        this.elements.score.textContent = this.state.score;
        
        console.log('Word display complete');
    }
    
    displayKeywords(keywords) {
        this.elements.keywordsList.innerHTML = '';
        keywords.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            tag.textContent = keyword;
            this.elements.keywordsList.appendChild(tag);
        });
    }
    
    toggleView() {
        this.state.isDescriberView = !this.state.isDescriberView;
        
        if (this.state.isDescriberView) {
            this.elements.describerView.classList.remove('hidden');
            this.elements.guesserView.classList.add('hidden');
        } else {
            this.elements.describerView.classList.add('hidden');
            this.elements.guesserView.classList.remove('hidden');
        }
        
        console.log('View toggled. Describer view:', this.state.isDescriberView);
    }
    
    handleCorrect() {
        console.log('Correct answer!');
        this.state.stopTimer();
        this.state.recordResult(true);
        
        Utils.showToast('Correct! +' + CONFIG.POINTS_PER_CORRECT + ' points', 'success');
        
        if (this.state.hasNextWord()) {
            setTimeout(() => {
                this.state.nextWord();
                this.displayCurrentWord();
                this.state.startTimer();
            }, 1000);
        } else {
            this.state.endGame();
        }
    }
    
    handleSkip() {
        console.log('Word skipped');
        this.state.stopTimer();
        this.state.recordResult(false);
        
        Utils.showToast('Word skipped', 'warning');
        
        if (this.state.hasNextWord()) {
            setTimeout(() => {
                this.state.nextWord();
                this.displayCurrentWord();
                this.state.startTimer();
            }, 1000);
        } else {
            this.state.endGame();
        }
    }
    
    showPauseModal() {
        this.state.togglePause();
        this.elements.pauseModal.classList.remove('hidden');
    }
    
    resumeGame() {
        this.state.togglePause();
        this.elements.pauseModal.classList.add('hidden');
    }
    
    quitGame() {
        if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
            this.state.stopTimer();
            this.returnToMenu();
        }
    }
    
    showResults() {
        console.log('Showing results');
        this.showScreen('results');
        
        // Calculate stats
        const total = this.state.results.length;
        const accuracy = Utils.calculateAccuracy(this.state.correctCount, total);
        
        // Display final score
        this.elements.finalScore.textContent = this.state.score;
        this.elements.correctCount.textContent = this.state.correctCount;
        this.elements.skippedCount.textContent = this.state.skippedCount;
        this.elements.accuracy.textContent = accuracy + '%';
        
        // Display review list
        this.displayReviewList();
        
        // Save high score
        this.saveHighScore();
    }
    
    displayReviewList() {
        this.elements.reviewList.innerHTML = '';
        
        this.state.results.forEach(result => {
            const item = document.createElement('div');
            item.className = `review-item ${result.correct ? 'correct' : 'skipped'}`;
            
            const icon = document.createElement('span');
            icon.className = 'review-icon';
            icon.textContent = result.correct ? '✅' : (result.timeout ? '⏰' : '⏭️');
            
            const word = document.createElement('span');
            word.className = 'review-word';
            word.textContent = result.word;
            
            const status = document.createElement('span');
            status.className = 'review-status';
            status.textContent = result.correct ? 'Correct' : (result.timeout ? 'Time out' : 'Skipped');
            
            item.appendChild(icon);
            item.appendChild(word);
            item.appendChild(status);
            
            this.elements.reviewList.appendChild(item);
        });
    }
    
    saveHighScore() {
        const highScore = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.HIGH_SCORE, 0);
        if (this.state.score > highScore) {
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.HIGH_SCORE, this.state.score);
            Utils.showToast('New high score! 🎉', 'success');
        }
    }
    
    playAgain() {
        this.startGame();
    }
    
    returnToMenu() {
        this.elements.pauseModal.classList.add('hidden');
        this.showScreen('menu');
        this.state.reset();
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        console.log('Screen changed to:', screenName);
    }
}

// ===========================
// Initialize Game
// ===========================

let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Initializing Science Describe-It!');
    game = new Game();
    console.log('✅ Game ready!');
});
