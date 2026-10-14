<script setup lang="ts">
import { COMBO_COUNT } from '../data/combos'
</script>

<template>
  <header class="hero">
    <!-- A hanko seal: 配色, "colour arrangement", the word in the title of
         Wada's dictionary (配色総鑑). Decorative; the heading carries the name. -->
    <span class="seal" aria-hidden="true">配<br>色</span>
    <div class="titles">
      <h1>Colour <span class="combos">Combos</span></h1>
      <p class="sub">
        All {{ COMBO_COUNT }} combinations from Sanzo Wada's
        <cite>A Dictionary of Color Combinations</cite>, 1933.
        Click one for its scale and code.
      </p>
    </div>
    <p class="vertical" aria-hidden="true">
      和田三造・配色総鑑
    </p>
  </header>
</template>

<style scoped>
/* Seigaiha — the "blue sea waves" pattern — drawn in hairlines just above the
   background, fading out under the titles. */
.hero {
  --wave: oklch(from var(--line) l c h / 0.55);

  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
  overflow: hidden;
  isolation: isolate;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-color: var(--bg);
  background-image:
    radial-gradient(circle at 100% 150%, var(--bg) 24%, var(--wave) 24% 28%, var(--bg) 28% 36%, var(--wave) 36% 40%, transparent 40%),
    radial-gradient(circle at 0 150%, var(--bg) 24%, var(--wave) 24% 28%, var(--bg) 28% 36%, var(--wave) 36% 40%, transparent 40%),
    radial-gradient(circle at 50% 100%, var(--wave) 10%, var(--bg) 10% 23%, var(--wave) 23% 30%, var(--bg) 30% 43%, var(--wave) 43% 50%, var(--bg) 50% 63%, var(--wave) 63% 71%, transparent 71%),
    radial-gradient(circle at 100% 50%, var(--wave) 5%, var(--bg) 5% 15%, var(--wave) 15% 20%, var(--bg) 20% 29%, var(--wave) 29% 34%, var(--bg) 34% 44%, var(--wave) 44% 49%, transparent 49%),
    radial-gradient(circle at 0 50%, var(--wave) 5%, var(--bg) 5% 15%, var(--wave) 15% 20%, var(--bg) 20% 29%, var(--wave) 29% 34%, var(--bg) 34% 44%, var(--wave) 44% 49%, transparent 49%);
  background-size: 80px 40px;
  mask-image: linear-gradient(to left, #000, transparent 75%);
}

.seal {
  flex: none;
  display: grid;
  place-items: center;
  inline-size: 5.5rem;
  block-size: 5.5rem;
  border-radius: 1.1rem;
  background: var(--shu);
  color: var(--on-shu);
  font-family: var(--display);
  font-size: 1.85rem;
  line-height: 1.05;
  text-align: center;
  rotate: -6deg;
  box-shadow: inset 0 0 0 4px var(--shu), inset 0 0 0 7px var(--on-shu);
  transition: rotate 400ms var(--ease-bounce);
}

@media (hover: hover) {
  .seal:hover {
    rotate: 8deg;
  }
}

.titles {
  min-inline-size: 0;
}

h1 {
  margin: 0;
  font-family: var(--display);
  font-size: var(--text-display);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.01em;
}

.combos {
  color: var(--kin);
}

.sub {
  max-inline-size: 36rem;
  margin: var(--space-sm) 0 0;
  color: var(--ink-muted);
}

cite {
  color: var(--ink);
  font-style: italic;
}

.vertical {
  margin: 0 0 0 auto;
  align-self: stretch;
  writing-mode: vertical-rl;
  color: var(--shu);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.3em;
  opacity: 0.85;
}

@media (max-width: 40rem) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding-inline: var(--space-md);
  }

  .seal {
    inline-size: 4rem;
    block-size: 4rem;
    font-size: 1.3rem;
  }

  .vertical {
    display: none;
  }
}
</style>
