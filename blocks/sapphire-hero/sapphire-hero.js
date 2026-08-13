/*
 * Sapphire Hero block — SAP Sapphire Virtual landing (POC)
 *
 * Pure front-end. The CTAs are ordinary hyperlinks (e.g. into the RainFocus
 * catalog app at /events/sapphire/virtual/flow/sap/...). No backend, no data
 * fetch — this block just renders authored content + links, which is exactly
 * why the landing page can be built entirely in EDS.
 *
 * Authored structure (rows):
 *   row 1: heading text
 *   row 2: subcopy text
 *   row 3+: one CTA per row — a link (first = primary, rest = secondary)
 */

function decorateButtons(el) {
  const links = el.querySelectorAll('a');
  links.forEach((a, i) => {
    a.classList.add('sapphire-hero-cta');
    a.classList.add(i === 0 ? 'sapphire-hero-cta-primary' : 'sapphire-hero-cta-secondary');
  });
}

export default async function init(el) {
  // The first sapphire-hero on the page is the lead hero (left-aligned, like
  // the source); any later instance is the centered bottom CTA banner.
  const isLead = document.querySelector('.sapphire-hero') === el;
  if (isLead) el.classList.add('sapphire-hero-lead');

  const rows = [...el.querySelectorAll(':scope > div')];
  el.textContent = '';

  const inner = document.createElement('div');
  inner.className = 'sapphire-hero-inner';

  // First row with a heading -> heading; first plain paragraph -> subcopy;
  // gather all links into a CTA group.
  const ctas = document.createElement('div');
  ctas.className = 'sapphire-hero-ctas';

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    const link = cell.querySelector('a');

    if (heading) {
      heading.classList.add('sapphire-hero-heading');
      inner.append(heading);
      return;
    }
    if (link) {
      ctas.append(link);
      return;
    }
    const text = cell.textContent.trim();
    if (text) {
      const p = document.createElement('p');
      p.className = 'sapphire-hero-subcopy';
      p.textContent = text;
      inner.append(p);
    }
  });

  if (ctas.children.length) {
    decorateButtons(ctas);
    inner.append(ctas);
  }

  el.append(inner);
}
