/*
 * Login block — SAP Connect (POC)
 *
 * Renders a sign-in surface with two states (signed-out / signed-in) and a
 * personalized attendee panel once "authenticated".
 *
 * RAINFOCUS INTEGRATION SEAM
 * --------------------------
 * All auth flows through the `RainFocus` adapter below and NOTHING else.
 * For the POC it is fully MOCKED — no live tenant, no credentials, no secrets
 * in this repo (block code ships publicly to every browser). To go live, swap
 * only the three adapter methods; the UI does not change:
 *   - signIn()  -> redirect to the RainFocus hosted login (the
 *                  /flow/oauthStart/sap/... OAuth handoff). RainFocus / SAP ID
 *                  authenticates the user and returns a token on callback — the
 *                  block never touches a raw password.
 *   - signOut() -> also call the RainFocus logout endpoint.
 *   - getAttendee() -> read the attendee profile from the RainFocus session.
 * Any RainFocus API key stays in a serverless proxy / secrets manager, never
 * here.
 */

const SESSION_KEY = 'sap-connect-attendee';

const DEFAULTS = {
  provider: 'RainFocus',
  heading: 'Sign in to SAP Connect',
  message: 'Access your personalized dashboard, agenda, and sponsor catalog.',
  cta: 'Sign in',
};

const RainFocus = {
  // POC MOCK. Live: window.location.assign(`${RF_BASE}/flow/oauthStart/...`)
  async signIn({ email, method } = {}) {
    const clean = (email || '').trim();
    const raw = clean ? clean.split('@')[0].replace(/[._-]+/g, ' ') : 'Guest Attendee';
    const name = raw.replace(/\b\w/g, (c) => c.toUpperCase());
    const attendee = {
      name,
      email: clean || 'guest@sap.com',
      pass: 'Full Conference Pass',
      method: method === 'sso' ? 'sso' : 'password',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(attendee));
    return attendee;
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },

  getAttendee() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },
};

/** Small DOM helper: h('div', { class, text, ...attrs }, ...children) */
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

/** Read optional authored key/value rows into a config object. */
function readConfig(el) {
  const config = {};
  const rows = el.querySelectorAll(':scope > div');
  for (const row of rows) {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  }
  return config;
}

function field(id, label, type) {
  const input = h('input', {
    id: `login-${id}`,
    name: id,
    type,
    autocomplete: type === 'password' ? 'current-password' : 'email',
    placeholder: type === 'password' ? '••••••••' : 'you@company.com',
  });
  const wrap = h(
    'div',
    { class: 'login-field' },
    h('label', { class: 'login-label', for: `login-${id}`, text: label }),
    input,
  );
  return { wrap, input };
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function renderSignedOut(view, config, rerender) {
  const card = h('div', { class: 'login-card' });
  card.append(
    h('span', { class: 'login-badge', text: `${config.provider} integration` }),
    h('h3', { class: 'login-heading', text: config.heading }),
    h('p', { class: 'login-message', text: config.message }),
  );

  const email = field('email', 'Email', 'email');
  const password = field('password', 'Password', 'password');
  const error = h('p', { class: 'login-error', role: 'alert' });
  const submit = h('button', {
    class: 'login-btn login-btn-accent',
    type: 'submit',
    text: config.cta,
  });
  const form = h(
    'form',
    { class: 'login-form', novalidate: 'novalidate' },
    email.wrap,
    password.wrap,
    error,
    submit,
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const value = email.input.value.trim();
    if (!value) {
      error.textContent = 'Please enter your email to continue.';
      email.input.focus();
      return;
    }
    await RainFocus.signIn({ email: value, method: 'password' });
    rerender();
  });

  const sso = h('button', {
    class: 'login-btn login-btn-outline',
    type: 'button',
    text: `Continue with SAP ID (${config.provider})`,
  });
  sso.addEventListener('click', async () => {
    await RainFocus.signIn({ email: 'attendee@sap.com', method: 'sso' });
    rerender();
  });

  card.append(
    form,
    h('div', { class: 'login-divider' }, h('span', { text: 'or' })),
    sso,
    h('p', {
      class: 'login-note',
      text: 'Demo mode — no real credentials are used. Live: redirects to RainFocus hosted sign-in.',
    }),
  );
  view.append(card);
}

function renderSignedIn(view, config, attendee, rerender) {
  const card = h('div', { class: 'login-card login-authed' });
  card.append(
    h('div', { class: 'login-avatar', 'aria-hidden': 'true', text: initials(attendee.name) }),
    h('h3', { class: 'login-heading', text: `Welcome, ${attendee.name}` }),
    h('p', { class: 'login-message', text: 'You’re signed in to SAP Connect Virtual.' }),
  );

  const meta = h('dl', { class: 'login-meta' });
  meta.append(
    h('dt', { text: 'Email' }),
    h('dd', { text: attendee.email }),
    h('dt', { text: 'Access' }),
    h('dd', { text: attendee.pass }),
    h('dt', { text: 'Signed in via' }),
    h('dd', { text: attendee.method === 'sso' ? 'SAP ID (SSO)' : 'Email' }),
  );

  const dashboard = h('a', {
    class: 'login-btn login-btn-accent',
    href: '#dashboard',
    text: 'Go to my dashboard',
  });
  const signOut = h('button', {
    class: 'login-btn login-btn-outline',
    type: 'button',
    text: 'Sign out',
  });
  signOut.addEventListener('click', () => {
    RainFocus.signOut();
    rerender();
  });

  card.append(meta, h('div', { class: 'login-actions' }, dashboard, signOut));
  view.append(card);
}

function render(view, config) {
  view.textContent = '';
  const rerender = () => render(view, config);
  const attendee = RainFocus.getAttendee();
  if (attendee) renderSignedIn(view, config, attendee, rerender);
  else renderSignedOut(view, config, rerender);
}

export default async function init(el) {
  const config = { ...DEFAULTS, ...readConfig(el) };
  el.textContent = '';
  const view = h('div', { class: 'login-inner' });
  el.append(view);
  render(view, config);
}
