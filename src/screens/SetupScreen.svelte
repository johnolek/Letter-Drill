<script>
  import { settings } from '../lib/state/Settings.svelte.js';
  import { selection } from '../lib/state/Selection.svelte.js';
  import { LETTERS, EXTRAS, PRESETS } from '../lib/constants.js';

  let { navigate } = $props();

  let mode = $state(localStorage.getItem('ld_mode') || 'standard');
  $effect(() => { localStorage.setItem('ld_mode', mode); });

  function applyPreset(key) {
    selection.setAll(PRESETS[key]);
  }

  let toggleInputValue = $state('');
  function onToggleInput(e) {
    const ch = (e.data || toggleInputValue).toLowerCase().slice(-1);
    toggleInputValue = '';
    if (!ch || ch === ' ') return;
    if ([...LETTERS, ...EXTRAS].includes(ch)) selection.toggle(ch);
  }

  function startDrill() {
    if (selection.size < 2) return;
    navigate(mode === 'rhythm' ? 'rhythm' : 'drill');
  }
</script>

<div class="screen">
  <div class="title">letter drill</div>
  <div class="sub">Pick letters to practice. Tap them or type below to toggle.</div>

  <div class="section-label">Presets</div>
  <div class="preset-row">
    {#each Object.entries(PRESETS) as [key, _]}
      <button class="pbtn" onclick={() => applyPreset(key)}>{key}</button>
    {/each}
  </div>

  <div class="section-label">Letters</div>
  <div class="letter-grid">
    {#each LETTERS as ch}
      <button class="lbtn" class:on={selection.has(ch)} onclick={() => selection.toggle(ch)}>{ch}</button>
    {/each}
  </div>

  <div class="section-label">Other Characters</div>
  <div class="letter-grid">
    {#each EXTRAS as ch}
      <button class="lbtn" class:on={selection.has(ch)} onclick={() => selection.toggle(ch)}>{ch}</button>
    {/each}
  </div>

  <div class="section-label">Toggle with keyboard</div>
  <div class="toggle-input-row">
    <input
      type="text"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="type a letter to toggle it"
      bind:value={toggleInputValue}
      oninput={onToggleInput}
    />
  </div>

  {#if selection.size > 0}
    <div class="enabled-display">
      {#each [...selection.set].sort() as ch}
        <button class="en-chip" onclick={() => selection.toggle(ch)}>{ch}</button>
      {/each}
    </div>
  {:else}
    <div class="enabled-display empty-hint">no letters selected</div>
  {/if}

  <div class="bottom-links">
    <button class="pbtn" onclick={() => navigate('stats')}>Stats</button>
    <button class="pbtn" onclick={() => navigate('settings')}>Settings</button>
  </div>

  <div class="mode-row">
    <button class="mode-btn" class:active={mode === 'standard'} onclick={() => (mode = 'standard')}>Standard</button>
    <button class="mode-btn" class:active={mode === 'rhythm'}   onclick={() => (mode = 'rhythm')}>Rhythm</button>
  </div>

  <button class="start-btn" disabled={selection.size < 2} onclick={startDrill}>Start</button>
</div>

<style>
  .screen {
    padding: 20px;
    padding-bottom: 100px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .title {
    font-family: var(--mono);
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -1px;
    margin-bottom: 4px;
  }

  .sub {
    color: var(--text-dim);
    font-size: 14px;
    margin-bottom: 20px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-dim);
    margin-bottom: 8px;
    margin-top: 18px;
  }

  .letter-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .lbtn {
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 9px;
    border: 2px solid var(--border);
    background: var(--surface);
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.1s;
  }

  .lbtn.on {
    border-color: var(--accent);
    background: rgba(96,165,250,0.12);
    color: var(--accent);
  }

  .preset-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 12px;
  }

  .pbtn {
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-dim);
    font-family: var(--sans);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  .pbtn:active { background: var(--surface2); }

  .toggle-input-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 8px;
  }

  .toggle-input-row input {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 16px;
    outline: none;
    caret-color: var(--accent);
  }
  .toggle-input-row input:focus { border-color: var(--accent); }
  .toggle-input-row input::placeholder { color: var(--text-dim); opacity: 0.5; }

  .enabled-display {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    min-height: 28px;
    align-items: center;
  }
  .empty-hint {
    font-size: 12px;
    color: var(--text-dim);
    opacity: 0.4;
  }

  .en-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px; height: 28px;
    border-radius: 6px;
    background: rgba(96,165,250,0.12);
    border: 1px solid rgba(96,165,250,0.25);
    color: var(--accent);
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.1s;
  }
  .en-chip:active {
    background: rgba(248,113,113,0.15);
    border-color: rgba(248,113,113,0.3);
    color: var(--wrong);
  }

  .bottom-links {
    display: flex;
    gap: 8px;
    margin-top: 18px;
  }

  .mode-row {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    margin-top: 16px;
    margin-bottom: 12px;
  }

  .mode-btn {
    flex: 1;
    padding: 10px;
    border: none;
    background: var(--surface);
    color: var(--text-dim);
    font-family: var(--sans);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.12s;
  }
  .mode-btn.active {
    background: var(--accent);
    color: var(--bg);
    font-weight: 700;
  }

  .start-btn {
    position: fixed;
    bottom: 20px; left: 20px; right: 20px;
    padding: 15px;
    border-radius: 12px;
    border: none;
    background: var(--accent);
    color: var(--bg);
    font-family: var(--sans);
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    z-index: 20;
  }
  .start-btn:disabled { opacity: 0.3; cursor: default; }
</style>
