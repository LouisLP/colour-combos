/**
 * Attribution, once, for the dataset as a whole.
 *
 * Deliberately not per combo: a Wada combination has no per-combo source page to
 * point at — the data arrives as one vendored file, so one dataset-level credit
 * is the honest shape (#2). Two facts have to be separable here, because they
 * carry different obligations: Wada's colours are **public domain** and owe no
 * credit, while the digitisation we actually shipped is **MIT** and does.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>
          Colours from Sanzo Wada's
          {' '}
          <cite>A Dictionary of Color Combinations</cite>
          {' '}
          (1933–1937), public domain. Source volumes digitised by the National
          Diet Library.
        </p>
        <p>
          Data via
          {' '}
          <a href="https://github.com/mattdesl/dictionary-of-colour-combinations">
            dictionary-of-colour-combinations
          </a>
          {' '}
          by Matt DesLauriers (MIT).
        </p>
      </div>
    </footer>
  )
}
