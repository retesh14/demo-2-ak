/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import videoPosterParser from './parsers/video-poster.js';
import cardParser from './parsers/card.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/sap-cleanup.js';
import sectionsTransformer from './transformers/sap-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'video-poster': videoPosterParser,
  'card': cardParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {"name":"customer-stories","urls":["https://www.sap.com/about/customer-stories/pwc.html"],"description":"SAP customer story (PwC): hero w/ background video, facts strip, stat callouts, narrative text sections, pull-quote+image bands, self-hosted video, CTA cards.","blocks":[{"name":"hero","instances":[".cs_hero__section"]},{"name":"columns","instances":[".cs_details__row",".cs_metrics__row",".cs_quote__section .cs_quote__row"]},{"name":"video-poster","instances":[".cs_video__section:nth-of-type(12)","section.cs_video__section:last-of-type"]},{"name":"card","instances":[".cs_alpha__section .cs_alpha__cards",".cs_alpha__section"]}],"sections":[{"id":"hero","name":"Hero","selector":[".cs_hero__section"],"style":null,"blocks":["hero"],"defaultContent":[".cs_collage__section"]},{"id":"facts","name":"Facts strip + intro","selector":[".cs_details__section"],"style":"light","blocks":["columns"],"defaultContent":[".cs_details__section p"]},{"id":"stats","name":"Stat callouts","selector":[".cs_metrics__section"],"style":"light","blocks":["columns"],"defaultContent":[]},{"id":"fullimg","name":"Full-width image band","selector":["section.cs_video__section:nth-of-type(5)"],"style":null,"blocks":[],"defaultContent":["section.cs_video__section:nth-of-type(5) img"]},{"id":"opportunity","name":"The Opportunity","selector":["section.cs_information__section:nth-of-type(6)"],"style":"light","blocks":[],"defaultContent":["section.cs_information__section:nth-of-type(6)"]},{"id":"quote1","name":"Pull-quote band 1","selector":["section.cs_quote__section:nth-of-type(7)"],"style":"light","blocks":["columns"],"defaultContent":[]},{"id":"solution","name":"The Solution","selector":["section.cs_information__section:nth-of-type(8)"],"style":"light","blocks":[],"defaultContent":["section.cs_information__section:nth-of-type(8)"]},{"id":"quote2","name":"Pull-quote band 2","selector":["section.cs_quote__section:nth-of-type(9)"],"style":"light","blocks":["columns"],"defaultContent":[]},{"id":"result","name":"The Result","selector":["section.cs_information__section:nth-of-type(10)"],"style":"light","blocks":[],"defaultContent":["section.cs_information__section:nth-of-type(10)"]},{"id":"quote3","name":"Pull-quote band 3","selector":["section.cs_quote__section:nth-of-type(11)"],"style":"light","blocks":["columns"],"defaultContent":[]},{"id":"video","name":"Video block","selector":["section.cs_video__section:nth-of-type(12)"],"style":null,"blocks":["video-poster"],"defaultContent":[]},{"id":"cta","name":"Take the next step","selector":[".cs_alpha__section"],"style":"light","blocks":["card"],"defaultContent":[".cs_alpha__section > .cs_container > *:not(.cs_alpha__cards)"]}]};

// TRANSFORMER REGISTRY — cleanup first, then sections (only if 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
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

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. parse each block (skip elements already detached by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. sanitized path (map root '/' → '/index' to avoid importer cwd crash)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
