<script>
  import { settings }  from '../lib/state/Settings.svelte.js';
  import { stats }     from '../lib/state/Stats.svelte.js';
  import { selection } from '../lib/state/Selection.svelte.js';
  import { DrillSession } from '../sessions/DrillSession.svelte.js';
  import { spawnParticles } from '../lib/effects.js';
  import Carousel     from '../lib/Carousel.svelte';
  import DotsRow      from '../lib/DotsRow.svelte';
  import SlowestPanel from '../lib/SlowestPanel.svelte';
  import RingBurst    from '../lib/RingBurst.svelte';

  let { navigate } = $props();

  const session = new DrillSession(selection.letters, settings.upcomingCount);

  let dots         = $state([]);
  let dotSeq       = 0;
  let ringSignal   = $state(0);
  let ringType     = $state('');
  let carouselCtrl = $state(null);
  let particlesEl;
  let inputEl;

  function focusInput() { inputEl?.focus(); }

  function addDot(cls) {
    dots = [...dots.slice(-29), { cls, id: dotSeq++ }];
  }

  function effectFast() {
    ringType = 'gold'; ringSignal++;
    spawnParticles(particlesEl, 14, 'var(--gold)', 'var(--correct)');
    carouselCtrl?.flash('var(--gold)');
  }
  function effectMedium() {
    ringType = ''; ringSignal++;
    spawnParticles(particlesEl, 6, 'var(--correct)', 'var(--accent)');
    carouselCtrl?.flash('var(--correct)');
  }
  function effectOk()    { carouselCtrl?.flash('var(--correct)'); }
  function effectWrong() { carouselCtrl?.shake(); }

  function onKeydown(e) {
    if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter') e.preventDefault();
  }

  function onInput(e) {
    const typed = (inputEl.value || e.data || '').toLowerCase().slice(-1);
    inputEl.value = '';
    if (!typed) return;

    const r = session.handleInput(typed, settings);
    stats.record(r.letter, r.hit, r.timeMs ?? 0, r.skipTime);

    if (r.hit) {
      if (r.speed === 'fast')        { effectFast();   addDot('g'); }
      else if (r.speed === 'medium') { effectMedium(); addDot('c'); }
      else                           { effectOk();     addDot('c'); }
    } else {
      effectWrong();
      addDot('w');
    }
  }

  let dsAcc = $derived(session.accuracy !== null ? session.accuracy + '%' : '—');
  let dsLpm = $derived(session.lpm !== null ? String(session.lpm) : '—');
</script>

<input
  bind:this={inputEl}
  class="hidden-input"
  type="text"
  autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
  onkeydown={onKeydown}
  oninput={onInput}
/>

<div class="screen">
  <div class="header">
    <button onclick={() => navigate('setup')}>← Done</button>
    <div class="stats">
      <span><span class="val">{session.correct}</span></span>
      <span><span class="val">{dsAcc}</span> acc</span>
      <span><span class="val">{dsLpm}</span> lpm</span>
    </div>
  </div>

  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="area" onclick={focusInput}>
    <SlowestPanel />

    <Carousel
      queue={session.queue}
      upcomingCount={settings.upcomingCount}
      bind:controls={carouselCtrl}
    />

    <div bind:this={particlesEl} class="particles"></div>

    <RingBurst bind:trigger={ringSignal} {ringType} />

    <DotsRow {dots} />
  </div>
</div>

<style>
  .hidden-input {
    position: fixed;
    bottom: 0; left: 0;
    width: 100%; height: 1px;
    opacity: 0; border: none; outline: none;
    background: transparent; font-size: 16px; z-index: -1;
  }

  .screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: none;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    z-index: 5;
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

  .stats {
    display: flex;
    gap: 16px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-dim);
  }
  .stats .val { color: var(--text); font-weight: 700; }

  .area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 6vh;
    overflow: hidden;
    position: relative;
  }

  .particles {
    position: absolute;
    top: calc(6vh + 80px);
    left: 50%;
    pointer-events: none;
    z-index: 10;
  }
</style>
