/*
 * Support Search block — SAP Support Portal (POC)
 *
 * Mirrors the blue "Welcome to the SAP Support Portal" search panel.
 *
 * BEHAVIOR (verified against support.sap.com): this is a SEARCH LAUNCHER, not a
 * search engine. On submit it builds a destination URL from the typed term and
 * navigates to the SAP for Me support search — there is no backend or auth in
 * this block. SAP for Me's own SSO gate handles login; the term is carried
 * through and shown once the user is authenticated.
 *
 * Destination pattern (confirmed from a logged-in results URL):
 *   https://me.sap.com/servicessupport/search/<encoded>
 * where <encoded> = encodeURIComponent(JSON.stringify({ q: <term>, tab: <tab> }))
 * e.g. {"q":"vs code","tab":"All"} -> %7B%22q%22%3A%22vs%20code%22...%7D
 *
 * All of the above is configurable via authored rows so the destination can be
 * tuned without code changes.
 */

const DEFAULTS = {
  heading: 'Welcome to the SAP Support Portal',
  message: 'Search for SAP Notes, SAP Knowledge Base Articles, SAP Community content, documentation and more in SAP for Me (login required).',
  placeholder: 'Enter keywords or an SAP Note / KBA number',
  cta: 'Search',
  base: 'https://me.sap.com/servicessupport/search/',
  tab: 'All',
  target: '_blank',
};

/** Build the SAP for Me results URL for a query, matching the live pattern. */
function buildSearchUrl(config, query) {
  const payload = JSON.stringify({ q: query, tab: config.tab });
  return `${config.base}${encodeURIComponent(payload)}`;
}

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

export default async function init(el) {
  const config = { ...DEFAULTS, ...readConfig(el) };
  el.textContent = '';

  const inner = h('div', { class: 'support-search-inner' });

  if (config.heading) {
    inner.append(h('h2', { class: 'support-search-heading', text: config.heading }));
  }
  if (config.message) {
    inner.append(h('p', { class: 'support-search-message', text: config.message }));
  }

  const input = h('input', {
    class: 'support-search-input',
    type: 'search',
    name: 'q',
    'aria-label': config.placeholder,
    placeholder: config.placeholder,
    autocomplete: 'off',
  });

  const submit = h('button', {
    class: 'support-search-submit',
    type: 'submit',
    'aria-label': config.cta,
  }, h('span', { class: 'support-search-submit-label', text: config.cta }));

  const form = h('form', { class: 'support-search-form', role: 'search' }, input, submit);

  const go = () => {
    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }
    const url = buildSearchUrl(config, query);
    if (config.target === '_blank') window.open(url, '_blank', 'noopener');
    else window.location.assign(url);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    go();
  });

  inner.append(form);
  el.append(inner);
}
