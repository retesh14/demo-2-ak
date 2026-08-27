/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SAP (sap.com) customer-stories section breaks + section metadata.
 *
 * Driven by payload.template.sections (page-templates.json). 12 sections →
 * 11 <hr> breaks (one before every section except the first) and 9 "Section
 * Metadata" blocks (every section whose style is set, i.e. "light").
 *
 * Section selectors are stored as single-element arrays in page-templates.json
 * (e.g. [".cs_hero__section"]), so each is unwrapped to a string before use.
 *
 * Breaks are inserted in beforeTransform (while every section element still
 * exists, before block parsers replace them), using a marker attribute on the
 * <hr> as a stable anchor for the afterTransform metadata insertion. Sections
 * are processed in reverse so live-element inserts never shift not-yet-processed
 * sections. <hr> is not a <div>, so it never disturbs :nth-of-type selectors.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

function sectionSelector(section) {
  // Selectors are arrays in page-templates.json; unwrap to a string.
  const sel = section.selector;
  return Array.isArray(sel) ? sel[0] : sel;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break, no metadata
      const sectionEl = element.querySelector(sectionSelector(section));
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers may have replaced section elements. Anchor each styled section's
    // Section Metadata block to whichever still exists: the marker <hr> or the
    // original element (first section, where no marker was inserted).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(sectionSelector(section));
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
