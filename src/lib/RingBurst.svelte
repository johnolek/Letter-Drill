<script>
  // trigger: $bindable number — increment to fire
  // type: '' | 'gold'
  let { trigger = $bindable(0), type = '' } = $props();
</script>

{#key trigger}
  {#if trigger > 0}
    <div class="ring" class:gold={type === 'gold'}></div>
  {/if}
{/key}

<style>
  .ring {
    position: absolute;
    top: calc(6vh + 80px);
    left: 50%;
    width: 0; height: 0;
    border-radius: 50%;
    pointer-events: none;
    z-index: 8;
    transform: translate(-50%, -50%);
    animation: ringExpand 0.5s ease-out forwards;
  }

  .ring.gold {
    animation: ringExpandGold 0.5s ease-out forwards;
  }
</style>
