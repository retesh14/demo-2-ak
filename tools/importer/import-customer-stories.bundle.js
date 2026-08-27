/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-customer-stories.js
  var import_customer_stories_exports = {};
  __export(import_customer_stories_exports, {
    default: () => import_customer_stories_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document: document2 }) {
    let videoEl = null;
    const prev = element.previousElementSibling;
    if (prev) {
      videoEl = prev.matches("video") ? prev : prev.querySelector("video[src], video[data-video]");
    }
    if (!videoEl) {
      videoEl = document2.querySelector(".cs_hero__video-container video[src], .cs_hero__video-container video[data-video]");
    }
    const eyebrow = element.querySelector('p.cs_hero__category, [class*="category"]');
    const title = element.querySelector('h1.cs_hero__title, h1, [class*="title"]');
    const cells = [];
    if (videoEl) {
      const mp4Url = videoEl.getAttribute("src") || videoEl.getAttribute("data-video");
      if (mp4Url) {
        const link = document2.createElement("a");
        link.href = mp4Url;
        link.textContent = mp4Url;
        cells.push([link]);
      } else {
        cells.push([""]);
      }
    } else {
      cells.push([""]);
    }
    const contentCell = [];
    if (eyebrow) contentCell.push(eyebrow);
    if (title) contentCell.push(title);
    if (contentCell.length === 0 && !videoEl) {
      element.replaceWith(...element.childNodes);
      return;
    }
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse2(element, { document: document2 }) {
    let columns = Array.from(element.querySelectorAll(
      ':scope > .cs_details__column, :scope > .cs_metrics__column, :scope > .cs_quote__column, :scope > [class*="__column"]'
    ));
    if (columns.length === 0) {
      columns = Array.from(element.querySelectorAll('[class*="__column"]'));
    }
    const contentSel = "h1, h2, h3, h4, h5, h6, blockquote, p, img";
    const row = columns.map((col) => {
      const nodes = Array.from(col.querySelectorAll(contentSel)).filter((n) => {
        return n.tagName === "IMG" || n.textContent && n.textContent.trim() || n.querySelector("img");
      });
      return nodes.length ? nodes : [""];
    });
    if (row.length === 0 || row.every((cell) => cell.length === 1 && cell[0] === "")) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/video-poster.js
  function parse3(element, { document: document2 }) {
    const title = element.querySelector('h3.cs_video__title, [class*="video__title"]');
    const poster = element.querySelector('img.cs_video__poster, [class*="video__poster"], .cs_video__container img');
    const container = element.querySelector(".cs_video__container[data-video], [data-video]");
    const videoUrl = container ? container.getAttribute("data-video") : null;
    if (!title && !videoUrl) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (title) contentCell.push(title);
    if (poster) contentCell.push(poster);
    if (videoUrl) {
      const link = document2.createElement("a");
      link.href = videoUrl;
      link.textContent = videoUrl;
      contentCell.push(link);
    }
    const cells = [[contentCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "video-poster", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/card.js
  function parse4(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll('li.cs_alpha__item, .cs_alpha__item, [class*="alpha__item"]'));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const heading = item.querySelector('h4.cs_alpha__item-title, h4, [class*="item-title"]');
      const desc = item.querySelector('p.cs_alpha__item-text, p, [class*="item-text"]');
      const cta = item.querySelector('a.cs_button, a[class*="button"], a');
      const cardCell = [];
      if (heading) cardCell.push(heading);
      if (desc) cardCell.push(desc);
      if (cta) cardCell.push(cta);
      if (cardCell.length) cells.push([cardCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "card", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/sap-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["button.cs_play"]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [".cs_hero__video-container"]);
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        "nav",
        "aside",
        '[role="complementary"]',
        "button",
        '[class*="breadcrumb"]',
        '[id*="sidebar"]',
        '[class*="cookie"]',
        "#onetrust-consent-sdk",
        ".site-search",
        "iframe",
        "link",
        "noscript",
        "script",
        "style"
      ]);
      const TRACKING_HOSTS = [
        "bat.bing.com",
        "t.co/",
        "analytics.twitter.com",
        "ads-twitter.com",
        "facebook.com/tr",
        "doubleclick.net",
        "google-analytics.com",
        "googletagmanager.com",
        "px.ads.linkedin.com",
        "demdex.net"
      ];
      element.querySelectorAll("img[src]").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (TRACKING_HOSTS.some((host) => src.includes(host))) {
          img.remove();
        }
      });
    }
  }

  // tools/importer/transformers/sap-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function sectionSelector(section) {
    const sel = section.selector;
    return Array.isArray(sel) ? sel[0] : sel;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = element.querySelector(sectionSelector(section));
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || element.querySelector(sectionSelector(section));
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-customer-stories.js
  var parsers = {
    "hero": parse,
    "columns": parse2,
    "video-poster": parse3,
    "card": parse4
  };
  var PAGE_TEMPLATE = { "name": "customer-stories", "urls": ["https://www.sap.com/about/customer-stories/pwc.html"], "description": "SAP customer story (PwC): hero w/ background video, facts strip, stat callouts, narrative text sections, pull-quote+image bands, self-hosted video, CTA cards.", "blocks": [{ "name": "hero", "instances": [".cs_hero__section"] }, { "name": "columns", "instances": [".cs_details__row", ".cs_metrics__row", ".cs_quote__section .cs_quote__row"] }, { "name": "video-poster", "instances": [".cs_video__section:nth-of-type(12)", "section.cs_video__section:last-of-type"] }, { "name": "card", "instances": [".cs_alpha__section .cs_alpha__cards", ".cs_alpha__section"] }], "sections": [{ "id": "hero", "name": "Hero", "selector": [".cs_hero__section"], "style": null, "blocks": ["hero"], "defaultContent": [".cs_collage__section"] }, { "id": "facts", "name": "Facts strip + intro", "selector": [".cs_details__section"], "style": "light", "blocks": ["columns"], "defaultContent": [".cs_details__section p"] }, { "id": "stats", "name": "Stat callouts", "selector": [".cs_metrics__section"], "style": "light", "blocks": ["columns"], "defaultContent": [] }, { "id": "fullimg", "name": "Full-width image band", "selector": ["section.cs_video__section:nth-of-type(5)"], "style": null, "blocks": [], "defaultContent": ["section.cs_video__section:nth-of-type(5) img"] }, { "id": "opportunity", "name": "The Opportunity", "selector": ["section.cs_information__section:nth-of-type(6)"], "style": "light", "blocks": [], "defaultContent": ["section.cs_information__section:nth-of-type(6)"] }, { "id": "quote1", "name": "Pull-quote band 1", "selector": ["section.cs_quote__section:nth-of-type(7)"], "style": "light", "blocks": ["columns"], "defaultContent": [] }, { "id": "solution", "name": "The Solution", "selector": ["section.cs_information__section:nth-of-type(8)"], "style": "light", "blocks": [], "defaultContent": ["section.cs_information__section:nth-of-type(8)"] }, { "id": "quote2", "name": "Pull-quote band 2", "selector": ["section.cs_quote__section:nth-of-type(9)"], "style": "light", "blocks": ["columns"], "defaultContent": [] }, { "id": "result", "name": "The Result", "selector": ["section.cs_information__section:nth-of-type(10)"], "style": "light", "blocks": [], "defaultContent": ["section.cs_information__section:nth-of-type(10)"] }, { "id": "quote3", "name": "Pull-quote band 3", "selector": ["section.cs_quote__section:nth-of-type(11)"], "style": "light", "blocks": ["columns"], "defaultContent": [] }, { "id": "video", "name": "Video block", "selector": ["section.cs_video__section:nth-of-type(12)"], "style": null, "blocks": ["video-poster"], "defaultContent": [] }, { "id": "cta", "name": "Take the next step", "selector": [".cs_alpha__section"], "style": "light", "blocks": ["card"], "defaultContent": [".cs_alpha__section > .cs_container > *:not(.cs_alpha__cards)"] }] };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_customer_stories_default = {
    transform: (payload) => {
      const { document: document2, url, html, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_customer_stories_exports);
})();
