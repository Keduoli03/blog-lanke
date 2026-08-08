---
title: 用 Vercel AI Gateway 给博客做一个 AI 摘要服务
summary: 使用 Vercel Functions、AI Gateway 和 Neon，为 Astro 博客实现带内容缓存、OIDC 鉴权和费用保护的 AI 摘要服务。
category: 博客
tags:
  - Vercel
  - AI
  - Astro
date: 2026-08-08 22:57
updated: 2026-08-08 22:59
slug: vercel-ai-blog-summary
aiSummary: true
draft: false
---

其实我对 AI 总结功能的有无一直是无所谓的态度，但既然可以免费做一个，那就顺手实现一下。我之前一直用的是 Mabbs 大佬的 [AI 摘要项目](https://mabbs.github.io/2024/07/03/ai-summary.html)，不过项目是部署在 Cloudflare 上的，我花了一下午才部署完。然后又因为 Cloudflare 在国内被墙，加上我在 CF 上没有托管域名，只好又搞了个 Vercel 反代，这才实现了 AI 摘要的效果。

那 Vercel 有没有可能部署个类似的项目呢？

折腾了几天，答案是完全可以。最终做出来的是 **Vercel Functions + AI Gateway + Neon Postgres** 的组合，项目开源在 [Keduoli03/vercel-ai-summary](https://github.com/Keduoli03/vercel-ai-summary)。这篇就当是项目分享吧。

## 最终架构

请求链路不复杂：

```text
Astro 博客
    │
    │ POST /api/summary
    ▼
Vercel Function
    ├── Neon Postgres：查询或保存摘要缓存
    └── AI Gateway：调用 Qwen 生成摘要
```

博客端只提交文章 ID 和正文，剩下的缓存判断、模型调用、错误处理全在服务端。这样有几个好处：

- 前端不保存任何模型密钥
- 换模型不用动博客代码
- 文章没变就直接返回缓存，不白花钱
- 文章更新了会自动重新生成
- 模型用量和费用可以在 Vercel 里统一看

## 为什么选 AI Gateway

[Vercel AI Gateway](https://vercel.com/docs/ai-gateway) 相当于一个统一的模型入口，用 AI SDK 的话，只要写一个 `provider/model` 格式的模型名就能切换供应商。项目默认用的是：

```text
alibaba/qwen3.7-flash
```

这个模型很便宜，给博客生成摘要绰绰有余。以后想换，改个 `AI_MODEL` 环境变量就行，不用动请求逻辑。

鉴权这块用的是 Vercel 的 **OIDC Token**，部署的时候自动注入、自动轮换，仓库里根本不用存 `AI_GATEWAY_API_KEY`：

```ts
import { gateway, generateText } from 'ai'

const result = await generateText({
  model: gateway('alibaba/qwen3.7-flash'),
  instructions: SYSTEM_PROMPT,
  prompt: articleContent,
  maxOutputTokens: 600,
  temperature: 0.2,
})
```

## 用 Neon 做缓存

每次打开文章都重新调模型的话，又慢又费额度。所以服务端会对这三样东西算一个 SHA-256：

- 提示词版本
- 当前模型
- 文章正文

```ts
const contentHash = createHash('sha256')
  .update(`${PROMPT_VERSION}\0${model}\0${content}`)
  .digest('hex')
```

数据库里已有相同 `id` 和 `content_hash` 就直接返回旧摘要，否则生成新的并 upsert。所以缓存不是只认文章 ID——正文、模型、提示词任何一个变了，哈希就变，自然就会重新生成，不会一直给你看旧摘要。

顺便把每次生成的 Token 用量、模型、提示词版本、耗时、时间都记了下来，方便对账。

Neon 是通过 Vercel Marketplace 接的，部署完自动就有 `DATABASE_URL`。数据库和 Function 都放在新加坡，避免请求绕来绕去。

## API 设计

两个接口：

**查缓存（不调模型）：**

```http
GET /api/summary?id=/posts/example
```

**生成或更新摘要：**

```http
POST /api/summary
Content-Type: application/json

{
  "id": "/posts/example",
  "content": "文章正文"
}
```

POST 也不一定真的调用 AI，服务端会先算哈希，命中缓存就直接返回。所以博客端永远提交最新正文就行。

成功响应长这样：

```json
{
  "code": 1,
  "message": "生成文章摘要成功",
  "data": "这里是生成的摘要",
  "isSave": true,
  "model": "alibaba/qwen3.7-flash"
}
```

## 博客怎么接入

原来那套 Cloudflare 实现要依次做哈希检查、上传文章、查缓存、读 SSE 流。换成这个之后，一次 POST 就完事：

```js
const response = await fetch('https://summary.blueke.top/api/summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: slug,
    content: `标题: ${title}\n\n${body}`,
  }),
  signal: controller.signal,
})

const result = await response.json()
outputEl.textContent = result.data
```

服务端配好了 CORS，博客和接口不在同一个域名也能调。客户端设了 65 秒超时，出错时优先显示服务端返回的错误信息。

文章要不要显示 AI 摘要，由 frontmatter 里的 `aiSummary: true` 控制，没开的文章根本不会发请求。

## 费用保护

Vercel AI Gateway 免费层给每个团队每月 `$5` 额度，不过得先绑一张有效银行卡才能解锁——**绑卡不等于购买额度**，记得把 Auto top-up 关掉。

我给线上项目设了硬预算，每月 `$4`，留 `$1` 余量：

```bash
vercel ai-gateway budgets set project vercel-cf-summary \
  --limit 4 \
  --refresh-period monthly
```

达到上限后 Gateway 会拒绝新的付费调用，但数据库里已有的缓存还能继续读。

## 安全方面

- 仓库里没有任何真实凭据，线上靠 OIDC 短期 Token 调模型
- 系统提示词里明确要求忽略正文中的注入指令，防止有人通过文章内容诱导模型
- `ALLOWED_ORIGIN` 可以限定允许调用 API 的来源
- 单篇正文限制 60,000 字符
- 根路径只返回一个只读 JSON 健康状态，不给测试表单

需要说明的是，这个项目定位是公开演示，没有做登录和按用户限流。预算只是防止超额扣费，代替不了真正的防滥用措施，真要拿来当正式服务的话，还得自己加认证和限流。

## 最后

折腾下来感觉，原本 Cloudflare Workers AI + D1 的方案在 Vercel 生态里确实能找到完整对应：

| Cloudflare 方案 | Vercel 方案      |
| --------------- | ---------------- |
| Workers         | Vercel Functions |
| Workers AI      | AI Gateway       |
| D1              | Neon Postgres    |

和之前 CF 那套的折腾相比，Vercel 这套上手确实没什么门槛：AI SDK 写起来顺手，OIDC 免去了密钥管理，模型切换和部署体验都挺完整。以后想换模型或者调提示词，博客端一行都不用动。

如果你也想给博客加个 AI 摘要，可以直接去仓库里看看，Fork 之后按 README 的步骤部署就行。

## 参考

- [项目源码](https://github.com/Keduoli03/vercel-ai-summary)
- [Vercel AI Gateway 文档](https://vercel.com/docs/ai-gateway)
- [Vercel AI Gateway 费用说明](https://vercel.com/docs/ai-gateway/pricing)
- [使用 Cloudflare Workers 制作博客 AI 摘要](https://mabbs.github.io/2024/07/03/ai-summary.html)
