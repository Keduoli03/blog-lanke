---
title: 使用Obsidian 作为 Hermes Agent 的记忆数据库
description: 为什么我最终没有选 RAG，而是用 Obsidian 做 Hermes的长期记忆管理。聊一聊两者的对比、技术细节，以及完整的实现方案。
categories:
  - 大杂烩
tags:
  - AI
  - 工具
  - Obsidian
  - Hermes
column:
cover: https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/FYwAUt5aQAU07-a.jpg
draft: false
unlisted: false
pinned: false
aiSummary: true
outdate: false
date: 2026-04-27 00:00
updated: 2026-04-26 18:12
slug: obsidian-hermes-memory
---

在折腾 AI Agent 的记忆系统时，我最终没有选择 RAG，而是选了 Obsidian。这篇文章说清楚为什么，以及怎么做的。

## RAG 是什么

Retrieval-Augmented Generation，检索增强生成，2020 年由 Facebook 提出，核心思想很直接：不让大模型单独回答问题，而是先从知识库检索相关文档，再把检索结果和问题一起交给模型生成。

标准 pipeline 是这样：

```text
Query → Embedding Model → Vector → Top-K Similarity Search → Retrieved Docs → LLM → Response
```

实际架构通常更复杂，会有这几个组件：

- **Embedding Model**：将文本映射到向量空间，常用 text-embedding-ada-002、bge、jina 等
- **Vector Database**：存储向量并提供相似度检索，Pinecone/Milvus/Qdrant/Chroma 等
- **Chunking Strategy**：文档切分方式，fixed-size、sentence、paragraph、recursive character 等
- **Reranker**：初筛之后再做一次语义重排序，提升召回精度
- **Metadata Filtering**：按时间、标签、来源等条件过滤候选文档

常见 RAG 范式：

| 范式                   | 说明                                         |
| ---------------------- | -------------------------------------------- |
| **Naive RAG**          | 直接向量检索 + 生成，chatbot 场景最常见      |
| **Retriever-Reranker** | 先召回 100 条，用 cross-encoder 重排取 Top 5 |
| **Hybrid Search**      | 关键词检索 + 向量检索结果取并集              |
| **Self-Rerank**        | 用 LLMs own reasoning 筛选相关文档           |
| **Agentic RAG**        | 让 LLM 自己决定查什么、查几次、怎么组合      |
| **GraphRAG**           | 用知识图谱组织实体关系，提升跨文档推理能力   |

## RAG 的实际问题

技术选型不能只看概念先进，要看实际踩坑。RAG 在个人场景的问题：

**检索质量不可控**

向量相似度是语义近似，但不是相关性强。一篇讲"缓存穿透"的笔记和一篇讲"Redis 缓存"的笔记，embedding 后距离很近，但实际完全无关。chunk 边界更是玄学——同一个段落，切在不同位置，召回率差一倍。

调参是个无底洞：chunk_size 128/256/512/1024，overlap 0/64/128，top_k 3/5/10/20，embedding 模型 bge-large/zephyr/jina，每个组合都要跑评估。没有成熟的 evaluation framework 之前，基本靠玄学调参。

**上下文污染**

召回来的文档质量参差不齐，top-k 排序差的片段会稀释正确答案。大模型有 lost-in-the-middle 问题，中间的上下文容易被忽略。token 消耗也高，一次检索可能召回 8k token，频繁调用成本可观。

**维护成本**

文档更新要重新 embedding，embedding 模型更新要重新索引全量数据，向量数据库本身要运维。这些都是隐性成本。

**黑盒，无人工干预空间**

RAG 的检索逻辑是隐式的、概率的。我想手动建立两条笔记之间的关联？做不到。我想标记某条知识优先级更高？做不到。我想在笔记里加批注说明"这条已过时"？做不到。

## 为什么选 Obsidian

核心认知是：**Agent 的记忆管理和 RAG 的知识检索，解决的是不同问题。**

RAG 解决的是"从大规模非结构化文档中找出相关内容"，适合企业知识库、代码库搜索、长文本问答。

Agent 记忆系统需要的是：**稳定、可解释、可干预、可持久化、以显式结构组织的人类知识。**

这正好是 Obsidian 的设计目标：

- **双向链接 `[[笔记]]`**：显式建立笔记间关联
- **标签 `#tag`**：主题分类
- **YAML frontmatter**：结构化元数据（状态、优先级、创建时间、复习周期）
- **纯文本 .md**：不依赖任何服务，永久可读
- **文件夹结构**：人类可理解的知识分类

RAG 靠"语义相似性"组织知识，是概率的、隐式的。

Obsidian 靠"人类主动组织"的知识网络，是确定的、显式的。

对于一个个人 Agent，这套东西还有一个额外好处：文件在本地，我用 AI 读写，你在桌面端用 Obsidian 打开，两者完全兼容，插件正常工作。

## 整体架构

```text
~/.hermes/
├── obsidian-memory.json              # 多 vault 配置（路径、默认 vault）
├── obsidian-memory.log               # 操作日志
├── scripts/obsidian/
│   ├── mem.py                        # CLI 入口: new|review|orphans|list|status|config
│   ├── review.py                     # 遗忘曲线引擎（基于 SM-2 算法）
│   ├── orphans.py                    # 孤儿笔记发现（无入链的笔记）
│   └── batch.py                      # 多 vault 批量操作
└── templates/obsidian/               # 笔记模板
    ├── memory.md                     # 标准记忆模板
    ├── inbox.md                      # 收件箱模板
    ├── session.md                    # 会话摘要模板
    ├── person.md                     # 人物模板
    ├── project.md                    # 项目模板
    ├── topic.md                      # 主题知识模板
    └── review.md                     # 回顾记录模板
```

**多 vault 支持**：

```json
// ~/.hermes/obsidian-memory.json
{
  "vaults": {
    "voidfarer": {
      "path": "/home/agentuser/dev/voidfarer",
      "default": true
    },
    "blog-writer": {
      "path": "/home/agentuser/blog-archive",
      "default": false
    },
    "blog-archive": {
      "path": "/home/agentuser/Documents/Blog Archive",
      "default": false
    }
  }
}
```

`mem.py` 是统一入口，`batch.py` 遍历所有 vault 执行操作。vault 之间互相隔离，但可以手动建立跨 vault 链接。

## 遗忘曲线驱动复习

记忆管理用改良的 SM-2 算法：

```python
STAGES = {
    "new":        {"interval": 1,  "next_review": "1天后"},
    "learning":   {"interval": 3,  "next_review": "3天后"},
    "reviewing":  {"interval": 7,  "next_review": "7天后"},
    "strong":    {"interval": 14, "next_review": "14天后"},
    "mastered":   {"interval": 30, "next_review": "30天后"},
}

# 超过 90 天未复习 → 标记为 stale（降级回 new）
# 每次复习通过 → 升级状态
# 复习失败 → 降一级
```

每次 cronjob 触发时，`review.py` 扫描所有 vault：

```python
for vault in vaults:
    for note in find_notes_by_status("new|learning|reviewing|stale"):
        if note.due_today():
            review(note)   # 更新下次复习时间
            log_review(vault, note)
```

## 孤儿笔记发现

`orphans.py` 用 `grep -r '\[\['` 扫描所有 md 文件，构建反向链接索引：

```python
def build_inlink_index(vault):
    """扫描所有 md 文件，找出每个笔记被哪些笔记链接"""
    index = defaultdict(list)
    for file in vault.md_files:
        links = extract_wikilinks(file.content)
        for link in links:
            index[link].append(file.path)
    return index

def find_orphans(vault, inlink_index):
    """入链为 0 的笔记 = 孤儿"""
    orphans = []
    for file in vault.md_files:
        if file.basename not in inlink_index:
            orphans.append(file)
    return orphans
```

**Claude 的代码搜索也用 grep**

有意思的是，Anthropic 官方在 Claude 的代码搜索方案里也选了类似思路。他们的 Claude Code 产品里有个内置工具叫 `grep`，专门用来做代码搜索和文件内容匹配——本质上就是正则 + grep，没有用向量检索。

行业都在吹 RAG，Claude 却回归基础 grep。这里有个本质洞察：**代码是结构化的、精确匹配比语义近似更重要**。搜索 `useState` 的用法、找一个函数定义、查某个 error message——这些都是 exact match 场景，grep 比向量检索准得多。

这个逻辑放到记忆管理上是一样的：笔记之间的链接关系是确定的，人名、项目名、技术术语，都是精确匹配。真正需要的不是"语义相似的文档"，而是"链接到这条笔记的所有内容"。

所以 orphans.py 用 `grep -r '\[\['` 做反向链接索引，而不是跑 embedding。这不是偷懒，是选对了工具。

孤儿笔记不代表无用，可能是新笔记还没整理，也可能是需要主动建立关联。每周发现一次，人工决定是删除还是补充链接。

## 快速创建笔记

```bash
mem new "RAG 的 chunking 策略对比" \
  --type topic \
  --tags RAG,LLM,技术 \
  --vault voidfarer \
  --review 7
```

生成的文件：

```markdown
---
uid: 20250427-rag-chunking-strategies
type: topic
tags:
  - RAG
  - LLM
  - 技术
created: 2025-04-27
review_status: new
next_review: 2025-05-04
aliases: []
related: []
status: new
---

# RAG 的 chunking 策略对比

## 问题背景

## 主流方法

## 优缺点对比

## 参考资料
```

## 多仓库管理

```text
~/Documents/
├── Obsidian Vault/           # 主要记忆库（用户偏好、项目决策、技术积累）
├── Blog Archive/             # 博客原文归档（82篇，用于文风分析）
└── Writer's Studio/          # 写作工作区（句式库、话题库、创作草稿）
```

博客归档和写作工作区是两个独立的 vault：

- **Blog Archive**：只读，GitHub 每周同步一次新文章，不主动修改
- **Writer's Studio**：增量积累，文风画像、句式库、话题库都在这里

两个 vault 共享同一套 `mem.py` CLI，切换只需 `--vault blog-archive` 或 `--vault blog-writer`。

## 定时任务

| 任务                     | 频率    | 内容                              |
| ------------------------ | ------- | --------------------------------- |
| `obsidian-memory-review` | 每 12h  | orphans 发现 + 遗忘曲线复习       |
| `blog-archive-sync`      | 每天    | 同步 GitHub 新文章到 Blog Archive |
| `writer-style-refresh`   | 每月1日 | 重新跑全量文风分析，更新风格手册  |

## 什么时候不用这套

这套方案不适合：

- **超大规模文档库**（百万级文档请用 RAG）
- **纯代码搜索场景**（用 Sourcegraph 而不是笔记）
- **需要语义推理的隐式关联发现**（GraphRAG 更强）

适合的是：**个人知识管理、需要人工干预、强调可解释性、不想运维向量数据库。**
