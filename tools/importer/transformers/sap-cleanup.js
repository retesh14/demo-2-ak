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
    // Play-button overlay on the real video block. The data-video HLS URL lives on
    // the parent div.cs_video__container (NOT on the button), so removing the button
    // does not disturb what the video-poster parser needs.
    // Verified in cleaned.html: <button class="cs_play" ...></button>
    WebImporter.DOMUtils.remove(element, ['button.cs_play']);

    // NOTE: the decorative hero background video (div.cs_hero__video-container) is
    // intentionally NOT removed here. The hero parser reads its MP4 via
    // previousElementSibling and emits it as the hero background link, so it must
    // still be in the DOM when parsers run. It is removed in afterTransform below,
    // after the hero parser has consumed it.
  }

  if (hookName === TransformHook.afterTransform) {
    // Now safe to drop the leftover decorative hero video container (the hero
    // parser has already extracted its MP4 URL in the parse phase).
    WebImporter.DOMUtils.remove(element, ['.cs_hero__video-container']);

    // Non-authorable SAP site chrome (present on the live page shell around <main>).
    // Includes the floating "Ask Joule" button and the "Contact us" complementary
    // aside that SAP injects at the top of <main>. The real page CTAs (Contact us /
    // Explore Business AI in the card block) are <a> links, not <button>s, so
    // removing button/aside does not touch authorable content.
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      'nav',
      'aside',
      '[role="complementary"]',
      'button',
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

    // Analytics/marketing tracking-pixel beacons that inject <img> tags into the
    // DOM (Bing UET, Twitter/X ads, Meta Pixel, DoubleClick, etc.). These are not
    // content — strip any image whose src points at a known tracking host.
    const TRACKING_HOSTS = [
      'bat.bing.com',
      't.co/',
      'analytics.twitter.com',
      'ads-twitter.com',
      'facebook.com/tr',
      'doubleclick.net',
      'google-analytics.com',
      'googletagmanager.com',
      'px.ads.linkedin.com',
      'demdex.net',
    ];
    element.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (TRACKING_HOSTS.some((host) => src.includes(host))) {
        img.remove();
      }
    });
  }
}
