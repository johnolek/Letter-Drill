<script>
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let { val = 0, level = 0 } = $props();

  const tweenVal   = Tween.of(() => val,   { duration: 150 });
  const tweenLevel = Tween.of(() => level, { duration: 300, easing: cubicOut });

  // ── Color palette ──
  // First 10 levels are hand-picked. Beyond that, golden-ratio hue walk.
  const PALETTE = [
    '#4b5563', // 0  grey
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
    const hue = ((lvl - PALETTE.length) * 137.508) % 360;
    return `hsl(${Math.round(hue)}, 75%, 60%)`;
  }

  // ── Oklab color blending ──
  // Oklab produces perceptually smooth transitions (no muddy midpoints)
  const gammaToLinear = (c) =>
    c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  const linearToGamma = (c) =>
    c >= 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c;

  function hexToOklab(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = gammaToLinear(((n >> 16) & 255) / 255);
    const g = gammaToLinear(((n >> 8) & 255) / 255);
    const b = gammaToLinear((n & 255) / 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ];
  }

  function oklabToHex(L, a, b) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const clamp = (v) => Math.round(Math.max(0, Math.min(255, 255 * linearToGamma(v))));
    const r = clamp(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
    const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
    const b2 = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b2).toString(16).slice(1);
  }

  function lerpColor(hexA, hexB, t) {
    const [L1, a1, b1] = hexToOklab(hexA);
    const [L2, a2, b2] = hexToOklab(hexB);
    return oklabToHex(
      L1 + (L2 - L1) * t,
      a1 + (a2 - a1) * t,
      b1 + (b2 - b1) * t,
    );
  }

  // Ensure hex for all levels (convert generated HSL to hex)
  function hexForLevel(lvl) {
    if (lvl < PALETTE.length) return PALETTE[lvl];
    const hue = ((lvl - PALETTE.length) * 137.508) % 360;
    const s = 0.75, li = 0.6;
    const c = (1 - Math.abs(2 * li - 1)) * s;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = li - c / 2;
    let r, g, b;
    if (hue < 60)       { r = c; g = x; b = 0; }
    else if (hue < 120) { r = x; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x; }
    else if (hue < 240) { r = 0; g = x; b = c; }
    else if (hue < 300) { r = x; g = 0; b = c; }
    else                { r = c; g = 0; b = x; }
    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Above 85%: blend toward next level (promotion preview)
  let color = $derived.by(() => {
    const cur = hexForLevel(level);
    if (val >= 85) {
      return lerpColor(cur, hexForLevel(level + 1), (val - 85) / 15);
    }
    return cur;
  });
  let height = $derived(Math.min(20, 6 + level * 2));

  // ── Glow halo: level 2+, intensity maxes at level 8 ──
  let glowIntensity = $derived(
    level < 2 ? 0 : Math.min(1, (level - 2) / 6)
  );
  let glow = $derived(
    glowIntensity > 0
      ? `0 0 ${8 + glowIntensity * 16}px ${color}, 0 0 ${glowIntensity * 40}px ${color}`
      : 'none'
  );

  // ── Barber pole: level 2+, speed maxes at level 8 ──
  const STRIPE_SIZE = 30;
  let stripeOffset = $state(0);
  let stripeSpeed = $derived(
    level < 2 ? 0 : 15 + (Math.min(level, 8) - 2) * 5.3
  );

  // ── Heat shimmer: level 9+ ──
  let shimmerSkew = $state(0);
  let hasShimmer = $derived(level >= 9);

  // Single rAF loop drives both barber pole and shimmer
  $effect(() => {
    if (stripeSpeed === 0 && !hasShimmer) return;
    let last = performance.now();
    let frame;

    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (stripeSpeed > 0) {
        stripeOffset = (stripeOffset + stripeSpeed * dt) % STRIPE_SIZE;
      }
      if (hasShimmer) {
        shimmerSkew = Math.sin(now / 200) * 1.2 + Math.sin(now / 130) * 0.6;
      }
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="outer">
  <div class="track-slot">
    <div
      class="track"
      style:height="{height}px"
      style:box-shadow={glow}
      style:transform={hasShimmer ? `skewX(${shimmerSkew}deg)` : null}
    >
      <div
        class="fill"
        style:width="{tweenVal.current}%"
        style:background={color}
      >
        {#if level >= 2}
          <div
            class="stripes"
            style:background-size="{STRIPE_SIZE}px {STRIPE_SIZE}px"
            style:background-position="{stripeOffset}px 0"
          ></div>
        {/if}
      </div>
    </div>
  </div>
  <span class="badge" style:color={color}>{Math.round(tweenLevel.current)}</span>
</div>

<style>
  .outer {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(84vw, 340px);
    margin-bottom: 14px;
  }

  .track-slot {
    width: 100%;
    height: 20px;
    display: flex;
    align-items: center;
  }

  .track {
    width: 100%;
    background: rgba(46, 51, 59, 0.9);
    border-radius: 3px;
    overflow: hidden;
    transition: height 0.3s ease, box-shadow 0.4s ease;
  }

  .fill {
    height: 100%;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
  }

  .stripes {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.45) 0px,
      rgba(255, 255, 255, 0.45) 10px,
      transparent 10px,
      transparent 20px
    );
  }

  .badge {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    margin-top: 4px;
  }
</style>
