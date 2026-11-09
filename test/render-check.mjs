// Render smoke test: execute the client factory and render every component
// with representative props under a minimal React stub. Catches undefined
// identifiers, bad prop wiring, and ReferenceErrors before shipping.
globalThis.__TP_TEST__ = true;
globalThis.window = {
  __ModuleLoader__: { load: () => {} },
  localStorage: { getItem: () => '[]', setItem: () => {} },
};
Object.defineProperty(globalThis, 'navigator', {
  value: { clipboard: { writeText: async () => {} } },
  configurable: true,
});

const React = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useEffect: () => {},
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  useRef: (initial) => ({ current: initial }),
};

const loadCalls = [];
globalThis.window.__ModuleLoader__.load = (definition) => { loadCalls.push(definition); };
await import('../client.js');

const definition = loadCalls.at(-1);
if (definition?.id !== 'dsh-tech-pulse') throw new Error('client module id mismatch');
const plugin = definition.factory((id) => {
  if (id === 'react') return React;
  throw new Error(`unexpected require: ${id}`);
});
if (typeof plugin.apply !== 'function' || plugin.inject.length === 0) throw new Error('plugin shape invalid');

// apply() with a stub ctx: registers slots and captures the components.
const registered = [];
const t = (key, params) => key + (params === undefined ? '' : `{${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')}}`);
plugin.apply({
  effect: (fn) => { fn(); return () => {}; },
  locale: { register: () => () => {}, bind: () => t },
  slots: {
    inject: (key, callback) => { const dispose = callback(); return typeof dispose === 'function' ? dispose : () => {}; },
    register: (options, component) => { registered.push({ options, component }); return () => {}; },
  },
});
const panel = registered.find((row) => row.options.name === 'main');
const icon = registered.find((row) => row.options.name === 'sidebar.panellist');
if (panel === undefined || icon === undefined) throw new Error('slots not registered');

// Shallow-render helper: call a component and recursively render function children.
// Records every component invocation so tests can assert "exactly one X per card".
const componentCalls = [];
function render(element, depth = 0) {
  if (element === null || element === undefined || depth > 12) return;
  if (Array.isArray(element)) { for (const child of element) render(child, depth); return; }
  if (typeof element === 'object' && typeof element.type === 'function') {
    componentCalls.push(element.type.name);
    render(element.type(element.props), depth + 1);
    return;
  }
  if (typeof element === 'object' && Array.isArray(element.children)) {
    render(element.children, depth);
  }
}

const C = globalThis.__TP_TEST_COMPONENTS__;
if (C === undefined) throw new Error('test component hook missing');

// 1) The page itself (initial state renders header + skeleton path).
render(panel.component({ t }));

// 2) Icon.
render(icon.component({ size: 20 }));

// 3) Every item kind × states (fav/read/translation/full-text/cluster).
const now = Date.now();
const baseItem = { id: 'x1', title: 'A headline', url: 'https://example.com/a', summary: 'sum', time: now, sourceLabel: 'Src', category: 'news' };
const variants = [
  baseItem,
  { ...baseItem, kind: 'story', score: 120, comments: 34, commentUrl: 'https://news.ycombinator.com/item?id=1', by: 'alice' },
  { ...baseItem, kind: 'repo', stars: 3300, repoLanguage: 'Rust' },
  { ...baseItem, kind: 'event', repo: 'o/r', repoUrl: 'https://github.com/o/r', actorLogin: 'bob', avatarUrl: '', eventType: 'push', eventCount: 3, eventTag: '', eventTitle: 'T' },
  { ...baseItem, clusterCount: 4 },
  { ...baseItem, needZh: true },
];
const translations = { x1: { phase: 'ready', open: true, titleZh: '中文标题', summaryZh: '中文摘要' } };
const fullTexts = { x1: { phase: 'ready', open: true, text: '正文' } };
const itemDigests = {
  x1: { phase: 'ready', open: true, oneLine: '一句话总结', points: ['要点一', '要点二'] },
  x2: { phase: 'error', open: false, message: 'boom' },
};
const noop = () => {};
for (const [index, item] of variants.entries()) {
  const withId = { ...item, id: `x${index}` };
  componentCalls.length = 0;
  render(C.ItemCard({
    item: withId, t, now, translations, onTranslate: noop,
    read: index % 2 === 0, onOpen: noop, fav: index % 2 === 1, onFav: noop,
    fullTexts, onFetchFullText: noop, itemDigests, onFetchItemDigest: noop,
  }));
  const kind = item.kind ?? 'article';
  const count = (name) => componentCalls.filter((n) => n === name).length;
  const expect = (name, expected) => {
    if (count(name) !== expected) throw new Error(`variant ${index} (${kind}): ${name} rendered ${count(name)}x, expected ${expected}`);
  };
  // Regression guard: each card shows each head button exactly once and has
  // exactly one display block per feature (a v1.4.0 edit shipped duplicates).
  expect('StarButton', 1);
  expect('TranslateButton', 1);
  expect('AIDigestButton', 1);
  expect('FullTextButton', kind === 'event' ? 0 : 1);
  expect('FullTextBlock', 1);
  expect('AIDigestBlock', 1);
  expect('TranslationBlock', 1);
}

// 4) Digest panel with angles + highlights.
render(C.DigestPanel({
  digest: {
    generatedAt: now, itemCount: 10, model: 'm/x',
    digest: ['要点一', '要点二'],
    angles: [{ topic: '选题', angle: '钩子' }],
    highlights: [{ id: 'x0', why: 'why' }],
  },
  t, now, items: [baseItem],
  onClose: noop, onRegenerate: noop, highlightsOnly: false, onToggleHighlights: noop,
}));

// 4b) Per-article AI digest pieces standalone.
render(C.AIDigestButton({ item: baseItem, t, digestItem: itemDigests.x1, onFetch: noop }));
render(C.AIDigestBlock({ item: baseItem, t, digestItem: itemDigests.x1, onFetch: noop }));
render(C.FullTextBlock({ item: baseItem, t, fullText: fullTexts.x1, onFetch: noop }));

// 5) Manager with sources of every type and health state.
render(C.Manager({
  sources: [
    { id: 'a', label: 'A', type: 'rss', category: 'news', enabled: true, state: 'ok' },
    { id: 'b', label: 'B', type: 'github-user', category: 'voices', enabled: true, state: 'error', message: 'rate limited' },
    { id: 'c', label: 'C', type: 'html-news', category: 'ai', enabled: false, state: 'disabled' },
  ],
  t, onClose: noop, onSaved: noop,
}));

console.log('[render] OK — page, icon, %d item variants, digest, manager all render', variants.length);
