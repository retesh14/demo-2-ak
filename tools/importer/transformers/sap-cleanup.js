/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SAP (sap.com) site-wide cleanup.
 *
 * All selectors verified against migration-work/cleaned.html and the live
 * SAP page shell. Removes non-authorable SAP chrome plus the decorative hero
 * background video. Preserves the real video block's data-video HLS URL
 * (on div.cs_video__container) and its poster image for the video-poster parser.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Decorative hero background video (autoplay/muted/loop MP4) — not authorable.
    // Verified in cleaned.html: <div class="cs_hero__video-container"><video .../></div>
    WebImporter.DOMUtils.remove(element, ['.cs_hero__video-container']);

    // Play-button overlay on the real video block. The data-video HLS URL lives on
    // the parent div.cs_video__container (NOT on the button), so removing the button
    // does not disturb what the video-poster parser needs.
    // Verified in cleaned.html: <button class="cs_play" ...></button>
    WebImporter.DOMUtils.remove(element, ['button.cs_play']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable SAP site chrome (present on the live page shell around <main>).
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      'nav',
      '[class*="breadcrumb"]',
      '[id*="sidebar"]',
      '[class*="cookie"]',
      '#onetrust-consent-sdk',
      '.site-search',
      'iframe',
      'link',
      'noscript',
      'script',
      'style',
    ]);
  }
}
