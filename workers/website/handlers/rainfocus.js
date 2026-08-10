/*
 * RainFocus proxy handler (backend / "layer 3").
 *
 * Serves the session catalog under our OWN origin at /rf-api/sessions, exactly
 * like SAP serves RainFocus under /events/.../flow/. The browser (the
 * sapphire-catalog block) calls this same-origin path — no CORS, no secrets in
 * the front end. This handler injects the RainFocus apiProfile + API key
 * SERVER-SIDE from Wrangler secrets and normalizes the response.
 *
 * Required env (set as Wrangler secrets / vars — NEVER committed):
 *   RAINFOCUS_API_URL      e.g. https://events.rainfocus.com/api/search
 *   RAINFOCUS_API_PROFILE  the apiProfile / widget id
 *   RAINFOCUS_API_KEY      the rfApiProfileId / apiToken (secret)
 *   RAINFOCUS_EVENT_ID     (optional) event/show id
 *
 * If RAINFOCUS_API_KEY is absent, we return a small MOCK payload so non-prod
 * environments still work. The FED block also has its own mock fallback, so the
 * demo renders even where this worker isn't running (e.g. the aem.page preview).
 */

const MOCK = {
  source: 'mock-worker',
  sessions: [
    {
      id: 'kw-1', title: 'Global keynote: The Beginning of Better', track: 'Joule', type: 'Keynote', abstract: 'How SAP provides the foundation of applications and data that AI needs.', href: '#',
    },
    {
      id: 'kw-2', title: 'A unified platform for your future', track: 'AI Services & Models', type: 'Session', abstract: 'Embedding AI directly into operations to scale trusted, agentic AI.', href: '#',
    },
    {
      id: 'kw-3', title: 'Autonomous supply chain in action', track: 'Autonomous Supply Chain Management', type: 'Session', abstract: 'Sense, analyze, and act across your supply chain in real time.', href: '#',
    },
  ],
};

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'max-age=300',
    ...extra,
  },
});

/** Map a RainFocus item to our normalized session shape. */
const mapItem = (s) => ({
  id: s.sessionID || s.id,
  title: s.title || s.name || '',
  track: (Array.isArray(s.tracks) && s.tracks[0] && (s.tracks[0].name || s.tracks[0])) || s.track || '',
  type: s.type || s.sessionType || 'Session',
  abstract: s.abstract || s.description || '',
  href: s.href || '#',
});

const normalize = (data) => {
  const raw = data.items || data.sessionData || data.sessions || data.data?.items || [];
  return Array.isArray(raw) ? raw.map(mapItem) : [];
};

export default async function fetchRainFocus({ env }) {
  // No key configured -> mock mode (non-prod / demo).
  if (!env.RAINFOCUS_API_KEY || !env.RAINFOCUS_API_URL) {
    return json(MOCK);
  }

  const body = new URLSearchParams();
  body.set('type', 'session');
  if (env.RAINFOCUS_EVENT_ID) body.set('eventId', env.RAINFOCUS_EVENT_ID);

  try {
    const resp = await fetch(env.RAINFOCUS_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        // RainFocus auth headers — kept server-side only.
        rfApiProfileId: env.RAINFOCUS_API_PROFILE,
        rfWidgetId: env.RAINFOCUS_API_PROFILE,
        rfapiprofileid: env.RAINFOCUS_API_PROFILE,
        Authorization: env.RAINFOCUS_API_KEY,
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      return json({ source: 'live-error', status: resp.status, sessions: [] }, 502);
    }

    const data = await resp.json();
    return json({ source: 'live', sessions: normalize(data) });
  } catch (e) {
    return json({ source: 'proxy-error', message: String(e), sessions: [] }, 502);
  }
}
