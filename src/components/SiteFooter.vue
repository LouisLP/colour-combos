<!--
  One credit for the whole dataset, since there's no per-combo source (#2).
  Wada's colours are public domain; the digitization we ship is MIT and needs
  credit.
-->
<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <p class="mark" aria-hidden="true">
        おわり
      </p>
      <p>
        Colours from Sanzo Wada's
        <cite>A Dictionary of Color Combinations</cite>
        (1933–1937), public domain. Source volumes digitised by the National
        Diet Library.
      </p>
      <p>
        Data via
        <a href="https://github.com/mattdesl/dictionary-of-colour-combinations">dictionary-of-colour-combinations</a>
        by Matt DesLauriers (MIT).
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-block-start: var(--space-xl);
  padding: var(--space-lg);
  border-block-start: 2px dashed var(--line);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--ink-muted);
}

.site-footer-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  inline-size: 100%;
  max-inline-size: 80rem;
  margin-inline: auto;
}

.site-footer-inner p {
  margin: 0;
}

.mark {
  color: var(--shu);
  font-family: var(--display);
}

cite {
  font-style: italic;
}
</style>
