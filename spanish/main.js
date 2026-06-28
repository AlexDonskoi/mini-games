// Spanish Syllables Game
// Hear a syllable and pick the matching written form from 3 choices.
// Wrong answers always differ from the correct answer only in the vowel.

const STATE_KEY   = 'spanishgame_state';
const PUZZLE_KEY  = 'spanishgame_puzzles';
const HISTORY_KEY = 'spanishgame_history';

// ---------------------------------------------------------------------------
// Syllable groups — wrong-answer candidates always come from the same group,
// so they differ from the correct answer only in the vowel.
//
// CV groups (consonant + vowel)
//   • All five vowels (a e i o u) included unless a combination is unnatural.
//   • 'c': ca/ce/ci/co/cu — TTS pronounces ce/ci as /s/ (Latin-American) ✓
//   • 'g': ga/ge/gi/go/gu — TTS pronounces ge/gi as /x/ (j-sound) ✓
//   • 'ch' / 'll' / 'y' / 'z' — standard Spanish digraphs/letters
//   • 'h' omitted — silent in Spanish (would sound like a bare vowel)
//   • 'w' / 'x' / 'qu' omitted — mostly foreign words or complex rules
//
// VC groups (vowel + consonant)  — common word-endings in Spanish
//   • endings: -n, -r, -l, -s  with the most frequent vowel partners
// ---------------------------------------------------------------------------
const SYLLABLE_GROUPS = [
  // ── CV ────────────────────────────────────────────────────────────────────
  { key: 'b',  syllables: ['ba', 'be', 'bi', 'bo', 'bu'] },
  { key: 'c',  syllables: ['ca', 'ce', 'ci', 'co', 'cu'] },
  { key: 'd',  syllables: ['da', 'de', 'di', 'do', 'du'] },
  { key: 'f',  syllables: ['fa', 'fe', 'fi', 'fo', 'fu'] },
  { key: 'g',  syllables: ['ga', 'ge', 'gi', 'go', 'gu'] },
  { key: 'j',  syllables: ['ja', 'je', 'ji', 'jo', 'ju'] },
  { key: 'l',  syllables: ['la', 'le', 'li', 'lo', 'lu'] },
  { key: 'm',  syllables: ['ma', 'me', 'mi', 'mo', 'mu'] },
  { key: 'n',  syllables: ['na', 'ne', 'ni', 'no', 'nu'] },
  { key: 'ñ',  syllables: ['ña', 'ñe', 'ñi', 'ño', 'ñu'] },
  { key: 'p',  syllables: ['pa', 'pe', 'pi', 'po', 'pu'] },
  { key: 'r',  syllables: ['ra', 're', 'ri', 'ro', 'ru'] },
  { key: 's',  syllables: ['sa', 'se', 'si', 'so', 'su'] },
  { key: 't',  syllables: ['ta', 'te', 'ti', 'to', 'tu'] },
  { key: 'v',  syllables: ['va', 've', 'vi', 'vo', 'vu'] },
  { key: 'ch', syllables: ['cha', 'che', 'chi', 'cho', 'chu'] },
  { key: 'll', syllables: ['lla', 'lle', 'llo', 'llu'] },
  { key: 'y',  syllables: ['ya', 'ye', 'yo', 'yu'] },
  { key: 'z',  syllables: ['za', 'ze', 'zo', 'zu'] },
  // ── VC ────────────────────────────────────────────────────────────────────
  { key: '_n', syllables: ['an', 'en', 'in', 'on', 'un'] },
  { key: '_r', syllables: ['ar', 'er', 'ir', 'or', 'ur'] },
  { key: '_l', syllables: ['al', 'el', 'ol'] },
  { key: '_s', syllables: ['as', 'es', 'os'] },
];

// Flat list: { text, groupKey }
const ALL_SYLLABLES = [];
SYLLABLE_GROUPS.forEach(group => {
  group.syllables.forEach(s => {
    ALL_SYLLABLES.push({ text: s, groupKey: group.key });
  });
});

// ---------------------------------------------------------------------------
// Audio Playback — Web Audio API with audio sprite
// ---------------------------------------------------------------------------
let audioContext = null;
let audioBuffer = null;
let spriteMap = null;

async function initAudio() {
  if (audioContext) return; // already initialized
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  try {
    const [oggResp, mapResp] = await Promise.all([
      fetch('sounds/sprite.ogg'),
      fetch('spriteMap.json')
    ]);
    const arrayBuffer = await oggResp.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    spriteMap = await mapResp.json();
  } catch (e) {
    console.error("Failed to load audio sprite:", e);
  }
}

let sourceNode = null;

function speak(text) {
  if (!audioContext || !audioBuffer || !spriteMap) {
    initAudio().then(() => speak(text));
    return;
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  if (sourceNode) {
    try { sourceNode.stop(); } catch(e) {}
    sourceNode.disconnect();
  }
  
  const sprite = spriteMap[text];
  if (!sprite) return;
  
  setPlayingState(true);
  
  sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.connect(audioContext.destination);
  sourceNode.start(0, sprite.start, sprite.duration);
  
  sourceNode.onended = () => {
    setPlayingState(false);
  };
}

function setPlayingState(playing) {
  const btn = document.getElementById('play-btn');
  if (!btn) return;
  btn.classList.toggle('playing', playing);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
let syllableStack = [];
let state = { correct: 0, wrong: 0, current: null };

function saveState() {
  localStorage.setItem(STATE_KEY,  JSON.stringify(state));
  localStorage.setItem(PUZZLE_KEY, JSON.stringify(syllableStack));
}

function loadState() {
  const s = localStorage.getItem(STATE_KEY);
  const p = localStorage.getItem(PUZZLE_KEY);
  if (s && p) {
    state         = JSON.parse(s);
    syllableStack = JSON.parse(p);
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

// ---------------------------------------------------------------------------
// Game logic
// ---------------------------------------------------------------------------
function resetGame() {
  if (state.correct > 0 || state.wrong > 0) {
    saveHistoryEntry({ correct: state.correct, wrong: state.wrong, date: Date.now() });
  }
  state         = { correct: 0, wrong: 0, current: null };
  syllableStack = shuffle([...ALL_SYLLABLES]);
  nextPuzzle();
  saveState();
  updateScore();
}

function nextPuzzle() {
  if (syllableStack.length === 0) {
    syllableStack = shuffle([...ALL_SYLLABLES]);
  }
  state.current = syllableStack.pop();
  saveState();
  renderPuzzle();
}

function updateScore() {
  document.getElementById('correct-count').textContent = state.correct;
  document.getElementById('wrong-count').textContent   = state.wrong;
}

function generateOptions(current) {
  const group = SYLLABLE_GROUPS.find(g => g.key === current.groupKey);
  const others = group.syllables.filter(s => s !== current.text);
  const wrongs = shuffle([...others]).slice(0, 2);
  return shuffle([current.text, ...wrongs]);
}

function renderPuzzle() {
  const current = state.current;
  const options = generateOptions(current);

  setPlayingState(false);

  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'answer-btn';
    btn.textContent = opt;
    btn.onclick     = () => selectAnswer(opt, current.text);
    answersDiv.appendChild(btn);
  });

  document.getElementById('overlay').style.display = 'none';

  // Auto-play the syllable after a brief rendering delay
  setTimeout(() => speak(current.text), 400);
}

function selectAnswer(selected, correct) {
  document.querySelectorAll('.answer-btn').forEach(btn => {
    if (btn.textContent === correct) btn.classList.add('correct');
    if (btn.textContent === selected) {
      btn.classList.add(selected === correct ? 'correct' : 'wrong', 'selected');
    }
    btn.disabled = true;
  });

  const isCorrect = selected === correct;
  if (isCorrect) {
    state.correct++;
  } else {
    state.wrong++;
    // Replay the correct answer so the child hears what it should have been
    setTimeout(() => speak(correct), 700);
  }
  updateScore();
  saveState();

  const face = document.getElementById('face');
  if (isCorrect) {
    face.innerHTML = `<svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="55" fill="#fffde7" stroke="#ffd700" stroke-width="6"/>
      <circle cx="45" cy="55" r="8" fill="#222"/>
      <circle cx="75" cy="55" r="8" fill="#222"/>
      <path d="M45 80 Q60 95 75 80" stroke="#43a047" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>`;
  } else {
    face.innerHTML = `<svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="55" fill="#fffde7" stroke="#ffd700" stroke-width="6"/>
      <circle cx="45" cy="55" r="8" fill="#222"/>
      <circle cx="75" cy="55" r="8" fill="#222"/>
      <path d="M45 90 Q60 75 75 90" stroke="#e53935" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>`;
  }
  document.getElementById('overlay').style.display = 'flex';
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------
function renderStats() {
  const statList = document.getElementById('stat-list');
  const history  = getHistory().slice().reverse();
  if (history.length === 0) {
    statList.innerHTML = '<p>No se han jugado partidas aún.</p>';
    return;
  }
  let max = 0;
  history.forEach(g => { if (g.correct + g.wrong > max) max = g.correct + g.wrong; });
  const cols = 10;
  let html = '<div class="stat-simple-list">';
  history.forEach((g, i) => {
    if (i % cols === 0) html += '<div class="stat-row">';
    const total  = g.correct + g.wrong;
    const border = total === max && max > 0 ? 'stat-cell-max' : '';
    const win    = g.correct > g.wrong ? 'stat-cell-win' : (g.correct < g.wrong ? 'stat-cell-lost' : '');
    html += `<span class="stat-cell ${border} ${win}"><span class='stat-correct'>${g.correct}</span>/<span class='stat-wrong'>${g.wrong}</span></span>`;
    if (i % cols === cols - 1) html += '</div>';
  });
  if (history.length % cols !== 0) html += '</div>';
  html += '</div>';
  statList.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
window.onload = () => {
  if (!loadState()) {
    resetGame();
  } else {
    updateScore();
    renderPuzzle();
  }

  document.getElementById('play-btn').onclick = () => {
    if (state.current) speak(state.current.text);
  };

  document.getElementById('overlay').onclick = () => nextPuzzle();

  document.getElementById('reset-btn').onclick = () => resetGame();

  document.getElementById('stat-btn').onclick = () => {
    renderStats();
    document.getElementById('stat-overlay').style.display = 'flex';
  };

  document.getElementById('stat-overlay').onclick = e => {
    const overlay = document.getElementById('stat-overlay');
    const panel   = document.getElementById('stat-panel');
    if (!panel.contains(e.target)) {
      overlay.style.display = 'none';
    }
  };
};
