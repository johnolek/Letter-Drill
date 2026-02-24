<script>
  import { fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { settings }  from '../lib/state/Settings.svelte.js';
  import { selection } from '../lib/state/Selection.svelte.js';
  import { RhythmSession } from '../sessions/RhythmSession.svelte.js';
  import Carousel from '../lib/Carousel.svelte';
  import DotsRow  from '../lib/DotsRow.svelte';

  let { navigate } = $props();

  const HIT_WINDOW = 150;

  const session = new RhythmSession(
    selection.letters,
    settings.rhythm,
    settings.upcomingCount,
  );

  // ── DOM refs ──
  let trackEl;
  let ballLEl;
  let ballREl;
  let inputEl;
  let carouselCtrl = $state(null);

  // ── UI state ──
  let dots       = $state([]);
  let dotSeq     = 0;
  let bannerText = $state('');
  let bannerTimer;
  let zoneFlash  = $state(false);
  let inZone     = $state(false);

  // ── Zone width (centred, updated when interval changes) ──
  let zoneWidthPct = $derived(Math.min(80, (2 * HIT_WINDOW / session.interval) * 100));

  function addDot(cls) {
    dots = [...dots.slice(-29), { cls, id: dotSeq++ }];
  }

  function showBanner(text) {
    clearTimeout(bannerTimer);
    bannerText = text;
    bannerTimer = setTimeout(() => { bannerText = ''; }, 1400);
  }

  // ── Ball animation callback ──
  function onProgress(p) {
    if (!ballLEl || !ballREl || !trackEl) return;
    const W  = trackEl.offsetWidth;
    const bW = 20;
    const lX = p * (W / 2 - bW);
    const rX = W - bW - p * (W / 2 - bW);
    ballLEl.style.transform = `translateY(-50%) translateX(${lX}px)`;
    ballREl.style.transform = `translateY(-50%) translateX(${rX}px)`;
    inZone = p >= Math.max(0, 1 - HIT_WINDOW / session.interval);
  }

  // ── Start session after mount ──
  $effect(() => {
    session.start({
      onProgress,
      onLateMiss() {
        carouselCtrl?.shake();
        addDot('w');
      },
    });
    return () => session.stop();
  });

  // ── Input ──
  function onKeydown(e) {
    if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter') e.preventDefault();
  }

  function onInput(e) {
    const typed = (inputEl.value || e.data || '').toLowerCase().slice(-1);
    inputEl.value = '';
    if (!typed) return;

    const r = session.handleInput(typed);
    if (!r) return;

    if (r.hit) {
      carouselCtrl?.flash('var(--correct)');
      zoneFlash = true;
      setTimeout(() => { zoneFlash = false; }, 250);
      addDot('c');
      if (r.speedUp) showBanner(`faster  ${(r.newInterval / 1000).toFixed(1)}s`);
    } else {
      carouselCtrl?.shake();
      addDot('w');
    }
  }

  // ── Streak color ──
  let streakClass = $derived(
    session.streak >= 20 ? 'gold' :
    session.streak >= 10 ? 'green' :
    session.streak >= 5  ? 'blue' : ''
  );
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
  <!-- Header -->
  <div class="header">
    <button onclick={() => navigate('setup')}>← Done</button>
    <div class="header-center">
      <span class="streak-label">streak</span>
      <span class="streak-val {streakClass}">{session.streak}</span>
    </div>
    <span class="interval">{(session.interval / 1000).toFixed(1)}s</span>
  </div>

  <!-- Track -->
  <div class="track-wrap">
    <div bind:this={trackEl} class="track">
      <div
        class="zone"
        class:zone-flash={zoneFlash}
        style:width="{zoneWidthPct}%"
        style:left="{(100 - zoneWidthPct) / 2}%"
      ></div>
      <div class="perfect-line"></div>
      <div bind:this={ballLEl} class="ball" class:in-zone={inZone}></div>
      <div bind:this={ballREl} class="ball" class:in-zone={inZone}></div>
    </div>
  </div>

  <!-- Main area -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="area" onclick={() => inputEl?.focus()}>
    <Carousel
      queue={session.queue}
      upcomingCount={0}
      bind:controls={carouselCtrl}
    />

    <div class="bottom">
      <DotsRow {dots} />
      {#if session.bestStreak > 0}
        <div class="best-label">best {session.bestStreak}</div>
      {/if}
    </div>
  </div>

  <!-- Speed-up banner -->
  {#if bannerText}
    <div
      class="banner"
      in:fly={{ y: 10, duration: 220, easing: backOut }}
      out:fly={{ y: -16, duration: 300 }}
    >{bannerText}</div>
  {/if}
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

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
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
  .header-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  .streak-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
    opacity: 0.5;
  }
  .streak-val {
    font-family: var(--mono);
    font-size: 24px;
    font-weight: 700;
    color: var(--text-dim);
    line-height: 1;
    transition: color 0.3s;
  }
  .streak-val.blue  { color: var(--accent); }
  .streak-val.green { color: var(--correct); }
  .streak-val.gold  { color: var(--gold); }

  .interval {
    font-family: var(--mono);
    font-size: 14px;
    color: var(--text-dim);
    min-width: 40px;
    text-align: right;
  }

  /* ── Track ── */
  .track-wrap {
    padding: 20px 0 12px;
    flex-shrink: 0;
  }
  .track {
    position: relative;
    height: 8px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    overflow: visible;
  }
  .zone {
    position: absolute;
    top: 0; height: 100%;
    background: rgba(52,211,153,0.18);
    border-left: 1px solid rgba(52,211,153,0.3);
    border-right: 1px solid rgba(52,211,153,0.3);
    transition: background 0.15s;
  }
  .zone.zone-flash {
    background: rgba(52,211,153,0.55);
  }
  .perfect-line {
    position: absolute;
    left: 50%;
    top: -6px; bottom: -6px;
    width: 2px;
    transform: translateX(-50%);
    background: rgba(52,211,153,0.65);
    border-radius: 1px;
  }
  .ball {
    position: absolute;
    width: 20px; height: 20px;
    border-radius: 50%;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    background: var(--accent);
    box-shadow: 0 0 10px 4px rgba(96,165,250,0.6), 0 0 20px 8px rgba(96,165,250,0.28);
    will-change: transform;
    transition: box-shadow 0.1s, background 0.1s;
  }
  .ball.in-zone {
    background: var(--correct);
    box-shadow: 0 0 12px 5px rgba(52,211,153,0.7), 0 0 26px 10px rgba(52,211,153,0.38);
  }

  /* ── Main area ── */
  .area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 20px 24px;
    gap: 16px;
    position: relative;
  }

  /* ── Bottom ── */
  .bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .best-label {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    opacity: 0.5;
  }

  /* ── Banner ── */
  .banner {
    position: absolute;
    top: 28%; left: 50%;
    translate: -50% 0;
    background: var(--gold);
    color: var(--bg);
    font-family: var(--mono);
    font-size: 17px;
    font-weight: 700;
    padding: 8px 22px;
    border-radius: 20px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 30;
  }
</style>
