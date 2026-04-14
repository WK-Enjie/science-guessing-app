/* ========================================
   SCIENCE CHARADES — GAME LOGIC
   Singapore Edition
   ======================================== */

// ========================================
// GAME STATE
// ========================================
const GameState = {
    level: null,
    questions: [],
    filteredQuestions: [],
    usedIndices: [],
    currentQuestion: null,

    numTeams: 2,
    timerDuration: 60,
    totalRounds: 3,
    selectedTopic: 'all',
    teamNames: ['Team 1', 'Team 2'],

    currentTeamIndex: 0,
    currentRound: 1,
    teamScores: [],
    teamBadges: [],

    turnCorrect: 0,
    turnSkipped: 0,
    turnPoints: 0,
    turnWords: [],
    streak: 0,

    timerInterval: null,
    timeLeft: 60,

    wheelSpun: false,
    wheelDeg: 0,
    pendingBonus: 0,
};

// ========================================
// FALLBACK QUESTIONS (if fetch fails)
// ========================================
const FALLBACK_QUESTIONS = {
    psle: [
        {
            term: "Photosynthesis",
            topic: "Biology",
            difficulty: "Medium",
            clue: "A process plants use to make their own food using sunlight energy. It happens in the green parts of the plant.",
            forbidden: ["sun", "light", "plant", "food", "green", "chlorophyll"],
            funFact: "A single large tree can absorb up to 48 pounds of carbon dioxide per year through this process!",
            points: 2
        },
        {
            term: "Evaporation",
            topic: "Water Cycle",
            difficulty: "Easy",
            clue: "Liquid water gains heat and changes into an invisible gas that rises into the air.",
            forbidden: ["water", "vapour", "liquid", "gas", "steam", "dry"],
            funFact: "The ocean loses about 1 metre of water depth every year through this process!",
            points: 1
        },
        {
            term: "Friction",
            topic: "Forces",
            difficulty: "Easy",
            clue: "A force that acts against movement when two surfaces are in contact with each other.",
            forbidden: ["rub", "surface", "slow", "force", "rough", "smooth"],
            funFact: "Your car tyres would be useless on ice because there is almost none of this force!",
            points: 1
        }
    ],
    olevel: [
        {
            term: "Oxidation",
            topic: "Chemistry",
            difficulty: "Medium",
            clue: "A process where a species loses electrons and its oxidation state increases.",
            forbidden: ["electron", "oxygen", "lose", "rust", "state", "OIL"],
            funFact: "Rusting of iron is a slow version of this process happening every day!",
            points: 2
        },
        {
            term: "Neutralisation",
            topic: "Chemistry",
            difficulty: "Medium",
            clue: "A reaction between an acid and a base that produces a salt and water.",
            forbidden: ["acid", "alkali", "salt", "base", "pH", "reaction"],
            funFact: "Antacid tablets use this reaction to treat indigestion!",
            points: 2
        }
    ]
};

// ========================================
// BASE URL — YOUR GITHUB PAGES URL
// ========================================
const BASE_URL = 'https://wk-enjie.github.io/science-guessing-app/questions/';

// ========================================
// CHAPTER REGISTRY
// ========================================
const CHAPTER_REGISTRY = {
    psle: [
        {
            id: 'psle_forces_energy',
            title: 'Forces and Energy',
            filename: 'psle_forces_energy.json',
            icon: '⚡'
        },
        {
            id: 'psle_water_cycle_matter',
            title: 'Water Cycle and Matter',
            filename: 'psle_water_cycle_matter.json',
            icon: '💧'
        },
        {
            id: 'psle_science',
            title: 'General Science',
            filename: 'psle_science.json',
            icon: '🔬'
        }
    ],
    olevel: [
        {
            id: 'olevel_periodic_reactivity',
            title: 'Periodic Table, Redox and Reactivity',
            filename: 'olevel_periodic_table_reactivity.json',
            icon: '⚗️'
        }
    ]
};

// ========================================
// WHEEL CONFIGURATION
// ========================================
const WHEEL_SEGMENTS = [
    { label: '+1', bonus: 1, type: 'points' },
    { label: '+3', bonus: 3, type: 'points' },
    { label: '⭐', bonus: 0, type: 'star'   },
    { label: '+2', bonus: 2, type: 'points' },
    { label: '🧪', bonus: 0, type: 'lab'    },
    { label: '+5', bonus: 5, type: 'points' },
];

// ========================================
// BADGES
// ========================================
const BADGES = [
    { id: 'first_correct', emoji: '🎯', name: 'First Blood',  desc: 'First correct answer'       },
    { id: 'streak_3',      emoji: '🔥', name: 'On Fire',      desc: '3 correct in a row'          },
    { id: 'streak_5',      emoji: '💥', name: 'Unstoppable',  desc: '5 correct in a row'          },
    { id: 'no_skip',       emoji: '🎖️', name: 'No Mercy',     desc: 'Zero skips in a turn'        },
    { id: 'jackpot',       emoji: '🎰', name: 'Jackpot!',     desc: 'Landed +5 on the wheel'      },
    { id: 'hard_correct',  emoji: '🧠', name: 'Big Brain',    desc: 'Correct on a Hard question'  },
    { id: 'all_correct',   emoji: '👑', name: 'Perfect Turn', desc: '3+ correct with zero skips'  },
];

// ========================================
// CHAPTER MANAGER (manual uploads)
// ========================================
const ChapterManager = {
    chapters: [],

    addChapter(name, questions) {
        const existing = this.chapters.findIndex(c => c.name === name);
        if (existing !== -1) {
            this.chapters[existing] = { name, questions };
        } else {
            this.chapters.push({ name, questions });
        }
    },

    removeChapter(index) {
        this.chapters.splice(index, 1);
    },

    getAllQuestions() {
        return this.chapters.flatMap(c => c.questions);
    },

    getTotalCount() {
        return this.chapters.reduce((sum, c) => sum + c.questions.length, 0);
    },

    clear() {
        this.chapters = [];
    }
};

// ========================================
// INIT
// ========================================
window.addEventListener('load', () => {
    createParticles();
    generateTeamNameInputs();
});

// ========================================
// PARTICLES
// ========================================
function createParticles() {
    const container = document.getElementById('particles');
    const colors = ['#4f46e5','#06b6d4','#10b981','#f59e0b','#ec4899'];
    const emojis = ['⚛️','🔬','🧪','🌿','⚡','🧲','💧','🔭'];

    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 80 + 20;
        p.style.cssText = `
            width:${size}px;
            height:${size}px;
            left:${Math.random() * 100}%;
            background:${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration:${Math.random() * 15 + 10}s;
            animation-delay:${Math.random() * 10}s;
        `;
        container.appendChild(p);
    }

    for (let i = 0; i < 10; i++) {
        const e = document.createElement('div');
        e.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 14}px;
            left: ${Math.random() * 100}%;
            opacity: 0.12;
            animation: float-up linear infinite;
            animation-duration: ${Math.random() * 20 + 12}s;
            animation-delay: ${Math.random() * 12}s;
            pointer-events: none;
        `;
        e.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        container.appendChild(e);
    }
}

// ========================================
// SCREEN NAVIGATION
// ========================================
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

// ========================================
// LEVEL SELECTION
// ========================================
function selectLevel(level) {
    GameState.level = level;
    showChapterSelect(level);
}

function showChapterSelect(level) {
    const chapters  = CHAPTER_REGISTRY[level];
    const selectDiv = document.getElementById('chapter-select');
    const titleEl   = document.getElementById('chapter-select-title');
    const container = document.getElementById('chapter-checkboxes');

    titleEl.textContent = level === 'psle'
        ? '🌱 Select PSLE Chapters'
        : '🚀 Select O-Level Chapters';

    if (!chapters || chapters.length === 0) {
        GameState.questions         = FALLBACK_QUESTIONS[level] || [];
        GameState.filteredQuestions = [...GameState.questions];
        populateTopicFilter();
        generateTeamNameInputs();
        goToScreen('screen-setup');
        showToast('📚 Using built-in questions', 'info');
        return;
    }

    let html = `
        <div class="select-all-row">
            <button class="select-all-btn" onclick="toggleAllChapters(true)">✅ Select All</button>
            <button class="select-all-btn" onclick="toggleAllChapters(false)">☐ Deselect All</button>
        </div>
    `;

    chapters.forEach((chapter, index) => {
        html += `
            <label class="chapter-checkbox checked" id="chapter-box-${index}">
                <input type="checkbox"
                       id="chapter-cb-${index}"
                       checked
                       onchange="updateChapterStyle(${index})">
                <span class="chapter-label">${chapter.icon} ${chapter.title}</span>
                <span class="chapter-meta">${chapter.filename}</span>
            </label>
        `;
    });

    container.innerHTML = html;
    document.getElementById('chapter-load-status').textContent = '';
    selectDiv.style.display = 'block';
    selectDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideChapterSelect() {
    document.getElementById('chapter-select').style.display = 'none';
    GameState.level = null;
}

function toggleAllChapters(state) {
    const chapters = CHAPTER_REGISTRY[GameState.level] || [];
    chapters.forEach((_, index) => {
        const cb = document.getElementById(`chapter-cb-${index}`);
        if (cb) {
            cb.checked = state;
            updateChapterStyle(index);
        }
    });
}

function updateChapterStyle(index) {
    const cb  = document.getElementById(`chapter-cb-${index}`);
    const box = document.getElementById(`chapter-box-${index}`);
    if (cb && box) {
        box.classList.toggle('checked', cb.checked);
    }
}

// ========================================
// EXTRACT QUESTIONS — BULLETPROOF
// ========================================
function extractQuestions(data) {
    // Format 1: Root array
    if (Array.isArray(data)) {
        return data;
    }

    // Format 2: { "questions": [...] }  ← YOUR FORMAT
    if (data.questions && Array.isArray(data.questions)) {
        return data.questions;
    }

    // Format 3: { "psle": [...] }
    if (data.psle && Array.isArray(data.psle)) {
        return data.psle;
    }

    // Format 4: { "olevel": [...] }
    if (data.olevel && Array.isArray(data.olevel)) {
        return data.olevel;
    }

    // Format 5: Search all keys for array of questions
    for (const key of Object.keys(data)) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
            const first = data[key][0];
            if (first && first.term && first.clue) {
                return data[key];
            }
        }
    }

    return [];
}

// ========================================
// LOAD SELECTED CHAPTERS
// ========================================
async function loadSelectedChapters() {
    const level    = GameState.level;
    const chapters = CHAPTER_REGISTRY[level] || [];
    const statusEl = document.getElementById('chapter-load-status');

    const selected = chapters.filter((_, index) => {
        const cb = document.getElementById(`chapter-cb-${index}`);
        return cb && cb.checked;
    });

    if (selected.length === 0) {
        showToast('❌ Please select at least one chapter!', 'error');
        return;
    }

    statusEl.innerHTML = `<span class="loading-spinner"></span> Loading...`;

    let allQuestions   = [];
    let failedChapters = [];

    for (const chapter of selected) {
        const url = BASE_URL + chapter.filename;

        try {
            const response = await fetch(url, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                throw new Error(`JSON parse failed: ${parseError.message}`);
            }

            const questions = extractQuestions(data);

            if (questions.length === 0) {
                throw new Error('No questions found in file');
            }

            // Validate — keep only questions with required fields
            const valid = questions.filter(q =>
                q && q.term && q.clue && Array.isArray(q.forbidden)
            );

            if (valid.length === 0) {
                throw new Error('No valid questions after validation');
            }

            allQuestions = allQuestions.concat(valid);
            statusEl.innerHTML = `<span class="loading-spinner"></span> ✅ ${chapter.title}: ${valid.length} Q`;

        } catch (err) {
            console.error('Failed to load:', url, err.message);
            failedChapters.push(chapter.title);
            showToast(`❌ ${chapter.title}: ${err.message}`, 'error');
        }
    }

    if (allQuestions.length > 0) {
        // Store into GameState
        GameState.questions         = allQuestions;
        GameState.filteredQuestions = [...allQuestions];

        console.log('Loaded into GameState:', GameState.questions.length, 'questions');

        populateTopicFilter();
        generateTeamNameInputs();

        statusEl.innerHTML = `✅ ${allQuestions.length} questions ready!`;
        showToast(`✅ ${allQuestions.length} questions loaded!`, 'success');

        setTimeout(() => {
            document.getElementById('chapter-select').style.display = 'none';
            goToScreen('screen-setup');
        }, 600);

    } else {
        // All failed — use fallback
        console.warn('All loads failed — using fallback');
        statusEl.innerHTML = '⚠️ Using built-in questions';

        GameState.questions         = FALLBACK_QUESTIONS[level] || [];
        GameState.filteredQuestions = [...GameState.questions];

        populateTopicFilter();
        generateTeamNameInputs();
        showToast('⚠️ Using built-in questions', 'warning');

        setTimeout(() => {
            document.getElementById('chapter-select').style.display = 'none';
            goToScreen('screen-setup');
        }, 1200);
    }

    if (failedChapters.length > 0) {
        showToast(`❌ Failed: ${failedChapters.join(', ')}`, 'error');
    }
}

// ========================================
// MANUAL FILE UPLOAD
// ========================================
function handleMultiUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    let successCount   = 0;
    let errorCount     = 0;
    let processedCount = 0;

    files.forEach(file => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data      = JSON.parse(e.target.result);
                const questions = extractQuestions(data);
                const name      = data.title || file.name.replace('.json', '');

                if (questions.length === 0) throw new Error('No questions found');

                const valid = questions.filter(q =>
                    q && q.term && q.clue && Array.isArray(q.forbidden)
                );

                if (valid.length === 0) throw new Error('No valid questions');

                ChapterManager.addChapter(name, valid);
                successCount++;

            } catch (err) {
                errorCount++;
                showToast(`❌ ${file.name}: ${err.message}`, 'error');
            }

            processedCount++;
            if (processedCount === files.length) {
                onAllFilesProcessed(successCount, errorCount);
            }
        };

        reader.onerror = () => {
            errorCount++;
            processedCount++;
            if (processedCount === files.length) {
                onAllFilesProcessed(successCount, errorCount);
            }
        };

        reader.readAsText(file);
    });
}

function onAllFilesProcessed(success, errors) {
    renderChapterList();
    if (success > 0) showToast(`✅ ${success} chapter${success > 1 ? 's' : ''} loaded!`, 'success');
    if (errors > 0)  showToast(`⚠️ ${errors} file${errors > 1 ? 's' : ''} had errors`, 'warning');
    document.getElementById('json-upload').value = '';
}

function renderChapterList() {
    const container = document.getElementById('loaded-chapters');
    const controls  = document.getElementById('chapter-controls');

    if (ChapterManager.chapters.length === 0) {
        container.innerHTML    = '';
        controls.style.display = 'none';
        return;
    }

    controls.style.display = 'block';

    let html = ChapterManager.chapters.map((chapter, index) => `
        <div class="chapter-tag">
            <div class="chapter-info">
                <span>📘 ${chapter.name}</span>
                <span class="chapter-count">${chapter.questions.length} Q</span>
            </div>
            <button class="chapter-remove" onclick="removeChapter(${index})">✕</button>
        </div>
    `).join('');

    html += `
        <div class="chapter-summary">
            📊 Total: ${ChapterManager.getTotalCount()} questions from ${ChapterManager.chapters.length} chapter${ChapterManager.chapters.length > 1 ? 's' : ''}
        </div>
    `;

    container.innerHTML = html;
}

function removeChapter(index) {
    const name = ChapterManager.chapters[index].name;
    ChapterManager.removeChapter(index);
    renderChapterList();
    showToast(`🗑️ Removed: ${name}`, 'info');
}

function clearAllChapters() {
    ChapterManager.clear();
    renderChapterList();
    showToast('🗑️ All chapters cleared', 'info');
}

function playLoadedChapters() {
    const allQuestions = ChapterManager.getAllQuestions();
    if (allQuestions.length === 0) {
        showToast('❌ No questions loaded!', 'error');
        return;
    }

    GameState.questions         = allQuestions;
    GameState.filteredQuestions = [...allQuestions];
    GameState.level             = 'custom';

    populateTopicFilter();
    generateTeamNameInputs();
    goToScreen('screen-setup');
    showToast(`🎮 ${allQuestions.length} questions ready!`, 'success');
}

// ========================================
// TOPIC FILTER
// ========================================
function populateTopicFilter() {
    const select = document.getElementById('topic-filter');
    const topics = ['all', ...new Set(
        GameState.questions.map(q => q.topic).filter(Boolean)
    )];
    select.innerHTML = topics.map(t =>
        `<option value="${t}">${t === 'all' ? 'All Topics' : t}</option>`
    ).join('');
}

function filterTopic() {
    GameState.selectedTopic = document.getElementById('topic-filter').value;
}

// ========================================
// SETUP STEPPERS
// ========================================
function adjustTeams(delta) {
    GameState.numTeams = Math.min(6, Math.max(2, GameState.numTeams + delta));
    document.getElementById('team-count').textContent = GameState.numTeams;
    generateTeamNameInputs();
}

function adjustTimer(delta) {
    GameState.timerDuration = Math.min(120, Math.max(20, GameState.timerDuration + delta));
    document.getElementById('timer-setting').textContent = GameState.timerDuration;
}

function adjustRounds(delta) {
    GameState.totalRounds = Math.min(10, Math.max(1, GameState.totalRounds + delta));
    document.getElementById('round-setting').textContent = GameState.totalRounds;
}

function generateTeamNameInputs() {
    const container  = document.getElementById('team-names');
    if (!container) return;

    const teamEmojis = ['🔴','🔵','🟢','🟡','🟣','🟠'];
    container.innerHTML = '';

    for (let i = 0; i < GameState.numTeams; i++) {
        const div       = document.createElement('div');
        div.className   = 'team-name-input';
        div.innerHTML   = `
            <span>${teamEmojis[i]}</span>
            <input type="text"
                   id="team-name-${i}"
                   placeholder="Team ${i + 1}"
                   value="${GameState.teamNames[i] || `Team ${i + 1}`}"
                   maxlength="20">
        `;
        container.appendChild(div);
    }
}

// ========================================
// START GAME
// ========================================
function startGame() {
    // Collect team names
    GameState.teamNames = [];
    for (let i = 0; i < GameState.numTeams; i++) {
        const input = document.getElementById(`team-name-${i}`);
        GameState.teamNames.push(input?.value.trim() || `Team ${i + 1}`);
    }

    // Build filtered pool
    if (GameState.selectedTopic === 'all') {
        GameState.filteredQuestions = [...GameState.questions];
    } else {
        GameState.filteredQuestions = GameState.questions.filter(
            q => q.topic === GameState.selectedTopic
        );
    }

    console.log('startGame — total questions:', GameState.questions.length);
    console.log('startGame — filtered questions:', GameState.filteredQuestions.length);
    console.log('startGame — topic filter:', GameState.selectedTopic);

    if (GameState.filteredQuestions.length === 0) {
        showToast('❌ No questions for selected topic!', 'error');
        return;
    }

    GameState.teamScores       = new Array(GameState.numTeams).fill(0);
    GameState.teamBadges       = Array.from({ length: GameState.numTeams }, () => []);
    GameState.usedIndices      = [];
    GameState.currentTeamIndex = 0;
    GameState.currentRound     = 1;

    showRulesScreen();
}

// ========================================
// RULES SCREEN
// ========================================
function showRulesScreen() {
    document.getElementById('current-team-display').textContent =
        GameState.teamNames[GameState.currentTeamIndex];
    document.getElementById('current-round-display').textContent =
        GameState.currentRound;
    document.getElementById('total-round-display').textContent =
        GameState.totalRounds;
    goToScreen('screen-rules');
}

// ========================================
// START TURN
// ========================================
function startTurn() {
    GameState.turnCorrect  = 0;
    GameState.turnSkipped  = 0;
    GameState.turnPoints   = 0;
    GameState.turnWords    = [];
    GameState.streak       = 0;
    GameState.timeLeft     = GameState.timerDuration;
    GameState.usedIndices  = []; // ← Reset every turn

    console.log('startTurn — questions in pool:', GameState.filteredQuestions.length);

    document.getElementById('game-team-name').textContent =
        GameState.teamNames[GameState.currentTeamIndex];
    document.getElementById('game-score').textContent =
        GameState.teamScores[GameState.currentTeamIndex];

    goToScreen('screen-game');
    loadNextQuestion();
    startTimer();
}

// ========================================
// LOAD NEXT QUESTION — FIXED
// ========================================
function loadNextQuestion() {
    const pool = GameState.filteredQuestions;

    if (!pool || pool.length === 0) {
        console.error('loadNextQuestion: pool is empty!');
        showToast('❌ No questions available!', 'error');
        endTurn();
        return;
    }

    // Find unused questions
    let available = pool
        .map((_, i) => i)
        .filter(i => !GameState.usedIndices.includes(i));

    // All used — reshuffle avoiding immediate repeat
    if (available.length === 0) {
        const lastUsed = GameState.usedIndices[GameState.usedIndices.length - 1];
        GameState.usedIndices = (lastUsed !== undefined) ? [lastUsed] : [];
        available = pool
            .map((_, i) => i)
            .filter(i => !GameState.usedIndices.includes(i));
        showToast('🔄 Reshuffling questions!', 'info');
    }

    // Pick random
    const randomIdx           = available[Math.floor(Math.random() * available.length)];
    GameState.usedIndices.push(randomIdx);
    GameState.currentQuestion = pool[randomIdx];

    console.log('Showing question', randomIdx, ':', GameState.currentQuestion.term);

    renderQuestion(GameState.currentQuestion);
}

// ========================================
// RENDER QUESTION
// ========================================
function renderQuestion(q) {
    const badge     = document.getElementById('difficulty-badge');
    badge.textContent = q.difficulty || 'Medium';
    badge.className   = `difficulty-badge ${q.difficulty || 'Medium'}`;

    document.getElementById('topic-label').textContent  = q.topic || 'Science';
    document.getElementById('the-word').textContent     = q.term.toUpperCase();
    document.getElementById('clue-text').textContent    = q.clue;

    const forbiddenContainer = document.getElementById('forbidden-words');
    forbiddenContainer.innerHTML = (q.forbidden || [])
        .map(w => `<span class="forbidden-word">${w}</span>`)
        .join('');

    const pts = q.points || 1;
    document.getElementById('points-value').textContent =
        `+${pts} point${pts !== 1 ? 's' : ''}`;

    document.getElementById('streak-text').textContent =
        `🔥 Streak: ${GameState.streak}`;

    document.getElementById('game-score').textContent =
        GameState.teamScores[GameState.currentTeamIndex] + GameState.turnPoints;
}

// ========================================
// TIMER
// ========================================
function startTimer() {
    clearInterval(GameState.timerInterval);
    updateTimerDisplay();

    GameState.timerInterval = setInterval(() => {
        GameState.timeLeft--;
        updateTimerDisplay();
        if (GameState.timeLeft <= 0) {
            clearInterval(GameState.timerInterval);
            endTurn();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('game-timer');
    timerEl.textContent = GameState.timeLeft;
    timerEl.classList.toggle('urgent', GameState.timeLeft <= 10);
}

function stopTimer() {
    clearInterval(GameState.timerInterval);
}

// ========================================
// CORRECT ANSWER
// ========================================
function correctAnswer() {
    const q   = GameState.currentQuestion;
    const pts = q.points || 1;

    GameState.turnCorrect++;
    GameState.turnPoints += pts;
    GameState.streak++;

    GameState.turnWords.push({ term: q.term, result: 'correct', pts });
    checkMidTurnBadges();

    stopTimer();
    showRewardScreen(q);
}

// ========================================
// SKIP
// ========================================
function skipWord() {
    const q = GameState.currentQuestion;

    GameState.turnSkipped++;
    GameState.turnPoints = Math.max(0, GameState.turnPoints - 1);
    GameState.streak     = 0;

    GameState.turnWords.push({ term: q.term, result: 'skipped', pts: -1 });
    document.getElementById('streak-text').textContent = '🔥 Streak: 0';

    showToast('⏭️ Skipped! −1 point', 'warning');
    loadNextQuestion();
}

// ========================================
// REWARD SCREEN
// ========================================
function showRewardScreen(q) {
    document.getElementById('reward-answer').textContent  = q.term;
    document.getElementById('fun-fact-text').textContent  =
        q.funFact || generateGenericFact(q.topic);

    GameState.wheelSpun    = false;
    GameState.pendingBonus = 0;

    const spinBtn       = document.getElementById('btn-spin');
    spinBtn.disabled    = false;
    spinBtn.textContent = 'Spin! 🎰';

    document.getElementById('spin-result').textContent    = '';
    document.getElementById('btn-continue').style.display = 'none';

    const wheelInner            = document.getElementById('wheel-inner');
    wheelInner.style.transition = 'none';
    wheelInner.style.transform  = `rotate(${GameState.wheelDeg % 360}deg)`;

    goToScreen('screen-reward');
    launchConfetti(30);
}

function generateGenericFact(topic) {
    const facts = {
        'Biology':     '🌿 Biology is the study of all living things — from bacteria to blue whales!',
        'Chemistry':   '⚗️ There are over 118 known elements in the Periodic Table!',
        'Physics':     '⚡ Physics explains everything from atoms to galaxies!',
        'Water Cycle': '💧 Earth has had the same water for over 4 billion years!',
        'Forces':      '🏋️ Every push or pull follows the same rules of physics!',
        'Energy':      '⚡ Energy cannot be created or destroyed — only converted!',
        'Matter':      '🔬 All matter is made of atoms — mostly empty space!',
        'Group I':     '🔥 Alkali metals are so reactive they are stored under oil!',
        'Group VII':   '🧪 Halogens all form diatomic molecules in their element form!',
        'Redox':       '⚗️ OIL RIG — Oxidation Is Loss, Reduction Is Gain of electrons!',
        'Metal Reactivity': '⚡ The reactivity series predicts displacement reactions!',
        'Transition Metals': '🌈 Transition metals form beautifully coloured compounds!',
    };
    return facts[topic] ||
        '🔬 Science helps us understand the amazing world around us. Keep exploring!';
}

// ========================================
// SPIN WHEEL
// ========================================
function spinWheel() {
    if (GameState.wheelSpun) return;
    GameState.wheelSpun = true;

    const btn       = document.getElementById('btn-spin');
    btn.disabled    = true;
    btn.textContent = 'Spinning...';

    const segmentIndex  = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle  = 360 / WHEEL_SEGMENTS.length;
    const extraSpins    = 5 * 360;
    const targetAngle   = segmentIndex * segmentAngle;
    const totalRotation = GameState.wheelDeg + extraSpins + (360 - targetAngle);
    GameState.wheelDeg  = totalRotation;

    const wheelInner            = document.getElementById('wheel-inner');
    wheelInner.style.transition = 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)';
    wheelInner.style.transform  = `rotate(${totalRotation}deg)`;

    setTimeout(() => processWheelResult(segmentIndex), 3200);
}

function processWheelResult(segmentIndex) {
    const segment     = WHEEL_SEGMENTS[segmentIndex];
    const resultEl    = document.getElementById('spin-result');
    const continueBtn = document.getElementById('btn-continue');
    let resultText    = '';

    if (segment.type === 'points') {
        GameState.pendingBonus = segment.bonus;
        resultText = `🎉 +${segment.bonus} Bonus Points!`;
        showToast(`🎰 +${segment.bonus} bonus points!`, 'success');
        if (segment.bonus === 5) {
            awardBadge('jackpot');
            launchConfetti(80);
        }
    } else if (segment.type === 'star') {
        GameState.pendingBonus = 0;
        resultText = `⭐ Star Player! Badge earned!`;
        awardBadge('first_correct');
        showToast('⭐ Star Player Badge earned!', 'success');
    } else if (segment.type === 'lab') {
        GameState.pendingBonus = 1;
        resultText = `🧪 Lab Genius! +1 bonus point!`;
        showToast('🧪 Lab Genius! +1 bonus!', 'success');
    }

    resultEl.textContent              = resultText;
    document.getElementById('btn-spin').textContent = '✅ Done!';
    continueBtn.style.display         = 'flex';
}

// ========================================
// CONTINUE AFTER REWARD
// ========================================
function continueGame() {
    GameState.turnPoints   += GameState.pendingBonus;
    GameState.pendingBonus  = 0;

    document.getElementById('game-score').textContent =
        GameState.teamScores[GameState.currentTeamIndex] + GameState.turnPoints;

    goToScreen('screen-game');
    loadNextQuestion();
    startTimer();
}

// ========================================
// END TURN
// ========================================
function endTurn() {
    stopTimer();
    checkEndTurnBadges();
    GameState.teamScores[GameState.currentTeamIndex] +=
        Math.max(0, GameState.turnPoints);
    showTurnEndScreen();
}

function showTurnEndScreen() {
    document.getElementById('turn-team-name').textContent =
        GameState.teamNames[GameState.currentTeamIndex];
    document.getElementById('turn-correct').textContent  = GameState.turnCorrect;
    document.getElementById('turn-skipped').textContent  = GameState.turnSkipped;
    document.getElementById('turn-points').textContent   =
        Math.max(0, GameState.turnPoints);

    const reviewContainer = document.getElementById('words-reviewed');
    if (GameState.turnWords.length === 0) {
        reviewContainer.innerHTML =
            '<p style="color:var(--text-sub);font-size:0.85rem;text-align:center;">No words attempted</p>';
    } else {
        reviewContainer.innerHTML = GameState.turnWords.map(w => `
            <div class="word-result ${w.result === 'correct' ? 'correct-word' : 'skipped-word'}">
                <span>${w.result === 'correct' ? '✅' : '⏭️'} ${w.term}</span>
                <span>${w.result === 'correct' ? '+' + w.pts : '−1'} pts</span>
            </div>
        `).join('');
    }

    const nextBtn       = document.querySelector('#screen-turnend .btn-next');
    nextBtn.textContent = isGameOver() ? '🏆 See Results!' : 'Next Team ▶️';

    goToScreen('screen-turnend');
}

// ========================================
// NEXT TURN
// ========================================
function nextTurn() {
    if (isGameOver()) {
        showFinalScreen();
        return;
    }

    GameState.currentTeamIndex++;
    if (GameState.currentTeamIndex >= GameState.numTeams) {
        GameState.currentTeamIndex = 0;
        GameState.currentRound++;
    }

    showRulesScreen();
}

function isGameOver() {
    return (
        GameState.currentTeamIndex === GameState.numTeams - 1 &&
        GameState.currentRound     === GameState.totalRounds
    );
}

// ========================================
// FINAL SCREEN
// ========================================
function showFinalScreen() {
    const scores   = GameState.teamScores;
    const maxScore = Math.max(...scores);
    const tied     = scores.filter(s => s === maxScore).length > 1;
    const winnerIdx = scores.indexOf(maxScore);

    document.getElementById('winner-text').textContent = tied
        ? "🤝 It's a Tie!"
        : `${GameState.teamNames[winnerIdx]} Wins! 🎉`;

    const sorted = scores
        .map((s, i) => ({ name: GameState.teamNames[i], score: s }))
        .sort((a, b) => b.score - a.score);

    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];

    document.getElementById('final-scores').innerHTML = sorted.map((t, rank) => `
        <div class="final-score-row ${t.score === maxScore ? 'winner' : ''}">
            <span class="final-team-name">${medals[rank]} ${t.name}</span>
            <span class="final-team-score">${t.score} pts</span>
        </div>
    `).join('');

    renderBadges();
    goToScreen('screen-final');
    launchConfetti(100);
}

function renderBadges() {
    const container = document.getElementById('badges-earned');
    const allBadges = GameState.teamBadges.flat();

    if (allBadges.length === 0) {
        container.innerHTML =
            '<h3>🏅 Badges Earned</h3><p style="color:var(--text-sub);font-size:0.85rem;">No badges this game — try harder next time!</p>';
        return;
    }

    const uniqueBadges = [...new Set(allBadges)];
    const badgeHTML    = uniqueBadges.map(id => {
        const badge = BADGES.find(b => b.id === id);
        return badge ? `<div class="badge">${badge.emoji} ${badge.name}</div>` : '';
    }).join('');

    container.innerHTML = `
        <h3>🏅 Badges Earned</h3>
        <div class="badges-grid">${badgeHTML}</div>
    `;
}

// ========================================
// BADGE SYSTEM
// ========================================
function awardBadge(badgeId) {
    const teamIdx = GameState.currentTeamIndex;
    if (!GameState.teamBadges[teamIdx].includes(badgeId)) {
        GameState.teamBadges[teamIdx].push(badgeId);
        const badge = BADGES.find(b => b.id === badgeId);
        if (badge) showToast(`🏅 Badge: ${badge.emoji} ${badge.name}`, 'success');
    }
}

function checkMidTurnBadges() {
    if (GameState.turnCorrect === 1 && GameState.currentRound === 1) {
        awardBadge('first_correct');
    }
    if (GameState.streak === 3) awardBadge('streak_3');
    if (GameState.streak === 5) awardBadge('streak_5');
    if (GameState.currentQuestion?.difficulty === 'Hard') {
        awardBadge('hard_correct');
    }
}

function checkEndTurnBadges() {
    if (GameState.turnSkipped === 0 && GameState.turnCorrect > 0) {
        awardBadge('no_skip');
    }
    if (GameState.turnSkipped === 0 && GameState.turnCorrect >= 3) {
        awardBadge('all_correct');
    }
}

// ========================================
// TOAST
// ========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast     = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========================================
// CONFETTI
// ========================================
function launchConfetti(count = 60) {
    const canvas  = document.getElementById('confetti-canvas');
    const ctx     = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b','#10b981','#6366f1','#ef4444','#06b6d4','#ec4899'];
    const pieces = Array.from({ length: count }, () => ({
        x:        Math.random() * canvas.width,
        y:        Math.random() * -canvas.height,
        w:        Math.random() * 12 + 6,
        h:        Math.random() * 6 + 4,
        color:    colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speed:    Math.random() * 4 + 2,
        rotSpeed: Math.random() * 4 - 2,
    }));

    let frame = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
            p.y        += p.speed;
            p.rotation += p.rotSpeed;
        });
        frame++;
        if (frame < 180) {
            requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    draw();
}

// ========================================
// RESET / HOME
// ========================================
function resetGame() {
    GameState.currentTeamIndex  = 0;
    GameState.currentRound      = 1;
    GameState.teamScores        = new Array(GameState.numTeams).fill(0);
    GameState.teamBadges        = Array.from({ length: GameState.numTeams }, () => []);
    GameState.usedIndices       = [];
    GameState.streak            = 0;
    showRulesScreen();
}

function goHome() {
    stopTimer();
    Object.assign(GameState, {
        level:              null,
        questions:          [],
        filteredQuestions:  [],
        usedIndices:        [],
        currentQuestion:    null,
        numTeams:           2,
        timerDuration:      60,
        totalRounds:        3,
        selectedTopic:      'all',
        teamNames:          ['Team 1', 'Team 2'],
        currentTeamIndex:   0,
        currentRound:       1,
        teamScores:         [],
        teamBadges:         [],
        streak:             0,
    });

    document.getElementById('upload-status').textContent     = '';
    document.getElementById('json-upload').value             = '';
    document.getElementById('chapter-select').style.display = 'none';
    ChapterManager.clear();
    renderChapterList();
    goToScreen('screen-welcome');
}
