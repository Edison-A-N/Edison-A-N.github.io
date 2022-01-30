---
layout: post
title: DRF Exception Handle
author: Edison
date: 2021-07-15
---

持续更新关于python并行计算与异步计算的包，后续再根据篇章拆分。

### Python 并行

#### 并行库
[threading](https://docs.python.org/3/library/threading.html)
[multiprocessing](https://docs.python.org/3/library/multiprocessing.html)

#### multiprocessing 中的一些问题
##### 问题
- [开启子进程的方法与问题](https://docs.python.org/3/library/multiprocessing.html#contexts-and-start-methods)  
    spawn相比fork会更耗时，但是fork在处理一个多线程的进程时可能会陷入死锁等问题。这是由于[fork本身的机制](https://man7.org/linux/man-pages/man2/fork.2.html)造成的。这也使得在使用包的过程中常常遇到一些问题。
- IO问题  
    [fork本身会继承打开文件的描述符](https://man7.org/linux/man-pages/man2/fork.2.html)，所以对于多进程的处理，要留意IO处理带来的不良影响
##### 建议
由于使用多进程更多是因为，CPython本身的GIL造成无法使用多个CPU核，而使用多进程的方式进行处理。所以仅当处理多核计算任务的时候，我们使用multiprocessing，并且尽量让处理内容限定在计算而不包含IO。

### Python 异步
#### gunicorn + gevent
[gunicorn async worker](https://docs.gunicorn.org/en/latest/design.html#async-workers)

### 其他

[Event Loop Wiki](https://en.wikipedia.org/wiki/Event_loop)