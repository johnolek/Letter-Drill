import { stats }    from '../lib/state/Stats.svelte.js';
import { settings } from '../lib/state/Settings.svelte.js';

export class DrillSession {
  // ── Reactive UI state ──
  queue            = $state([]);
  correct          = $state(0);
  attempts         = $state(0);
  mistakeOnCurrent = $state(false);
  isFirst          = $state(true);

  // ── Internal timing (not reactive) ──
  #letters       = [];
  #targetShownAt = 0;
  #sessionStart  = 0;

  constructor(letters, upcomingCount) {
    this.#letters = letters;
    this.#fill(upcomingCount);
    this.#targetShownAt = performance.now();
  }

  // ── Derived getters ──
  get currentLetter() { return this.queue[0] ?? ''; }

  get accuracy() {
    if (this.attempts === 0) return null;
    return Math.round(this.correct / this.attempts * 100);
  }

  get lpm() {
    if (this.correct < 2 || this.#sessionStart === 0) return null;
    const mins = (performance.now() - this.#sessionStart) / 60000;
    return Math.round(this.correct / mins);
  }

  // ── Input handling ──
  // Returns { hit, letter, speed, timeMs, skipTime, isFirst }
  // speed: 'fast' | 'medium' | 'slow' | null
  handleInput(typed, cfg) {
    const now    = performance.now();
    const rawMs  = Math.round(now - this.#targetShownAt);
    const paused = rawMs > cfg.pauseMs;
    const hit    = typed === this.currentLetter;
    const letter = this.currentLetter;

    if (this.isFirst) {
      this.isFirst = false;
      this.#sessionStart = now;
      this.attempts++;
      if (hit) {
        this.correct++;
        this.advance(cfg.upcomingCount);
      } else {
        this.mistakeOnCurrent = true;
      }
      return { hit, letter, speed: null, timeMs: 0, skipTime: true, isFirst: true };
    }

    this.attempts++;

    if (hit) {
      this.correct++;
      const skipTime = paused || this.mistakeOnCurrent;
      const timeMs   = skipTime ? 0 : rawMs;
      const speed    = skipTime  ? null
        : rawMs <= cfg.fastMs   ? 'fast'
        : rawMs <= cfg.mediumMs ? 'medium'
        : 'slow';
      this.advance(cfg.upcomingCount);
      return { hit: true, letter, speed, timeMs, skipTime, isFirst: false };
    } else {
      this.mistakeOnCurrent = true;
      return { hit: false, letter, speed: null, timeMs: 0, skipTime: true, isFirst: false };
    }
  }

  advance(upcomingCount) {
    this.queue.shift();
    this.#fill(upcomingCount);
    this.#targetShownAt  = performance.now();
    this.mistakeOnCurrent = false;
  }

  // ── Private helpers ──
  #fill(upcomingCount) {
    const needed = 1 + upcomingCount;
    while (this.queue.length < needed) this.queue.push(this.#pick());
  }

  #pick() {
    const last    = this.queue.length > 0 ? this.queue[this.queue.length - 1] : '';
    const slowPct = settings.slowPct;
    const slowN   = settings.slowN;

    // Try slow-letter bias
    if (slowPct > 0 && Math.random() * 100 < slowPct) {
      const data    = stats.data;
      const slowest = this.#letters
        .filter(l => (data[l]?.timedCount ?? 0) > 0)
        .map(l => ({ l, avg: Math.round(data[l].totalMs / data[l].timedCount) }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, slowN)
        .map(x => x.l);

      if (slowest.length > 0) {
        let l, tries = 0;
        do {
          l = slowest[Math.floor(Math.random() * slowest.length)];
          tries++;
        } while (l === last && slowest.length > 1 && tries < 10);
        return l;
      }
    }

    // Regular random pick
    let l;
    do { l = this.#letters[Math.floor(Math.random() * this.#letters.length)]; }
    while (l === last && this.#letters.length > 1);
    return l;
  }
}
