// Math Game for Kids
const PUZZLE_KEY = 'mathgame_puzzles';
const STATE_KEY = 'mathgame_state';
const HISTORY_KEY = 'mathgame_history';

let puzzles = [];
let puzzleStack = [];
let state = {
  correct: 0,
  wrong: 0,
  current: null
};

function generatePuzzles() {
  const all = [];
  for (let a = 10; a <= 99; a++) {
    for (let b = 1; b <= 9; b++) {
      all.push({ a, b });
    }
  }
  return all;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  localStorage.setItem(PUZZLE_KEY, JSON.stringify(puzzleStack));
}

function loadState() {
  const s = localStorage.getItem(STATE_KEY);
  const p = localStorage.getItem(PUZZLE_KEY);
  if (s && p) {
    state = JSON.parse(s);
    puzzleStack = JSON.parse(p);
    return true;
  }
  return false;
}

function saveHistoryEntry(entry) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  history.push(entry);
  if (history.length > 50) history = history.slice(-50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function resetGame() {
  // Save previous game to history before resetting, if it was played
  if (state.correct > 0 || state.wrong > 0) {
    saveHistoryEntry({ correct: state.correct, wrong: state.wrong, date: Date.now() });
  }
  state = { correct: 0, wrong: 0, current: null };
  puzzles = generatePuzzles();
  puzzleStack = shuffle([...puzzles]);
  nextPuzzle();
  saveState();
  updateScore();
}

function nextPuzzle() {
  if (puzzleStack.length === 0) {
    puzzleStack = shuffle(generatePuzzles());
  }
  state.current = puzzleStack.pop();
  saveState();
  renderPuzzle();
}

function updateScore() {
  document.getElementById('correct-count').textContent = state.correct;
  document.getElementById('wrong-count').textContent = state.wrong;
}

function renderPuzzle() {
  const { a, b } = state.current;
  const correct = a + b;
  let options = [correct, correct + 1, correct - 1];
  options = Array.from(new Set(options)).filter(x => x >= 0);
  options = shuffle(options);
  const puzzleDiv = document.getElementById('puzzle');
  // Render each part as a span for independent animation
  puzzleDiv.innerHTML = `
    <span class="puzzle-digit a">${a}</span>
    <span class="puzzle-digit op">+</span>
    <span class="puzzle-digit b">${b}</span>
  `;
  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(opt, correct);
    answersDiv.appendChild(btn);
  });
  document.getElementById('overlay').style.display = 'none';
}

function selectAnswer(selected, correct) {
  const btns = document.querySelectorAll('.answer-btn');
  btns.forEach(btn => {
    if (parseInt(btn.textContent) === correct) {
      btn.classList.add('correct');
    }
    if (parseInt(btn.textContent) === selected) {
      btn.classList.add(selected === correct ? 'correct' : 'wrong', 'selected');
    }
    btn.disabled = true;
  });
  let isCorrect = selected === correct;
  if (isCorrect) {
    state.correct++;
  } else {
    state.wrong++;
  }
  updateScore();
  saveState();
  // Show overlay with face
  const overlay = document.getElementById('overlay');
  const face = document.getElementById('face');
  if (isCorrect) {
    face.innerHTML = `<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="55" fill="#fffde7" stroke="#ffd700" stroke-width="6"/><circle cx="45" cy="55" r="8" fill="#222"/><circle cx="75" cy="55" r="8" fill="#222"/><path d="M45 80 Q60 95 75 80" stroke="#43a047" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
  } else {
    face.innerHTML = `<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="55" fill="#fffde7" stroke="#ffd700" stroke-width="6"/><circle cx="45" cy="55" r="8" fill="#222"/><circle cx="75" cy="55" r="8" fill="#222"/><path d="M45 90 Q60 75 75 90" stroke="#e53935" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
  }
  overlay.style.display = 'flex';
}

function renderStats() {
  const statList = document.getElementById('stat-list');
  const history = getHistory().slice().reverse();
  if (history.length === 0) {
    statList.innerHTML = '<p>No games played yet.</p>';
    return;
  }
  // Find max correct+wrong for border color
  let max = 0;
  history.forEach(g => { if (g.correct + g.wrong > max) max = g.correct + g.wrong; });
  // Show as 1/1 format, 10 columns per row
  const cols = 10;
  let html = '<div class="stat-simple-list">';
  history.forEach((g, i) => {
    if (i % cols === 0) html += '<div class="stat-row">';
    const total = g.correct + g.wrong;
    const border = total === max && max > 0 ? 'stat-cell-max' : '';
    let win = g.correct > g.wrong ? 'stat-cell-win' : (g.correct < g.wrong ? 'stat-cell-lost' : '');
    html += `<span class="stat-cell ${border} ${win}"><span class='stat-correct'>${g.correct}</span>/<span class='stat-wrong'>${g.wrong}</span></span>`;
    if (i % cols === cols - 1) html += '</div>';
  });
  if (history.length % cols !== 0) html += '</div>';
  html += '</div>';
  statList.innerHTML = html;
}

window.onload = () => {
  if (!loadState()) {
    resetGame();
  } else {
    updateScore();
    renderPuzzle();
  }
  document.getElementById('overlay').onclick = () => {
    nextPuzzle();
  };
  document.getElementById('reset-btn').onclick = () => {
    resetGame();
  };
  document.getElementById('stat-btn').onclick = () => {
    renderStats();
    document.getElementById('stat-overlay').style.display = 'flex';
  };
  document.getElementById('close-stat-btn').style.display = 'none';
  document.getElementById('stat-overlay').onclick = (e) => {
    if (e.target === document.getElementById('stat-overlay') || e.target === document.getElementById('stat-panel')) {
      document.getElementById('stat-overlay').style.display = 'none';
    }
  };
};
