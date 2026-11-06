/**
 * Tech Pulse — client half.
 *
 * Registers the "Tech pulse" main panel and its sidebar icon, then renders the
 * merged feed served by the plugin's Host half at `tech-pulse/*` (same-origin,
 * behind the harness login cookie). Styling uses only --dsw-* theme tokens so
 * the panel follows the host's light/dark themes; React comes from the browser
 * module table and no other harness package is imported.
 */
window.__ModuleLoader__.load({
  id: 'dsh-tech-pulse',
  factory(require) {
    const React = require('react');
    const { useState, useEffect, useMemo, useRef, useCallback } = React;
    const h = React.createElement;

    const NS = 'techPulse';
    const PANEL_ID = 'tech-pulse';
    const FEED_ROUTE = '/tech-pulse/feed'.slice(1);
    const SOURCES_ROUTE = '/tech-pulse/sources'.slice(1);
    const TRANSLATE_ROUTE = '/tech-pulse/translate'.slice(1);
    const SUMMARIZE_ROUTE = '/tech-pulse/summarize'.slice(1);

    const TABS = ['all', 'flash', 'news', 'ai', 'voices'];
    const SOURCE_TYPES = ['rss', 'hackernews', 'github-user', 'html-news', 'github-trending'];
    const CATEGORIES = ['flash', 'news', 'ai', 'voices'];

    /* ---------------------------------- locale --------------------------------- */

    const zh = {
      'panel': '科技脉搏',
      'title': '科技脉搏',
      'live': '实时',
      'tab.all': '全部',
      'tab.flash': '快讯',
      'tab.news': '新闻',
      'tab.ai': 'AI 前沿',
      'tab.voices': '大佬动态',
      'search': '搜索标题、来源、摘要…',
      'refresh': '刷新',
      'manage': '订阅管理',
      'digest': 'AI 速览',
      'generating': '生成中…',
      'digestFailed': 'AI 速览生成失败',
      'regenerate': '重新生成',
      'closeDigest': '关闭速览',
      'digestTitle': 'AI 速览',
      'highlightsTitle': '重点消息',
      'onlyHighlights': '只看重点',
      'modelLabel': '模型',
      'translate': '译',
      'translating': '翻译中…',
      'translateFailed': '翻译失败',
      'translateRetry': '重试翻译',
      'translateTitle': '点击翻译并展开中文',
      'unreadOnly': '只看未读',
      'markAllRead': '全部已读',
      'unreadCount': '{n} 条未读',
      'sourcesFailed': '{n} 个源异常',
      'sourceError': '加载失败',
      'noMatch': '没有匹配的资讯',
      'noMatchHint': '换个关键词，或清除筛选条件试试',
      'updatedNow': '刚刚更新',
      'updatedAgo': '更新于 {n}',
      'loadError': '资讯加载失败',
      'retry': '重试',
      'empty': '还没有内容',
      'emptyHint': '先到「订阅管理」里确认源已启用，或添加新的 RSS / Hacker News / GitHub 订阅。',
      'points': '{n} 赞',
      'comments': '{n} 评论',
      'stars': '{n} 星',
      'by': '@{name}',
      'time.now': '刚刚',
      'time.min': '{n} 分钟前',
      'time.hour': '{n} 小时前',
      'time.day': '{n} 天前',
      'sourcesTitle': '订阅管理',
      'sourcesHint': '提示：X/Twitter 没有公开订阅接口。可以用自建 RSSHub 等桥接把账号转成 RSS 后按「RSS 订阅」添加，保持一手来源。',
      'remove': '移除',
      'addTitle': '添加订阅源',
      'typeLabel': '类型',
      'type.rss': 'RSS 订阅',
      'type.hackernews': 'Hacker News',
      'type.github-user': 'GitHub 用户动态',
      'type.html-news': '官网新闻页（Anthropic/DeepSeek）',
      'type.github-trending': 'GitHub 新星项目',
      'categoryLabel': '分类',
      'field.label': '名称',
      'field.url': 'Feed 地址',
      'field.login': 'GitHub 用户名',
      'add': '添加',
      'save': '保存',
      'cancel': '取消',
      'saving': '保存中…',
      'saveFailed': '保存失败：{msg}',
      'labelRequired': '请填写名称',
      'urlRequired': '请填写 Feed 地址',
      'loginRequired': '请填写 GitHub 用户名',
      'gh.push': '推送了 {n} 个提交到',
      'gh.star': '收藏了',
      'gh.fork': '复刻了',
      'gh.release': '发布了 {tag} 版本',
      'gh.createRepo': '创建了仓库',
      'gh.createBranch': '创建了分支',
      'gh.openSource': '开源了',
      'gh.issue': '提交了 issue',
      'gh.issueComment': '评论了 issue',
      'gh.pr': '更新了 PR',
      'gh.other': '在 GitHub 有新动态：',
    };

    const en = {
      'panel': 'Tech pulse',
      'title': 'Tech pulse',
      'live': 'Live',
      'tab.all': 'All',
      'tab.flash': 'Flash',
      'tab.news': 'News',
      'tab.ai': 'AI frontier',
      'tab.voices': 'Voices',
      'search': 'Search titles, sources, summaries…',
      'refresh': 'Refresh',
      'manage': 'Manage sources',
      'digest': 'AI digest',
      'generating': 'Generating…',
      'digestFailed': 'Could not generate the AI digest',
      'regenerate': 'Regenerate',
      'closeDigest': 'Close digest',
      'digestTitle': 'AI digest',
      'highlightsTitle': 'Highlights',
      'onlyHighlights': 'Highlights only',
      'modelLabel': 'Model',
      'translate': 'ZH',
      'translating': 'Translating…',
      'translateFailed': 'Translation failed',
      'translateRetry': 'Retry translation',
      'translateTitle': 'Translate and show Chinese',
      'unreadOnly': 'Unread only',
      'markAllRead': 'Mark all read',
      'unreadCount': '{n} unread',
      'sourcesFailed': '{n} sources failing',
      'sourceError': 'failed',
      'noMatch': 'No matching items',
      'noMatchHint': 'Try another keyword, or clear the filters',
      'updatedNow': 'Updated just now',
      'updatedAgo': 'Updated {n}',
      'loadError': 'Could not load the feed',
      'retry': 'Retry',
      'empty': 'Nothing here yet',
      'emptyHint': 'Check that sources are enabled in "Manage sources", or add an RSS / Hacker News / GitHub subscription.',
      'points': '{n} points',
      'comments': '{n} comments',
      'stars': '{n} stars',
      'by': '@{name}',
      'time.now': 'just now',
      'time.min': '{n} min ago',
      'time.hour': '{n} h ago',
      'time.day': '{n} d ago',
      'sourcesTitle': 'Manage sources',
      'sourcesHint': 'Tip: X/Twitter has no public feed API. Bridge an account through a self-hosted RSSHub instance and add it as an RSS source to stay first-hand.',
      'remove': 'Remove',
      'addTitle': 'Add a source',
      'typeLabel': 'Type',
      'type.rss': 'RSS feed',
      'type.hackernews': 'Hacker News',
      'type.github-user': 'GitHub user activity',
      'type.html-news': 'Official news page (Anthropic/DeepSeek)',
      'type.github-trending': 'GitHub rising repos',
      'categoryLabel': 'Category',
      'field.label': 'Name',
      'field.url': 'Feed URL',
      'field.login': 'GitHub username',
      'add': 'Add',
      'save': 'Save',
      'cancel': 'Cancel',
      'saving': 'Saving…',
      'saveFailed': 'Save failed: {msg}',
      'labelRequired': 'A name is required',
      'urlRequired': 'A feed URL is required',
      'loginRequired': 'A GitHub username is required',
      'gh.push': 'pushed {n} commits to',
      'gh.star': 'starred',
      'gh.fork': 'forked',
      'gh.release': 'released {tag}',
      'gh.createRepo': 'created repository',
      'gh.createBranch': 'created branch',
      'gh.openSource': 'open-sourced',
      'gh.issue': 'opened an issue on',
      'gh.issueComment': 'commented on an issue in',
      'gh.pr': 'updated a PR in',
      'gh.other': 'was active on GitHub:',
    };

    /* ---------------------------------- helpers -------------------------------- */

    function hashHue(text) {
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
      return hash % 360;
    }

    function fmtCount(value) {
      if (typeof value !== 'number') return '';
      if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
      return String(value);
    }

    function relTime(time, now, t) {
      if (!time) return '';
      const diff = Math.max(0, now - time);
      if (diff < 60000) return t('time.now');
      if (diff < 3600000) return t('time.min', { n: Math.floor(diff / 60000) });
      if (diff < 86400000) return t('time.hour', { n: Math.floor(diff / 3600000) });
      if (diff < 7 * 86400000) return t('time.day', { n: Math.floor(diff / 86400000) });
      const date = new Date(time);
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    async function apiGet(route, params) {
      const query = params === undefined ? '' : `?${new URLSearchParams(params).toString()}`;
      const response = await fetch(route + query, { headers: { accept: 'application/json' } });
      if (!response.ok) {
        const error = new Error(`HTTP ${String(response.status)}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    }

    async function apiPost(route, body) {
      const response = await fetch(route, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.message ?? `HTTP ${String(response.status)}`);
        error.status = response.status;
        throw error;
      }
      return payload;
    }

    /* --------------------------- read-state persistence -------------------------- */

    const READ_STORE_KEY = 'dsh.techpulse.read.v1';
    const READ_STORE_CAP = 800;

    function loadReadIds() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(READ_STORE_KEY) ?? '[]');
        return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
      } catch {
        return new Set();
      }
    }

    function saveReadIds(set) {
      try {
        const ids = [...set];
        window.localStorage.setItem(READ_STORE_KEY, JSON.stringify(ids.slice(-READ_STORE_CAP)));
      } catch {
        /* storage unavailable (private mode) — read state just won't persist */
      }
    }

    /* --------------------------------- pieces ---------------------------------- */

    function TechPulsePanelIcon({ size = 20 }) {
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true,
      }, h('path', { d: 'M2.5 12.5h3.7l2.3-6 3.3 10.8 2.8-7 .2.5 1.4 1.7h5.3' }));
    }

    function SourceAvatar({ label, url }) {
      const hue = hashHue(label);
      if (url) {
        return h('img', { className: 'tp-avatar', src: url, alt: '', width: 22, height: 22, loading: 'lazy',
          onError: (event) => { event.currentTarget.style.visibility = 'hidden'; } });
      }
      return h('span', {
        className: 'tp-avatar', 'aria-hidden': true,
        style: { background: `hsl(${hue}, 72%, 50%, 0.16)`, color: `hsl(${hue}, 65%, 48%)` },
      }, label.slice(0, 1).toUpperCase());
    }

    function Meta({ children }) {
      return h('span', { className: 'tp-meta-item' }, children);
    }

    function TranslateButton({ item, t, translation, onTranslate }) {
      if (item.needZh !== true) return null;
      const phase = translation?.phase ?? 'idle';
      const label = phase === 'loading' ? t('translating') : phase === 'error' ? t('translate') : t('translate');
      return h('button', {
        type: 'button', className: 'tp-btn tp-translate', 'aria-label': label, title: t('translateTitle'),
        'data-phase': phase, 'data-open': (translation?.open ?? false) && phase === 'ready' ? 'true' : 'false',
        onClick: () => { onTranslate(item); },
      }, phase === 'loading' ? h('span', { className: 'tp-spin', 'aria-hidden': true }, '◌') : t('translate'));
    }

    function TranslationBlock({ item, t, translation, onTranslate }) {
      if (translation?.open !== true || translation?.phase !== 'ready') return null;
      return h('div', { className: 'tp-translation' },
        h('div', { className: 'tp-translation-title' }, translation.titleZh),
        translation.summaryZh !== '' && h('p', { className: 'tp-translation-sum' }, translation.summaryZh));
    }

    function ItemCard({ item, t, now, translations, onTranslate, read, onOpen }) {
      const time = relTime(item.time, now, t);
      const translation = translations[item.id];
      const title = h('a', {
        className: 'tp-card-title', href: item.url, target: '_blank', rel: 'noopener noreferrer',
        id: `tp-card-${item.id}`,
        onClick: () => { onOpen(item); },
      }, item.title);

      if (item.kind === 'event') {
        const verbKey = `gh.${item.eventType ?? 'other'}`;
        const verb = item.eventType === 'push'
          ? t(verbKey, { n: item.eventCount ?? 1 })
          : item.eventType === 'release'
            ? t(verbKey, { tag: item.eventTag || 'v?' })
            : t(verbKey);
        return h('article', { className: 'tp-card tp-card-event', 'data-read': read ? 'true' : 'false' },
          h('div', { className: 'tp-card-head' },
            h(SourceAvatar, { label: item.actorLogin || item.sourceLabel, url: item.avatarUrl }),
            h('span', { className: 'tp-event-line' },
              h('b', { className: 'tp-event-actor' }, item.actorLogin || item.sourceLabel),
              ' ', verb, ' ',
              h('a', { className: 'tp-event-repo', href: item.repoUrl, target: '_blank', rel: 'noopener noreferrer', onClick: () => { onOpen(item); } }, item.repo)),
            h('span', { className: 'tp-head-actions' },
              h(TranslateButton, { item, t, translation, onTranslate }),
              time !== '' && h(Meta, null, time))),
          item.eventTitle !== '' && h('div', { className: 'tp-event-title' }, item.eventTitle),
          translation?.phase === 'error' && h('div', { className: 'tp-inline-error' }, `${t('translateFailed')} · `, h('button', { type: 'button', className: 'tp-btn tp-btn-link', onClick: () => { onTranslate(item); } }, t('translateRetry'))),
          h(TranslationBlock, { item, t, translation, onTranslate }));
      }

      if (item.kind === 'story') {
        return h('article', { className: 'tp-card', 'data-read': read ? 'true' : 'false' },
          h('div', { className: 'tp-card-head' },
            h(SourceAvatar, { label: item.sourceLabel }),
            h('span', { className: 'tp-source' }, item.sourceLabel),
            h('span', { className: 'tp-head-actions' },
              h(TranslateButton, { item, t, translation, onTranslate }),
              time !== '' && h(Meta, null, time))),
          title,
          item.summary !== '' && h('p', { className: 'tp-card-sum' }, item.summary),
          translation?.phase === 'error' && h('div', { className: 'tp-inline-error' }, `${t('translateFailed')} · `, h('button', { type: 'button', className: 'tp-btn tp-btn-link', onClick: () => { onTranslate(item); } }, t('translateRetry'))),
          h(TranslationBlock, { item, t, translation, onTranslate }),
          h('div', { className: 'tp-meta' },
            h(Meta, null, `▲ ${fmtCount(item.score ?? 0)}`),
            h('a', { className: 'tp-meta-item tp-link', href: item.commentUrl, target: '_blank', rel: 'noopener noreferrer' },
              t('comments', { n: fmtCount(item.comments ?? 0) })),
            item.by !== '' && h(Meta, null, t('by', { name: item.by }))));
      }

      if (item.kind === 'repo') {
        return h('article', { className: 'tp-card', 'data-read': read ? 'true' : 'false' },
          h('div', { className: 'tp-card-head' },
            h(SourceAvatar, { label: item.sourceLabel }),
            h('span', { className: 'tp-source' }, item.sourceLabel),
            h('span', { className: 'tp-head-actions' },
              h(TranslateButton, { item, t, translation, onTranslate }),
              time !== '' && h(Meta, null, time))),
          title,
          item.summary !== '' && h('p', { className: 'tp-card-sum' }, item.summary),
          translation?.phase === 'error' && h('div', { className: 'tp-inline-error' }, `${t('translateFailed')} · `, h('button', { type: 'button', className: 'tp-btn tp-btn-link', onClick: () => { onTranslate(item); } }, t('translateRetry'))),
          h(TranslationBlock, { item, t, translation, onTranslate }),
          h('div', { className: 'tp-meta' },
            h(Meta, null, `★ ${fmtCount(item.stars ?? 0)}`),
            item.repoLanguage !== '' && h(Meta, null, item.repoLanguage)));
      }

      return h('article', { className: 'tp-card', 'data-read': read ? 'true' : 'false' },
        h('div', { className: 'tp-card-head' },
          h(SourceAvatar, { label: item.sourceLabel }),
          h('span', { className: 'tp-source' }, item.sourceLabel),
          h('span', { className: 'tp-head-actions' },
            h(TranslateButton, { item, t, translation, onTranslate }),
            time !== '' && h(Meta, null, time))),
        title,
        item.summary !== '' && h('p', { className: 'tp-card-sum' }, item.summary),
        translation?.phase === 'error' && h('div', { className: 'tp-inline-error' }, `${t('translateFailed')} · `, h('button', { type: 'button', className: 'tp-btn tp-btn-link', onClick: () => { onTranslate(item); } }, t('translateRetry'))),
        h(TranslationBlock, { item, t, translation, onTranslate }));
    }

    function Toggle({ checked, onChange, label }) {
      return h('button', {
        type: 'button', role: 'switch', 'aria-checked': checked, 'aria-label': label,
        className: 'tp-switch', 'data-on': checked ? 'true' : 'false',
        onClick: () => { onChange(!checked); },
      }, h('span', { className: 'tp-switch-knob' }));
    }

    function Manager({ sources, onClose, onSaved, t }) {
      const [draft, setDraft] = useState(() => sources.map((source) => ({ ...source })));      const [type, setType] = useState('rss');
      const [label, setLabel] = useState('');
      const [url, setUrl] = useState('');
      const [login, setLogin] = useState('');
      const [category, setCategory] = useState('news');
      const [formError, setFormError] = useState('');
      const [saving, setSaving] = useState(false);
      const [saveError, setSaveError] = useState('');

      const patch = (id, change) => {
        setDraft((rows) => rows.map((row) => (row.id === id ? { ...row, ...change } : row)));
      };
      const remove = (id) => {
        setDraft((rows) => rows.filter((row) => row.id !== id));
      };
      const add = () => {
        const trimmedLabel = label.trim();
        if (trimmedLabel === '') { setFormError(t('labelRequired')); return; }
        if (type === 'rss' && url.trim() === '') { setFormError(t('urlRequired')); return; }
        if (type === 'github-user' && login.trim() === '') { setFormError(t('loginRequired')); return; }
        setFormError('');
        setDraft((rows) => [...rows, {
          id: `new-${String(Date.now())}-${String(rows.length)}`,
          type, label: trimmedLabel, category,
          url: type === 'rss' ? url.trim() : '',
          login: type === 'github-user' ? login.trim() : '',
          enabled: true,
        }]);
        setLabel(''); setUrl(''); setLogin('');
      };
      const save = async () => {
        setSaving(true); setSaveError('');
        try {
          await apiPost(SOURCES_ROUTE, { sources: draft });
          setSaving(false);
          onSaved();
        } catch (error) {
          setSaving(false);
          setSaveError(t('saveFailed', { msg: error instanceof Error ? error.message : String(error) }));
        }
      };

      return h('section', { className: 'tp-manager', 'aria-label': t('sourcesTitle') },
        h('header', { className: 'tp-manager-head' },
          h(TechPulsePanelIcon, { size: 16 }),
          h('span', { className: 'tp-manager-title' }, t('sourcesTitle')),
          h('button', { type: 'button', className: 'tp-btn tp-btn-icon', 'aria-label': t('cancel'), onClick: onClose }, '✕')),
        h('div', { className: 'tp-manager-scroll' },
          h('ul', { className: 'tp-mgr-list' }, draft.map((source) => {
            const live = sources.find((row) => row.id === source.id);
            const health = source.enabled ? (live?.state ?? 'unknown') : 'disabled';
            return h('li', { key: source.id, className: 'tp-mgr-row' },
              h(SourceAvatar, { label: source.label }),
              h('div', { className: 'tp-mgr-info' },
                h('span', { className: 'tp-mgr-label' },
                  h('span', { className: 'tp-src-dot', 'data-state': health, title: health === 'error' ? `${t('sourceError')}: ${live?.message ?? ''}` : health } ),
                  source.label),
                h('span', { className: 'tp-mgr-sub' },
                  t(`type.${source.type}`), ' · ', t(`tab.${source.category}`),
                  health === 'error' && live?.message ? ` · ${String(live.message).slice(0, 60)}` : '')),
              h('button', { type: 'button', className: 'tp-btn tp-btn-icon tp-mgr-remove', 'aria-label': t('remove'), onClick: () => { remove(source.id); } }, '✕'),
              h(Toggle, { checked: source.enabled, label: source.label, onChange: (value) => { patch(source.id, { enabled: value }); } }));
          })),
          h('div', { className: 'tp-mgr-form' },
            h('div', { className: 'tp-form-title' }, t('addTitle')),
            h('label', { className: 'tp-field' },
              h('span', { className: 'tp-field-label' }, t('typeLabel')),
              h('select', {
                className: 'tp-input tp-select', value: type,
                onChange: (event) => { setType(event.currentTarget.value); },
              }, SOURCE_TYPES.map((value) => h('option', { key: value, value }, t(`type.${value}`)))),
              h('span', { className: 'tp-field-label' }, t('categoryLabel')),
              h('select', {
                className: 'tp-input tp-select', value: category,
                onChange: (event) => { setCategory(event.currentTarget.value); },
              }, CATEGORIES.map((value) => h('option', { key: value, value }, t(`tab.${value}`))))),
            h('label', { className: 'tp-field' },
              h('span', { className: 'tp-field-label' }, t('field.label')),
              h('input', { className: 'tp-input', value: label, placeholder: t('field.label'),
                onChange: (event) => { setLabel(event.currentTarget.value); } })),
            (type === 'rss' || type === 'html-news') && h('label', { className: 'tp-field' },
              h('span', { className: 'tp-field-label' }, t('field.url')),
              h('input', {
                className: 'tp-input', value: url, inputMode: 'url',
                placeholder: type === 'rss' ? 'https://example.com/feed.xml' : 'https://www.anthropic.com/news · https://api-docs.deepseek.com/zh-cn/news/',
                onChange: (event) => { setUrl(event.currentTarget.value); },
              })),
            type === 'github-user' && h('label', { className: 'tp-field' },
              h('span', { className: 'tp-field-label' }, t('field.login')),
              h('input', { className: 'tp-input', value: login, placeholder: 'torvalds',
                onChange: (event) => { setLogin(event.currentTarget.value); } })),
            formError !== '' && h('div', { className: 'tp-form-error' }, formError),
            h('button', { type: 'button', className: 'tp-btn tp-btn-secondary', onClick: add }, t('add'))),
          h('p', { className: 'tp-hint' }, t('sourcesHint'))),
        h('footer', { className: 'tp-manager-foot' },
          h('button', { type: 'button', className: 'tp-btn tp-btn-secondary', disabled: saving, onClick: onClose }, t('cancel')),
          h('button', { type: 'button', className: 'tp-btn tp-btn-primary', disabled: saving, onClick: save }, saving ? t('saving') : t('save')),
          saveError !== '' && h('div', { className: 'tp-form-error' }, saveError)));
    }

    function DigestPanel({ digest, t, now, items, onClose, onRegenerate, highlightsOnly, onToggleHighlights }) {
      const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
      return h('section', { className: 'tp-digest', 'aria-label': t('digestTitle') },
        h('header', { className: 'tp-digest-head' },
          h('span', { className: 'tp-digest-badge' }, 'AI'),
          h('span', { className: 'tp-digest-title' }, t('digestTitle')),
          h('span', { className: 'tp-digest-meta' },
            `${t('modelLabel')}: ${digest.model} · ${relTime(digest.generatedAt, now, t)} · ${String(digest.itemCount)}`),
          digest.highlights.length > 0 && h('button', {
            type: 'button', className: 'tp-btn tp-chip', 'data-on': highlightsOnly ? 'true' : 'false',
            'aria-pressed': highlightsOnly, onClick: onToggleHighlights,
          }, t('onlyHighlights')),
          h('button', { type: 'button', className: 'tp-btn tp-btn-icon', 'aria-label': t('regenerate'), onClick: onRegenerate, title: t('regenerate') }, '↻'),
          h('button', { type: 'button', className: 'tp-btn tp-btn-icon', 'aria-label': t('closeDigest'), onClick: onClose, title: t('closeDigest') }, '✕')),
        digest.digest.length > 0 && h('ul', { className: 'tp-digest-list' },
          digest.digest.map((line, index) => h('li', { key: index, className: 'tp-digest-item' }, line))),
        digest.highlights.length > 0 && h('div', { className: 'tp-highlights' },
          h('div', { className: 'tp-form-title' }, t('highlightsTitle')),
          digest.highlights.map((highlight) => {
            const item = byId.get(highlight.id);
            return h('button', {
              key: highlight.id, type: 'button', className: 'tp-highlight',
              onClick: () => {
                const card = document.getElementById(`tp-card-${highlight.id}`);
                if (card !== null) {
                  card.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  card.classList.remove('tp-flash');
                  void card.offsetWidth;
                  card.classList.add('tp-flash');
                }
              },
            },
            h('span', { className: 'tp-highlight-source' }, item?.sourceLabel ?? ''),
            h('span', { className: 'tp-highlight-title' }, item?.title ?? highlight.id),
            highlight.why !== '' && h('span', { className: 'tp-highlight-why' }, highlight.why));
          })));
    }

    function Skeletons() {
      return h('div', { className: 'tp-skel-wrap', 'aria-hidden': true },
        [0, 1, 2, 3, 4].map((key) => h('div', { key, className: 'tp-skel' },
          h('div', { className: 'tp-skel-line', style: { width: '38%' } }),
          h('div', { className: 'tp-skel-line', style: { width: '86%' } }),
          h('div', { className: 'tp-skel-line', style: { width: '62%' } }))));
    }

    /* ---------------------------------- panel ---------------------------------- */

    function TechPulsePage(props) {
      const t = props.t;
      const [state, setState] = useState({ phase: 'loading', items: [], sources: [], updatedAt: 0, refreshSeconds: 600, message: '' });
      const [tab, setTab] = useState('all');
      const [query, setQuery] = useState('');
      const [managing, setManaging] = useState(false);
      const [now, setNow] = useState(() => Date.now());
      /** itemId -> { phase: 'loading'|'ready'|'error', open, titleZh, summaryZh, message } */
      const [translations, setTranslations] = useState({});
      /** { phase: 'idle'|'loading'|'ready'|'error', data, message } */
      const [digest, setDigest] = useState({ phase: 'idle', data: null, message: '' });
      const [highlightsOnly, setHighlightsOnly] = useState(false);
      /** Item ids the user has opened; persisted locally on this browser only. */
      const [readIds, setReadIds] = useState(() => loadReadIds());
      const [unreadOnly, setUnreadOnly] = useState(false);
      const alive = useRef(true);
      const loadSeq = useRef(0);

      const markRead = useCallback((item) => {
        setReadIds((current) => {
          if (current.has(item.id)) return current;
          const next = new Set(current);
          next.add(item.id);
          saveReadIds(next);
          return next;
        });
      }, []);

      const markAllRead = useCallback(() => {
        setReadIds((current) => {
          const next = new Set(current);
          for (const item of state.items) next.add(item.id);
          saveReadIds(next);
          return next;
        });
      }, [state.items]);

      const load = useCallback(async (force) => {
        const seq = ++loadSeq.current;
        setState((current) => ({ ...current, phase: current.items.length > 0 ? current.phase : 'loading' }));
        const attempt = async () => apiGet(FEED_ROUTE, force ? { refresh: '1' } : undefined);
        try {
          let payload;
          try {
            payload = await attempt();
          } catch (error) {
            if (error.status === 404) {
              await new Promise((resolve) => { setTimeout(resolve, 600); });
              payload = await attempt();
            } else {
              throw error;
            }
          }
          if (!alive.current || seq !== loadSeq.current) return;
          setState({
            phase: 'ready',
            items: Array.isArray(payload.items) ? payload.items : [],
            sources: Array.isArray(payload.sources) ? payload.sources : [],
            updatedAt: typeof payload.updatedAt === 'number' ? payload.updatedAt : 0,
            refreshSeconds: typeof payload.refreshSeconds === 'number' ? payload.refreshSeconds : 600,
            message: '',
          });
        } catch (error) {
          if (!alive.current || seq !== loadSeq.current) return;
          setState((current) => ({ ...current, phase: 'error', message: error instanceof Error ? error.message : String(error) }));
        }
      }, []);

      const translate = useCallback(async (item) => {
        setTranslations((current) => {
          const existing = current[item.id];
          if (existing?.phase === 'ready') {
            // Toggle the visible translation block on repeat clicks.
            return { ...current, [item.id]: { ...existing, open: !existing.open } };
          }
          return { ...current, [item.id]: { phase: 'loading', open: true } };
        });
        const needsFetch = translations[item.id]?.phase !== 'ready';
        if (!needsFetch) return;
        try {
          const payload = await apiGet(TRANSLATE_ROUTE, { id: item.id });
          if (!alive.current) return;
          const translation = payload.translation ?? {};
          setTranslations((current) => ({
            ...current,
            [item.id]: {
              phase: 'ready', open: true,
              titleZh: String(translation.titleZh ?? ''),
              summaryZh: String(translation.summaryZh ?? ''),
            },
          }));
        } catch (error) {
          if (!alive.current) return;
          setTranslations((current) => ({
            ...current,
            [item.id]: { phase: 'error', open: false, message: error instanceof Error ? error.message : String(error) },
          }));
        }
      }, [translations]);

      const runDigest = useCallback(async (force) => {
        setDigest({ phase: 'loading', data: null, message: '' });
        try {
          const payload = await apiGet(SUMMARIZE_ROUTE, force ? { refresh: '1' } : undefined);
          if (!alive.current) return;
          if (payload.digest === undefined || payload.highlights === undefined) throw new Error('unexpected reply');
          setDigest({
            phase: 'ready',
            message: '',
            data: {
              generatedAt: typeof payload.generatedAt === 'number' ? payload.generatedAt : Date.now(),
              itemCount: typeof payload.itemCount === 'number' ? payload.itemCount : 0,
              digest: Array.isArray(payload.digest) ? payload.digest : [],
              highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
              model: String(payload.model ?? ''),
            },
          });
        } catch (error) {
          if (!alive.current) return;
          setDigest({ phase: 'error', data: null, message: error instanceof Error ? error.message : String(error) });
        }
      }, []);

      useEffect(() => {
        alive.current = true;
        load(false);
        return () => { alive.current = false; };
      }, [load]);

      // Relative-time ticker.
      useEffect(() => {
        const timer = setInterval(() => { setNow(Date.now()); }, 30000);
        return () => { clearInterval(timer); };
      }, []);

      // Auto refresh while the panel is open.
      useEffect(() => {
        if (state.phase !== 'ready' || managing) return;
        const timer = setInterval(() => { load(false); }, Math.max(60, state.refreshSeconds) * 1000);
        return () => { clearInterval(timer); };
      }, [state.phase, state.refreshSeconds, managing, load]);

      const counts = useMemo(() => {
        const table = { all: state.items.length, flash: 0, news: 0, ai: 0, voices: 0 };
        for (const item of state.items) {
          if (table[item.category] !== undefined) table[item.category] += 1;
        }
        return table;
      }, [state.items]);

      const highlightIds = useMemo(() => new Set(digest.data?.highlights?.map((row) => row.id) ?? []), [digest.data]);

      const unreadCount = useMemo(
        () => state.items.reduce((sum, item) => (readIds.has(item.id) ? sum : sum + 1), 0),
        [state.items, readIds],
      );

      const failedSources = useMemo(
        () => state.sources.filter((source) => source.enabled && source.state === 'error'),
        [state.sources],
      );

      const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return state.items.filter((item) => {
          if (tab !== 'all' && item.category !== tab) return false;
          if (highlightsOnly && digest.phase === 'ready' && !highlightIds.has(item.id)) return false;
          if (unreadOnly && readIds.has(item.id)) return false;
          if (needle === '') return true;
          const haystack = `${item.title}\n${item.summary ?? ''}\n${item.sourceLabel ?? ''}\n${item.repo ?? ''}\n${item.actorLogin ?? ''}`;
          return haystack.toLowerCase().includes(needle);
        });
      }, [state.items, tab, query, highlightsOnly, digest.phase, highlightIds, unreadOnly, readIds]);

      const updatedText = state.updatedAt === 0
        ? ''
        : (now - state.updatedAt < 60000 ? t('updatedNow') : t('updatedAgo', { n: relTime(state.updatedAt, now, t) }));

      return h('div', { className: 'tp-page' },
        h('style', null, CSS),
        h('header', { className: 'tp-header' },
          h('div', { className: 'tp-header-row' },
            h('span', { className: 'tp-brand' },
              h(TechPulsePanelIcon, { size: 18 }),
              h('span', { className: 'tp-title' }, t('title')),
              h('span', { className: 'tp-live' },
                h('span', { className: 'tp-live-dot' }), t('live'))),
            h('span', { className: 'tp-actions' },
              updatedText !== '' && h('span', { className: 'tp-pill' }, updatedText),
              failedSources.length > 0 && h('button', {
                type: 'button', className: 'tp-pill tp-warn-pill', onClick: () => { setManaging(true); },
                title: failedSources.map((source) => `${source.label}: ${source.message}`).join('\n'),
              }, `⚠ ${t('sourcesFailed', { n: String(failedSources.length) })}`),
              h('button', {
                type: 'button', className: 'tp-btn tp-btn-icon tp-btn-lg', 'aria-label': t('refresh'),
                onClick: () => { load(true); },
              }, h('span', { className: `tp-refresh ${state.phase === 'loading' ? 'tp-spin' : ''}`, 'aria-hidden': true }, '⟳')),
              h('button', {
                type: 'button', className: 'tp-btn tp-btn-secondary', disabled: digest.phase === 'loading',
                onClick: () => { runDigest(false); },
              }, digest.phase === 'loading' ? t('generating') : `✦ ${t('digest')}`),
              h('button', {
                type: 'button', className: 'tp-btn tp-btn-secondary', onClick: () => { setManaging(true); },
              }, h('span', { 'aria-hidden': true }, '⚙ '), t('manage')))),
          h('div', { className: 'tp-header-row tp-toolbar' },
            h('div', { className: 'tp-tabs', role: 'tablist' }, TABS.map((value) =>
              h('button', {
                key: value, type: 'button', role: 'tab', className: 'tp-tab',
                'aria-selected': tab === value, 'data-active': tab === value ? 'true' : 'false',
                onClick: () => { setTab(value); },
              }, t(`tab.${value}`), h('span', { className: 'tp-tab-count' }, String(counts[value] ?? 0)))),
            h('span', { className: 'tp-toolbar-actions' },
              unreadCount > 0 && h('button', {
                type: 'button', className: 'tp-btn tp-chip', 'aria-pressed': unreadOnly,
                'data-on': unreadOnly ? 'true' : 'false', onClick: () => { setUnreadOnly((value) => !value); },
              }, `${t('unreadOnly')} · ${String(unreadCount)}`),
              unreadCount > 0 && h('button', {
                type: 'button', className: 'tp-btn tp-btn-icon', 'aria-label': t('markAllRead'),
                title: t('markAllRead'), onClick: markAllRead,
              }, '✓'),
              h('input', {
                className: 'tp-input tp-search', type: 'search', value: query, placeholder: t('search'),
                'aria-label': t('search'),
                onChange: (event) => { setQuery(event.currentTarget.value); } }))))),
        h('div', { className: 'tp-body' },
          digest.phase === 'ready' && digest.data !== null && h(DigestPanel, {
            digest: digest.data, t, now, items: state.items,
            onClose: () => { setDigest({ phase: 'idle', data: null, message: '' }); setHighlightsOnly(false); },
            onRegenerate: () => { runDigest(true); },
            highlightsOnly,
            onToggleHighlights: () => { setHighlightsOnly((value) => !value); },
          }),
          digest.phase === 'loading' && h('div', { className: 'tp-digest tp-digest-loading' },
            h('span', { className: 'tp-digest-badge' }, 'AI'),
            h('span', { className: 'tp-digest-title' }, t('generating')),
            h('span', { className: 'tp-spin tp-refresh', 'aria-hidden': true }, '⟳')),
          digest.phase === 'error' && h('div', { className: 'tp-digest tp-digest-error' },
            h('span', { className: 'tp-digest-title' }, t('digestFailed')),
            digest.message !== '' && h('span', { className: 'tp-digest-meta' }, digest.message),
            h('button', { type: 'button', className: 'tp-btn tp-btn-secondary', onClick: () => { runDigest(false); } }, t('retry'))),
          state.phase === 'loading' && h(Skeletons, null),
          state.phase === 'error' && h('div', { className: 'tp-state' },
            h('div', { className: 'tp-state-title' }, t('loadError')),
            state.message !== '' && h('div', { className: 'tp-state-sub' }, state.message),
            h('button', { type: 'button', className: 'tp-btn tp-btn-secondary', onClick: () => { load(true); } }, t('retry'))),
          state.phase === 'ready' && visible.length === 0 && h('div', { className: 'tp-state' },
            h('div', { className: 'tp-state-title' }, query.trim() !== '' || highlightsOnly || unreadOnly ? t('noMatch') : t('empty')),
            h('div', { className: 'tp-state-sub' }, query.trim() !== '' || highlightsOnly || unreadOnly ? t('noMatchHint') : t('emptyHint'))),
          state.phase === 'ready' && visible.length > 0 && h('div', { className: 'tp-list' },
            visible.map((item) => h(ItemCard, {
              key: item.id, item, t, now, translations, onTranslate: translate,
              read: readIds.has(item.id), onOpen: markRead,
            }))),
          managing && h(Manager, {
            sources: state.sources.length > 0 ? state.sources : [],
            t,
            onClose: () => { setManaging(false); },
            onSaved: () => { setManaging(false); load(true); },
          })));
    }

    /* ----------------------------------- css ----------------------------------- */

    const CSS = `
.tp-page{box-sizing:border-box;display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#1f2328);font-family:var(--dsw-font-family,system-ui,-apple-system,"Segoe UI",sans-serif)}
.tp-page *,.tp-page *::before,.tp-page *::after{box-sizing:border-box}
.tp-header{flex:none;padding:18px 24px 0;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(31,35,40,.12))}
.tp-header-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.tp-toolbar{justify-content:space-between;padding-bottom:12px}
.tp-brand{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-brand-primary,#2e6be6)}
.tp-title{font-size:15px;font-weight:650;color:var(--dsw-alias-label-primary,#1f2328)}
.tp-live{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:var(--dsw-alias-brand-primary,#2e6be6);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 10%,transparent);border-radius:999px;padding:2px 8px}
.tp-live-dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:tp-blink 2.2s ease infinite}
@keyframes tp-blink{0%,100%{opacity:1}50%{opacity:.25}}
.tp-actions{display:inline-flex;align-items:center;gap:8px;margin-left:auto}
.tp-pill{font-size:11.5px;color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-btn{cursor:pointer;border:1px solid var(--dsw-alias-border-l2,rgba(31,35,40,.2));background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1f2328);border-radius:var(--dsw-radius-sm,6px);font:inherit;font-size:12.5px;padding:5px 12px;transition:background .12s ease,border-color .12s ease}
.tp-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(31,35,40,.06))}
.tp-btn:disabled{cursor:default;opacity:.55}
.tp-btn-icon{padding:5px 8px;line-height:1}
.tp-btn-lg{font-size:15px}
.tp-btn-primary{background:var(--dsw-alias-brand-primary,#2e6be6);border-color:var(--dsw-alias-brand-primary,#2e6be6);color:#fff}
.tp-btn-primary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 88%,#000)}
.tp-tabs{display:inline-flex;gap:4px;flex-wrap:wrap}
.tp-tab{cursor:pointer;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary,#6b7280);font:inherit;font-size:12.5px;padding:5px 11px;border-radius:999px;transition:color .12s ease,background .12s ease}
.tp-tab:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(31,35,40,.06));color:var(--dsw-alias-label-primary,#1f2328)}
.tp-tab[data-active="true"]{color:var(--dsw-alias-brand-primary,#2e6be6);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 10%,transparent);font-weight:600}
.tp-tab-count{margin-left:5px;font-size:10.5px;opacity:.75}
.tp-input{border:1px solid var(--dsw-alias-border-l2,rgba(31,35,40,.2));background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1f2328);border-radius:var(--dsw-radius-sm,6px);font:inherit;font-size:12.5px;padding:6px 10px;min-width:0}
.tp-input::placeholder{color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2e6be6);outline-offset:1px}
.tp-search{width:min(320px,42vw)}
.tp-body{flex:1;min-height:0;position:relative;overflow:hidden;display:flex;flex-direction:column}
.tp-list{flex:1;min-height:0;overflow-y:auto;padding:16px 24px 40px}
.tp-list::after{content:"";display:block;max-width:860px;margin:0 auto}
.tp-card{max-width:860px;margin:0 auto 10px;padding:13px 16px;border:1px solid var(--dsw-alias-border-l1,rgba(31,35,40,.12));border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1,#fff);transition:border-color .12s ease,transform .12s ease}
.tp-card:hover{border-color:var(--dsw-alias-border-l2,rgba(31,35,40,.2));transform:translateY(-1px)}
.tp-card-head{display:flex;align-items:center;gap:8px;margin-bottom:7px;min-height:22px}
.tp-avatar{flex:none;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;object-fit:cover}
.tp-source{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-meta-item{font-size:11.5px;color:var(--dsw-alias-label-secondary,#6b7280);white-space:nowrap}
.tp-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:7px}
.tp-link{color:var(--dsw-alias-label-secondary,#6b7280);text-decoration:none}
.tp-link:hover{text-decoration:underline}
.tp-card-title{display:block;font-size:14.5px;font-weight:600;line-height:1.45;color:var(--dsw-alias-label-primary,#1f2328);text-decoration:none}
.tp-card-title:hover{text-decoration:underline}
.tp-card-sum{margin:5px 0 0;font-size:12.5px;line-height:1.55;color:var(--dsw-alias-label-secondary,#6b7280);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tp-event-line{font-size:12.5px;color:var(--dsw-alias-label-secondary,#6b7280);min-width:0;flex:1;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.tp-event-actor{color:var(--dsw-alias-label-primary,#1f2328);font-weight:650}
.tp-event-repo{color:var(--dsw-alias-brand-primary,#2e6be6);text-decoration:none;font-weight:550}
.tp-event-repo:hover{text-decoration:underline}
.tp-event-title{margin-top:5px;font-size:12.5px;color:var(--dsw-alias-label-secondary,#6b7280);padding-left:30px}
.tp-card-event .tp-card-head{margin-bottom:0}
.tp-skel-wrap{max-width:860px;margin:0 auto;padding:16px 24px}
.tp-skel{border:1px solid var(--dsw-alias-border-l1,rgba(31,35,40,.12));border-radius:var(--dsw-radius-md,8px);padding:16px;margin-bottom:10px;background:var(--dsw-alias-bg-layer-1,#fff)}
.tp-skel-line{height:11px;border-radius:5px;margin:9px 0;background:linear-gradient(100deg,var(--dsw-alias-interactive-bg-hover,rgba(31,35,40,.06)) 40%,color-mix(in srgb,var(--dsw-alias-interactive-bg-hover,rgba(31,35,40,.06)) 50%,#fff0) 50%,var(--dsw-alias-interactive-bg-hover,rgba(31,35,40,.06)) 60%);background-size:200% 100%;animation:tp-shimmer 1.4s ease infinite}
@keyframes tp-shimmer{to{background-position:-200% 0}}
.tp-state{max-width:520px;margin:12vh auto 0;text-align:center;padding:0 24px}
.tp-state-title{font-size:15px;font-weight:650;color:var(--dsw-alias-label-primary,#1f2328);margin-bottom:8px}
.tp-state-sub{font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-secondary,#6b7280);margin-bottom:16px}
.tp-spin{display:inline-block;animation:tp-rotate .8s linear infinite}
@keyframes tp-rotate{to{transform:rotate(360deg)}}
.tp-manager{position:absolute;inset:0 0 0 auto;width:min(440px,100%);display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1,#fff);border-left:1px solid var(--dsw-alias-border-l2,rgba(31,35,40,.2));box-shadow:-12px 0 32px rgba(0,0,0,.14);z-index:5}
.tp-manager-head{flex:none;display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(31,35,40,.12));color:var(--dsw-alias-brand-primary,#2e6be6)}
.tp-manager-title{font-size:13.5px;font-weight:650;color:var(--dsw-alias-label-primary,#1f2328);flex:1}
.tp-manager-scroll{flex:1;min-height:0;overflow-y:auto;padding:12px 16px}
.tp-mgr-list{list-style:none;margin:0 0 16px;padding:0}
.tp-mgr-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(31,35,40,.1))}
.tp-mgr-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.tp-mgr-label{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,#1f2328);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-mgr-sub{font-size:11px;color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-mgr-remove{color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-mgr-remove:hover{color:var(--dsw-alias-state-error-primary,#d43d17)}
.tp-mgr-form{border:1px dashed var(--dsw-alias-border-l2,rgba(31,35,40,.2));border-radius:var(--dsw-radius-md,8px);padding:14px}
.tp-form-title{font-size:12.5px;font-weight:650;margin-bottom:10px;color:var(--dsw-alias-label-primary,#1f2328)}
.tp-field{display:grid;grid-template-columns:88px 1fr;align-items:center;gap:8px;margin-bottom:8px}
.tp-field-label{font-size:11.5px;color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-select{appearance:auto}
.tp-form-error{font-size:11.5px;color:var(--dsw-alias-state-error-primary,#d43d17);margin:6px 0}
.tp-hint{font-size:11px;line-height:1.7;color:var(--dsw-alias-label-secondary,#6b7280);margin:14px 0 0}
.tp-manager-foot{flex:none;display:flex;align-items:center;gap:8px;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(31,35,40,.12))}
.tp-switch{flex:none;cursor:pointer;width:34px;height:19px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,rgba(31,35,40,.25));background:var(--dsw-alias-bg-layer-2,rgba(31,35,40,.05));padding:0;position:relative;transition:background .15s ease,border-color .15s ease}
.tp-switch-knob{position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;background:var(--dsw-alias-label-secondary,#6b7280);transition:transform .15s ease,background .15s ease}
.tp-switch[data-on="true"]{background:var(--dsw-alias-brand-primary,#2e6be6);border-color:var(--dsw-alias-brand-primary,#2e6be6)}
.tp-switch[data-on="true"] .tp-switch-knob{transform:translateX(15px);background:#fff}
.tp-refresh{font-size:15px;line-height:1}
.tp-toolbar-actions{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}
.tp-warn-pill{cursor:pointer;border-radius:999px;padding:2px 9px;color:var(--dsw-alias-state-warn-primary,#b45309);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 12%,transparent);border:none;font-weight:600}
.tp-warn-pill:hover{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 20%,transparent)}
.tp-card[data-read="true"]{opacity:.62}
.tp-card[data-read="true"] .tp-card-title{color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-card[data-read="true"]:hover{opacity:1}
.tp-src-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:1px;background:var(--dsw-alias-state-idle-primary,#9ca3af)}
.tp-src-dot[data-state="ok"]{background:var(--dsw-alias-state-success-primary,#12805c)}
.tp-src-dot[data-state="error"]{background:var(--dsw-alias-state-error-primary,#d43d17)}
.tp-src-dot[data-state="disabled"]{background:var(--dsw-alias-state-idle-primary,#9ca3af)}
.tp-head-actions{margin-left:auto;display:inline-flex;align-items:center;gap:8px;flex:none}
.tp-translate{padding:1px 7px;font-size:10.5px;font-weight:700;border-radius:999px;line-height:1.5}
.tp-translate[data-phase="ready"][data-open="true"]{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 12%,transparent);border-color:var(--dsw-alias-brand-primary,#2e6be6);color:var(--dsw-alias-brand-primary,#2e6be6)}
.tp-btn-link{border:none;background:none;padding:0;font-size:11.5px;color:var(--dsw-alias-brand-primary,#2e6be6);text-decoration:underline}
.tp-inline-error{font-size:11.5px;color:var(--dsw-alias-state-error-primary,#d43d17);margin-top:5px}
.tp-translation{margin-top:9px;padding:8px 12px;border-left:3px solid var(--dsw-alias-brand-primary,#2e6be6);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 5%,transparent);border-radius:0 var(--dsw-radius-sm,6px) var(--dsw-radius-sm,6px) 0}
.tp-translation-title{font-size:13.5px;font-weight:650;line-height:1.5;color:var(--dsw-alias-label-primary,#1f2328)}
.tp-translation-sum{margin:4px 0 0;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-digest{max-width:860px;margin:14px auto 0;padding:12px 16px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 35%,var(--dsw-alias-border-l1,rgba(31,35,40,.12)));border-radius:var(--dsw-radius-md,8px);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 4%,var(--dsw-alias-bg-layer-1,#fff))}
.tp-digest-loading,.tp-digest-error{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tp-digest-error{border-color:var(--dsw-alias-state-error-primary,#d43d17);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d43d17) 5%,var(--dsw-alias-bg-layer-1,#fff))}
.tp-digest-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.tp-digest-badge{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;font-size:10.5px;font-weight:800;color:#fff;background:linear-gradient(135deg,#4F8DFF,#2254D6)}
.tp-digest-title{font-size:13.5px;font-weight:700;color:var(--dsw-alias-label-primary,#1f2328)}
.tp-digest-meta{font-size:11px;color:var(--dsw-alias-label-secondary,#6b7280)}
.tp-digest-list{margin:0;padding:0 0 2px;list-style:none}
.tp-digest-item{position:relative;font-size:12.8px;line-height:1.65;color:var(--dsw-alias-label-primary,#1f2328);padding-left:16px;margin-bottom:4px}
.tp-digest-item::before{content:"";position:absolute;left:4px;top:.62em;width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-brand-primary,#2e6be6)}
.tp-highlights{margin-top:8px;border-top:1px dashed var(--dsw-alias-border-l1,rgba(31,35,40,.14));padding-top:8px;display:flex;flex-direction:column;gap:6px}
.tp-highlight{cursor:pointer;text-align:left;border:1px solid var(--dsw-alias-border-l1,rgba(31,35,40,.12));background:var(--dsw-alias-bg-layer-1,#fff);border-radius:var(--dsw-radius-sm,6px);padding:7px 11px;font:inherit;display:flex;flex-direction:column;gap:2px;transition:border-color .12s ease}
.tp-highlight:hover{border-color:var(--dsw-alias-brand-primary,#2e6be6)}
.tp-highlight-source{font-size:10.5px;font-weight:700;letter-spacing:.3px;color:var(--dsw-alias-label-secondary,#6b7280);text-transform:uppercase}
.tp-highlight-title{font-size:12.8px;font-weight:600;color:var(--dsw-alias-label-primary,#1f2328);line-height:1.45}
.tp-highlight-why{font-size:11.8px;color:var(--dsw-alias-label-secondary,#6b7280);line-height:1.5}
.tp-chip[data-on="true"]{color:var(--dsw-alias-brand-primary,#2e6be6);border-color:var(--dsw-alias-brand-primary,#2e6be6);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 10%,transparent);font-weight:650}
.tp-card.tp-flash{animation:tp-flash-anim 1.6s ease 1}
@keyframes tp-flash-anim{0%,60%{border-color:var(--dsw-alias-brand-primary,#2e6be6);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#2e6be6) 18%,transparent)}100%{border-color:var(--dsw-alias-border-l1,rgba(31,35,40,.12));box-shadow:none}}
`;

    /* --------------------------------- plugin ---------------------------------- */

    const inject = ['slots', 'locale', 'layout'];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'tech-pulse: dictionaries');
      const t = ctx.locale.bind(NS);
      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({ t }),
      }, TechPulsePage));
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 10,
        label: () => t('panel'),
        locale: NS,
      }, TechPulsePanelIcon));
    }

    return { inject, apply };
  },
});
