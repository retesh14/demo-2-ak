/*
 * Sapphire Session block — native session detail page (POC)
 *
 * Mirrors the real SAP session page (…/catalog/page/catalog/session/<id>) but
 * IN OUR OWN DOMAIN, so the flow matches live: landing → catalog → session,
 * with no hop out to sap.com. Reads the session id from ?id= (or #id), fetches
 * the same same-origin sheet the catalog uses (/rf-api/sessions.json), finds the
 * matching row, and renders: back-to-catalog link, video area, title, badge row,
 * abstract, and a speakers list.
 *
 * Authored config rows (optional): endpoint, catalog (back-link path).
 */

const DEFAULTS = {
  endpoint: '/rf-api/sessions.json',
  catalog: '/sapphire-catalog-demo',
};

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

function readConfig(el) {
  const config = {};
  el.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const val = cells[1].textContent.trim();
      if (key) config[key] = val;
    }
  });
  return config;
}

function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || window.location.hash.replace('#', '') || '';
}

/** Pull the flat rows out of the sheet / worker shapes. */
function rows(json) {
  if (!json) return [];
  if (Array.isArray(json.sessions)) return json.sessions;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  return [];
}

function initials(name) {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2)
    .join('')
    .toUpperCase();
}

function renderSpeakers(speakersStr) {
  const wrap = h('div', { class: 'sapphire-session-speakers' });
  wrap.append(h('h2', { class: 'sapphire-session-h2', text: 'Speakers' }));
  const grid = h('div', { class: 'sapphire-session-speaker-grid' });
  speakersStr.split(';').map((s) => s.trim()).filter(Boolean).forEach((entry) => {
    const [name, ...roleParts] = entry.split(',');
    const role = roleParts.join(',').trim();
    grid.append(h(
      'div',
      { class: 'sapphire-session-speaker' },
      h('div', { class: 'sapphire-session-avatar', 'aria-hidden': 'true', text: initials(name) }),
      h('div', { class: 'sapphire-session-speaker-meta' }, h('span', { class: 'sapphire-session-speaker-name', text: name.trim() }), role ? h('span', { class: 'sapphire-session-speaker-role', text: role }) : null),
    ));
  });
  wrap.append(grid);
  return wrap;
}

/** Build the lazy YouTube embed (matches the project's youtube block convention). */
function buildEmbed(videoId) {
  const wrap = h('div', { class: 'sapphire-session-embed' });
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&autoplay=1`;
  iframe.title = 'On-demand session replay';
  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  wrap.append(iframe);
  return wrap;
}

function renderSession(el, config, session) {
  const back = h('p', { class: 'sapphire-session-back' }, h('a', { href: config.catalog, text: '← Back to session catalog' }));

  const badges = h('div', { class: 'sapphire-session-badges' });
  if (session.type) badges.append(h('span', { class: 'sapphire-session-badge badge-type', text: session.type }));
  badges.append(h('span', { class: 'sapphire-session-badge badge-status', text: 'On Demand' }));
  if (session.track) badges.append(h('span', { class: 'sapphire-session-badge badge-track', text: session.track }));

  // Video area. If the session has a video id, the facade is a click-to-load
  // button that swaps in a real YouTube embed (lazy — nothing loads until click,
  // which is good for performance and consent). Without an id it stays static.
  const video = h('div', { class: 'sapphire-session-video' });
  if (session.video) {
    const btn = h(
      'button',
      { class: 'sapphire-session-play-btn', type: 'button', 'aria-label': `Play: ${session.title}` },
      h('span', { class: 'sapphire-session-play', 'aria-hidden': 'true', text: '▶' }),
      h('span', { class: 'sapphire-session-video-note', text: 'Watch the on-demand replay' }),
    );
    btn.addEventListener('click', () => {
      video.replaceWith(buildEmbed(session.video));
    });
    video.append(btn);
  } else {
    video.append(
      h('div', { class: 'sapphire-session-play', 'aria-hidden': 'true', text: '▶' }),
      h('p', { class: 'sapphire-session-video-note', text: 'Replay available at the event' }),
    );
  }

  const main = h(
    'div',
    { class: 'sapphire-session-main' },
    badges,
    h('h1', { class: 'sapphire-session-title', text: session.title }),
    session.abstract ? h('p', { class: 'sapphire-session-abstract', text: session.abstract }) : null,
    session.speakers ? renderSpeakers(session.speakers) : null,
  );

  el.append(back, h('div', { class: 'sapphire-session-inner' }, video, main));
}

function renderMissing(el, config, id) {
  el.append(
    h('p', { class: 'sapphire-session-back' }, h('a', { href: config.catalog, text: '← Back to session catalog' })),
    h('div', { class: 'sapphire-session-inner' }, h(
      'div',
      { class: 'sapphire-session-main' },
      h('h1', { class: 'sapphire-session-title', text: 'Session not found' }),
      h('p', { class: 'sapphire-session-abstract', text: id ? `No session matched "${id}". It may have been removed — browse the full catalog instead.` : 'No session was specified. Browse the full catalog to pick a session.' }),
    )),
  );
}

export default async function init(el) {
  const config = { ...DEFAULTS, ...readConfig(el) };
  el.textContent = '';
  const id = getSessionId();

  let list = [];
  try {
    const resp = await fetch(config.endpoint, { headers: { accept: 'application/json' } });
    if (resp.ok) list = rows(await resp.json());
  } catch {
    list = [];
  }

  const session = list.find((s) => (s.id || '') === id);
  if (session) renderSession(el, config, session);
  else renderMissing(el, config, id);
}
