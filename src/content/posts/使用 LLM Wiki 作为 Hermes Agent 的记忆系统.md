---
title: 使用 LLM Wiki 作为 Hermes Agent 的记忆系统
description: 为什么没有选 RAG，也没有继续用 Obsidian，而是选了 Karpathy 的 LLM Wiki 模式。聊一聊新的方案、遗忘曲线设计，以及和 Obsidian 方案的对比。
categories:
  - 大杂烩
tags:
  - AI
  - 工具
  - Wiki
  - Hermes
  - 记忆系统
column:
cover: https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/FYwAUt5aQAU07-a.jpg
draft: false
unlisted: false
pinned: false
aiSummary: true
outdate: false
date: 2026-04-30 00:00
updated: 2026-04-30 18:30
slug: llm-wiki-hermes-memory
---

[上篇文章](/posts/obsidian-hermes-memory/) 写了用 Obsidian 做记忆管理的方案，运行了一段时间后，发现了一些新问题，最终换成了 **Karpathy 的 LLM Wiki 模式**。这篇文章说清楚为什么，以及新的方案是怎么设计的。

## Obsidian 方案的问题

用了大约一周，发现 Obsidian 方案有几个实际痛点：

**1. 路径和上下文丢失**

Obsidian 是通用笔记工具，文件散落在各个 vault 的不同文件夹里。Agent 每次处理一个任务时，需要从上下文里找文件路径，然后一个个 `read_file`。没有统一的知识目录，很难快速知道"这个领域的知识存在哪里"。

**2. 遗忘曲线和笔记内容的矛盾**

SM-2 算法设计得很优雅，但问题在于：笔记不像闪卡。笔记是上下文相关的，一篇"项目架构设计"可能在 30 天后依然重要，只因为项目还在迭代。而"今天的临时想法"可能在 3 天后就该删掉。

把"复习周期"绑定在笔记本身上，而不是笔记代表的那个知识上，逻辑上不对。

**3. 多 vault 的维护成本**

有三个 vault：主记忆、博客归档、写作工作区。跨 vault 链接虽然可以建立，但维护成本高。孤儿笔记发现要跑三个 vault，复习也要跑三个 vault。收益递减。

## LLM Wiki 是什么

[Andrej Karpathy 分享过一套](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) **用 Markdown 文件构建 AI 知识库的模式**，核心思想是：

> Unlike traditional RAG (which rediscovers knowledge from scratch per query), the wiki compiles knowledge once and keeps it current. Cross-references are already there. Contradictions have already been flagged. Synthesis reflects everything ingested.

简单说：**一次编译，持续使用**。不像 RAG 每次问答都要从原始文档重新检索，Wiki 把知识预先提取、链接、合成，需要时直接查。

三层架构：

```
wiki/
├── raw/              # Layer 1: 不可变的源材料（文章/PDF/ transcripts）
├── entities/         # Layer 2: 实体（人物/公司/产品/项目）
├── concepts/         # Layer 2: 概念（主题/理论/方法论）
├── comparisons/      # Layer 2: 对比分析
├── queries/          # Layer 2: 值得保存的问答结果
├── SCHEMA.md         # Layer 3: 规范（结构/标签/遗忘曲线规则）
├── index.md          # Layer 3: 内容目录
└── log.md            # Layer 3: 操作日志
```

**Layer 1（原始材料）** 是 immutable 的，只读不修改。**Layer 2（Wiki 页面）** 是 Agent 维护的，有版本演进。**Layer 3（Schema）是规则**，定义整个系统的运作方式。

## 遗忘曲线的重新设计

Obsidian 方案里，把遗忘曲线绑定在笔记本身上。这有问题。

LLM Wiki 的做法是：**把遗忘曲线绑定在信息的优先级上，而不是笔记本身上。**

```yaml
---
title: User Profile
priority: critical    # 优先级：critical/high/medium/low/ephemeral
review_after: 2099-12-31  # 下次 review 时间
confidence: high
---
```

| 优先级 | 含义 | Review 周期 | 衰减 |
|--------|------|------------|------|
| `critical` | 永久记忆，不能丢 | 90 天 | 不衰减 |
| `high` | 重要，长期保留 | 60 天 | 很慢 |
| `medium` | 有价值但非核心 | 30 天 | 中等 |
| `low` | 低价值/过时 | 14 天 | 快速 |
| `ephemeral` | 临时笔记 | 不主动 review | 立即过期 |

每次 lint 检查时：
- `ephemeral` 页面 7 天没更新 → 归档
- `low` 页面错过 2 次 review → 归档
- `medium` 页面 2x 周期没更新 → 降级为 low
- `critical/high` → 永远保持

这样设计的好处是：**遗忘的是低价值信息，高价值信息自然沉淀。**

## 和 Obsidian 方案的对比

| 维度 | Obsidian 方案 | LLM Wiki 方案 |
|------|-------------|--------------|
| 存储位置 | 多 vault | 单一日 wiki |
| 遗忘曲线 | SM-2 算法（绑定笔记） | Priority-based（绑定信息价值） |
| 孤儿检测 | 跨 vault 扫描 | 单一日录扫描 |
| 知识组织 | 通用笔记 | 预结构化（entities/concepts/comparisons） |
| 维护成本 | 高（多 vault） | 低（单目录） |
| Agent 集成 | 文件系统 + CLI | 直接读取，结构已知 |

核心区别是：**Obsidian 是通用工具，LLM Wiki 是为 Agent 设计的知识库。**

Obsidian 允许你用任意方式组织笔记，文件夹、标签、链接都可以随便加。这对人类很自由，但对 Agent 来说，每次都要猜"这个信息应该存在哪里"。

LLM Wiki 预先定义好了结构：实体放 entities/，概念放 concepts/，对比分析放 comparisons/。Agent 知道信息该往哪放，查询时也知道该从哪里读。

## 实际使用方式

现在的使用方式很简单：

```
用户告诉新事实 → Agent 更新对应 wiki 页面
用户问问题 → Agent 从 wiki 查询再回答
用户让记录想法 → Agent 创建/更新相关页面
定期 lint → 检查遗忘曲线 + 孤儿页面
```

不需要定时任务。Wiki 存在 `~/wiki/` 目录，任何 session 都能读。Agent 每次启动时读一遍 SCHEMA.md + index.md + log.md，然后继续工作。

Wiki 也可以用 Obsidian 打开——它本身就是合法的 Obsidian vault，wikilink 正常工作，Graph View 也能用。Agent 在 Wiki 里写，用户用 Obsidian 读，两者完全兼容。

## 什么时候不用这套

LLM Wiki 不适合：

- **超大规模文档库**（百万级请用 RAG 或专业知识图谱）
- **需要语义推理的隐式关联发现**（GraphRAG 更强）
- **多人协作场景**（需要权限控制和版本管理）
- **纯结构化数据**（数据库比 Markdown 文件更合适）

适合的是：**个人知识管理、需要人工干预、强调可解释性、不想运维额外服务。**

## 总结

从 RAG → Obsidian → LLM Wiki，认知在演进。核心洞察是：

**Agent 的记忆不是"检索"，是"编译"。**

RAG 是检索思维，每次重新找。Obsidian 是笔记思维，不区分价值。LLM Wiki 是编译思维——预先处理，持续使用，高价值信息自然沉淀，低价值信息逐渐遗忘。

这套方案还在跑，后续如果有新发现再更新。


