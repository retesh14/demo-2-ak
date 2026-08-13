# SAP Support Portal — Blocks Handoff

> Blocks for the `support.sap.com/en/index.html` home page, built in the demo repo and packaged for the
> real project's repo + DA.live content. Global header/footer/design tokens come from the colleague's
> site build (UDEX / UI5). This covers only the page body blocks.

## What's included
Patch: `0001-feat-add-SAP-Support-Portal-blocks-*.patch` — adds these blocks under `blocks/`:

| Block | Purpose | Dynamic? |
|---|---|---|
| `support-hero` | Blue "Welcome to the SAP Support Portal" panel + search | ⚠️ search mocked (launcher → SAP for Me) |
| `support-top-tasks` | "Access SAP for Me" + quick-link task tiles | ⚠️ personalization mocked (authored links) |
| `support-news` | "Spotlight news" feed + resources list | ⚠️ feed mocked (authored rows or a sheet) |
| `support-feedback` | "How is your experience?" Like/Dislike | ⚠️ push mocked (client-side only) |
| *(reuse)* `sapphire-cards` | Features promo + Additional Resources cards | static |

## Apply to the other repo
From a clone of the target repo, on a new feature branch:
```bash
git checkout -b feat/support-blocks
git am /path/to/docs/handoff-support/0001-*.patch   # or copy the blocks/ folders in manually
npm run lint                                         # confirms eslint + stylelint pass
git push -u origin feat/support-blocks
```
If `git am` doesn't apply cleanly (different repo history), just copy the four `blocks/support-*/`
folders (and confirm `sapphire-cards` exists or copy it too), then commit normally.

## Create the DA.live page in the target project's content
Use the target project's DA org/site (`{org}/{site}`), not this demo's. Upload the page HTML (authored as
EDS block tables) via the DA source API, then preview:
```bash
curl -X POST -F "data=@support-home.html;type=text/html" \
  "https://admin.da.live/source/{org}/{site}/support-home.html"
curl -X POST "https://admin.hlx.page/preview/{org}/{site}/main/support-home"
```
Then view at `https://main--{site}--{org}.aem.page/support-home`. (Requires the DA/Adobe credential opt-in.)
A ready page skeleton is in `support-home.html` in this folder — swap in real copy.

## Non-static data — what to worry about (pull / push)

Verified from a live network capture of `support.sap.com/en/index.html`:

| Area | Direction | Live service | Mock in these blocks | Production wiring |
|---|---|---|---|---|
| **Search** | pull + push | **Coveo** (`*.org.coveo.com`) suggestions + search; then SAP for Me (login) | Launcher builds SAP for Me URL, opens it | Coveo API for suggestions (key server-side / proxy); keep SAP for Me handoff |
| **Top Tasks** | pull | `personalizedtoptasks.nocache.html`, `bin/fiji/es/user.support` (per-user) | Static authored tiles | Fetch personalization endpoint after auth |
| **Spotlight News** | pull | `newsfeed_copy.nocache.html` (AEM feed) | Authored rows or a same-origin sheet (`feed` config) | Point `feed` at the real feed/proxy |
| **Feedback** | push | `bin/support/content-feedback` + **Qualtrics** intercept | Client-side only (sessionStorage), no POST | POST to feedback endpoint via same-origin proxy |
| **Resources video** | pull | **Kaltura** (`cdnapisec.kaltura.com`) | n/a (use a card/link) | Embed Kaltura player if needed |
| Analytics/consent | push | Adobe (`smetrics`, `eddl.cdi`), 6sense, Google/DoubleClick, TrustArc | none | Comes with global template |

**Guidance:** the authored blocks (hero copy, tiles, cards, community banner) are pure front-end. The four
flagged areas need real service integration for production — for anything requiring a secret key
(Coveo, feedback), use the same same-origin proxy pattern documented in
`../architecture/rainfocus-working-flow-guide.md` (Cloudflare worker or serverless), never a key in the browser.

## Blocks (updated)

Now fully self-contained on `feat/support-blocks` — **no `sapphire-cards` dependency**:
`support-hero`, `support-top-tasks`, `support-cards` (image + title + desc + CTA),
`support-video` (lazy YouTube embed), `support-news`, `support-feedback`. Apply patches
`0001`–`0004` in order (`git am docs/handoff-support/0*.patch`).

## Images & video
- Card images use explicit `width`/`height` + `loading="lazy"` and a reserved 16:9 box (no CLS).
  Swap the demo image URLs for the project's own DAM/media.
- `support-video` is a click-to-load facade → `youtube-nocookie` iframe (nothing loads until click).
  Set the YouTube id via a `video` row (or drop in a YouTube link).

## SEO — page title & description (IMPORTANT, authoring step)
On DA.live the `<title>` and `<meta name="description">` come from the **DA document's Page
Properties**, applied by the content pipeline — they can NOT be set by uploading body HTML. So:
- The page has a proper **`<h1>`** (the hero heading) — this is the default title source and the a11y
  single-top-level-heading.
- **To set an explicit title/description:** open the page in the DA editor and fill in **Page Properties →
  Title / Description** (or add a Metadata block inside the DA doc). This is a one-time authoring action,
  not code.

## Lighthouse (100 target)

These blocks are built to contribute **zero Lighthouse regressions**; verified on the deployed page:

- **CLS 0.0008** (green needs < 0.1) — layouts reserve space; no shift on load.
- **~10 KB** total JS+CSS across all support blocks — negligible payload.
- **Accessibility:** 0 heading-order jumps, 0 images without alt, 0 unlabeled buttons/inputs.
- **Best practices:** all `target=_blank` links use `rel=noopener`; all buttons typed.
- Respects `prefers-reduced-motion`; text contrast meets WCAG AA (fixed news date to gray-600).

**Honest caveat:** a *page-level* Lighthouse 100 is determined mostly by the **global template** your
colleague owns — fonts (self-host + `font-display: swap`), the header/footer, and any third-party scripts
(analytics/consent must be delayed/consent-gated), plus image `width`/`height` and `loading`/`fetchpriority`.
The blocks here are LH-clean; hitting 100 end-to-end is a whole-page effort. The standard EDS levers to
close it: keep third-party JS in the delayed phase, lazy-load below-the-fold, and set explicit image
dimensions. (I could not run the official PSI/Lighthouse here — the public API was quota-blocked from this
IP; the numbers above are the underlying metrics Lighthouse scores, measured directly on the page.)

## Branch note
This code is on branch **`feat/support-blocks`**, cut from the clean **author-kit base** (`origin/main`),
containing **only** the 4 support blocks — no event/sapphire demo code — so it drops into the
colleague's author-kit-derived repo with a minimal, conflict-free diff. NOTE: the `support-home.html`
skeleton also references the `sapphire-cards` block for the Features/Resources/Community card grids. On a
branch that doesn't have `sapphire-cards`, those sections show a fallback "Error". Two options for the
colleague: (a) also copy the `sapphire-cards` block, or (b) use their repo's own card block for those
sections. The four `support-*` blocks are fully self-contained.

## Design note
The live page uses SAP's **UDEX design system + UI5 web components**. The blue is `#0040b0`. The global
header/footer and tokens will arrive from the colleague's site build — these blocks use neutral project
tokens and the `#0040b0` accent so they inherit cleanly.
