/*
 * Sapphire Cards block — SAP Sapphire Virtual landing (POC)
 *
 * A responsive grid of link cards (Session Catalog / Solution Tracks /
 * Speakers / keynote tiles / solution tracks). Each card is authored as one
 * row: heading + description + a CTA link. The CTA is a plain hyperlink —
 * typically into the RainFocus app (/events/sapphire/virtual/flow/sap/...) —
 * confirming the landing page needs no backend.
 *
 * Each authored row (card) contains:
 *   - a heading (card title)
 *   - one or more paragraphs (description)
 *   - a link (the CTA)
 */

function decorateCard(row) {
  row.classList.add('sapphire-card');

  const inner = row.querySelector(':scope > div') || row;
  inner.classList.add('sapphire-card-inner');

  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('sapphire-card-title');

  const cta = inner.querySelector('a');
  if (cta) {
    cta.classList.add('sapphire-card-cta');
    // Move the CTA to the end of the card so it anchors the bottom.
    inner.append(cta);
    // Add a trailing arrow glyph for the "→" affordance seen on the source.
    const arrow = document.createElement('span');
    arrow.className = 'sapphire-card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    cta.append(arrow);
  }

  // Any remaining paragraphs become the description.
  inner.querySelectorAll(':scope > p').forEach((p) => {
    if (!p.classList.contains('sapphire-card-cta')) p.classList.add('sapphire-card-desc');
  });
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  rows.forEach(decorateCard);
}
