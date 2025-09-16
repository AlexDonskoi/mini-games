// Math Game for Kids
const PUZZLE_KEY = 'mathgame_puzzles';
const STATE_KEY = 'mathgame_state';

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

function resetGame() {
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
  if (selected === correct) {
    state.correct++;
  } else {
    state.wrong++;
  }
  updateScore();
  saveState();
  document.getElementById('overlay').style.display = 'flex';
}

document.getElementById('overlay').onclick = () => {
  nextPuzzle();
};
document.getElementById('reset-btn').onclick = () => {
  resetGame();
};

window.onload = () => {
  if (!loadState()) {
    resetGame();
  } else {
    updateScore();
    renderPuzzle();
  }
};
