<script>
  import { settings } from '../lib/state/Settings.svelte.js';

  let { navigate } = $props();

  function back() {
    settings.save();
    navigate('setup');
  }
</script>

<div class="screen">
  <div class="header">
    <h2>Settings</h2>
    <button onclick={back}>← Back</button>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Fast threshold</div>
      <div class="sdesc">ms — gold burst effect</div>
    </div>
    <input type="number" min="50" max="5000" step="50" bind:value={settings.fastMs}>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Medium threshold</div>
      <div class="sdesc">ms — green ring effect</div>
    </div>
    <input type="number" min="100" max="10000" step="50" bind:value={settings.mediumMs}>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Pause timeout</div>
      <div class="sdesc">ms — ignore time after this</div>
    </div>
    <input type="number" min="1000" max="30000" step="500" bind:value={settings.pauseMs}>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Upcoming letters</div>
      <div class="sdesc">shown in carousel (1–10)</div>
    </div>
    <input type="number" min="1" max="10" step="1" bind:value={settings.upcomingCount}>
  </div>

  <div class="section-label">Rhythm Mode</div>

  <div class="setting-row">
    <div>
      <div class="slabel">Starting interval</div>
      <div class="sdesc">ms — initial sweep speed</div>
    </div>
    <input type="number" min="500" max="5000" step="100" bind:value={settings.rhythm.startMs}>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Minimum interval</div>
      <div class="sdesc">ms — speed floor</div>
    </div>
    <input type="number" min="200" max="3000" step="100" bind:value={settings.rhythm.floorMs}>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Streak to speed up</div>
      <div class="sdesc">consecutive hits needed</div>
    </div>
    <input type="number" min="5" max="100" step="5" bind:value={settings.rhythm.streakUp}>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Speed-up amount</div>
      <div class="sdesc">ms faster per milestone</div>
    </div>
    <input type="number" min="25" max="500" step="25" bind:value={settings.rhythm.speedupMs}>
  </div>

  <div class="setting-row">
    <div>
      <div class="slabel">Metronome tick</div>
      <div class="sdesc">audio cue at target moment</div>
    </div>
    <input type="checkbox" bind:checked={settings.rhythm.tick}>
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
    margin-bottom: 20px;
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
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }

  .slabel { font-size: 14px; color: var(--text); }
  .sdesc  { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

  .setting-row input[type="number"] {
    width: 70px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 8px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 14px;
    text-align: right;
    outline: none;
  }
  .setting-row input[type="number"]:focus { border-color: var(--accent); }

  .setting-row input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
    cursor: pointer;
  }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-dim);
    margin: 20px 0 4px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
</style>
