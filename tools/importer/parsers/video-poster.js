/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: video-poster
 * Base block: video
 * Source: https://www.sap.com/about/customer-stories/pwc.html
 * Generated: 2026-08-27
 *
 * Structure (1 column, 2 rows):
 *   Row 1: block name
 *   Row 2: single cell containing —
 *     - title (h3.cs_video__title)
 *     - poster image (img.cs_video__poster → ./images/group_5.jpg)
 *     - HLS video URL as a bare link, read from data-video on div.cs_video__container
 *       (https://d.dam.sap.com/x/5xCgEP4/hls.m3u8?doi=SAP1239105)
 *
 * NOTE: this targets the section.cs_video__section that CONTAINS h3.cs_video__title.
 * It must NOT touch the hero MP4 or the full-width image band (which has no title).
 */
export default function parse(element, { document }) {
  const title = element.querySelector('h3.cs_video__title, [class*="video__title"]');
  const poster = element.querySelector('img.cs_video__poster, [class*="video__poster"], .cs_video__container img');
  const container = element.querySelector('.cs_video__container[data-video], [data-video]');
  const videoUrl = container ? container.getAttribute('data-video') : null;

  // Empty-block guard: this section is a genuine video block only if it has a title
  // and a streaming source. Bail otherwise (e.g. the full-width image band).
  if (!title && !videoUrl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (title) contentCell.push(title);
  if (poster) contentCell.push(poster);
  if (videoUrl) {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.textContent = videoUrl;
    contentCell.push(link);
  }

  const cells = [[contentCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'video-poster', cells });
  element.replaceWith(block);
}
