---
title: Flutter输入面板布局优化：键盘、表情面板与@联想的丝滑切换
summary: 记录一次 Flutter 评论输入框的布局优化：解决键盘与表情面板切换时的跳动、透明过渡、需要点击两次等问题。
cover: https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/flutter-cover.png
category: Flutter
tags:
  - Flutter
  - 移动端交互
  - 键盘
  - 布局优化
date: 2026-08-03 20:33
updated: 2026-08-03 21:05
slug: flutter-input-panel-smooth-switch
draft: false
aiSummary: true
---

在做评论输入框的时候，我想实现一种比较接近抖音、小红书的交互：点击输入框弹出系统键盘，点击表情后切换成表情面板，点击键盘图标再切回系统键盘。切换过程中，输入框的位置应该保持稳定，不能出现面板先收缩、再弹起，或者后面的内容突然透出来的情况。

这个问题看起来只是一个 `TextField` 加一个 `EmojiPanel`，真正做起来却会同时牵涉到焦点、窗口 inset、`Scaffold` 的自动避让、系统键盘动画和底部安全区。只要其中一个地方多负责了一次布局，体验就会明显变差。

## 最终想要的交互

评论输入框里其实有两类功能，不能把它们混成一种键盘：

- **表情面板**：替代系统键盘，占据系统键盘原本所在的区域。
- **@ 联想选择器**：显示在输入框上方，系统键盘继续保留，用户可以边看候选边继续输入搜索词。

所以最终的结构应该是：

```text
评论输入区域
├── 回复提示
├── @ 联想条（可选，保留系统键盘）
├── 多行输入框
├── 图片 / @ / 表情 / 发送按钮
└── 表情等自定义面板（可选，替代系统键盘）
```

![输入面板的分层结构：@ 联想条、输入框、按钮行与表情面板](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/flutter-layout.png)

这里最重要的判断是：@ 联想条是输入区上方的辅助内容，而表情面板才是“键盘类型”的切换。

## 第一个问题：面板为什么会先收缩再弹起

最初的实现很容易写成这样：

```dart
if (emojiOpen) {
  return EmojiPanel(
    height: MediaQuery.of(context).viewInsets.bottom,
  );
}
```

点击表情的瞬间，系统键盘并不会立刻消失，而是执行一段退场动画。`viewInsets.bottom` 会从键盘高度逐帧下降到 0。如果表情面板直接使用这个值，它也会跟着一起变矮：

```text
键盘 291 → 220 → 120 → 40 → 0
表情 291 → 220 → 120 → 40 → 260
```

最后的 `260` 还是面板自己的最小高度，于是用户看到的就是表情面板先往下缩，再突然撑回来。

正确做法是：在打开自定义面板的那一刻锁定键盘高度，后续键盘退场的 inset 变化不再影响面板尺寸。

```dart
double? _lockedPanelHeight;

final panelHeight = _lockedPanelHeight ??= inputPanelHeight(context);
```

`inputPanelHeight` 在键盘真实存在时读取当前高度，键盘已经收起时才使用历史缓存或兜底高度。这样可以保证表情面板和刚刚显示过的系统键盘高度一致。

## 第二个问题：为什么第一次点击表情会失败

为了处理“面板打开后键盘又自己弹出来”的异常，我增加了一个键盘看守：

```dart
if (panelOpen && insets > 80) {
  onKeyboardAppeared?.call();
}
```

这段逻辑本身是有意义的，但有一个非常隐蔽的时序问题：点击表情后，旧键盘正在退场，`insets` 在前几帧仍然大于 80。于是刚打开的表情面板被误判为“键盘重新出现”，面板立即关闭，用户只能再点一次。

解决方案是给键盘看守增加一个退场过渡状态：

```dart
bool _awaitingKeyboardDismiss = false;
```

从键盘态切到表情面板时，先进入等待状态：

```dart
if (old.panel == null && widget.panel != null) {
  _awaitingKeyboardDismiss = true;
}
```

只有当键盘 inset 真正降到阈值以下，才开始监听键盘是否重新出现：

```dart
if (panelOpen && _awaitingKeyboardDismiss && insets <= 80) {
  _awaitingKeyboardDismiss = false;
}

if (panelOpen && !_awaitingKeyboardDismiss && insets > 80) {
  onKeyboardAppeared?.call();
}
```

这段状态转换可以表示为：

```text
键盘态
  │ 点击表情
  ▼
面板已显示 + 等待旧键盘退场
  │ inset 降到阈值以下
  ▼
稳定面板态 + 开启键盘异常看守
```

![键盘与表情面板切换时的稳定过渡：输入栏位置不随键盘动画抖动](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/flutter-transition.png)

它解决了两个看起来相反的问题：第一次点击表情可以成功，同时也不会丢掉键盘异常重现时的保护逻辑。

## 第三个问题：从表情切回键盘时，为什么会透出后面的内容

从表情面板切回系统键盘时，表情面板会立即移除，但系统键盘需要一段时间才能升起。为了保持输入框位置不动，中间需要保留一块和键盘等高的占位区域。

如果这个占位只是：

```dart
SizedBox(height: gap)
```

它就是透明的。键盘还没有完全升起时，用户就能看到后面的评论列表或页面内容，视觉上像是输入面板破了一块。

占位区域应该使用输入面板的背景色：

```dart
ColoredBox(
  color: AppColors.of(context).surface,
  child: SizedBox(
    width: double.infinity,
    height: gap,
  ),
)
```

浅色主题下它是白色，深色主题下则自动使用深色面板色。这样键盘升起过程中，输入区域仍然是一整块连续的背景。

## 用一个固定高度的宿主管理布局

为了避免聊天、评论、发布页各自处理一套键盘逻辑，我把通用结构抽成了 `InputPanelHost`。它负责四件事：

1. 保存输入框焦点。
2. 计算并锁定系统键盘高度。
3. 用固定高度渲染自定义面板。
4. 管理键盘和面板切换时的底部占位。

核心布局可以抽象成：

```dart
final wantPanel = panelOpen || awaitingKeyboard ? panelHeight : 0.0;
final reserve = keyboardInset > wantPanel
    ? keyboardInset
    : wantPanel;
final filled = panelOpen ? panelHeight : 0.0;
final gap = reserve - filled;

return Column(
  mainAxisSize: MainAxisSize.min,
  children: [
    SafeArea(
      top: false,
      bottom: !panelOpen,
      child: inputBar,
    ),
    if (panelOpen)
      SizedBox(height: panelHeight, child: panel),
    if (gap > 0)
      ColoredBox(
        color: surfaceColor,
        child: SizedBox(
          width: double.infinity,
          height: gap,
        ),
      ),
  ],
);
```

这里的关键不是某个具体组件，而是一个不变量：

> 输入框上方的内容和输入框本身不参与键盘动画；键盘和功能面板只在底部占据同一块空间。

因此，切换功能面板时只替换固定盒子里的内容，盒子的高度不会跟着内容变化。

## 焦点不能用 `unfocus()` 处理

点击表情时，如果直接执行：

```dart
FocusScope.of(context).unfocus();
```

输入框会失去焦点，光标消失。关闭表情面板时再调用 `requestFocus()`，又会和系统键盘的动画、输入连接重建产生竞争，最终经常表现为需要点击两次，或者光标位置发生变化。

这里使用的是：

```dart
Future<void> hideKeyboardKeepFocus() {
  return SystemChannels.textInput.invokeMethod('TextInput.hide');
}

Future<void> showKeyboard() {
  return SystemChannels.textInput.invokeMethod('TextInput.show');
}
```

切到表情时只隐藏系统键盘，不清除输入焦点；切回键盘时显式发送 `TextInput.show`。这样光标一直留在输入框里，表情插入也能继续使用当前光标位置。

## `resizeToAvoidBottomInset` 只能有一个负责人

如果页面使用了 `InputPanelHost`，外层 `Scaffold` 应该关闭自动避让：

```dart
Scaffold(
  resizeToAvoidBottomInset: false,
  body: ...,
)
```

否则会出现两份底部位移：

- `Scaffold` 根据键盘 inset 把 body 顶起一次。
- `InputPanelHost` 又根据键盘或面板高度添加一次占位。

两个组件都认为自己在“保护输入框”，结果就是输入框先跳上去，再被动画拉回来。

同样，底部安全区也只能计算一次。表情面板展开时，底部导航栏区域由表情面板内部的 `SafeArea` 负责；输入栏这一侧不能再次叠加底部安全区。

## @ 联想为什么不应该放进这个面板

@ 选择器和表情面板看起来都是“输入辅助功能”，但它们的空间语义不同。

@ 选择器需要保留系统键盘，因为用户可能会继续搜索昵称；它应该作为输入框上方的一行候选条存在：

```dart
if (_mentionActive)
  MentionPicker(
    query: _mentionQuery,
    onPick: _pickMentionUser,
  ),
```

如果把 @ 选择器也当作自定义键盘来切换，就会收起系统键盘，用户输入搜索词的路径反而变长。未来如果增加投票、图片、位置等真正需要替代键盘的功能，再把它们放进固定高度的功能面板即可。

## 这次优化后的检查清单

以后再做类似输入面板，可以按下面的顺序排查：

- 外层 `Scaffold` 是否设置了 `resizeToAvoidBottomInset: false`。
- 是否使用窗口原始 inset，而不是在被 `Scaffold` 调整过的 body 里读取失真的值。
- 自定义面板是否锁定了打开瞬间的键盘高度。
- 键盘退场期间，是否被错误的“键盘出现”回调关掉。
- 面板切回键盘时，底部过渡占位是否有背景色。
- 输入框和功能面板是否只计算了一次底部安全区。
- 切换面板时是否保留了输入框焦点和光标。
- @ 联想是否保持在输入区上方，并保留系统键盘。

## 最后

这次问题让我意识到，移动端输入框的“丝滑”并不是简单加一个动画。真正决定体验的是布局职责是否清晰：输入框负责编辑，系统键盘负责输入，功能面板负责替代键盘，而过渡占位负责把两套动画之间的空档填完整。

只要把这几块区域放进一个固定的布局模型里，键盘、表情和后续功能就可以稳定切换，不会因为某一帧的 `viewInsets` 变化而让整个页面跟着抖动。
