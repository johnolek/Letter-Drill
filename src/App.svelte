<script>
  import SetupScreen    from './screens/SetupScreen.svelte';
  import DrillScreen    from './screens/DrillScreen.svelte';
  import RhythmScreen   from './screens/RhythmScreen.svelte';
  import StatsScreen    from './screens/StatsScreen.svelte';
  import SettingsScreen from './screens/SettingsScreen.svelte';

  let screen = $state('setup');

  function navigate(to) { screen = to; }
</script>

{#if screen === 'setup'}
  <SetupScreen {navigate} />
{:else if screen === 'drill'}
  <DrillScreen {navigate} />
{:else if screen === 'rhythm'}
  <RhythmScreen {navigate} />
{:else if screen === 'stats'}
  <StatsScreen {navigate} />
{:else if screen === 'settings'}
  <SettingsScreen {navigate} />
{/if}

<style>
  /* ── Reset ── */
  :global(*) {
    margin: 0; padding: 0;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Design tokens ── */
  :global(:root) {
    --bg:       #0f1114;
    --surface:  #1a1d23;
    --surface2: #24282f;
    --border:   #2e333b;
    --text:     #e8eaed;
    --text-dim: #6b7280;
    --accent:   #60a5fa;
    --correct:  #34d399;
    --wrong:    #f87171;
    --gold:     #fbbf24;
    --mono:  'Menlo', 'Courier New', monospace;
    --sans:  -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  }

  /* ── Base ── */
  :global(html) {
    height: 100%;
    overflow: hidden;
  }

  :global(body) {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    overflow: hidden;
    touch-action: manipulation;
    position: fixed;
    width: 100%;
  }

  /* ── Global keyframes (used across components) ── */
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    40%     { transform: translateX(8px); }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(4px); }
  }

  @keyframes ringExpand {
    0%   { width:20px;  height:20px;  border:3px solid var(--correct); opacity:1; }
    100% { width:200px; height:200px; border:2px solid var(--correct); opacity:0; }
  }

  @keyframes ringExpandGold {
    0%   { width:20px;  height:20px;  border:4px solid var(--gold); opacity:1; }
    100% { width:260px; height:260px; border:2px solid var(--gold); opacity:0; }
  }

</style>
