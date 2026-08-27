/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns
 * Base block: columns
 * Source: https://www.sap.com/about/customer-stories/pwc.html
 * Generated: 2026-08-27
 *
 * Reused across 3 source structures (element is the "__row"):
 *   - Facts strip   (.cs_details__row)  → 3 columns, each = label p + value p
 *   - Stat callouts (.cs_metrics__row)  → 2 columns, each = value p (60% / 100%) + text p
 *   - Pull-quote    (.cs_quote__row)    → 2 columns: [blockquote + author + role] | [supporting image]
 *
 * Strategy: each direct-child column div becomes one table column (cell). Within a
 * column, collect leaf content nodes (headings, blockquote, paragraphs, images) so
 * that images wrapped in intermediate divs (.cs_relative) are preserved. All columns
 * form a single row whose cell count equals the number of source columns.
 */
export default function parse(element, { document }) {
  // Direct-child columns of the row. Fall back to any *__column descendants.
  let columns = Array.from(element.querySelectorAll(
    ':scope > .cs_details__column, :scope > .cs_metrics__column, :scope > .cs_quote__column, :scope > [class*="__column"]'
  ));
  if (columns.length === 0) {
    columns = Array.from(element.querySelectorAll('[class*="__column"]'));
  }

  const contentSel = 'h1, h2, h3, h4, h5, h6, blockquote, p, img';

  const row = columns.map((col) => {
    const nodes = Array.from(col.querySelectorAll(contentSel)).filter((n) => {
      // Drop a paragraph that only wraps an already-collected image, etc.
      return n.tagName === 'IMG' || (n.textContent && n.textContent.trim()) || n.querySelector('img');
    });
    return nodes.length ? nodes : [''];
  });

  // Empty-block guard
  if (row.length === 0 || row.every((cell) => cell.length === 1 && cell[0] === '')) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
