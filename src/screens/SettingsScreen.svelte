<script>
  import { Tween } from 'svelte/motion';
  import { settings } from '../lib/state/Settings.svelte.js';
  import { BIGRAMS, TRIGRAMS } from '../lib/constants.js';

  const sortedBigrams  = [...BIGRAMS].sort();
  const sortedTrigrams = [...TRIGRAMS].sort();
  const defaultNgramsText = [...sortedBigrams, ...sortedTrigrams].join('\n');
  let ngramText = $state(settings.customNgrams || defaultNgramsText);
  function onNgramInput() { settings.customNgrams = ngramText; }

  let { navigate } = $props();

  const slowPctDisplay = new Tween(settings.slowPct, { duration: 150 });
  $effect(() => { slowPctDisplay.set(settings.slowPct); });

  const ngramPctDisplay = new Tween(settings.ngramPct, { duration: 150 });
  $effect(() => { ngramPctDisplay.set(settings.ngramPct); });

  function back() {
    settings.save();
    navigate('setup');
  }

  function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

  function step(field, delta, min, max) {
    settings[field] = clamp(settings[field] + delta, min, max);
  }

  // For live slider fill (Webkit only, Firefox uses ::-moz-range-progress)
  function sliderStyle(val, min, max) {
    const pct = ((val - min) / (max - min)) * 100;
    return `background: linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`;
  }
</script>

<div class="screen">
  <div class="header">
    <h2>Settings</h2>
    <button onclick={back}>← Back</button>
  </div>

  <div class="section-label">Timing</div>

  <div class="row">
    <div class="row-info">
      <div class="row-label">Fast threshold</div>
      <div class="row-desc">ms — gold burst effect and more points towards your streak</div>
    </div>
    <div class="stepper">
      <button onclick={() => step('fastMs', -50, 50, 5000)}>−</button>
      <span class="sv">{settings.fastMs}</span>
      <button onclick={() => step('fastMs', 50, 50, 5000)}>+</button>
    </div>
  </div>

  <div class="row">
    <div class="row-info">
      <div class="row-label">Medium threshold</div>
      <div class="row-desc">ms — green ring effect</div>
    </div>
    <div class="stepper">
      <button onclick={() => step('mediumMs', -50, 100, 10000)}>−</button>
      <span class="sv">{settings.mediumMs}</span>
      <button onclick={() => step('mediumMs', 50, 100, 10000)}>+</button>
    </div>
  </div>

  <div class="row">
    <div class="row-info">
      <div class="row-label">Pause timeout</div>
      <div class="row-desc">ms — if you take longer than this to hit the letter, it won't count against your stats.</div>
    </div>
    <div class="stepper">
      <button onclick={() => step('pauseMs', -500, 1000, 30000)}>−</button>
      <span class="sv">{settings.pauseMs}</span>
      <button onclick={() => step('pauseMs', 500, 1000, 30000)}>+</button>
    </div>
  </div>

  <div class="section-label">Display</div>

  <div class="row">
    <div class="row-info">
      <div class="row-label">Upcoming letters</div>
      <div class="row-desc">shown in carousel</div>
    </div>
    <div class="stepper compact">
      <button onclick={() => step('upcomingCount', -1, 1, 10)}>−</button>
      <span class="sv">{settings.upcomingCount}</span>
      <button onclick={() => step('upcomingCount', 1, 1, 10)}>+</button>
    </div>
  </div>

  <div class="row">
    <div class="row-info">
      <div class="row-label">Streak meter</div>
      <div class="row-desc">Enable to show the streak bar during the drill</div>
    </div>
    <button
      class="toggle"
      class:on={settings.showStreak}
      onclick={() => settings.showStreak = !settings.showStreak}
      aria-label="Toggle streak meter"
    >
      <span class="knob"></span>
    </button>
  </div>

  <div class="section-label">Practice Weighting</div>

  <div class="row slider-row">
    <div class="row-info">
      <div class="row-label">Slow letter boost</div>
      <div class="row-desc">% chance of picking a slow letter</div>
    </div>
    <span class="slider-val">{Math.round(slowPctDisplay.current)}%</span>
  </div>
  <div class="slider-wrap">
    <input
      type="range" min="0" max="100" step="5"
      bind:value={settings.slowPct}
      style={sliderStyle(settings.slowPct, 0, 100)}
    />
    <div class="slider-ticks">
      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
    </div>
  </div>

  <div class="row" class:dim={settings.slowPct === 0}>
    <div class="row-info">
      <div class="row-label">Slowest pool size</div>
      <div class="row-desc">When using slow letter boost, choose from this many of your slowest letters</div>
    </div>
    <div class="stepper compact">
      <button onclick={() => step('slowN', -1, 1, 100)}>−</button>
      <span class="sv">{settings.slowN}</span>
      <button onclick={() => step('slowN', 1, 1, 100)}>+</button>
    </div>
  </div>

  <div class="row slider-row">
    <div class="row-info">
      <div class="row-label">N-gram mix</div>
      <div class="row-desc">% of letters generated from common bigrams and trigrams</div>
    </div>
    <span class="slider-val">{Math.round(ngramPctDisplay.current)}%</span>
  </div>
  <div class="slider-wrap">
    <input
      type="range" min="0" max="100" step="5"
      bind:value={settings.ngramPct}
      style={sliderStyle(settings.ngramPct, 0, 100)}
    />
    <div class="slider-ticks">
      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
    </div>
  </div>
  {#if settings.ngramPct === 100}
    <div class="ngram-note">Punctuation and special characters will only appear if this is below 100%.</div>
  {/if}

  <div class="row">
    <div class="row-info">
      <div class="row-label">Custom sequences</div>
      <div class="row-desc">Bigrams, trigrams, or words separated by spaces, commas, or newlines. Clear to restore defaults.</div>
    </div>
  </div>
  <textarea
    class="custom-ngrams"
    rows="8"
    bind:value={ngramText}
    oninput={onNgramInput}
  ></textarea>

  <div class="reset-row">
    <button class="reset-btn" onclick={() => settings.reset()}>Reset to defaults</button>
  </div>

</div>

<style>
  .screen {
    padding: 20px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    height: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .header h2 {
    font-family: var(--mono);
    font-size: 20px;
    font-weight: 700;
  }

  .header button {
    background: none;
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: var(--sans);
    font-size: 14px;
    padding: 5px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
  }
  .header button:hover { border-color: rgba(96,165,250,0.4); color: var(--text); }

  /* ── Section labels ── */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-dim);
    opacity: 0.5;
    margin-top: 24px;
    margin-bottom: 10px;
  }

  /* ── Rows ── */
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 0;
    border-bottom: 1px solid var(--border);
    transition: opacity 0.2s;
  }
  .row.dim { opacity: 0.35; pointer-events: none; }
  .slider-row { border-bottom: none; padding-bottom: 4px; }

  .row-info { flex: 1; }
  .row-label { font-size: 14px; color: var(--text); }
  .row-desc  { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

  /* ── Custom stepper ── */
  .stepper {
    display: flex;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 9px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .stepper button {
    width: 32px;
    height: 34px;
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 16px;
    font-family: var(--mono);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s, color 0.1s;
    flex-shrink: 0;
  }
  .stepper button:hover { background: var(--surface2); color: var(--text); }
  .stepper button:active { background: var(--border); }

  .stepper .sv {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    min-width: 52px;
    text-align: center;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    letter-spacing: 0.5px;
  }

  .stepper.compact .sv { min-width: 32px; }

  /* ── Slider ── */
  .slider-val {
    font-family: var(--mono);
    font-size: 16px;
    font-weight: 700;
    color: var(--accent);
    min-width: 42px;
    text-align: right;
  }

  .slider-wrap {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0;
  }

  .slider-wrap input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    display: block;
    touch-action: none;
  }

  .slider-wrap input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    background-clip: padding-box;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(96,165,250,0.5);
    border: 2px solid var(--bg);
    transition: box-shadow 0.15s, transform 0.1s;
  }
  .slider-wrap input[type="range"]::-webkit-slider-thumb:hover {
    box-shadow: 0 0 14px rgba(96,165,250,0.7);
    transform: scale(1.1);
  }

  .slider-wrap input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    background-clip: padding-box;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(96,165,250,0.5);
    border: 2px solid var(--bg);
  }

  @media (pointer: coarse) {
    .slider-wrap input[type="range"] {
      padding: 14px 0;
      box-sizing: content-box;
    }
    .slider-wrap input[type="range"]::-webkit-slider-thumb {
      border: 10px solid transparent;
      background-clip: padding-box;
    }
    .slider-wrap input[type="range"]::-moz-range-thumb {
      border: 10px solid transparent;
      background-clip: padding-box;
    }
  }
  .slider-wrap input[type="range"]::-moz-range-progress {
    background: var(--accent);
    height: 4px;
    border-radius: 2px;
  }

  .slider-ticks {
    display: flex;
    justify-content: space-between;
    padding: 4px 0 0;
    font-family: var(--mono);
    font-size: 9px;
    color: var(--text-dim);
    opacity: 0.4;
  }

  /* ── Toggle ── */
  .toggle {
    width: 44px;
    height: 26px;
    border-radius: 13px;
    border: 1px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;
    padding: 0;
  }
  .toggle.on {
    background: var(--accent);
    border-color: var(--accent);
  }
  .toggle .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text);
    transition: transform 0.2s;
  }
  .toggle.on .knob {
    transform: translateX(18px);
    background: var(--bg);
  }

  /* ── N-gram note ── */
  .ngram-note {
    font-size: 11px;
    color: var(--text-dim);
    opacity: 0.7;
    padding: 4px 0 8px;
    border-bottom: 1px solid var(--border);
  }

  /* ── Custom ngrams textarea ── */
  .custom-ngrams {
    width: 100%;
    min-height: 60px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 10px;
    resize: vertical;
    outline: none;
    margin-bottom: 0;
    box-sizing: border-box;
    transition: border-color 0.12s;
  }
  .custom-ngrams:focus {
    border-color: var(--accent);
  }
  .custom-ngrams::placeholder {
    color: var(--text-dim);
    opacity: 0.5;
  }

  /* ── Reset ── */
  .reset-row {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .reset-btn {
    background: none;
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: var(--sans);
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
  }
  .reset-btn:hover { border-color: rgba(248,113,113,0.4); color: var(--wrong); }
  .reset-btn:active { background: rgba(248,113,113,0.08); }
</style>
