/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: card
 * Base block: card (no library convention — inferred from source HTML)
 * Source: https://www.sap.com/about/customer-stories/pwc.html
 * Generated: 2026-08-27
 *
 * The .cs_alpha__section "Take the next step" CTA. Emits 2 cards, one per
 * li.cs_alpha__item, each in its own row (1 column):
 *   - h4 heading (h4.cs_alpha__item-title)
 *   - description p (p.cs_alpha__item-text)
 *   - CTA link (a.cs_button)
 *
 * The section heading/subtitle (cs_alpha__head) is left as default content
 * (handled by the transformer / defaultContent selector), not part of the block.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('li.cs_alpha__item, .cs_alpha__item, [class*="alpha__item"]'));

  // Empty-block guard
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    const heading = item.querySelector('h4.cs_alpha__item-title, h4, [class*="item-title"]');
    const desc = item.querySelector('p.cs_alpha__item-text, p, [class*="item-text"]');
    const cta = item.querySelector('a.cs_button, a[class*="button"], a');

    const cardCell = [];
    if (heading) cardCell.push(heading);
    if (desc) cardCell.push(desc);
    if (cta) cardCell.push(cta);

    if (cardCell.length) cells.push([cardCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'card', cells });
  element.replaceWith(block);
}
