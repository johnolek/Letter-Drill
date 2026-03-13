import { stats }    from '../lib/state/Stats.svelte.js';
import { settings } from '../lib/state/Settings.svelte.js';
import { BIGRAMS, TRIGRAMS } from '../lib/constants.js';

export class DrillSession {
  // ── Reactive UI state ──
  queue            = $state([]);
  correct          = $state(0);
  attempts         = $state(0);
  mistakeOnCurrent = $state(false);
  isFirst          = $state(true);

  // ── Internal (not reactive) ──
  #letters         = [];
  #targetShownAt   = 0;
  #sessionStart    = 0;
  #pendingNgram    = [];
  #availableNgrams = [];

  constructor(letters, upcomingCount) {
    this.#letters = letters;
    this.#availableNgrams = this.#computeAvailableNgrams();
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

  #computeAvailableNgrams() {
    const letterSet = new Set(this.#letters);
    const raw = settings.customNgrams.trim();

    let source;
    if (raw) {
      const tokens = raw.split(/[\s,]+/);
      source = [];
      for (const tok of tokens) {
        const cleaned = tok.toLowerCase().replace(/[^a-z]/g, '');
        if (cleaned.length > 0) source.push(cleaned);
      }
    } else {
      source = [...BIGRAMS, ...TRIGRAMS];
    }

    return source.filter(ng => {
      for (const ch of ng) {
        if (!letterSet.has(ch)) return false;
      }
      return true;
    });
  }

  #getSlowPool(slowN) {
    const data = stats.data;
    return this.#letters
      .filter(l => (data[l]?.timedCount ?? 0) > 0)
      .map(l => ({ l, avg: Math.round(data[l].totalMs / data[l].timedCount) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, slowN)
      .map(x => x.l);
  }

  #pick() {
    // Drain pending ngram buffer first
    if (this.#pendingNgram.length > 0) {
      return this.#pendingNgram.shift();
    }

    const last     = this.queue.length > 0 ? this.queue[this.queue.length - 1] : '';
    const ngramPct = settings.ngramPct;
    const slowPct  = settings.slowPct;
    const slowN    = settings.slowN;

    // ── Ngram-based pick ──
    if (ngramPct > 0 && this.#availableNgrams.length > 0 && Math.random() * 100 < ngramPct) {
      let pool = this.#availableNgrams;

      // Slow-letter bias: try to find an ngram containing a slow letter
      if (slowPct > 0 && Math.random() * 100 < slowPct) {
        const slowPool = this.#getSlowPool(slowN);
        if (slowPool.length > 0) {
          let sl, tries = 0;
          do {
            sl = slowPool[Math.floor(Math.random() * slowPool.length)];
            tries++;
          } while (sl === last && slowPool.length > 1 && tries < 10);

          const filtered = pool.filter(ng => ng.includes(sl));
          if (filtered.length > 0) {
            pool = filtered;
          } else {
            // No ngram contains this slow letter — just return the letter
            return sl;
          }
        }
      }

      // Pick a random ngram, avoid starting with the last queued letter
      let ngram, tries = 0;
      do {
        ngram = pool[Math.floor(Math.random() * pool.length)];
        tries++;
      } while (ngram[0] === last && pool.length > 1 && tries < 10);

      if (ngram.length > 1) {
        this.#pendingNgram = [...ngram.slice(1)];
      }
      return ngram[0];
    }

    // ── Single-letter pick (slow-letter bias) ──
    if (slowPct > 0 && Math.random() * 100 < slowPct) {
      const slowPool = this.#getSlowPool(slowN);
      if (slowPool.length > 0) {
        let l, tries = 0;
        do {
          l = slowPool[Math.floor(Math.random() * slowPool.length)];
          tries++;
        } while (l === last && slowPool.length > 1 && tries < 10);
        return l;
      }
    }

    // ── Regular random pick ──
    let l;
    do { l = this.#letters[Math.floor(Math.random() * this.#letters.length)]; }
    while (l === last && this.#letters.length > 1);
    return l;
  }
}
