const DEFAULTS = {
  fastMs:        600,
  mediumMs:      1200,
  pauseMs:       4000,
  upcomingCount: 2,
  slowPct:       30,  // % chance of picking from slow letters
  slowN:         5,   // draw from top-N slowest
  showStreak:    true,
  ngramPct:      80,  // % of picks from bigrams/trigrams (rest are random single chars)
  customNgrams:  '',  // user-supplied sequences (space/comma separated), empty = use defaults
};

class Settings {
  fastMs        = $state(DEFAULTS.fastMs);
  mediumMs      = $state(DEFAULTS.mediumMs);
  pauseMs       = $state(DEFAULTS.pauseMs);
  upcomingCount = $state(DEFAULTS.upcomingCount);
  slowPct       = $state(DEFAULTS.slowPct);
  slowN         = $state(DEFAULTS.slowN);
  showStreak    = $state(DEFAULTS.showStreak);
  ngramPct      = $state(DEFAULTS.ngramPct);
  customNgrams  = $state(DEFAULTS.customNgrams);

  constructor() {
    try {
      const s = JSON.parse(localStorage.getItem('ld_settings') || '{}');
      if (s.fastMs        !== undefined) this.fastMs        = s.fastMs;
      if (s.mediumMs      !== undefined) this.mediumMs      = s.mediumMs;
      if (s.pauseMs       !== undefined) this.pauseMs       = s.pauseMs;
      if (s.upcomingCount !== undefined) this.upcomingCount = s.upcomingCount;
      if (s.slowPct       !== undefined) this.slowPct       = s.slowPct;
      if (s.slowN         !== undefined) this.slowN         = s.slowN;
      if (s.showStreak    !== undefined) this.showStreak    = s.showStreak;
      if (s.ngramPct      !== undefined) this.ngramPct      = s.ngramPct;
      if (s.customNgrams  !== undefined) this.customNgrams  = s.customNgrams;
    } catch { /* ignore corrupt data */ }
  }

  reset() {
    for (const [k, v] of Object.entries(DEFAULTS)) this[k] = v;
    this.save();
  }

  save() {
    localStorage.setItem('ld_settings', JSON.stringify({
      fastMs:        this.fastMs,
      mediumMs:      this.mediumMs,
      pauseMs:       this.pauseMs,
      upcomingCount: this.upcomingCount,
      slowPct:       this.slowPct,
      slowN:         this.slowN,
      showStreak:    this.showStreak,
      ngramPct:      this.ngramPct,
      customNgrams:  this.customNgrams,
    }));
  }
}

export const settings = new Settings();
