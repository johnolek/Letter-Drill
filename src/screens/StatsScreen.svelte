<script>
  import { stats } from '../lib/state/Stats.svelte.js';

  let { navigate } = $props();

  let rows = $derived.by(() => {
    const data = stats.getAll();
    const keys = Object.keys(data).sort();

    let tH = 0, tM = 0, tMs = 0, tC = 0;
    keys.forEach(k => {
      const s = data[k];
      tH += s.hits; tM += s.misses; tMs += s.totalMs; tC += s.timedCount;
    });

    const overall = {
      acc: (tH + tM) > 0 ? Math.round(tH / (tH + tM) * 100) : 0,
      avg: tC > 0 ? Math.round(tMs / tC) : 0,
      total: tH + tM,
      letters: keys.length,
    };

    const sorted = keys.map(k => {
      const s = data[k];
      const avg = s.timedCount > 0 ? Math.round(s.totalMs / s.timedCount) : 0;
      const acc = (s.hits + s.misses) > 0 ? Math.round(s.hits / (s.hits + s.misses) * 100) : 0;
      return { l: k, avg, acc, n: s.hits + s.misses };
    }).sort((a, b) => b.avg - a.avg);

    const avgs = sorted.map(r => r.avg).filter(v => v > 0);
    const fastest = avgs.length ? Math.min(...avgs) : 0;
    const slowest = avgs.length ? Math.max(...avgs) : 0;

    return { overall, sorted, fastest, slowest, hasAvgs: avgs.length >= 3 };
  });

  function clearStats() {
    if (confirm('Clear all stats?')) stats.clear();
  }
</script>

<div class="screen">
  <div class="header">
    <h2>Stats</h2>
    <button onclick={() => navigate('setup')}>← Back</button>
  </div>

  <div class="grid">
    <div class="scard"><div class="sl">Accuracy</div><div class="sv">{rows.overall.acc}%</div></div>
    <div class="scard"><div class="sl">Avg ms</div><div class="sv">{rows.overall.avg || '—'}</div></div>
    <div class="scard"><div class="sl">Total</div><div class="sv">{rows.overall.total}</div></div>
    <div class="scard"><div class="sl">Letters</div><div class="sv">{rows.overall.letters}</div></div>
  </div>

  <table class="ltable">
    <thead><tr>
      <th>Letter</th><th>Avg ms</th><th>Accuracy</th><th>Count</th>
    </tr></thead>
    <tbody>
      {#each rows.sorted as r}
        {@const cls = rows.hasAvgs
          ? (r.avg === rows.slowest && r.avg > 0 ? 'slow' : r.avg === rows.fastest && r.avg > 0 ? 'fast' : '')
          : ''}
        {@const bw = r.acc * 0.5}
        {@const bc = r.acc >= 90 ? 'var(--correct)' : r.acc >= 70 ? 'var(--accent)' : 'var(--wrong)'}
        <tr class={cls}>
          <td>{r.l}</td>
          <td>{r.avg || '—'}</td>
          <td>
            <span class="abar" style:width="{bw}px" style:background={bc}></span>{r.acc}%
          </td>
          <td>{r.n}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <button class="clear-btn" onclick={clearStats}>Clear All Stats</button>
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

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }

  .scard {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 11px;
    padding: 14px;
  }
  .scard .sl {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
    margin-bottom: 4px;
  }
  .scard .sv {
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 700;
  }

  .ltable {
    width: 100%;
    border-collapse: collapse;
  }
  .ltable th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
    padding: 7px 10px;
    border-bottom: 1px solid var(--border);
  }
  .ltable th:not(:first-child) { text-align: right; }
  .ltable td {
    padding: 9px 10px;
    border-bottom: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 14px;
  }
  .ltable td:first-child { font-size: 17px; font-weight: 700; }
  .ltable td:not(:first-child) { text-align: right; color: var(--text-dim); }

  :global(.ltable tr.slow td:first-child) { color: var(--wrong); }
  :global(.ltable tr.fast td:first-child) { color: var(--correct); }

  .abar {
    display: inline-block;
    height: 5px;
    border-radius: 3px;
    min-width: 3px;
    vertical-align: middle;
    margin-right: 4px;
  }

  .clear-btn {
    margin-top: 16px;
    width: 100%;
    padding: 11px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: none;
    color: var(--wrong);
    font-family: var(--sans);
    font-size: 14px;
    cursor: pointer;
  }
</style>
