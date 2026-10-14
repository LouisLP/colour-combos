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
/* Dataset-level attribution. --ink-muted clears 4.5:1 on --canvas in both modes
   by contract (ADR 0002 §5), so small and quiet is still legible. */
.site-footer {
  padding: var(--space-lg);
  border-block-start: 1px solid var(--border);
  background: var(--surface);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--ink-muted);
  transition:
    background-color var(--dur-theme) var(--ease),
    border-color var(--dur-theme) var(--ease),
    color var(--dur-theme) var(--ease);
}

/* The chrome's shared 78rem measure (ADR 0010). */
.site-footer-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  inline-size: 100%;
  max-inline-size: 78rem;
  margin-inline: auto;
}

cite {
  font-style: italic;
}
</style>
