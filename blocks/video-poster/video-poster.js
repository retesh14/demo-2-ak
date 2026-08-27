/*
 * Video Poster block
 *
 * Renders a click-to-play video facade: a poster image with a play button that,
 * on click, swaps in the actual video player. Supports self-hosted MP4 and HLS
 * (.m3u8) sources. Authored as:
 *   Row 1: heading (optional)
 *   Row 2: poster image
 *   Row 3: a link to the video source (.mp4 or .m3u8)
 *
 * Lighthouse-friendly: the heavy player is only created on interaction, so the
 * initial render is just an image + button.
 */

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

function isHls(src) {
  return /\.m3u8(\?|$)/i.test(src);
}

function buildPlayer(src) {
  const video = h('video', {
    class: 'video-poster-player',
    controls: '',
    autoplay: '',
    playsinline: '',
    preload: 'auto',
  });
  if (isHls(src) && !video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS unsupported (non-Safari). Point the source at the stream anyway;
    // browsers with native HLS play it, others need an hls.js shim the site may add.
    video.src = src;
  } else {
    video.src = src;
  }
  return video;
}

export default function init(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  // Locate the video source link (.mp4 / .m3u8) anywhere in the block.
  const link = [...block.querySelectorAll('a')]
    .find((a) => /\.(mp4|m3u8)(\?|$)/i.test(a.getAttribute('href') || ''));
  const src = link?.getAttribute('href');

  // Heading: first heading element in the block.
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');

  // Poster: first picture/img in the block.
  const pic = block.querySelector('picture') || block.querySelector('img');

  block.textContent = '';

  if (heading) {
    heading.classList.add('video-poster-title');
    block.append(heading);
  }

  const frame = h('div', { class: 'video-poster-frame' });
  if (pic) {
    const posterHolder = pic.tagName === 'IMG' ? pic : pic;
    posterHolder.classList.add('video-poster-image');
    frame.append(posterHolder);
  }

  if (src) {
    const btn = h('button', {
      class: 'video-poster-play',
      type: 'button',
      'aria-label': 'Play video',
      title: 'Play video',
    });
    btn.addEventListener('click', () => {
      const player = buildPlayer(src);
      frame.textContent = '';
      frame.append(player);
      player.play?.().catch(() => { /* user can use controls */ });
    });
    frame.append(btn);
  }

  block.append(frame);
}
