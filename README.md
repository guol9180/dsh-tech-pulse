# Tech Pulse 科技脉搏

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 侧栏面板插件：把**一手**科技资讯聚合到一个页面——科技快讯、新闻、头部 AI 公司动态、科技大佬的公开动态，并内置 **AI 速览**（总结 + 重点过滤）与**按需中文翻译**。

![License](https://img.shields.io/badge/license-MIT-green) ![Version](https://img.shields.io/badge/version-1.1.0-blue)

## 特性

- **全部一手来源**：官方 API / 出版方官方 RSS / 官网新闻页 / 本人博客与 GitHub 动态，不经任何聚合转手
- **四个分类标签**：快讯 / 新闻 / AI 前沿 / 大佬动态（带计数），支持搜索过滤
- **AI 速览**：一键把近 48 小时资讯交给模型，产出中文要点 + 重点消息（附理由，可点击定位卡片），「只看重点」一键过滤
- **按需中文翻译**：英文条目点击「译」才翻译并展开（Host 缓存，重复展开零成本），中文条目自动隐藏按钮
- **订阅管理**：面板内增删启停订阅源，写入 profile 持久生效；也支持直接改 `cordis.patch.yml`
- Host 进程内抓取（无 CORS 限制）、按源缓存、单源失败不影响整体、所有路由经登录鉴权信任闸

## 数据来源（默认订阅）

| 分类 | 来源 | 方式 |
|---|---|---|
| 快讯 | Hacker News 首页 | 官方 Firebase API |
| 快讯 | Solidot | 官方 RSS |
| 快讯 | GitHub 新星项目（近 7 天高星） | GitHub Search API |
| 新闻 | TechCrunch / The Verge / Ars Technica / 少数派 | 官方 RSS |
| AI 前沿 | OpenAI News | 官方 RSS（openai.com/news） |
| AI 前沿 | Anthropic News | 官网新闻页解析（anthropic.com/news） |
| AI 前沿 | DeepSeek 动态 | 官方中文新闻页（api-docs.deepseek.com，标题自带日期） |
| AI 前沿 | Microsoft Research | 官方 RSS |
| 大佬动态 | torvalds / karpathy / simonw / yyx990803 | GitHub 公开事件 API（push/star/release/issue/PR，带头像） |
| 大佬动态 | Simon Willison、Andrej Karpathy 博客 | 本人 RSS |

可选源（部分网络环境不可直连，按需添加）：Google DeepMind `https://deepmind.google/blog/rss.xml`、Meta AI `https://ai.meta.com/blog/rss/`、Mistral `https://mistral.ai/news/rss.xml`、Hugging Face `https://huggingface.co/blog/feed.xml`。

> **X/Twitter**：X 没有公开订阅接口。要跟踪大佬的 X 动态，推荐自建 [RSSHub](https://docs.rsshub.app/) 等桥接生成 RSS 后按「RSS 订阅」添加——用自己的桥接保持一手。

## 安装

前提：已安装 DeepSeek Harness（dsh）并使用其 profile。三种方式任选：

**方式一：插件市场索引（推荐，可发现、可一键安装）**

本仓库自带市场索引 `market-index.json`。在你的 dsh 插件市场里添加索引源（GUI：Plugins 页 → Discover 标签 → 添加索引；或设置里的 plugin-market 索引配置）：

```
https://cdn.jsdelivr.net/gh/guol9180/dsh-tech-pulse@main/market-index.json
```

（备用直链：`https://raw.githubusercontent.com/guol9180/dsh-tech-pulse/main/market-index.json`）

之后「科技脉搏」会出现在 Discover 列表中，点击即可安装；详情页会展示本 README。

**方式二：直接让 AI 从 GitHub 安装**

在你的 DeepSeek Harness 会话里说：

> 安装 bundle：git+https://github.com/guol9180/dsh-tech-pulse.git

Harness 会通过 `plugin_manager install_bundle` 从 Git 拉取并安装。

**方式三：克隆后按本地路径安装**

```bash
git clone https://github.com/guol9180/dsh-tech-pulse.git
```

然后对 AI 说「安装本地 bundle：<克隆路径>/dsh-tech-pulse」，或通过 GUI 的 Plugins 页面安装本地目录。

安装完成后刷新页面，侧栏会出现「科技脉搏」图标。

## 使用

- **浏览**：标签页切换分类，搜索框过滤；标题点击在浏览器打开原文；HN 条目显示分数/评论，GitHub 事件显示头像 + 本地化动作（如“推送了 3 个提交到 deepseek-ai/DeepSeek-V3”）。
- **AI 速览**：顶部「✦ AI 速览」生成（跟随 GUI 的默认模型）；`↻` 强制重新生成；「只看重点」过滤信息流。
- **翻译**：英文卡片右上角「译」，点击展开/收起中文。
- **订阅管理**：⚙ 按钮打开，支持五类源——RSS 订阅 / Hacker News / GitHub 用户 / 官网新闻页（Anthropic/DeepSeek）/ GitHub 新星。
- 刷新按钮绕过缓存立即拉取；面板按 `refreshMinutes` 自动刷新。

## 配置（cordis.patch.yml 中本插件行的 `config`）

```yaml
- id: tech-pulse
  name: 'dsh-tech-pulse'
  config:
    refreshMinutes: 15        # 每源缓存 TTL（分钟），也是面板自动刷新周期
    maxItemsPerSource: 15     # 每源最多保留条数（1–50）
    fetchTimeoutMs: 12000     # 单个上游请求超时
    githubToken: ''           # 可选：GitHub PAT，提高 API 速率限制
    summarizeMaxItems: 60     # AI 速览单次送入的最大条数（10–150）
    llmTimeoutMs: 120000      # 模型调用超时
    llmProvider: ''           # 可选：指定模型路由（默认跟随 GUI 默认模型）
    llmModel: ''
    sources:                  # 省略则使用内置默认源
      - id: gh-torvalds
        type: github-user     # rss | hackernews | github-user | html-news | github-trending
        label: Linus Torvalds
        category: voices      # flash | news | ai | voices
        login: torvalds
        enabled: true
      - id: anthropic-news
        type: html-news       # 仅支持官方页面：
        label: Anthropic News #   https://www.anthropic.com/news
        category: ai          #   https://api-docs.deepseek.com/zh-cn/news/
        url: https://www.anthropic.com/news
        enabled: true
```

`githubToken` 属于敏感信息；不加也可以（匿名额度对默认订阅够用），或使用只读的细粒度 token。

## 项目结构

```
├── index.js            # Host 半边：抓取（RSS/HN/GitHub/官网新闻页）、缓存、
│                       #   LLM 翻译与速览、HTTP 路由（经信任闸鉴权）
├── client.js           # Client 半边：侧栏面板 UI（React，仅用宿主主题令牌）
├── cordis.patch.yml    # Loader 补丁（插件行）
├── locale/             # 插件管理器显示用的 en/zh 元信息
├── icon.svg            # 面板图标
└── test/smoke.mjs      # 冒烟测试（解析器单元 + 真实源抓取）
```

## 开发与测试

```bash
node test/smoke.mjs     # 覆盖：RSS/官网页解析、中文检测、模型 JSON 容错、
                        # 校验规则、真实源抓取（OpenAI/Anthropic/DeepSeek 等）
```

修改后重新安装（会热加载 Host 半边；页面刷新加载新 client）：

> 对 Harness AI 说：重装本地 bundle `<本仓库路径>`

## 发布新版本

1. 改代码 → `package.json` 升版本号 → 提交并推送
2. 取该提交的完整 SHA（`git rev-parse HEAD`），在 `market-index.json` 的 `versions` 数组**头部**插入一条：

```json
{
  "version": "x.y.z",
  "publishTimestamp": <Unix 秒>,
  "source": { "type": "git", "url": "https://github.com/guol9180/dsh-tech-pulse", "commit": "<40 位 SHA>" }
}
```

3. 提交索引并推送——已添加本索引的用户会在 Discover 里看到新版本（更新 = 卸载后重装）

## 安全与隐私

面向公开发布设计，数据流最小化：

- **零依赖、零上报**：插件无任何 npm 运行时依赖，不含统计/遥测代码，不向第三方发送数据
- **本地通信全部鉴权**：面板与 Host 的四个接口都经过 dsh 信任闸（Host/Origin 防护 + 登录 cookie），未认证请求 401、跨源 403
- **只抓你配置的源**：Host 仅请求订阅列表中的地址；无论配置还是重定向，都**硬编码拒绝云元数据端点**（169.254.169.254 等），杜绝 SSRF 偷取宿主机凭证
- **条目内容视为不可信**：feed 提供的链接仅放行 http/https（拦截 `javascript:` 等协议注入）；所有文本经 React 转义渲染，插件自身不使用 innerHTML
- **AI 调用走你自己的模型**：翻译/速览使用你配置的默认模型路由，内容不出你的账号体系；提示词内置注入防护（feed 内容一律视为数据而非指令）
- **已读状态只存本机**：浏览器 localStorage，不上传、不进配置
- **凭证建议**：`githubToken` 使用只读细粒度 PAT；若配置 RSSHub 桥接 X，auth_token 只保留在本机 RSSHub 的 `.env`

## 面板与 Host 的接口

- `GET tech-pulse/feed?refresh=1&category=flash|news|ai|voices` — 聚合条目（含 `needZh` 标记）与各源状态
- `GET tech-pulse/translate?id=<itemId>` — 单条按需中文翻译（Host 缓存）
- `GET tech-pulse/summarize?refresh=1` — AI 速览（digest + highlights，按内容指纹缓存）
- `GET/POST tech-pulse/sources` — 读取/整表替换订阅（严格校验，最多 64 个源）
- 所有路由经过 `connection.requestRejection` 信任闸（Host/Origin 防护 + 登录 cookie 鉴权）；保存订阅使用 `configEditor.edit`

## 已知限制

- GitHub 匿名 API 限速约 60 次/小时/IP；默认订阅按 15 分钟刷新控制在额度内，加更多 GitHub 源建议配置 `githubToken`
- Anthropic/DeepSeek 官网新闻页解析依赖当前页面结构，改版时该源会显式报错而非返回脏数据；Anthropic 条目暂无发布时间；DeepSeek 条目时间来自官方 slug 中的日期
- DeepMind 等 Google/Meta/HF 域名在部分网络间歇性不可直连，故不放入默认源
- RSS 解析器为轻量实现（RSS 2.0 / Atom 常见字段）；AI 速览与翻译依赖可用的模型路由，格式异常时明确报错

## License

[MIT](LICENSE)
