const HIT_WINDOW = 150; // ±ms around the perfect moment

export class RhythmSession {
  // ── Reactive UI state ──
  queue      = $state([]);
  interval   = $state(2000);
  streak     = $state(0);
  bestStreak = $state(0);
  correct    = $state(0);
  attempts   = $state(0);

  // ── Internal ──
  #letters       = [];
  #cfg           = null;
  #upcomingCount = 2;
  #active        = false;
  #firstCycle    = true;
  #cycleStart    = 0;    // performance.now() when current cycle animation began
  #windowLetter  = '';   // letter cached at cycle start, stable for entire window
  #pressed       = false;
  #raf           = null;
  #beatTimeout   = null;
  #tickTimeout   = null;
  #audioCtx      = null;
  #onProgress    = null;
  #onCycleStart  = null;
  #onLateMiss    = null;

  constructor(letters, rhythmCfg, upcomingCount) {
    this.#letters       = letters;
    this.#cfg           = rhythmCfg;
    this.#upcomingCount = upcomingCount;
    this.interval       = rhythmCfg.startMs;
    // Fill one extra so the first shift still leaves enough upcoming letters
    this.#fill(upcomingCount + 1);
  }

  get currentLetter() { return this.#windowLetter; }

  // ── Lifecycle ──
  start({ onProgress, onCycleStart, onLateMiss } = {}) {
    this.#active       = true;
    this.#onProgress   = onProgress;
    this.#onCycleStart = onCycleStart;
    this.#onLateMiss   = onLateMiss;
    this.#beatTimeout  = setTimeout(() => this.#startCycle(), 300);
  }

  stop() {
    this.#active = false;
    if (this.#raf) { cancelAnimationFrame(this.#raf); this.#raf = null; }
    clearTimeout(this.#beatTimeout);
    clearTimeout(this.#tickTimeout);
  }

  // ── Input ──
  // Returns null if already pressed / inactive.
  // Returns { hit, missReason, speedUp, newInterval }
  handleInput(typed) {
    if (!this.#active || this.#pressed) return null;

    const now        = performance.now();
    const offset     = now - (this.#cycleStart + this.interval);
    const goodTiming = Math.abs(offset) <= HIT_WINDOW;
    const goodLetter = typed === this.#windowLetter;
    const hit        = goodLetter && goodTiming;

    this.#pressed = true;
    if (this.#raf) { cancelAnimationFrame(this.#raf); this.#raf = null; }

    this.attempts++;
    let speedUp = false, newInterval = this.interval;

    if (hit) {
      this.correct++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      if (this.streak % this.#cfg.streakUp === 0) {
        const prev  = this.interval;
        this.interval = Math.max(this.#cfg.floorMs, this.interval - this.#cfg.speedupMs);
        speedUp     = this.interval < prev;
        newInterval = this.interval;
      }
    } else {
      this.streak = 0;
    }

    // Cancel the remaining window timeout and start the next cycle promptly.
    // This prevents balls from freezing at center while the HIT_WINDOW drains out.
    clearTimeout(this.#beatTimeout);
    this.#beatTimeout = setTimeout(() => this.#startCycle(), 120);

    const missReason = !goodLetter ? 'letter' : null;
    return { hit, missReason, speedUp, newInterval };
  }

  // ── Private ──

  // Starts a new cycle. The next cycle is triggered exactly
  // (interval + HIT_WINDOW) ms later — AFTER the press window has closed.
  // This eliminates the race condition between a late-but-valid press and
  // the next cycle advancing queue[0].
  #startCycle() {
    if (!this.#active) return;

    this.#cycleStart = performance.now();
    this.#pressed    = false;

    // Advance queue (skip shift on the very first cycle)
    if (!this.#firstCycle) {
      this.queue.shift();
      this.#fill(this.#upcomingCount);
    }
    this.#firstCycle = false;

    // Cache letter for this window — won't change until next #startCycle
    this.#windowLetter = this.queue[0] ?? '';

    this.#onCycleStart?.();

    // Tick at the perfect moment
    clearTimeout(this.#tickTimeout);
    if (this.#cfg.tick) {
      this.#tickTimeout = setTimeout(() => this.#playTick(), this.interval);
    }

    // After the press window closes: auto-miss if no press, then start next cycle
    clearTimeout(this.#beatTimeout);
    this.#beatTimeout = setTimeout(() => {
      if (!this.#pressed) {
        this.#pressed = true;
        this.attempts++;
        this.streak = 0;
        this.#onLateMiss?.();
      }
      this.#startCycle(); // no delay — immediately start next cycle
    }, this.interval + HIT_WINDOW);

    // Ball animation
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf = requestAnimationFrame(() => this.#animLoop());
  }

  #animLoop() {
    if (!this.#active) return;
    const elapsed = performance.now() - this.#cycleStart;
    const p       = elapsed / this.interval;
    this.#onProgress?.(Math.min(p, 1));
    // Stop animating once balls have reached center; #beatTimeout handles the rest
    if (p < 1) this.#raf = requestAnimationFrame(() => this.#animLoop());
  }

  #fill(upcomingCount) {
    const needed = 1 + upcomingCount;
    while (this.queue.length < needed) this.queue.push(this.#pick());
  }

  #pick() {
    const last = this.queue.length > 0 ? this.queue[this.queue.length - 1] : '';
    let l;
    do { l = this.#letters[Math.floor(Math.random() * this.#letters.length)]; }
    while (l === last && this.#letters.length > 1);
    return l;
  }

  #playTick() {
    try {
      if (!this.#audioCtx)
        this.#audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx  = this.#audioCtx;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch { /* audio may be blocked */ }
  }
}
