<script>
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let { val = 0, level = 0, levelUp = 0 } = $props();

  // Track direction before render so the CSS transition class is correct
  let prevVal = $state(val);
  let wasInc  = $state(true);

  $effect.pre(() => {
    wasInc  = val >= prevVal;
    prevVal = val;
  });

  // Color AND thickness determined by level, not fill amount
  const phase = $derived(
    level >= 4 ? 'plasma'  :
    level >= 3 ? 'burning' :
    level >= 2 ? 'hot'     :
    level >= 1 ? 'warm'    : 'cold'
  );
</script>

<div class="outer">
  <div class="track">
    <!-- Fill bar — thickness grows via scaleY (no layout impact) -->
    <div
      class="fill {phase}"
      class:dec={!wasInc}
      style:width="{val}%"
    >
      <!-- Leading-edge spark -->
      {#if val > 4}
        <span class="spark {phase}"></span>
      {/if}
    </div>

    <!-- Scan wipe only on level-UP (not on penalty drops) -->
    {#key levelUp}
      {#if levelUp > 0}
        <div class="scan"></div>
      {/if}
    {/key}
  </div>

  <!-- Level badge: 1-3 show number, plasma shows nothing (the bar speaks) -->
  <div class="badge-slot">
    {#if level > 0 && level < 4}
      {#key level}
        <span
          class="badge {phase}"
          in:fly={{ y: -6, duration: 180, easing: cubicOut }}
        >L{level}</span>
      {/key}
    {/if}
  </div>
</div>

<style>
  /* Fixed height container — never shifts layout when bar grows */
  .outer {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(84vw, 340px);
    height: 20px;
    margin-bottom: 14px;
  }

  /* ── Track (the empty channel) ── */
  .track {
    flex: 1;
    height: 5px;
    background: rgba(46,51,59,0.9);
    border-radius: 3px;
    position: relative;
    overflow: visible;
    box-shadow:
      inset 0 1px 2px rgba(0,0,0,0.6),
      inset 0 0 0 1px rgba(255,255,255,0.03);
  }

  /* ── Fill bar ── */
  .fill {
    position: absolute;
    left: 0; top: 0;
    height: 100%;
    border-radius: 3px;
    transform-origin: center;
    background-color: rgba(56,62,73,0.8);
    transform: scaleY(1);
    transition:
      width             0.3s  cubic-bezier(0.34, 1.56, 0.64, 1),
      background-color  0.45s ease,
      box-shadow        0.45s ease,
      transform         0.6s  ease;
  }

  /* Penalty: no spring on width */
  .fill.dec {
    transition:
      width             0.35s ease-out,
      background-color  0.45s ease,
      box-shadow        0.45s ease,
      transform         0.6s  ease;
  }

  /* ── Phase: color + thickness ── */
  .fill.warm {
    background-color: #60a5fa;
    box-shadow: 0 0 8px rgba(96,165,250,0.6), 0 0 18px rgba(96,165,250,0.2);
    transform: scaleY(1.4);
  }

  .fill.hot {
    background-color: #4ade80;
    box-shadow: 0 0 10px rgba(74,222,128,0.7), 0 0 24px rgba(74,222,128,0.25);
    transform: scaleY(2.0);
  }

  .fill.burning {
    background-color: #fbbf24;
    box-shadow: 0 0 12px rgba(251,191,36,0.8), 0 0 28px rgba(251,191,36,0.3);
    transform: scaleY(2.8);
    animation: burning-pulse 1.4s ease-in-out infinite;
  }

  .fill.plasma {
    background: linear-gradient(90deg,
      #fbbf24 0%,
      #f97316 18%,
      #ef4444 36%,
      #f97316 54%,
      #fbbf24 72%,
      #f97316 90%,
      #fbbf24 100%
    );
    background-size: 400% 100%;
    transform: scaleY(3.8);
    animation:
      plasma-flow  2.5s linear      infinite,
      plasma-pulse 1s   ease-in-out infinite alternate;
    /* drop background transitions, keep width + transform */
    transition:
      width     0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.6s ease;
  }

  .fill.plasma.dec {
    transition: width 0.35s ease-out, transform 0.6s ease;
  }

  /* ── Spark dot at fill's leading edge ── */
  .spark {
    position: absolute;
    right: -1px;
    top: 50%;
    transform: translateY(-50%);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    pointer-events: none;
    background: rgba(255,255,255,0.92);
    box-shadow: 0 0 4px 1px rgba(255,255,255,0.55);
  }

  .spark.warm {
    box-shadow: 0 0 6px 2px rgba(96,165,250,0.9), 0 0 12px rgba(96,165,250,0.4);
  }
  .spark.hot {
    width: 8px; height: 8px;
    box-shadow: 0 0 7px 2px rgba(74,222,128,0.9), 0 0 14px rgba(74,222,128,0.4);
  }
  .spark.burning {
    width: 9px; height: 9px;
    box-shadow: 0 0 8px 3px rgba(251,191,36,1), 0 0 18px rgba(251,191,36,0.5);
  }
  .spark.plasma {
    width: 12px;
    height: 12px;
    background: #fff;
    box-shadow:
      0 0 12px 5px rgba(255,255,255,0.65),
      0 0 26px    rgba(249,115,22,0.9),
      0 0 48px    rgba(239,68,68,0.5);
    animation: spark-flare 0.5s ease-in-out infinite alternate;
  }

  /* ── Level-up scan overlay ── */
  .scan {
    position: absolute;
    inset: 0;
    border-radius: 3px;
    background: rgba(255,255,255,0.92);
    animation: levelup-scan 0.65s ease-in-out forwards;
    pointer-events: none;
    z-index: 6;
  }

  /* ── Level badge ── */
  .badge-slot {
    width: 22px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
  }

  .badge {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--text-dim);
    opacity: 0.5;
  }

  .badge.warm    { color: #60a5fa; opacity: 0.7; }
  .badge.hot     { color: #4ade80; opacity: 0.7; }
  .badge.burning { color: #fbbf24; opacity: 0.8; }
</style>
