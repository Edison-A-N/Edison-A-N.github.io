---
title: mvc-and-ddd
date: 2022-05-23 13:10:03
tags: DDD
---


# MVC与DDD比较(2022.05.23)
MVC与DDD其实并不是对立的。在MVC中，我们会在controller中执行一些校验逻辑，包含可能的鉴权、参数校验等。我们也会在view里面实现service，包含各种validator与serializer以及data transfer。

DDD拆解并丰富了MVC中的M，将一些在V中执行的逻辑迁移到M中，由domain model执行model内的业务处理，同时将DTO从M中剥离出来放到infrastructure中，借由其他的设计模式如repository或者CQRS等进行处理。

同时，DDD中依然会有一些业务操作无法在model中完成，这时候，借由domain service和application service来进行处理。其中，domain service执行数据间的判断与操作，application service则负责完整执行需要service与model与infrastructure协同的操作。application service面向client提供完整功能，domain service仅处理model无法承担的业务功能。

其实这两种方式都是对web服务处理业务逻辑的一种抽象，而DDD只是提供我们另一种抽象方式，协助我们更紧凑的封装data model。当然，其代价就是由于严格的分层，造成同样属性的模型重复在request与response序列化、domain model处理以及repository处理中实现。借鉴[Django Rest Framework](https://www.django-rest-framework.org/)中对serializer的设计，我们可以实现通用的从某一个`domain model Entity and ValueObj` generate不同的适配不同module的data model。以减少model重复定义，避免提高维护复杂度

# 参考
[domain service vs application service vs infrastructure service](https://stackoverflow.com/a/2279729)
[uniquevalidation in DDD](https://stackoverflow.com/a/16847409)
[驱动方法不能改变任何事情](https://www.infoq.cn/article/star-driven-approaches)