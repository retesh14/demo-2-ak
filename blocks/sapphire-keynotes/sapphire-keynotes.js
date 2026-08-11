/*
 * Sapphire Keynotes block — SAP Sapphire Virtual landing (POC)
 *
 * Renders keynote / line-of-business tiles: a colored gradient banner (in place
 * of SAP's photographic images, to keep the demo self-contained) + title +
 * abstract + a "Watch" CTA. Pure front-end; CTAs are hyperlinks into the
 * anonymous-safe track-filtered catalog (not gated /session/<id> links).
 *
 * Each authored row (tile) = one card:
 *   - a heading (tile title)
 *   - paragraph(s) (abstract)
 *   - a link (the CTA)
 * An optional accent per tile can be set with a leading cell of a color-token
 * name (e.g. "blue", "purple", "teal"); otherwise accents cycle automatically.
 */

const ACCENTS = ['blue', 'purple', 'teal', 'magenta', 'green', 'orange'];

function decorateTile(row, index) {
  row.classList.add('sapphire-keynote');

  const inner = row.querySelector(':scope > div') || row;
  inner.classList.add('sapphire-keynote-inner');

  // Gradient banner stands in for the source's keynote image.
  const accent = ACCENTS[index % ACCENTS.length];
  const banner = document.createElement('div');
  banner.className = `sapphire-keynote-banner accent-${accent}`;
  banner.setAttribute('aria-hidden', 'true');
  inner.insertAdjacentElement('beforebegin', banner);

  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('sapphire-keynote-title');

  const cta = inner.querySelector('a');
  if (cta) {
    cta.classList.add('sapphire-keynote-cta');
    inner.append(cta);
    const arrow = document.createElement('span');
    arrow.className = 'sapphire-keynote-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    cta.append(arrow);
  }

  inner.querySelectorAll(':scope > p').forEach((p) => {
    if (!p.classList.contains('sapphire-keynote-cta')) p.classList.add('sapphire-keynote-abstract');
  });
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  rows.forEach(decorateTile);
}
