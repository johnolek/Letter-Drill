<script>
  import { fly, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let { val = 0, level = 0 } = $props();

  // ── Color palette ──
  // First 10 levels are hand-picked for a satisfying progression.
  // Beyond that, deterministically generate colors by walking the hue wheel.
  const PALETTE = [
    '#4b5563', // 0  grey (cold)
    '#60a5fa', // 1  blue
    '#38bdf8', // 2  sky
    '#2dd4bf', // 3  teal
    '#4ade80', // 4  green
    '#a3e635', // 5  lime
    '#facc15', // 6  yellow
    '#fb923c', // 7  orange
    '#f87171', // 8  red
    '#e879f9', // 9  purple
  ];

  function colorForLevel(lvl) {
    if (lvl < PALETTE.length) return PALETTE[lvl];
    // Golden-ratio hue walk — produces evenly-spaced, non-repeating hues
    const hue = ((lvl - PALETTE.length) * 137.508) % 360;
    return `hsl(${Math.round(hue)}, 75%, 60%)`;
  }

  // ── Derived styles ──
  let color    = $derived(colorForLevel(level));
  let height   = $derived(Math.min(20, 6 + level * 2));
</script>

<div class="outer">
  <div class="track" style:height="{height}px">
    <div class="fill" style:width="{val}%" style:background={color}></div>
  </div>

  {#key level}
    {#if level > 0}
      <span
        class="badge"
        style:color={color}
        in:fly={{ y: -6, duration: 180, easing: cubicOut }}
      >{level}</span>
    {/if}
  {/key}
</div>

<style>
  .outer {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(84vw, 340px);
    height: 20px;
    margin-bottom: 14px;
  }

  .track {
    flex: 1;
    background: rgba(46, 51, 59, 0.9);
    border-radius: 3px;
    overflow: hidden;
    transition: height 0.4s ease;
  }

  .fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.15s linear, background 0.4s ease;
  }

  .badge {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    flex-shrink: 0;
    min-width: 12px;
    text-align: right;
  }
</style>
