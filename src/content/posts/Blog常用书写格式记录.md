---
title: Blog常用书写格式记录
description: 部分内容只适用于本博客
categories:
  - 博客
tags:
  - 笔记
  - 博客
column: 博客
cover:
status: false
date: 2025-04-23 00:47
updated: 2026-01-15 23:59
slug: '303355'
pinned: true
---

## 标注

一个合适的标注可以吸引读者注意，给予更好的阅读体验

由于笔者本身使用 Obsidian 进行本地书写，而 Fuwari 自带的样式没有做到很好的兼容，我尝试修改一番后也没有很好的效果，然后找到了 [rehype-callout](https://github.com/lin-stephanie/rehype-callouts)，这是一个现成的插件，支持 github、obsidian 等样式和写法，算是完美解决了我的问题。

```markdown title="参考于Github"
> [!NOTE]  
> 强调用户在浏览时应考虑的信息。

> [!TIP]
> 可选信息，可帮助用户更成功。

> [!IMPORTANT]  
> 用户成功所必需的关键信息。

> [!WARNING]  
> 由于潜在风险，需要用户立即注意的关键内容。

> [!CAUTION]
> 行动的负面潜在后果。
```

**示例**

> [!NOTE]
> 强调用户在浏览时应考虑的信息。

> [!TIP]
> 可选信息，可帮助用户更成功。

> [!IMPORTANT]
> 用户成功所必需的关键信息。

> [!WARNING]
> 由于潜在风险，需要用户立即注意的关键内容。

> [!CAUTION]
> 行动的负面潜在后果。

---

### 自定义标题

可以在 callout 类型后添加自定义标题，格式为 `> [!类型] 自定义标题`：

```markdown
> [!NOTE] 关于标注的说明
> 这是一个带自定义标题的 NOTE 标注，标题会显示在图标右侧。

> [!TIP] 高效使用技巧
> 自定义标题可以让标注更具针对性，方便快速识别内容主题。

> [!WARNING] 数据备份提醒
> 请定期备份你的 Obsidian 库，避免数据丢失。
```

**示例效果**

> [!NOTE] 关于标注的说明
> 这是一个带自定义标题的 NOTE 标注，标题会显示在图标右侧。

> [!TIP] 高效使用技巧
> 自定义标题可以让标注更具针对性，方便快速识别内容主题。

> [!WARNING] 数据备份提醒
> 请定期备份你的 Obsidian 库，避免数据丢失。

#### 可折叠的 Callout

通过添加 `-` 参数实现折叠功能，默认折叠状态；添加 `+` 可默认展开：

```markdown
# 默认折叠（需点击展开）

> [!IMPORTANT]- 折叠的重要信息
> 点击标题可展开/折叠内容，适合内容较长的标注，减少视觉干扰。
>
> - 列表项 1
> - 列表项 2
> - 列表项 3

# 默认展开（可手动折叠）

> [!CAUTION]+ 可折叠的警告
> 这是默认展开的折叠标注，包含多行内容时非常实用：
>
> 1. 第一步操作
> 2. 第二步操作
> 3. 注意事项：操作前请确认数据无误
```

**示例效果**：

> [!IMPORTANT]- 折叠的重要信息  
> 点击标题可展开 / 折叠内容，适合内容较长的标注，减少视觉干扰。
>
> - 列表项 1
> - 列表项 2
> - 列表项 3

> [!CAUTION]+ 可折叠的警告  
> 这是默认展开的折叠标注，包含多行内容时非常实用：
>
> 1. 第一步操作
> 2. 第二步操作
> 3. 注意事项：操作前请确认数据无误

---

## 代码块

通过安装 [Expressive Code](https://expressive-code.com/installation/#astro) 增强 Astro 的代码块，拥有更多主题样式，使用 [expressive-code-file-icons](https://github.com/xt0rted/expressive-code-file-icons) 可以为不同类型的代码块加上图标。更多写法可以参考官方文档，不多做展示：

```python
a = 1
b = 2
print(a+b)
```

也可以带标题

```python title="测试"
a = 1
b = 2
print(a+b)
```

## 音乐卡片

根据 remark 写的卡片，支持外部音乐链接。没有使用 meetingjs，因为我不相信国内的音乐平台，还有很多的歌曲需要版权，索性使用自己的云盘咯

```text
::music{title="晴天" author="周杰伦" url=" https://openlist.blueke.top/d/115%E7%BD%91%E7%9B%98/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6/03.%20%E6%99%B4%E5%A4%A9.flac?sign=pCKUnc6dsm61PHHHVdBEGJtTaf57h3B_SUwtqCKRADY=:0" }
```

示例：

::music{title="晴天" author="周杰伦" url=" https://openlist.blueke.top/d/115%E7%BD%91%E7%9B%98/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6/03.%20%E6%99%B4%E5%A4%A9.flac?sign=pCKUnc6dsm61PHHHVdBEGJtTaf57h3B_SUwtqCKRADY=:0"}

## 不同尺寸的插图

适配了 obsidian 的写法 , `|` 后添加数字可以规定图片的大小

```text
![乌贼 | 800](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/%E4%B9%8C%E8%B4%BC.webp)
```

示例：

![普拉娜 | 600](./附件/Blog常用书写格式记录/Blog常用书写格式记录.webp)

![乌贼 | 450](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/%E4%B9%8C%E8%B4%BC.webp)

![普拉娜 | 300](./附件/Blog常用书写格式记录/Blog常用书写格式记录.webp)

![乌贼 | 150](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/%E4%B9%8C%E8%B4%BC.webp)
