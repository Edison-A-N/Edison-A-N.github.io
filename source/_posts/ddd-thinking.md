---
title: ddd-thinking
tags: DDD
date: 2022-06-09 12:26:18
---


### DDD 关键概念
#### Domain 中的概念
##### Context
一个Domain独占一个Context。在Context中完成下述的一系列逻辑。在应用DDD中，最难的一步是，划定Context。将不同Domain的边界准确的描述清楚，对于抽象能力、业务理解准确性与未来预期的判断能力要求极高。边界划定的不好，也将难以保障内聚与耦合的合理性。
##### Aggregate、Entity、Value Object
将三者放在一起，是因为三者是一个包含关系，并对上层提供引用。在这些model中，会提供独占的attribute以及对应的对attribute的访问方法。
##### Service
对于一些无法由一个model完成执行的方法逻辑，可以通过service进行包装。service的设计取舍比较复杂，在[后续章节中详说](#关于domain-service)
##### Event
将Domain Event提前到这个位置提出，是因为，Event Driven模式在越来越的复杂应用中，会被使用。（不复杂的应用，也不建议使用DDD进行建模，增加了过多的实体反而提高了理解成本）。Domain Event主要应用于异步驱动其他Domain执行一些业务处理，其中也会涉及到复杂的事务处理与资源竞争访问的问题。相关话题与Event Driven模式相关，在这里不详述。
##### Factory方法
`Factory`方法用于创建一个对应的model（可能是一个Aggregate、Entity或者Value Object），并执行一些复杂的初始化操作。**`Factory`不用于从`Repository`重建model，重建应该将`Factory`创建的model的引用，作为参数传入`Repository`接口中，执行重建**
##### Repository
`Repository`用于将model写入到数据存储中以及从数据存储中重建model。数据存储可以是sql数据库或nosql数据库以及具有存储能力的MQ以及磁盘系统。`Repository`提供一系列interface来访问数据存储。
- 写入和重建
创建、更新、重建model，都会将model传入`Repository`的`interface`中，**这是因为，`Repository`也是属于Domain，属于Context，所以，Repository需要理解同一个Context中的model包含什么attribute，并将其映射写入到存储中或从存储中重建model。**
- 其他访问数据的方法
list是一个在DDD中没有提到，在实际业务中经常使用的数据访问形式，这一系列扩展的数据访问方法，可以通过扩展`Repository`的`interface`支持Domain的数据访问。

#### 跨Domain的访问

##### Facade接口
使用Facade模式来避免跨Context直接调用内部方法，便于底层model的持续重构。

### 关于domain service
什么样的业务逻辑会放在领域服务中，在DDD中没有具体说，这可能也受限于DDD提出的时代背景。后续的实践者，包括我自己，也只能通过举例来说明。我个人的理解是，对于Web应用中，pagination、validator、permission、serializer等模块，都可以使用service来进行处理。也就是说，service是一个大的package，其中会根据不同domain需求再做复杂的service拆分。这些service通常也是interface模式，传入model的引用执行一些数据处理或校验，并按需返回数据。

### DDD 在不同领域的应用
DDD的提出，是为了解决Web应用开发中出现的大量贫血模型。在前后端分离架构中，后端越来越专注与数据模型与数据处理逻辑的设计与开发，并最终交付Rest API。客户端渲染模式交由前端完成。随着后端数据模型复杂度的提高，原有的M+V模式割裂了数据处理逻辑与数据模型，不利于持续维护和迭代开发。DDD的设计可以将数据与数据处理很好的融合起来，实现了高内聚低耦合。

高内聚低耦合在复杂度高的软件开发中是十分必要的，对于保障软件整体的可维护性与稳定可用有很大价值。**DDD的设计则可用应用在这一系列软件设计中。** 比如，通过对Context-Aggregate-Entity-ValueObj的模型层次设计，让数据模型更好理解，通过Factory方法来维护唯一创建入口让初始化更简单易理解。跨domain使用facade模式进行interface设计，也让模型之间的访问不会产生复杂的耦合。
