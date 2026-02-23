
// ── CONFIG ──
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const EXTRAS = '.,;:!?\'-/"@'.split('');
const PRESETS = {
  'me-taps': 'aehinorst',
  'me-taps+dl': 'adehinlorst',
  'me-taps+dlcu': 'acdehinlorstu',
  'me-common': 'acdefghilmnorstwu',
  'all': LETTERS.join(''),
  'none': '',
};

const DEFAULT_SETTINGS = { fastMs: 350, mediumMs: 800, pauseMs: 4000, upcomingCount: 2 };

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('ld_settings') || '{}') }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) { localStorage.setItem('ld_settings', JSON.stringify(s)); }

function loadStats() {
  try { return JSON.parse(localStorage.getItem('ld_stats') || '{}'); }
  catch { return {}; }
}
function saveStats(s) { localStorage.setItem('ld_stats', JSON.stringify(s)); }

function loadSelection() {
  try { return new Set(JSON.parse(localStorage.getItem('ld_sel') || '[]')); }
  catch { return new Set(); }
}
function saveSelection(s) { localStorage.setItem('ld_sel', JSON.stringify([...s])); }

// ── STATE ──
let selected = loadSelection();
let settings = loadSettings();
let drillLetters = [];
let queue = [];
let currentTarget = '';
let targetShownAt = 0;
let sessionCorrect = 0;
let sessionAttempts = 0;
let sessionStartTime = 0;
let isFirstLetter = true;
let mistakeOnCurrent = false;
let slowestElements = new Map();

// ── SCREENS ──
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── SETUP: LETTER GRIDS ──
function renderGrid(el, chars) {
  el.innerHTML = '';
  chars.forEach(ch => {
    const b = document.createElement('button');
    b.className = 'lbtn' + (selected.has(ch) ? ' on' : '');
    b.textContent = ch;
    b.addEventListener('click', () => { toggleChar(ch); });
    el.appendChild(b);
  });
}

function toggleChar(ch) {
  if (selected.has(ch)) selected.delete(ch); else selected.add(ch);
  syncGrids();
  saveSelection(selected);
  updateStartBtn();
  renderEnabledDisplay();
}

function syncGrids() {
  document.querySelectorAll('#letter-grid .lbtn, #extra-grid .lbtn').forEach(b => {
    b.classList.toggle('on', selected.has(b.textContent));
  });
}

function updateStartBtn() {
  document.getElementById('start-btn').disabled = selected.size < 2;
}

function renderEnabledDisplay() {
  const container = document.getElementById('enabled-display');
  container.innerHTML = '';
  const sorted = [...selected].sort();
  sorted.forEach(ch => {
    const chip = document.createElement('button');
    chip.className = 'en-chip';
    chip.textContent = ch;
    chip.addEventListener('click', () => { toggleChar(ch); });
    container.appendChild(chip);
  });
}

renderGrid(document.getElementById('letter-grid'), LETTERS);
renderGrid(document.getElementById('extra-grid'), EXTRAS);
updateStartBtn();
renderEnabledDisplay();

// Presets
document.querySelectorAll('.pbtn[data-preset]').forEach(b => {
  b.addEventListener('click', () => {
    selected.clear();
    PRESETS[b.dataset.preset].split('').forEach(c => selected.add(c));
    syncGrids();
    saveSelection(selected);
    updateStartBtn();
    renderEnabledDisplay();
  });
});

// Keyboard toggle input
document.getElementById('toggle-input').addEventListener('input', function(e) {
  const ch = (e.data || '').toLowerCase();
  this.value = '';
  if (!ch || ch === ' ') return;
  const allChars = LETTERS.concat(EXTRAS);
  if (allChars.includes(ch)) {
    toggleChar(ch);
  }
});

// ── NAV BUTTONS ──
document.getElementById('start-btn').addEventListener('click', startDrill);
document.getElementById('drill-back').addEventListener('click', () => { show('setup-screen'); });
document.getElementById('open-stats').addEventListener('click', () => { renderStatsScreen(); show('stats-screen'); });
document.getElementById('stats-back').addEventListener('click', () => show('setup-screen'));
document.getElementById('open-settings').addEventListener('click', () => { populateSettings(); show('settings-screen'); });
document.getElementById('settings-back').addEventListener('click', () => { readSettings(); show('setup-screen'); });
document.getElementById('clear-stats').addEventListener('click', () => {
  if (confirm('Clear all stats?')) { localStorage.removeItem('ld_stats'); renderStatsScreen(); }
});

// ── SETTINGS ──
function populateSettings() {
  document.getElementById('set-fast').value = settings.fastMs;
  document.getElementById('set-medium').value = settings.mediumMs;
  document.getElementById('set-pause').value = settings.pauseMs;
  document.getElementById('set-upcoming').value = settings.upcomingCount;
}

function readSettings() {
  settings.fastMs = parseInt(document.getElementById('set-fast').value) || DEFAULT_SETTINGS.fastMs;
  settings.mediumMs = parseInt(document.getElementById('set-medium').value) || DEFAULT_SETTINGS.mediumMs;
  settings.pauseMs = parseInt(document.getElementById('set-pause').value) || DEFAULT_SETTINGS.pauseMs;
  settings.upcomingCount = Math.min(10, Math.max(1, parseInt(document.getElementById('set-upcoming').value) || DEFAULT_SETTINGS.upcomingCount));
  saveSettings(settings);
}

// ── CAROUSEL ──
function buildCarouselSlots() {
  const carousel = document.getElementById('carousel');
  carousel.innerHTML = '';
  const total = 1 + settings.upcomingCount;
  for (let i = 0; i < total; i++) {
    const slot = document.createElement('div');
    slot.className = 'carousel-slot';
    slot.id = `slot${i}`;
    applySlotPosition(slot, i);
    carousel.appendChild(slot);
  }
}

function applySlotPosition(slot, index) {
  if (index === 0) {
    slot.style.fontSize = '28vw';
    slot.style.opacity = '1';
    slot.style.transform = 'translateX(0)';
    slot.style.zIndex = 20;
  } else {
    const sizePct = Math.pow(0.58, index);
    const size = Math.max(2, 28 * sizePct);
    const opacity = Math.max(0.04, Math.pow(0.42, index));
    let x = 0;
    for (let j = 0; j < index; j++) {
      x += Math.max(3, 28 * Math.pow(0.58, j)) * 0.62;
    }
    slot.style.fontSize = `${size}vw`;
    slot.style.opacity = opacity;
    slot.style.transform = `translateX(${x}vw)`;
    slot.style.zIndex = 20 - index;
  }
}

// ── SLOWEST PANEL ──
const SP_ITEM_H = 22;

function updateSlowestPanel() {
  const stats = loadStats();
  const entries = Object.entries(stats)
    .filter(([, v]) => v.timedCount > 0)
    .map(([k, v]) => ({ letter: k, avg: Math.round(v.totalMs / v.timedCount) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const panel = document.getElementById('sp-list');
  const newLetters = new Set(entries.map(e => e.letter));

  // Remove letters no longer in list
  for (const [letter, el] of slowestElements) {
    if (!newLetters.has(letter)) {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-20px)';
      const removeEl = el;
      setTimeout(() => removeEl.remove(), 350);
      slowestElements.delete(letter);
    }
  }

  // Compute color gradient
  const maxAvg = entries.length ? entries[0].avg : 0;
  const minAvg = entries.length ? entries[entries.length - 1].avg : 0;

  entries.forEach((entry, i) => {
    const targetTop = i * SP_ITEM_H;
    // Color: interpolate from wrong (slowest) to text-dim (fastest in list)
    const t = maxAvg > minAvg ? (entry.avg - minAvg) / (maxAvg - minAvg) : 0.5;
    const r = Math.round(120 + t * 128);
    const g = Math.round(114 - t * 2);
    const b = Math.round(128 - t * 15);
    const color = `rgb(${r},${g},${b})`;

    if (slowestElements.has(entry.letter)) {
      const el = slowestElements.get(entry.letter);
      el.style.top = targetTop + 'px';
      el.querySelector('.sp-ms').textContent = entry.avg;
      el.querySelector('.sp-letter').style.color = color;
    } else {
      const el = document.createElement('div');
      el.className = 'sp-item';
      el.style.top = targetTop + 'px';
      el.style.opacity = '0';
      el.innerHTML = `<span class="sp-letter" style="color:${color}">${entry.letter}</span><span class="sp-ms">${entry.avg}</span>`;
      panel.appendChild(el);
      slowestElements.set(entry.letter, el);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { el.style.opacity = '1'; });
      });
    }
  });

  // Update panel height for layout
  panel.style.height = (entries.length * SP_ITEM_H) + 'px';
}

function clearSlowestPanel() {
  const panel = document.getElementById('sp-list');
  panel.innerHTML = '';
  slowestElements.clear();
}

// ── DRILL ──
function pickLetter() {
  let l;
  const last = queue.length > 0 ? queue[queue.length - 1] : '';
  do { l = drillLetters[Math.floor(Math.random() * drillLetters.length)]; }
  while (l === last && drillLetters.length > 1);
  return l;
}

function fillQueue() {
  const needed = 1 + settings.upcomingCount;
  while (queue.length < needed) queue.push(pickLetter());
}

function startDrill() {
  drillLetters = [...selected];
  saveSelection(selected);
  queue = [];
  sessionCorrect = 0;
  sessionAttempts = 0;
  sessionStartTime = 0;
  isFirstLetter = true;
  mistakeOnCurrent = false;
  document.getElementById('dots').innerHTML = '';
  updateDrillStats();
  clearSlowestPanel();
  buildCarouselSlots();
  fillQueue();
  renderCarousel();
  updateSlowestPanel();
  targetShownAt = performance.now();
  show('drill-screen');
  focusInput();
}

function renderCarousel() {
  currentTarget = queue[0];
  const total = 1 + settings.upcomingCount;
  for (let i = 0; i < total; i++) {
    const slot = document.getElementById(`slot${i}`);
    if (slot) slot.textContent = queue[i] || '';
  }
}

function advanceCarousel() {
  const slot0 = document.getElementById('slot0');

  // Phase 1: slide current letter out left
  slot0.style.transition = 'opacity 45ms ease-out, transform 45ms ease-out';
  slot0.style.opacity = '0';
  slot0.style.transform = 'translateX(-18px)';

  setTimeout(() => {
    queue.shift();
    fillQueue();
    targetShownAt = performance.now();
    mistakeOnCurrent = false;

    // Snap slot0 to entry position (no transition)
    slot0.style.transition = 'none';
    slot0.style.transform = 'translateX(14px)';
    slot0.style.opacity = '0';

    renderCarousel();

    // Phase 2: animate slot0 into place
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slot0.style.transition = 'opacity 110ms ease-out, transform 110ms cubic-bezier(0.22, 1, 0.36, 1)';
        slot0.style.opacity = '1';
        slot0.style.transform = 'translateX(0)';
        setTimeout(() => { slot0.style.transition = ''; }, 120);
      });
    });
  }, 50);
}

function focusInput() {
  const inp = document.getElementById('hinput');
  inp.value = '';
  inp.focus();
}

document.getElementById('drill-area').addEventListener('click', (e) => {
  e.preventDefault();
  focusInput();
});

document.getElementById('drill-screen').addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

document.getElementById('hinput').addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter') e.preventDefault();
});

document.getElementById('hinput').addEventListener('input', function(e) {
  const typed = (e.data || '').toLowerCase();
  this.value = '';
  if (!typed) return;

  const now = performance.now();
  const rawMs = Math.round(now - targetShownAt);
  const paused = rawMs > settings.pauseMs;
  const correct = typed === currentTarget;

  if (isFirstLetter) {
    isFirstLetter = false;
    sessionStartTime = now;
    if (correct) {
      recordStat(currentTarget, true, 0, true);
      sessionCorrect++;
      sessionAttempts++;
      addDot('c');
      effectOk();
      advanceCarousel();
      updateSlowestPanel();
    } else {
      sessionAttempts++;
      mistakeOnCurrent = true;
      recordStat(currentTarget, false, 0, true);
      addDot('w');
      effectWrong();
    }
    updateDrillStats();
    return;
  }

  if (correct) {
    sessionCorrect++;
    sessionAttempts++;

    const countTime = !paused && !mistakeOnCurrent;
    const timeMs = countTime ? rawMs : 0;
    recordStat(currentTarget, true, timeMs, !countTime);

    if (paused || mistakeOnCurrent) {
      effectOk();
      addDot('c');
    } else if (rawMs <= settings.fastMs) {
      effectFast();
      addDot('g');
    } else if (rawMs <= settings.mediumMs) {
      effectMedium();
      addDot('c');
    } else {
      effectOk();
      addDot('c');
    }

    advanceCarousel();
    updateSlowestPanel();
  } else {
    sessionAttempts++;
    mistakeOnCurrent = true;
    recordStat(currentTarget, false, 0, true);
    addDot('w');
    effectWrong();
  }

  updateDrillStats();
});

function recordStat(letter, correct, timeMs, skipTime) {
  const stats = loadStats();
  if (!stats[letter]) stats[letter] = { hits: 0, misses: 0, totalMs: 0, timedCount: 0 };
  const s = stats[letter];
  if (correct) {
    s.hits++;
    if (!skipTime && timeMs > 0) {
      s.totalMs += timeMs;
      s.timedCount++;
    }
  } else {
    s.misses++;
  }
  saveStats(stats);
}

function updateDrillStats() {
  document.getElementById('ds-n').textContent = sessionCorrect;
  if (sessionAttempts > 0) {
    document.getElementById('ds-acc').textContent = Math.round(sessionCorrect / sessionAttempts * 100) + '%';
  } else {
    document.getElementById('ds-acc').textContent = '\u2014';
  }
  if (sessionCorrect > 1 && sessionStartTime > 0) {
    const mins = (performance.now() - sessionStartTime) / 60000;
    document.getElementById('ds-lpm').textContent = Math.round(sessionCorrect / mins);
  } else {
    document.getElementById('ds-lpm').textContent = '\u2014';
  }
}

function addDot(cls) {
  const dots = document.getElementById('dots');
  const d = document.createElement('div');
  d.className = 'rdot ' + cls;
  dots.appendChild(d);
  while (dots.children.length > 30) dots.removeChild(dots.firstChild);
}

// ── EFFECTS ──
function effectFast() {
  const ring = document.getElementById('ring');
  ring.className = 'ring-burst gold';
  void ring.offsetWidth;
  ring.classList.add('go');
  setTimeout(() => ring.className = 'ring-burst', 600);
  spawnParticles(14, 'var(--gold)', 'var(--correct)');
  flashSlot('var(--gold)');
}

function effectMedium() {
  const ring = document.getElementById('ring');
  ring.className = 'ring-burst';
  void ring.offsetWidth;
  ring.classList.add('go');
  setTimeout(() => ring.className = 'ring-burst', 600);
  spawnParticles(6, 'var(--correct)', 'var(--accent)');
  flashSlot('var(--correct)');
}

function effectOk() {
  flashSlot('var(--correct)');
}

function effectWrong() {
  const slot = document.getElementById('slot0');
  slot.style.color = 'var(--wrong)';
  slot.classList.remove('shake');
  void slot.offsetWidth;
  slot.classList.add('shake');
  setTimeout(() => { slot.style.color = ''; slot.classList.remove('shake'); }, 350);
}

function flashSlot(color) {
  const slot = document.getElementById('slot0');
  slot.style.color = color;
  setTimeout(() => { slot.style.color = ''; }, 120);
}

function spawnParticles(count, c1, c2) {
  const container = document.getElementById('particles');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 3 + Math.random() * 5;
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const color = Math.random() > 0.5 ? c1 : c2;
    const dur = 300 + Math.random() * 300;

    p.style.cssText = `
        width:${size}px; height:${size}px;
        background:${color};
        left:0; top:0;
        transition: all ${dur}ms cubic-bezier(0.22, 1, 0.36, 1);
        opacity: 1;
      `;
    container.appendChild(p);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        p.style.transform = `translate(${dx}px, ${dy}px)`;
        p.style.opacity = '0';
      });
    });

    setTimeout(() => p.remove(), dur + 50);
  }
}

// ── STATS SCREEN ──
function renderStatsScreen() {
  const stats = loadStats();
  const keys = Object.keys(stats).sort();

  let tH = 0, tM = 0, tMs = 0, tC = 0;
  keys.forEach(k => {
    const s = stats[k];
    tH += s.hits; tM += s.misses; tMs += s.totalMs; tC += s.timedCount;
  });

  const oAcc = (tH + tM) > 0 ? Math.round(tH / (tH + tM) * 100) : 0;
  const oAvg = tC > 0 ? Math.round(tMs / tC) : 0;

  document.getElementById('stats-grid').innerHTML = `
      <div class="scard"><div class="sl">Accuracy</div><div class="sv">${oAcc}%</div></div>
      <div class="scard"><div class="sl">Avg ms</div><div class="sv">${oAvg}</div></div>
      <div class="scard"><div class="sl">Total</div><div class="sv">${tH + tM}</div></div>
      <div class="scard"><div class="sl">Letters</div><div class="sv">${keys.length}</div></div>
    `;

  const rows = keys.map(k => {
    const s = stats[k];
    const avg = s.timedCount > 0 ? Math.round(s.totalMs / s.timedCount) : 0;
    const acc = (s.hits + s.misses) > 0 ? Math.round(s.hits / (s.hits + s.misses) * 100) : 0;
    return { l: k, avg, acc, n: s.hits + s.misses };
  }).sort((a, b) => b.avg - a.avg);

  const avgs = rows.map(r => r.avg).filter(v => v > 0);
  const fastest = avgs.length ? Math.min(...avgs) : 0;
  const slowest = avgs.length ? Math.max(...avgs) : 0;

  document.getElementById('ltbody').innerHTML = rows.map(r => {
    let cls = '';
    if (avgs.length >= 3) {
      if (r.avg === slowest && r.avg > 0) cls = 'slow';
      if (r.avg === fastest && r.avg > 0) cls = 'fast';
    }
    const bw = r.acc * 0.5;
    const bc = r.acc >= 90 ? 'var(--correct)' : r.acc >= 70 ? 'var(--accent)' : 'var(--wrong)';
    return `<tr class="${cls}">
        <td>${r.l}</td>
        <td>${r.avg || '\u2014'}</td>
        <td><span class="abar" style="width:${bw}px;background:${bc}"></span>${r.acc}%</td>
        <td>${r.n}</td>
      </tr>`;
  }).join('');
}

// ── INIT ──
syncGrids();
updateStartBtn();
