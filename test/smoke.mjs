import { __internals } from '../index.js';

const { Aggregator, normalizeConfig, normalizePostedSources, needsChinese, parseModelJson, parseAnthropicNews, parseDeepseekNews, clusterTitles, extractArticleText } = __internals;

// 1) Pure units.
if (needsChinese('更高能效比，带来新惊喜：M6 款 MacBook Pro 初探') !== true) throw new Error('needsChinese zh failed');
if (needsChinese('Nvidia Kubernetes Engine launches') !== false) throw new Error('needsChinese en failed');
if (parseModelJson('```json\n{"digest":["a"],"highlights":[]}\n```')?.digest?.[0] !== 'a') throw new Error('parseModelJson fence failed');
if (parseModelJson('result: {"title":"t","summary":"s"}')?.title !== 't') throw new Error('parseModelJson prose failed');

// 1b) Cluster counting: cross-source reports of one story share a count.
const clustered = clusterTitles([
  { title: 'Nvidia launches Kubernetes Engine for AI factories' },
  { title: 'Nvidia Kubernetes Engine launches for AI factories' },
  { title: 'DeepSeek 发布新模型 DeepSeek-V4.2' },
  { title: 'DeepSeek 发布了新模型 DeepSeek-V4.2' },
  { title: 'Solidot 报道了一个完全不相关的存储事件' },
]);
if (clustered[0].clusterCount !== 2 || clustered[1].clusterCount !== 2) throw new Error('latin clustering failed');
if (clustered[2].clusterCount !== 2 || clustered[3].clusterCount !== 2) throw new Error('cjk clustering failed');
if (clustered[4].clusterCount !== 1) throw new Error('unrelated item wrongly clustered');
console.log('[cluster] OK');

// 1c) Article text extraction: p-dense container wins over nav junk.
const page = `<body><nav><p>Menu item one Menu item two Menu item three Menu item four</p></nav>
<div class="content"><p>${'Real article paragraph with substantial content. '.repeat(12)}</p><p>${'Second paragraph of the actual story continues here. '.repeat(10)}</p></div></body>`;
const text = extractArticleText(page);
if (!text.startsWith('Real article paragraph') || text.includes('Menu item')) throw new Error('article extraction failed');
console.log('[article] OK');

const anthFixture = `<a class="x" href="/news/ai-for-science-expands-foundations-research-institutions"><span><h3>AI for Science expands</h3></span></a>
<a href="/news/announcements">Announcements</a>
<a class="y" href="/news/ai-for-science-expands-foundations-research-institutions"><span><p>Excerpt text here</p></span></a>`;
const anth = parseAnthropicNews(anthFixture, 10);
if (anth.length !== 1 || anth[0].title !== 'AI for Science expands') throw new Error('anthropic parser failed');

const dsFixture = `<a href="/zh-cn/news/news261017">中文（中国）</a><a href="/zh-cn/news/news261017">新闻</a>
<a href="/zh-cn/news/news261017" class="menu__link">DeepSeek-V4.1-Flash-1017 发布 2026/10/17</a>
<a href="/zh-cn/news/news260910" class="menu__link">DeepSeek-V4.1-Flash 发布 2026/09/10</a>`;
const ds = parseDeepseekNews(dsFixture, 10);
if (ds.length !== 2 || ds[0].title !== 'DeepSeek-V4.1-Flash-1017 发布') throw new Error('deepseek parser failed');
console.log('[units] OK', ds[0].title, ds[0].url);

// 2) Validation accepts html-news pages and rejects unknown ones.
const ok = normalizePostedSources({ sources: [{ type: 'html-news', label: 'Anthropic News', url: 'https://www.anthropic.com/news', category: 'ai' }] });
const bad = normalizePostedSources({ sources: [{ type: 'html-news', label: 'x', url: 'https://example.com/news' }] });
if (ok === null || bad !== null) throw new Error('html-news validation failed');
console.log('[validate] html-news OK');

// 3) Live: the full new AI lineup through the real aggregator.
const config = normalizeConfig({ refreshMinutes: 15, maxItemsPerSource: 8, fetchTimeoutMs: 20000 });
const agg = new Aggregator(config);
const live = ['openai-news', 'anthropic-news', 'deepseek-news', 'deepmind-blog', 'sspai']
  .map((id) => config.sources.find((s) => s.id === id))
  .filter(Boolean);
const feed = await agg.gather(live, true, undefined);
for (const status of feed.sources) {
  console.log(`[live] ${status.id} ${status.state} count=${status.count} ${status.message ? `msg=${status.message}` : ''}`);
}
for (const id of ['anthropic-news', 'deepseek-news']) {
  const item = feed.items.find((row) => row.sourceId === id);
  console.log(`[live] ${id}: %s | needZh=%s | %s`, item?.time, item?.needZh, item?.title?.slice(0, 60));
}
const en = feed.items.find((row) => row.sourceId === 'anthropic-news');
if (!en || en.needZh !== true) throw new Error('anthropic item missing or needZh wrong');
const zhItem = feed.items.find((row) => row.sourceId === 'deepseek-news');
if (!zhItem || zhItem.needZh !== false || !zhItem.time) throw new Error('deepseek item missing/wrong flags');
console.log('[live] OK total=%d', feed.items.length);
