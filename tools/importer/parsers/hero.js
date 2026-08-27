/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero
 * Base block: hero
 * Source: https://www.sap.com/about/customer-stories/pwc.html
 * Generated: 2026-08-27
 *
 * Structure (1 column, 3 rows):
 *   Row 1: block name
 *   Row 2: background asset — the hero MP4 emitted as a BARE LINK
 *          (blocks/hero converts an authored .mp4 link into a <video>)
 *   Row 3: foreground content — eyebrow (p.cs_hero__category) + title (h1.cs_hero__title)
 *
 * The background MP4 lives in div.cs_hero__video-container > video[src=...pwc_1.mp4],
 * which is the previousElementSibling of section.cs_hero__section. Resolve via
 * previousElementSibling, then fall back to a document-wide lookup.
 */
export default function parse(element, { document }) {
  // --- Background video (MP4) ---
  // Look at the sibling video-container first, then fall back to the document.
  let videoEl = null;
  const prev = element.previousElementSibling;
  if (prev) {
    videoEl = prev.matches('video') ? prev : prev.querySelector('video[src], video[data-video]');
  }
  if (!videoEl) {
    videoEl = document.querySelector('.cs_hero__video-container video[src], .cs_hero__video-container video[data-video]');
  }

  // --- Foreground content ---
  const eyebrow = element.querySelector('p.cs_hero__category, [class*="category"]');
  const title = element.querySelector('h1.cs_hero__title, h1, [class*="title"]');

  const cells = [];

  // Row 2: background asset.
  // The project hero block (blocks/hero/hero.js) only promotes a background MP4
  // when the background cell contains an <a href="*.mp4"> that WRAPS a <picture>
  // (the picture acts as the video poster). So emit link(mp4) > picture > img,
  // using the first hero/collage image as the poster when one is available.
  if (videoEl) {
    const mp4Url = videoEl.getAttribute('src') || videoEl.getAttribute('data-video');
    if (mp4Url) {
      const link = document.createElement('a');
      link.href = mp4Url;

      // Poster image: prefer the video's own poster attr, else the first collage
      // image that follows the hero section, else leave the link bare.
      const posterSrc = videoEl.getAttribute('poster')
        || document.querySelector('.cs_collage__section img, .cs_collage__column img')?.getAttribute('src');
      if (posterSrc) {
        const picture = document.createElement('picture');
        const img = document.createElement('img');
        img.src = posterSrc;
        img.alt = '';
        picture.append(img);
        link.append(picture);
      } else {
        link.textContent = mp4Url;
      }
      cells.push([link]);
    } else {
      cells.push(['']);
    }
  } else {
    cells.push(['']);
  }

  // Row 3: foreground content in a single cell
  const contentCell = [];
  if (eyebrow) contentCell.push(eyebrow);
  if (title) contentCell.push(title);

  // Empty-block guard: nothing meaningful to emit
  if (contentCell.length === 0 && !videoEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
