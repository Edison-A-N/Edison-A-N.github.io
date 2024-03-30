---
layout: post
title: Graphql and Restful API 
author: Edison
date: 2021-03-21
---

### GraphQL 与 RESTful
#### GraphQL
- 数据一次获取  
数据返回被封装在一个入口，一次请求
- 所见及所得  
想要获取什么数据，就定义相应的查询字段。

#### RESTful
- 明确资源间的关系
- HTTP verb定义对资源的行为

### API设计

对于前后端分离架构，API成为了前后端间数据通信协议。当一个产品经理列出需求之后之后，前后端工程师设计领域模型，抽象需求与原型成为代码可以描述的对象。在实践中发现，大多数前端工程师会对```页面```进行建模，而后端工程师则对```资源```进行建模。于是会发现，前后端工程师对模型的定义会有些差别，即使我们在设计阶段有领域模型设计，我们也无法保障前端工程师能按照领域模型设计组件，这是由页面和UI决定的。

尽管API作为数据通信的协议，往往是由前后端工程师共同约定的，实际情况是，API是前端获取数据的入口，更多的时候更像是后端交付给前端的“产品”。这个时候，前端对获取数据的逻辑设计产生的需求，会转换成对API设计的复杂要求。

当我们使用RESTful style API的时候，我们会需要前端工程师对领域模型也有充分的理解，这在一些团队是不一定可以做得到的。尤其是当页面组件设计需要多个资源的时候，前端工程师不得不

显然，RESTful API 更偏向于后端设计的API，GraphQL则对前端更友好。

如果API作为交付给前端的```产品```，则我们应该让前端工程师调用更方便更易理解，RESTful这类与后端模型相耦的风格则显现不足。通常，RESTful API无法完全由模型推导API，后端还是要修饰API以返回前端友好的数据结构。GraphQL风格则对后端提出更高的要求，包括接口性能和数据拼接等。

### 新的解决方案 BFF
BFF是Backend for Frontend。从实践前后端分离之后，前端工程师更关注单页面应用的设计，而后端工程师则持续深研领域建模。当后端工程师基于模型实现的API不足以满足前端工程师的复杂访问逻辑的时候，我们需要有一个专门为前端应用设计的后端服务，来提供API服务。

#### 优点

**加快前端应用开发**  

前后端分离，要求先完成API设计，再进行前后端开发，可以保证联调前大家都能完成各自大部分代码实现。而现实中，由于花费大量精力定义API文档并不是一种敏捷的模式，所以很难在开发前完成API文档统一设计。同时领域模型会在开发中不断与产品经理讨论而调整，后端工程师在迭代中会不断调整接口返回格式，前端工程师并不愿意在接口不work之前就进入自己的开发（除了一些页面模版）。

因此，BFF可以满足前端自主定义API数据格式，并完成页面设计与开发。待后端接口work之后，再在BFF层对接后端接口汇集数据，实现联调。

NodeJS的出现，更加方便前端工程师实现BFF层。有趣的事，过往只有后端工程师，后来独立出前端工程师只负责前端模块，而现在前端工程师又回到了需要做后端开发的时代。

#### 缺点

**新增一层的复杂度**

- 错误返回无法很好处理
由于很多权限设计汇聚在后端业务逻辑中，当BFF层调用多个接口汇集数据之后在传回前端，此时的错误回传前端会变得复杂

- 错误追踪复杂
当出现页面错误的时候，我们需要多查看一层数据层的调用情况

### 没有银弹

我们在本篇没有关注性能等优势，比如，在HTTP1.1Graph QL性能有优势，而HTTP2支持下RESTful风格多个API并不会有加载问题，当然还有如传输无效数据浪费带宽。我们认为，这些都是可以有应对的方法。

本篇更强调的是前后端协作的问题，以及使用哪一种风格更有利于加快迭代。后续会分享，前后端工程师如何拆解领域模型，并保持在same page。事实上，当前后端对业务理解趋于一致，API的设计也会更易于取得平衡。