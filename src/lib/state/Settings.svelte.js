const DEFAULTS = {
  fastMs:        350,
  mediumMs:      800,
  pauseMs:       4000,
  upcomingCount: 2,
  slowPct:       0,   // % chance of picking from slow letters
  slowN:         5,   // draw from top-N slowest
};

class Settings {
  fastMs        = $state(DEFAULTS.fastMs);
  mediumMs      = $state(DEFAULTS.mediumMs);
  pauseMs       = $state(DEFAULTS.pauseMs);
  upcomingCount = $state(DEFAULTS.upcomingCount);
  slowPct       = $state(DEFAULTS.slowPct);
  slowN         = $state(DEFAULTS.slowN);

  constructor() {
    try {
      const s = JSON.parse(localStorage.getItem('ld_settings') || '{}');
      if (s.fastMs        !== undefined) this.fastMs        = s.fastMs;
      if (s.mediumMs      !== undefined) this.mediumMs      = s.mediumMs;
      if (s.pauseMs       !== undefined) this.pauseMs       = s.pauseMs;
      if (s.upcomingCount !== undefined) this.upcomingCount = s.upcomingCount;
      if (s.slowPct       !== undefined) this.slowPct       = s.slowPct;
      if (s.slowN         !== undefined) this.slowN         = s.slowN;
    } catch { /* ignore corrupt data */ }
  }

  save() {
    localStorage.setItem('ld_settings', JSON.stringify({
      fastMs:        this.fastMs,
      mediumMs:      this.mediumMs,
      pauseMs:       this.pauseMs,
      upcomingCount: this.upcomingCount,
      slowPct:       this.slowPct,
      slowN:         this.slowN,
    }));
  }
}

export const settings = new Settings();
