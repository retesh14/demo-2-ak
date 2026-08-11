/*
 * Sapphire Catalog block — native session catalog (POC, "layer 3")
 *
 * This is the OPTIONAL integration path: instead of linking out to the
 * RainFocus /flow/ app, it renders session data natively inside our own EDS
 * page — search + track filter + session cards, like the real catalog.
 *
 * DATA SOURCING — two layers, one seam:
 *   FED (this block): fetches a SAME-ORIGIN endpoint (default /rf-api/sessions)
 *     and renders it. No CORS, no secrets here — exactly like SAP's own
 *     same-origin /flow/loadPage calls.
 *   BACKEND (the CF worker, workers/website): the /rf-api/ route proxies to
 *     events.rainfocus.com and injects the apiProfile/API key server-side.
 *
 * DEMO FALLBACK: the aem.page preview host does NOT run the CF worker, so if
 * the endpoint isn't reachable (or returns non-JSON) the block falls back to an
 * embedded MOCK so the demo renders end-to-end today. Going live = deploy the
 * worker + set the RainFocus secret; no block change.
 *
 * Authored config rows (optional): endpoint, heading.
 */

const DEFAULTS = {
  // Same-origin data endpoint. Two ways to serve it:
  //  - EDS sheet (works on aem.page today): /rf-api/sessions.json
  //  - Cloudflare worker (needs CF deploy): /rf-api/sessions
  // The block fetches whatever the author configures; both return the same shape.
  endpoint: '/rf-api/sessions.json',
  heading: 'Session Catalog',
};

// Track -> anonymous-safe catalog URL (the track-filtered view). The deep
// /session/<id> links require an event-registered login ("attendee not found
// on this event"), so tiles point at the track-filtered catalog instead — it
// always renders real sessions for anyone.
const CATALOG = 'https://www.sap.com/events/sapphire/virtual/flow/sap/sv26/catalog/page/catalog';
const TRACK_URL = {
  'AI Services & Models': `${CATALOG}?search.track=option_1733949722572`,
  'Build & Integrate': `${CATALOG}?search.track=option_1733949733770`,
  'Cloud ERP': `${CATALOG}?search.track=option_1733949738690`,
  'Data & Analytics': `${CATALOG}?search.track=option_1733949727757`,
  Joule: `${CATALOG}?search.track=1773765539720001Z4Qz`,
  'Autonomous Supply Chain Management': `${CATALOG}?search.track=option_1733949766806`,
};
const trackHref = (track) => TRACK_URL[track] || CATALOG;

// Mock sessions mirror the shape our worker normalizes RainFocus into.
// hrefs use the track-filtered catalog (anonymous-safe), not gated session links.
const MOCK = {
  source: 'mock',
  sessions: [
    {
      id: '1774887882560001Dn04', title: 'Global keynote: The Beginning of Better', track: 'Joule', type: 'Keynote', abstract: 'How SAP provides the foundation of applications and data that AI needs to deliver business outcomes.', href: trackHref('Joule'),
    },
    {
      id: '1774887883045001eJnq', title: 'Customer keynote: Connected to win', track: 'Cloud ERP', type: 'Keynote', abstract: 'Real value is created when a moment that demands change turns into momentum.', href: trackHref('Cloud ERP'),
    },
    {
      id: '1776267993114001kR7a', title: 'The beginning of better decisions, made in motion', track: 'Data & Analytics', type: 'Session', abstract: 'See how SAP connects signals across finance, supply chain, procurement, and HCM to bring the right decision together.', href: trackHref('Data & Analytics'),
    },
    {
      id: '1776707736559001bE5d', title: 'A unified platform for your future', track: 'AI Services & Models', type: 'Session', abstract: 'SAP’s unified platform embeds AI directly into operations to help CIOs scale trusted, agentic AI.', href: trackHref('AI Services & Models'),
    },
    {
      id: '1774553764776001FfEP', title: 'CFO power moves for 2026: Strategic finance innovation', track: 'Cloud ERP', type: 'Session', abstract: 'SAP and BCG on redefining finance with agentic AI that shifts CFO focus from reacting to shaping outcomes.', href: trackHref('Cloud ERP'),
    },
    {
      id: '1777492393240001BiPA', title: 'Meet Joule: The future of work', track: 'Joule', type: 'Session', abstract: 'How the Joule solution is transforming enterprise software today and where it’s headed next.', href: trackHref('Joule'),
    },
    {
      id: 'sc-01', title: 'Autonomous supply chain in action', track: 'Autonomous Supply Chain Management', type: 'Session', abstract: 'Orchestrate your supply chain as a single connected system that senses, analyzes, and acts in real time.', href: trackHref('Autonomous Supply Chain Management'),
    },
    {
      id: 'bi-01', title: 'Build & integrate with SAP BTP', track: 'Build & Integrate', type: 'Workshop', abstract: 'Extend and build AI-supported business applications and processes across your enterprise.', href: trackHref('Build & Integrate'),
    },
  ],
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

/** Normalize whatever the endpoint returns into { source, sessions[] }. */
function normalize(json) {
  if (!json) return null;
  if (Array.isArray(json.sessions)) return { source: json.source || 'live', sessions: json.sessions };
  // Supported shapes:
  //  - RainFocus-native: { items | sessionData: [...] } or { data: { items: [...] } }
  //  - EDS sheet endpoint: { total, limit, offset, data: [ {row}, ... ] }
  const raw = json.items
    || json.sessionData
    || json.data?.items
    || (Array.isArray(json.data) ? json.data : null);
  if (Array.isArray(raw)) {
    return {
      source: json.source || (Array.isArray(json.data) ? 'eds-sheet' : 'live'),
      sessions: raw.map((s) => ({
        id: s.sessionID || s.id,
        title: s.title || s.name,
        track: (s.tracks && s.tracks[0]?.name) || s.track || '',
        type: s.type || s.sessionType || 'Session',
        abstract: s.abstract || s.description || '',
        href: s.href || '#',
      })),
    };
  }
  return null;
}

async function loadSessions(endpoint) {
  try {
    const resp = await fetch(endpoint, { headers: { accept: 'application/json' } });
    if (!resp.ok) return { ...MOCK, note: `endpoint ${resp.status} — using mock` };
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('json')) return { ...MOCK, note: 'endpoint non-JSON — using mock' };
    const data = normalize(await resp.json());
    return data || { ...MOCK, note: 'unrecognized shape — using mock' };
  } catch {
    return { ...MOCK, note: 'endpoint unreachable — using mock' };
  }
}

function renderCards(listEl, sessions) {
  listEl.textContent = '';
  if (!sessions.length) {
    listEl.append(h('p', { class: 'sapphire-catalog-empty', text: 'No sessions match your search.' }));
    return;
  }
  sessions.forEach((s) => {
    const card = h(
      'article',
      { class: 'sapphire-catalog-card' },
      h('span', { class: 'sapphire-catalog-type', text: s.type || 'Session' }),
      h('h3', { class: 'sapphire-catalog-title', text: s.title }),
      s.track ? h('span', { class: 'sapphire-catalog-track', text: s.track }) : null,
      s.abstract ? h('p', { class: 'sapphire-catalog-abstract', text: s.abstract }) : null,
      h('a', { class: 'sapphire-catalog-cta', href: s.href || '#' }, h('span', { text: 'Watch on demand' }), h('span', { class: 'sapphire-catalog-arrow', 'aria-hidden': 'true', text: '→' })),
    );
    listEl.append(card);
  });
}

export default async function init(el) {
  const config = { ...DEFAULTS, ...readConfig(el) };
  el.textContent = '';

  const heading = h('h2', { class: 'sapphire-catalog-heading', text: config.heading });
  const search = h('input', { class: 'sapphire-catalog-search', type: 'search', placeholder: 'Search sessions', 'aria-label': 'Search sessions' });
  const trackSel = h('select', { class: 'sapphire-catalog-filter', 'aria-label': 'Filter by track' });
  const count = h('p', { class: 'sapphire-catalog-count', role: 'status' });
  const list = h('div', { class: 'sapphire-catalog-list' });
  const controls = h('div', { class: 'sapphire-catalog-controls' }, search, trackSel);

  el.append(heading, controls, count, list);

  const data = await loadSessions(config.endpoint);
  const all = data.sessions;

  // Build track filter options
  const tracks = [...new Set(all.map((s) => s.track).filter(Boolean))].sort();
  trackSel.append(h('option', { value: '', text: 'All tracks' }));
  tracks.forEach((t) => trackSel.append(h('option', { value: t, text: t })));

  const apply = () => {
    const q = search.value.trim().toLowerCase();
    const track = trackSel.value;
    const filtered = all.filter((s) => {
      const matchesQ = !q || `${s.title} ${s.abstract} ${s.track}`.toLowerCase().includes(q);
      const matchesT = !track || s.track === track;
      return matchesQ && matchesT;
    });
    count.textContent = `${filtered.length} session${filtered.length === 1 ? '' : 's'}${data.source === 'mock' ? ' (demo data)' : ''}`;
    renderCards(list, filtered);
  };

  search.addEventListener('input', apply);
  trackSel.addEventListener('change', apply);
  apply();
}
