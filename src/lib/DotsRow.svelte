<script>
  import { scale } from 'svelte/transition';

  // dots: Array<{ cls: 'c' | 'w' | 'g', id: number }>
  let { dots = [] } = $props();
</script>

<div class="row">
  {#each dots as d (d.id)}
    <div class="dot {d.cls}" in:scale={{ duration: 150, start: 0.3 }}></div>
  {/each}
</div>

<style>
  .row {
    display: flex;
    gap: 5px;
    height: 24px;
    align-items: center;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    opacity: 0.7;
  }

  .dot.c { background: var(--correct); }
  .dot.w { background: var(--wrong); }
  .dot.g { background: var(--gold); }
</style>
