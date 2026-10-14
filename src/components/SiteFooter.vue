<!--
  Attribution, once, for the dataset as a whole.

  Deliberately not per combo: a Wada combination has no per-combo source page to
  point at — the data arrives as one vendored file, so one dataset-level credit
  is the honest shape (#2). Two facts have to be separable here, because they
  carry different obligations: Wada's colours are **public domain** and owe no
  credit, while the digitisation we actually shipped is **MIT** and does.
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
