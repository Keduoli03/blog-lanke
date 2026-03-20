---
title: Python
description: 摘要
categories:
  - 大杂烩
tags:
  - 大杂烩
column:
cover:
draft: true
unlisted: true
pinned: false
aiSummary: true
outdate: true
date: 2026-03-09 15:16
updated: 2026-03-09 15:17
---

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("函数执行前的一些操作")
        result = func(*args, **kwargs)
        print("函数执行后的一些操作")
        return result
    return wrapper

@my_decorator
def say_hello(name):
    print(f"Hello, {name}!")

# 使用装饰器
say_hello("Alice")
```

**输出结果：**

```python
函数执行前的一些操作
Hello, Alice!
函数执行后的一些操作
```
