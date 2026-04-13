/* ========================================
   SCIENCE CHARADES - GAME LOGIC
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

    // Setup
    numTeams: 2,
    timerDuration: 60,
    totalRounds: 3,
    selectedTopic: 'all',
    teamNames: ['Team 1', 'Team 2'],

    // Progress
    currentTeamIndex: 0,
    currentRound: 1,
    teamScores: [],
    teamBadges: [],

    // Turn tracking
    turnCorrect: 0,
    turnSkipped: 0,
    turnPoints: 0,
    turnWords: [],
    streak: 0,

    // Timer
    timerInterval: null,
    timeLeft: 60,

    // Wheel
    wheelSpun: false,
    wheelDeg: 0,

    // Pending reward
    pendingBonus: 0,
};

// ========================================
// BUILT-IN FALLBACK QUESTIONS
// (Used only if no JSON loaded)
// ========================================
const FALLBACK_QUESTIONS = {
    psle: [
        {
            term: "Photosynthesis",
            topic: "Biology",
            difficulty: "Medium",
            clue: "A process plants use to make their own food using sunlight",
            forbidden: ["sun", "light", "plant", "food", "green"],
            funFact: "A single large tree can absorb up to 48 pounds of carbon dioxide per year through this process!",
            points: 2
        },
        {
            term: "Evaporation",
            topic: "Water Cycle",
            difficulty: "Easy",
            clue: "Liquid water changes into water vapour and rises into the air",
            forbidden: ["water", "vapour", "liquid", "gas", "steam"],
            funFact: "The ocean loses about 1 metre of water depth every year through this process!",
            points: 1
        },
        {
            term: "Condensation",
            topic: "Water Cycle",
            difficulty: "Easy",
            clue: "Water vapour cools down and turns back into tiny water droplets",
            forbidden: ["water", "cool", "cloud", "droplet", "vapour"],
            funFact: "The drops of water you see on a cold glass of drink on a hot day are formed this way!",
            points: 1
        },
        {
            term: "Germination",
            topic: "Biology",
            difficulty: "Easy",
            clue: "This is when a seed begins to sprout and grow into a new plant",
            forbidden: ["seed", "grow", "plant", "sprout", "soil"],
            funFact: "A 2000-year-old date palm seed found in Israel was successfully made to do this in 2005!",
            points: 1
        },
        {
            term: "Pollination",
            topic: "Biology",
            difficulty: "Medium",
            clue: "Pollen is transferred from one flower to another, often with the help of insects",
            forbidden: ["pollen", "flower", "bee", "insect", "transfer"],
            funFact: "A single bee can visit up to 5000 flowers in a single day during this process!",
            points: 2
        },
        {
            term: "Electrical Conductor",
            topic: "Physics",
            difficulty: "Easy",
            clue: "A material that allows electricity to flow through it easily",
            forbidden: ["electricity", "flow", "wire", "metal", "copper"],
            funFact: "Silver is the best one of these, but copper is used more because it is much cheaper!",
            points: 1
        },
        {
            term: "Magnetic Force",
            topic: "Physics",
            difficulty: "Easy",
            clue: "An invisible push or pull between magnets or between a magnet and certain metals",
            forbidden: ["magnet", "attract", "repel", "iron", "north"],
            funFact: "Earth itself acts like a giant version of this — that is how compasses work!",
            points: 1
        },
        {
            term: "Decomposition",
            topic: "Biology",
            difficulty: "Medium",
            clue: "Dead plants and animals are broken down into simpler substances by tiny organisms",
            forbidden: ["dead", "break", "bacteria", "fungi", "rot"],
            funFact: "Without this process, Earth would be buried in dead plants and animals within decades!",
            points: 2
        },
        {
            term: "Adaptation",
            topic: "Biology",
            difficulty: "Medium",
            clue: "A special feature or behaviour that helps a living thing survive in its environment",
            forbidden: ["survive", "environment", "feature", "animal", "habitat"],
            funFact: "The Arctic fox changes its fur colour from brown in summer to white in winter as a form of this!",
            points: 2
        },
        {
            term: "Friction",
            topic: "Physics",
            difficulty: "Easy",
            clue: "A force that slows things down when two surfaces rub against each other",
            forbidden: ["rub", "surface", "slow", "force", "rough"],
            funFact: "Your car tyres would be useless on ice because there is almost none of this force there!",
            points: 1
        }
    ],
    olevel: [
        {
            term: "Osmosis",
            topic: "Biology",
            difficulty: "Hard",
            clue: "Movement of water molecules across a partially permeable membrane from a region of higher water potential to lower",
            forbidden: ["water", "membrane", "diffuse", "concentration", "permeable"],
            funFact: "This is why drinking seawater actually makes you MORE dehydrated — it pulls water OUT of your cells!",
            points: 3
        },
        {
            term: "Mitosis",
            topic: "Biology",
            difficulty: "Hard",
            clue: "A type of cell division that produces two genetically identical daughter cells for growth and repair",
            forbidden: ["cell", "divide", "chromosome", "nucleus", "daughter"],
            funFact: "Your body performs this process about 25 million times every second to replace old cells!",
            points: 3
        },
        {
            term: "Neutralisation",
            topic: "Chemistry",
            difficulty: "Medium",
            clue: "A chemical reaction between an acid and an alkali that produces salt and water",
            forbidden: ["acid", "alkali", "salt", "reaction", "base"],
            funFact: "Indigestion tablets use this reaction — the tablet contains a base that reacts with stomach acid!",
            points: 2
        },
        {
            term: "Electrolysis",
            topic: "Chemistry",
            difficulty: "Hard",
            clue: "Using electrical energy to break down a compound into its elements using electrodes",
            forbidden: ["electricity", "electrode", "anode", "cathode", "ion"],
            funFact: "This process is used to extract aluminium from bauxite ore and to electroplate metals like gold!",
            points: 3
        },
        {
            term: "Natural Selection",
            topic: "Biology",
            difficulty: "Hard",
            clue: "The process by which organisms with favourable traits survive and reproduce more successfully",
            forbidden: ["survive", "trait", "evolution", "Darwin", "reproduce"],
            funFact: "Peppered moths in England changed colour during the Industrial Revolution as a real-life example of this!",
            points: 3
        },
        {
            term: "Potential Difference",
            topic: "Physics",
            difficulty: "Medium",
            clue: "The work done per unit charge between two points in a circuit, measured in volts",
            forbidden: ["voltage", "volt", "charge", "circuit", "battery"],
            funFact: "The potential difference across a lightning bolt can be up to one billion volts!",
            points: 2
        },
        {
            term: "Enzyme",
            topic: "Biology",
            difficulty: "Medium",
            clue: "A biological catalyst made of protein that speeds up chemical reactions in living things without being used up",
            forbidden: ["catalyst", "protein", "reaction", "speed", "biological"],
            funFact: "The enzyme in your saliva starts breaking down the starch in bread before you even swallow it!",
            points: 2
        },
        {
            term: "Oxidation",
            topic: "Chemistry",
            difficulty: "Medium",
            clue: "A chemical change where a substance loses electrons or gains oxygen",
            forbidden: ["oxygen", "electron", "lose", "gain", "rust"],
            funFact: "The browning of a cut apple is a form of this — the iron compounds in the apple react with air!",
            points: 2
        },
        {
            term: "Refraction",
            topic: "Physics",
            difficulty: "Medium",
            clue: "The bending of a wave as it passes from one medium into another of different density",
            forbidden: ["bend", "light", "wave", "medium", "glass"],
            funFact: "This is why a straw in a glass of water appears to be broken or bent at the surface!",
            points: 2
        },
        {
            term: "Respiration",
            topic: "Biology",
            difficulty: "Medium",
            clue: "A chemical process in cells that releases energy from glucose — happens in every living cell",
            forbidden: ["energy", "glucose", "oxygen", "breathe", "cell"],
            funFact: "You can do this without oxygen — athletes doing sprints rely on the anaerobic version for quick energy bursts!",
            points: 2
        }
    ]
};

// ========================================
// WHEEL CONFIGURATION
// ========================================
const WHEEL_SEGMENTS = [
    { label: '+1',  bonus: 1,   type: 'points' },
    { label: '+3',  bonus: 3,   type: 'points' },
    { label: '⭐',  bonus: 0,   type: 'star'   },
    { label: '+2',  bonus: 2,   type: 'points' },
    { label: '🧪',  bonus: 0,   type: 'lab'    },
    { label: '+5',  bonus: 5,   type: 'points' },
];

// ========================================
// BADGES CONFIGURATION
// ========================================
const BADGES = [
    { id: 'first_correct',  emoji: '🎯', name: 'First Blood',      desc: 'First correct answer'           },
    { id: 'streak_3',       emoji: '🔥', name: 'On Fire',          desc: '3 answers in a row'             },
    { id: 'streak_5',       emoji: '💥', name: 'Unstoppable',      desc: '5 answers in a row'             },
    { id: 'no_skip',        emoji: '🎖️', name: 'No Mercy',         desc: 'Zero skips in a turn'           },
    { id: 'jackpot',        emoji: '🎰', name: 'Jackpot!',         desc: 'Landed +5 on the wheel'         },
    { id: 'hard_correct',   emoji: '🧠', name: 'Big Brain',        desc: 'Correct on a Hard question'     },
    { id: 'all_correct',    emoji: '👑', name: 'Perfect Turn',     desc: 'All correct, no skips in a turn'},
];

// ========================================
// INIT ON LOAD
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

    // Colour blobs
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 80 + 20;
        p.style.cssText = `
            width:${size}px; height:${size}px;
            left:${Math.random()*100}%;
            background:${colors[Math.floor(Math.random()*colors.length)]};
            animation-duration:${Math.random()*15+10}s;
            animation-delay:${Math.random()*10}s;
        `;
        container.appendChild(p);
    }

    // Floating emojis
    for (let i = 0; i < 10; i++) {
        const e = document.createElement('div');
        e.style.cssText = `
            position:absolute;
            font-size:${Math.random()*20+14}px;
            left:${Math.random()*100}%;
            opacity:0.12;
            animation: float-up linear infinite;
            animation-duration:${Math.random()*20+12}s;
            animation-delay:${Math.random()*12}s;
            pointer-events:none;
        `;
        e.textContent = emojis[Math.floor(Math.random()*emojis.length)];
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
    GameState.questions = FALLBACK_QUESTIONS[level] || [];
    populateTopicFilter();
    generateTeamNameInputs();
    goToScreen('screen-setup');
    showToast(`📚 ${level.toUpperCase()} level selected!`, 'info');
}

// ========================================
// JSON UPLOAD HANDLER
// ========================================
function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Accept formats:
            // { psle: [...], olevel: [...] }  OR  { questions: [...] }  OR  [...]
            let questions = [];

            if (Array.isArray(data)) {
                questions = data;
            } else if (data.questions) {
                questions = data.questions;
            } else if (data.psle || data.olevel) {
                // Merge both levels if present
                questions = [
                    ...(data.psle || []),
                    ...(data.olevel || [])
                ];
                // Also set level-specific
                FALLBACK_QUESTIONS.psle = data.psle || FALLBACK_QUESTIONS.psle;
                FALLBACK_QUESTIONS.olevel = data.olevel || FALLBACK_QUESTIONS.olevel;
            }

            if (questions.length === 0) {
                throw new Error('No questions found in file');
            }

            // Validate structure
            validateQuestions(questions);

            GameState.questions = questions;
            GameState.level = 'custom';

            document.getElementById('upload-status').textContent =
                `✅ ${questions.length} questions loaded!`;

            populateTopicFilter();
            generateTeamNameInputs();
            goToScreen('screen-setup');
            showToast(`📁 ${questions.length} questions loaded!`, 'success');

        } catch (err) {
            document.getElementById('upload-status').textContent = `❌ Error: ${err.message}`;
            showToast(`❌ ${err.message}`, 'error');
        }
    };
    reader.readAsText(file);
}

function validateQuestions(questions) {
    const required = ['term', 'clue', 'forbidden'];
    questions.forEach((q, i) => {
        required.forEach(field => {
            if (!q[field]) {
                throw new Error(`Question ${i + 1} missing field: "${field}"`);
            }
        });
        if (!Array.isArray(q.forbidden)) {
            throw new Error(`Question ${i + 1}: "forbidden" must be an array`);
        }
    });
}

// ========================================
// TOPIC FILTER
// ========================================
function populateTopicFilter() {
    const select = document.getElementById('topic-filter');
    const topics = ['all', ...new Set(GameState.questions.map(q => q.topic).filter(Boolean))];

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
    const container = document.getElementById('team-names');
    if (!container) return;

    const teamEmojis = ['🔴','🔵','🟢','🟡','🟣','🟠'];
    container.innerHTML = '';

    for (let i = 0; i < GameState.numTeams; i++) {
        const div = document.createElement('div');
        div.className = 'team-name-input';
        div.innerHTML = `
            <span>${teamEmojis[i]}</span>
            <input
                type="text"
                id="team-name-${i}"
                placeholder="Team ${i + 1}"
                value="${GameState.teamNames[i] || `Team ${i + 1}`}"
                maxlength="20"
            />
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

    // Filter questions by topic
    GameState.filteredQuestions = GameState.selectedTopic === 'all'
        ? [...GameState.questions]
        : GameState.questions.filter(q => q.topic === GameState.selectedTopic);

    if (GameState.filteredQuestions.length === 0) {
        showToast('❌ No questions for selected topic!', 'error');
        return;
    }

    // Init scores and badges
    GameState.teamScores = new Array(GameState.numTeams).fill(0);
    GameState.teamBadges = Array.from({ length: GameState.numTeams }, () => []);
    GameState.usedIndices = [];
    GameState.currentTeamIndex = 0;
    GameState.currentRound = 1;

    showRulesScreen();
}

// ========================================
// RULES SCREEN
// ========================================
function showRulesScreen() {
    const teamName = GameState.teamNames[GameState.currentTeamIndex];
    document.getElementById('current-team-display').textContent = teamName;
    document.getElementById('current-round-display').textContent = GameState.currentRound;
    document.getElementById('total-round-display').textContent = GameState.totalRounds;
    goToScreen('screen-rules');
}

// ========================================
// START A TURN
// ========================================
function startTurn() {
    // Reset turn state
    GameState.turnCorrect  = 0;
    GameState.turnSkipped  = 0;
    GameState.turnPoints   = 0;
    GameState.turnWords    = [];
    GameState.streak       = 0;
    GameState.timeLeft     = GameState.timerDuration;

    // Update header
    document.getElementById('game-team-name').textContent =
        GameState.teamNames[GameState.currentTeamIndex];
    document.getElementById('game-score').textContent =
        GameState.teamScores[GameState.currentTeamIndex];

    goToScreen('screen-game');
    loadNextQuestion();
    startTimer();
}

// ========================================
// LOAD NEXT QUESTION
// ========================================
function loadNextQuestion() {
    // Get available questions
    let available = GameState.filteredQuestions
        .map((q, i) => i)
        .filter(i => !GameState.usedIndices.includes(i));

    // If all used, reset pool
    if (available.length === 0) {
        GameState.usedIndices = [];
        available = GameState.filteredQuestions.map((_, i) => i);
    }

    // Pick random question
    const randomIdx = available[Math.floor(Math.random() * available.length)];
    GameState.usedIndices.push(randomIdx);
    GameState.currentQuestion = GameState.filteredQuestions[randomIdx];

    renderQuestion(GameState.currentQuestion);
}

function renderQuestion(q) {
    // Set difficulty badge
    const badge = document.getElementById('difficulty-badge');
    badge.textContent = q.difficulty || 'Medium';
    badge.className = `difficulty-badge ${q.difficulty || 'Medium'}`;

    // Set topic
    document.getElementById('topic-label').textContent = q.topic || 'Science';

    // Set the word
    document.getElementById('the-word').textContent = q.term.toUpperCase();

    // Set clue
    document.getElementById('clue-text').textContent = q.clue;

    // Set forbidden words
    const forbiddenContainer = document.getElementById('forbidden-words');
    forbiddenContainer.innerHTML = (q.forbidden || [])
        .map(w => `<span class="forbidden-word">${w}</span>`)
        .join('');

    // Set points
    const pts = q.points || 1;
    document.getElementById('points-value').textContent = `+${pts} point${pts !== 1 ? 's' : ''}`;

    // Update streak
    document.getElementById('streak-text').textContent = `🔥 Streak: ${GameState.streak}`;

    // Update score display
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

    if (GameState.timeLeft <= 10) {
        timerEl.classList.add('urgent');
    } else {
        timerEl.classList.remove('urgent');
    }
}

function stopTimer() {
    clearInterval(GameState.timerInterval);
}

// ========================================
// CORRECT ANSWER
// ========================================
function correctAnswer() {
    const q = GameState.currentQuestion;
    const pts = q.points || 1;

    GameState.turnCorrect++;
    GameState.turnPoints += pts;
    GameState.streak++;

    // Track word result
    GameState.turnWords.push({ term: q.term, result: 'correct', pts });

    // Check badges mid-turn
    checkMidTurnBadges();

    // Go to reward screen
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
    GameState.streak = 0;

    GameState.turnWords.push({ term: q.term, result: 'skipped', pts: -1 });

    document.getElementById('streak-text').textContent = `🔥 Streak: 0`;
    showToast('⏭️ Skipped! −1 point', 'warning');

    loadNextQuestion();
}

// ========================================
// REWARD SCREEN
// ========================================
function showRewardScreen(q) {
    // Set answer
    document.getElementById('reward-answer').textContent = q.term;

    // Set fun fact
    document.getElementById('fun-fact-text').textContent =
        q.funFact || generateGenericFact(q.topic);

    // Reset wheel
    GameState.wheelSpun = false;
    GameState.pendingBonus = 0;
    document.getElementById('btn-spin').disabled = false;
    document.getElementById('btn-spin').textContent = 'Spin! 🎰';
    document.getElementById('spin-result').textContent = '';
    document.getElementById('btn-continue').style.display = 'none';

    // Reset wheel rotation visually
    const wheelInner = document.getElementById('wheel-inner');
    wheelInner.style.transition = 'none';
    wheelInner.style.transform = `rotate(${GameState.wheelDeg % 360}deg)`;

    goToScreen('screen-reward');
    launchConfetti(30);
}

function generateGenericFact(topic) {
    const facts = {
        'Biology': '🌿 Biology is the study of all living things — from the tiniest bacteria to the largest whales!',
        'Chemistry': '⚗️ There are over 118 known elements in the periodic table, each with unique properties!',
        'Physics': '⚡ Physics explains everything from how atoms behave to how galaxies move through space!',
        'Water Cycle': '💧 Earth has had the same water for over 4 billion years — recycled through the water cycle!',
    };
    return facts[topic] || '🔬 Science helps us understand the amazing world around us. Keep exploring!';
}

// ========================================
// SPIN WHEEL
// ========================================
function spinWheel() {
    if (GameState.wheelSpun) return;
    GameState.wheelSpun = true;

    const btn = document.getElementById('btn-spin');
    btn.disabled = true;
    btn.textContent = 'Spinning...';

    // Random segment (0-5)
    const segmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;

    // Calculate rotation to land on segment
    const extraSpins = 5 * 360;
    const targetAngle = segmentIndex * segmentAngle;
    const totalRotation = GameState.wheelDeg + extraSpins + (360 - targetAngle);
    GameState.wheelDeg = totalRotation;

    const wheelInner = document.getElementById('wheel-inner');
    wheelInner.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheelInner.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
        processWheelResult(segmentIndex);
    }, 3200);
}

function processWheelResult(segmentIndex) {
    const segment = WHEEL_SEGMENTS[segmentIndex];
    const resultEl = document.getElementById('spin-result');
    const continueBtn = document.getElementById('btn-continue');

    let resultText = '';

    if (segment.type === 'points') {
        GameState.pendingBonus = segment.bonus;
        resultText = `🎉 +${segment.bonus} Bonus Points!`;
        showToast(`🎰 Jackpot! +${segment.bonus} bonus!`, 'success');

        if (segment.bonus === 5) {
            awardBadge('jackpot');
            launchConfetti(80);
        }
    } else if (segment.type === 'star') {
        GameState.pendingBonus = 0;
        resultText = `⭐ Star Player! Your team gets a Star Badge!`;
        awardBadge('first_correct');
        showToast('⭐ Star Player Badge earned!', 'success');
    } else if (segment.type === 'lab') {
        GameState.pendingBonus = 0;
        resultText = `🧪 Lab Genius! +1 bonus point and a special badge!`;
        GameState.pendingBonus = 1;
        showToast('🧪 Lab Genius Badge earned!', 'success');
    }

    resultEl.textContent = resultText;
    document.getElementById('btn-spin').textContent = '✅ Done!';
    continueBtn.style.display = 'flex';
}

// ========================================
// CONTINUE AFTER REWARD
// ========================================
function continueGame() {
    // Apply bonus points
    GameState.turnPoints += GameState.pendingBonus;
    GameState.pendingBonus = 0;

    // Update score display
    document.getElementById('game-score').textContent =
        GameState.teamScores[GameState.currentTeamIndex] + GameState.turnPoints;

    // Resume timer and load next question
    goToScreen('screen-game');
    loadNextQuestion();
    startTimer();
}

// ========================================
// END TURN
// ========================================
function endTurn() {
    stopTimer();

    // Check end-of-turn badges
    checkEndTurnBadges();

    // Apply turn points to team score
    GameState.teamScores[GameState.currentTeamIndex] += Math.max(0, GameState.turnPoints);

    // Show turn end screen
    showTurnEndScreen();
}

function showTurnEndScreen() {
    const teamName = GameState.teamNames[GameState.currentTeamIndex];

    document.getElementById('turn-team-name').textContent = teamName;
    document.getElementById('turn-correct').textContent  = GameState.turnCorrect;
    document.getElementById('turn-skipped').textContent  = GameState.turnSkipped;
    document.getElementById('turn-points').textContent   = Math.max(0, GameState.turnPoints);

    // Words reviewed list
    const reviewContainer = document.getElementById('words-reviewed');
    if (GameState.turnWords.length === 0) {
        reviewContainer.innerHTML = '<p style="color:var(--text-sub);font-size:0.85rem;text-align:center;">No words attempted</p>';
    } else {
        reviewContainer.innerHTML = GameState.turnWords.map(w => `
            <div class="word-result ${w.result === 'correct' ? 'correct-word' : 'skipped-word'}">
                <span>${w.result === 'correct' ? '✅' : '⏭️'} ${w.term}</span>
                <span>${w.result === 'correct' ? '+' + w.pts : '−1'} pts</span>
            </div>
        `).join('');
    }

    // Update next button text
    const nextBtn = document.querySelector('#screen-turnend .btn-next');
    const isLastTurn = isGameOver();
    nextBtn.textContent = isLastTurn ? '🏆 See Results!' : 'Next Team ▶️';

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

    // Advance team / round
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
        GameState.currentRound === GameState.totalRounds
    );
}

// ========================================
// FINAL SCREEN
// ========================================
function showFinalScreen() {
    const scores = GameState.teamScores;
    const maxScore = Math.max(...scores);
    const winnerIdx = scores.indexOf(maxScore);
    const winnerName = GameState.teamNames[winnerIdx];

    // Winner text
    const tied = scores.filter(s => s === maxScore).length > 1;
    document.getElementById('winner-text').textContent =
        tied ? "🤝 It's a Tie!" : `${winnerName} Wins! 🎉`;

    // Score rows
    const scoreContainer = document.getElementById('final-scores');
    const sorted = scores
        .map((s, i) => ({ name: GameState.teamNames[i], score: s, idx: i }))
        .sort((a, b) => b.score - a.score);

    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];

    scoreContainer.innerHTML = sorted.map((t, rank) => `
        <div class="final-score-row ${t.score === maxScore ? 'winner' : ''}">
            <span class="final-team-name">${medals[rank]} ${t.name}</span>
            <span class="final-team-score">${t.score} pts</span>
        </div>
    `).join('');

    // Badges
    renderBadges();

    goToScreen('screen-final');
    launchConfetti(100);
}

function renderBadges() {
    const container = document.getElementById('badges-earned');
    const allBadges = GameState.teamBadges.flat();

    if (allBadges.length === 0) {
        container.innerHTML = '<p style="color:var(--text-sub);font-size:0.85rem;">No badges earned yet — play harder next time!</p>';
        return;
    }

    const uniqueBadges = [...new Set(allBadges)];
    const badgeHTML = uniqueBadges.map(id => {
        const badge = BADGES.find(b => b.id === id);
        return badge
            ? `<div class="badge">${badge.emoji} ${badge.name}</div>`
            : '';
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
        if (badge) {
            showToast(`🏅 Badge: ${badge.emoji} ${badge.name}`, 'success');
        }
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
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ========================================
// CONFETTI
// ========================================
function launchConfetti(count = 60) {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b','#10b981','#6366f1','#ef4444','#06b6d4','#ec4899'];
    const pieces = [];

    for (let i = 0; i < count; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            w: Math.random() * 12 + 6,
            h: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            speed: Math.random() * 4 + 2,
            rotSpeed: Math.random() * 4 - 2,
        });
    }

    let frame = 0;
    const maxFrames = 180;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();

            p.y += p.speed;
            p.rotation += p.rotSpeed;
        });

        frame++;
        if (frame < maxFrames) {
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
    GameState.currentTeamIndex = 0;
    GameState.currentRound = 1;
    GameState.teamScores = new Array(GameState.numTeams).fill(0);
    GameState.teamBadges = Array.from({ length: GameState.numTeams }, () => []);
    GameState.usedIndices = [];
    GameState.streak = 0;

    showRulesScreen();
}

function goHome() {
    stopTimer();
    Object.assign(GameState, {
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
        streak: 0,
    });

    document.getElementById('upload-status').textContent = '';
    document.getElementById('json-upload').value = '';
    goToScreen('screen-welcome');
}