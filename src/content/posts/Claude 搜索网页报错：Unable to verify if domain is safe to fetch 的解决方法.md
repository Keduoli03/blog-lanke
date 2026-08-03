---
title: Claude 搜索网页报错：Unable to verify if domain is safe to fetch 的解决方法
summary: Claude 搜索网页时提示无法验证目标域名安全性，本质是 WebFetch 预检请求访问 claude.ai 被网络环境拦截，一行配置跳过预检即可解决。
cover: https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/claude-cover.png
category: 计算机
tags:
  - Claude
date: 2026-08-03 20:50
updated: 2026-08-03 21:04
slug: claude-skip-web-fetch-preflight
draft: false
aiSummary: true
---

用 Claude 搜索网页内容的时候，经常会遇到这样的报错：

```text
Unable to verify if domain segmentfault.com is safe to fetch.
This may be due to network restrictions or enterprise security policies blocking claude.ai.
```

提示无法搜索，`WebFetch` 完全用不了。这篇文章记录一下原因和解决方案。

## 问题本质：WebFetch 抓取前的域名预检

`WebFetch` 在抓取目标网站之前，会先请求一次安全校验接口：

```text
https://claude.ai/api/web/domain_info?domain=<目标域名>
```

也就是先问一下 claude.ai："这个域名安全吗？"确认安全之后才会真正去抓取目标页面。

问题就出在这里：**如果你的网络环境中 claude.ai 被墙、被运营商拦截，或者被企业防火墙拦截，这一步预检请求根本发不出去**，于是无论目标网站（比如 segmentfault.com）本身能不能正常访问，`WebFetch` 都会直接报错。

> 即使你开了全局代理，只要代理没有正确处理对 claude.ai 的请求，预检依然会失败——因为这一步请求的是 claude.ai，而不是目标网站本身。

所以报错信息里那句 "network restrictions or enterprise security policies blocking claude.ai" 说的就是真实原因，不是吓唬人的。

## 解决方案：跳过预检

Claude Code 实际提供了一个配置项来跳过这一步域名预检，在 `settings.json` 里加一行：

```json
{
  // ...
  "skipWebFetchPreflight": true
}
```

配置之后，`WebFetch` 不再请求 `domain_info` 预检接口，直接抓取目标网页，报错就不会再出现了。

### settings.json 在哪

Claude Code 的配置文件在：

- **Windows**：`C:\Users\<你的用户名>\.claude\settings.json`
- **macOS / Linux**：`~/.claude/settings.json`

没有这个文件就手动创建一个，把上面的配置写进去即可。也可以直接用命令打开：

```bash
claude config set -g skipWebFetchPreflight true
```

## 参考

- [GitHub Issue: anthropics/claude-code#6388](https://github.com/anthropics/claude-code/issues/6388)

## 最后

简单总结一下排查思路：

- 报错提到 `blocking claude.ai` → 说明是预检请求被网络环境拦截，而不是目标网站的问题。
- 目标网站本身能访问、能 `curl`，但 Claude 搜不了 → 基本就是预检这步挂了。
- 一行 `skipWebFetchPreflight: true` 跳过预检，是最直接有效的解法。

如果跳过预检之后仍然报错，那就要检查代理规则是否覆盖了 claude.ai 域名，或者换一个能正常访问 claude.ai 的网络环境了。
