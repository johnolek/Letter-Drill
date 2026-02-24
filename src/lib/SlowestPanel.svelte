<script>
  import { fly } from 'svelte/transition';
  import { stats } from './state/Stats.svelte.js';
  import { selection } from './state/Selection.svelte.js';

  // Reactively derive sorted slowest-letter list
  let entries = $derived(
    Object.entries(stats.data)
      .filter(([k, v]) => v.timedCount > 0 && selection.has(k))
      .map(([k, v]) => ({ letter: k, avg: Math.round(v.totalMs / v.timedCount) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10)
  );

  // Color for each entry (red = slowest, dim = fastest in list)
  function entryColor(entry) {
    const maxAvg = entries[0]?.avg ?? 0;
    const minAvg = entries[entries.length - 1]?.avg ?? 0;
    const t = maxAvg > minAvg ? (entry.avg - minAvg) / (maxAvg - minAvg) : 0.5;
    const r = Math.round(120 + t * 128);
    const g = Math.round(114 - t * 2);
    const b = Math.round(128 - t * 15);
    return `rgb(${r},${g},${b})`;
  }
</script>

<div class="panel">
  <div class="label">slowest</div>
  <div class="list">
    {#each entries as entry (entry.letter)}
      <div class="item" in:fly={{ x: -20, duration: 300 }} out:fly={{ x: -20, duration: 300 }}>
        <span class="letter" style:color={entryColor(entry)}>{entry.letter}</span>
        <span class="ms">{entry.avg}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .panel {
    position: absolute;
    left: 6px;
    top: 6px;
    width: 62px;
    z-index: 4;
  }

  .label {
    font-family: var(--mono);
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
    opacity: 0.5;
    margin-bottom: 4px;
  }

  .list {
    display: flex;
    flex-direction: column;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 22px;
    font-family: var(--mono);
    white-space: nowrap;
  }

  .letter {
    font-size: 13px;
    font-weight: 700;
    width: 16px;
    text-align: center;
  }

  .ms {
    font-size: 9px;
    color: var(--text-dim);
  }
</style>
