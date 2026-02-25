---
categories:
  - Obsidian
tags:
  - 笔记
  - 博客
cove:
status: true
title: Obsidian拓展
slug: obsidiantuo-zhan
cover: ''
halo:
  site: https://www.blueke.top
  name: 89ce33e0-365c-422c-b39b-73e8adaff2ad
  publish: true
date: 2024-11-17 13:59
updated: 2025-09-13 00:07
description: 最近又对笔记进行了一些优化，目前感觉还可以，简单记录一下。
---

最近又对笔记进行了一些优化，目前感觉还可以，简单记录一下。 ^b9bb4d

## dataview

DataView 是 Obsidian 社区中的热门插件，它为用户提供了一个强大的实时索引和查询引擎。通过在文档中设置属性（或称为元数据），DataView 能够检索并处理这些数据。借助 DataView，用户可以轻松列出、筛选、排序和分组数据，这与使用数据库查询语言类似。

> 首先我们要知道，插件为我们初始化了很多参数，方便我们调用。请先大致浏览下图

![&dataview-参数|475](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/dataview%E9%A2%9D%E5%A4%96%E5%B1%9E%E6%80%A7)

### 展示最近的文件

![&dataview-展示最近文件](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/%26dataview-%E5%B1%95%E7%A4%BA%E6%9C%80%E8%BF%91%E6%96%87%E4%BB%B6.png)

````javascript
;```dataview
table WITHOUT ID tags as "🏷️标签",
file.link as "📜文件",
dateformat(file.ctime,"yyyy年MM月dd日") as 🕕创建日期
from "" and !"笔记模板"
sort file.ctime desc
where type = "编程"
limit 10
```
````

^28840b

这里我选择的是展示标签、文件名以及创建日期，并给列名取了名字。
下面都是非必要的参数：
from 支持检索文件夹和标签。标签要加 `#` 号
sort 排序，支持多种参数，后面跟 `asc` 或者 `desc` 控制升降序，默认升序
where 聚合条件，进行匹配操作。
limit 就是限制展示的长度啦

> 个人实测，where 后和我上面代码一样写 = 号，和 `where contains(type,"编程")` 是一样的效果

添加 CSS 优化，如果你已经粘贴复制了，那么标签一多，表格就会很乱，当然我们可以用 CSS 来控制

````javascript
;```dataview
table WITHOUT ID "<span style='display:flex; justify-content: left;'>"+tags as "🏷️标签",
"<span style='display:flex; justify-content: left;'>"+file.link as "📜文件",
"<span style='display:flex; justify-content: left;'>"+dateformat(file.ctime,"yyyy年MM月dd日") as 🕕创建日期
from "" and -"笔记模板"
sort file.ctime desc
where type = "编程"
limit 10
```
````

我就简单弄了下标签的布局，并都改成左对齐了。你可以自己发挥一下

### 展示含有某个标签的笔记

上面的细化，比如我就只想看数据库标签的笔记

````js
;```dataview
table WITHOUT ID "<span style='display:flex; justify-content: left;'>"+tags as "类型",
file.link as "📜文件",
dateformat(file.ctime,"yyyy年MM月dd日") as 🕕创建日期
from #数据库 
where type = "编程"
```
````

### 展示未完成的笔记

![展示未完成的笔记](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/%E5%B1%95%E7%A4%BA%E6%9C%AA%E5%AE%8C%E6%88%90%E7%9A%84%E7%AC%94%E8%AE%B0.png)
这里其实就是添加了个 status 的属性

````javascript
;```dataview
table WITHOUT ID "<span style='display:flex; justify-content: left;'>"+tags as "🏷️标签",
"<span style='display:flex; justify-content: left;'>"+file.link as "📜文件",
"<span style='display:flex; justify-content: left;'>"+dateformat(file.ctime,"yyyy年MM月dd日") as 🕕创建日期
from !"笔记模板"
sort file.ctime desc
where status = "未完成"
limit 10
```
````

## dataviewjs

dataview 本身是支持 JS 语法拓展的。这里展示一些我使用的例子，具体语法不详细展开。
原贴放到最后

### 展示天数

直接上代码了

```javascript
 今天是 `=dateformat(date(today),"yyyy年M月d日")`，今年还剩 `=(date(2024-12-31)-date(today))`
```

### 展示文件数

![&dataviewjs-展示文件](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/%26dataviewjs-%E5%B1%95%E7%A4%BA%E6%96%87%E4%BB%B6.png)
代码实现：

````js
```dataviewjs
var i = [dv.pages().length,dv.pages(`""`).length,dv.pages(`"日常/博客"`).length,
         dv.pages().file.etags.distinct().length]
dv.paragraph(`总共有 **${i[0]}** 个文件`)
dv.paragraph(`其中==笔记== **${i[1]}** 篇，==博客== **${i[2]}** 篇`)
dv.paragraph(`==标签== **${i[3]}**个`)
```
````

> `dv` 是 dataview 的缩写，也是 JS 的入口。

`dv.pages` 的功能是，你给它一个搜索字段（如文件路径、标签等），会自动返回结果。

> 填写文件夹，它就会把所有符合要求的文件都给你列出来。为空就是展示所有，也可以自己写对应路径，搜索某个子文件夹里的文件数量

> 如果要搜索标签，在其中输入 `#对应标签` 即可

`dv.paragraph` 输出，类似 print 语法，输出结果。

#### 拓展

> 输出的拓展，可以略过

`dv.paragraph` 与 `dv.list()`。这两种都是输出，前者类似 print 语法，输出结果。list 就是以列表形式展示
这样也可以实现展示对应的文件， list 和 paragraph 格式可以直接输出，table 要用别的语法格式

````js
;```dataviewjs
dv.list(dv.pages("#Vue").file.link)
```
````

**table 展示**

````javascript
;```dataviewjs
dv.table(
  ["File", "Status"],
  dv.pages('""')  
  .sort(p => p.status, 'desc')
  .map(p => [p.file.link, p.status])
)
```
````

格式是这样的，列表列名+元素，然后用 map 函数返回。

`dv.current()` 展示当前文件名字

````javascript
;```dataviewjs
dv.paragraph(dv.current().file.name);
```
````

好像不小心多写了很多，因为看了不少资料，就此打住，不多写了。
更具体的请参阅 [DataviewJS - 从入门到退坑 01 - 餐巾纸盒子 - Obsidian Publish](https://publish.obsidian.md/napkinium/Ideas/Dataview/Learnings/DataviewJS+-+%E4%BB%8E%E5%85%A5%E9%97%A8%E5%88%B0%E9%80%80%E5%9D%91+01)

### 展示笔记字数

效果图如下：
![笔记字数](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/%E7%AC%94%E8%AE%B0%E5%AD%97%E6%95%B0.png)
我用的是二改过的，然后自己再修改了一点，加了创建日期。
链接：[点我下载](https://www.123684.com/s/YyUDVv-B1IJA)
**用法**

````javascript
;```dataviewjs
dv.view("笔记模板/字数统计","")
```
````

只要在合适的地方引用即可

## Quick Add

目前我只用到快速创建笔记，更多功能可以看下面的链接，那个博主写的很好。
简单来说就是，你写好模板，然后可以用这个快速创建笔记。
比如我一般写编程时，就用下面的
![[模板举例.png|475]]
这样就不需要自己添加属性值了，笔记也会自动创建在你指定的文件夹中

### 简单实现

首先，我们在插件设置中，写好名字，右侧选择 `template`，模板格式，然后点击 add choice 创建
然后下面是我的一些配置：
![QuickAdd参数配置](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/QuickAdd%E5%8F%82%E6%95%B0%E9%85%8D%E7%BD%AE.png)

template path: 模板地址，我是专门建个文件夹存放的
打开 create in folder 设置，然后根据自己需要，自己每次选择文件夹还是自动放到指定好的文件夹。如果希望自动放到指定文件夹，那下面那一个不能打开。
先点击 folder path 进行文件夹选择，然后点击 add 进行添加
然后就是最后的 open ，开启也是有 split 分栏和 panel 新面板两个选择的，个人习惯推荐 panel

## 原版

### 预览别的笔记

原版除了链接到别的笔记，还支持预览, 效果如下
![原版预览](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/%E5%8E%9F%E7%89%88%E9%A2%84%E8%A7%88.png)

使用也是直接在正常的链接前加个感叹号就可以了，例如 `![[聚沙成塔]]`
那如果我们只想预览一部分，也是可以的，格式就是在上面的基础上, 在文件名后加 `^`, 然后进行选择即可
![[块引用.png]]
在本文中也是可以进行块引用的，直接使用 `^` 选择即可
![[#^28840b | 块引用展示]]

### 快速跳转到笔记的其他标题

比如跳到 dataview，格式为 `[[#dataview]]`，也可以 `[[#dataview | 自定义文本]]` 来修改文本
`[[#^....]]` 来进行文字块的选择，也能快速跳转
例如

- [[#dataview | 来到第一个插件介绍]]
- [[#^b9bb4d| 跳转到顶部]]

## 教程参考

### dataview

1. [obsidian插件之dataview入门 - 经验分享 - Obsidian 中文论坛](https://forum-zh.obsidian.md/t/topic/195)
2. [基于dataviewjs的字数统计功能 - 经验分享 - Obsidian 中文论坛](https://forum-zh.obsidian.md/t/topic/32608)

#### dataviewjs

1. [DataviewJS - 从入门到退坑 01 - 餐巾纸盒子 - Obsidian Publish](https://publish.obsidian.md/napkinium/Ideas/Dataview/Learnings/DataviewJS+-+%E4%BB%8E%E5%85%A5%E9%97%A8%E5%88%B0%E9%80%80%E5%9D%91+01)
2. [Dataviewjs的奇技淫巧 - 经验分享 - Obsidian 中文论坛](https://forum-zh.obsidian.md/t/topic/5954/128)

### Quick Add

1. [Obsidian最强插件：QuickAdd - 少数派](https://sspai.com/post/69375)
