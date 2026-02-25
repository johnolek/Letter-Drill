<script>
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  // Props
  // queue        – string[] (queue[0] = current letter, queue[1..] = upcoming)
  // upcomingCount – how many upcoming slots to show
  // controls     – $bindable object; parent can call controls.flash(color) / controls.shake()
  let { queue, upcomingCount, controls = $bindable(null) } = $props();

  // DOM refs populated via use:attachSlot action
  let slotEls = [];

  // Expose imperative API to parent
  controls = {
    flash(color) {
      const s = slotEls[0];
      if (!s) return;
      s.style.color = color;
      setTimeout(() => { s.style.color = ''; }, 130);
    },
    shake() {
      const s = slotEls[0];
      if (!s) return;
      s.classList.remove('shaking');
      void s.offsetWidth;
      s.classList.add('shaking');
      setTimeout(() => s.classList.remove('shaking'), 350);
    },
  };

  // Svelte action: store element ref by index
  function attachSlot(el, i) {
    slotEls[i] = el;
    return { destroy() { slotEls[i] = null; } };
  }

  // Base size for slot 0 in both units. All other slots scale by 0.58^i.
  const BASE_VW = 28;
  const BASE_PX = 130;

  function slotSize(i) {
    const vw = Math.max(2, BASE_VW * Math.pow(0.78, i));
    const px = Math.max(2, BASE_PX * Math.pow(0.78, i));
    return { vw, px };
  }

  // Compute inline style for each slot position
  function slotStyle(i) {
    const { vw, px } = slotSize(i);
    const opacity = i === 0 ? 1 : Math.max(0.08, Math.pow(0.55, i));

    // x offset = sum of previous slots' capped widths × 0.62
    const xParts = [];
    for (let j = 0; j < i; j++) {
      const s = slotSize(j);
      xParts.push(`min(${(s.vw * 0.62).toFixed(2)}vw,${(s.px * 0.62).toFixed(2)}px)`);
    }
    const x = xParts.length === 0 ? '0px'
      : xParts.length === 1 ? xParts[0]
      : `calc(${xParts.join(' + ')})`;

    return `font-size:min(${vw}vw,${px}px);opacity:${opacity};transform:translateX(${x});z-index:${20 - i};`;
  }
</script>

<div class="carousel">
  {#each Array.from({ length: 1 + Math.min(upcomingCount, 9) }, (_, i) => i) as i}
    <div class="slot" style={slotStyle(i)} use:attachSlot={i}>
      {#if i === 0}
        {#key queue[0]}
          <span
            style="display:block"
            in:fly={{ x: 14, duration: 110, easing: cubicOut }}
          >{queue[0] ?? ''}</span>
        {/key}
      {:else}
        {queue[i] ?? ''}
      {/if}
    </div>
  {/each}
</div>

<style>
  .carousel {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 160px;
    width: 100%;
    overflow: hidden;
  }

  .slot {
    position: absolute;
    font-family: 'Menlo', 'Courier New', monospace;
    font-weight: 700;
    line-height: 1;
    user-select: none;
    white-space: nowrap;
    color: var(--text);
  }

  /* shake must use :global because the class is added imperatively */
  :global(.shaking) {
    animation: shake 0.3s ease !important;
  }
</style>
