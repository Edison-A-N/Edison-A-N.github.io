---
layout: post
title: Django Restful Framework Business Logic
author: Edison
date: 2021-03-30
---

### Django Restful Framework Business Logic 
#### Django Restful Framework 
- Restful API
Django Restful Framework 提供了非常便利的方法序列化Restful API，并且提供了统一的数据返回格式（包括错误返回）。
- Serializer
Serializer 提供了数据序列化反序列的操作，并承担了validation的工作，validator有内置，也可以自主添加。

#### 局限性
我们在使用中也发现了一些局限性。这些局限，根本上是因为框架是基于Model去设计的。当我们遇到API由多个不同的Django Model组成数据的时候，就会遇到限制。当AP
- Writtable Nested SerializerI的输入输出由多个Django Model组成时，我们无法写入nested serializer。如果是一个relation field，当指定```source```的时候，我们会发现，由于```set_value```是字典嵌套赋值操作，该field作为入参没有办法被成功```set_value```。为了在执行```serializer.save()```的时候能够顺利存储多个Django Model，我们不得不修改serializer的```create```和```update```操作。而这破坏了前述serializer所提供的能力。

#### 解决方案

- 使用宽表

对于需要在一个```serializer```进行读写的数据，本质上也说明了该数据集很有可能属于同一个领域模型。对于一个模型，我们可以使用一张表存下它。如果模型包含的字段较多，我们可以使用宽表。

宽表在OLTP场景中，可能会带来写入性能的影响。我们需要权衡的是，我们的业务量是否会因此而带来性能影响。对于小型业务，这是一个不错的考虑。

使用宽表还有另一个问题，就是migration会不断在同一张表上进行，随着数据量增加，可能会对migration的性能带来不良影响。同样的，在小型业务中，这些问题仍然不会很显著。当我们遇到性能问题的时候，很可能表结构已经因为业务发展做了拆分了。

- 使用service层

使用service层，是将view与model隔离的一种好方法。将大量复杂的业务逻辑封装在service层中，在view层为业务提供适配的API，并引入各种权限校验等通用逻辑，在model层独立设计模型及其关系，由service层将两者串联起来。

service层像是设计模式中的适配器，当model设计与前端的model不完全一致的时候，service充当适配器的效果，将两者串联起来。

service的引入会带来代码的开发，增加开发成本，当然也相应会带来不稳定的因素。

#### 框架只是解决一部分问题

使用DRF框架显然可以快速的开发一个restful的应用，在业务逻辑非常简单的时候（常规的CRUD居多），完成一个项目的开发可能只需要一两天的时间。而我们在实际使用中也发现框架对读取数据及其关联数据的能力非常强大，相对的写入关联数据的支持非常少。这个在官方文档中关于```writtable nested serializer```的描述就很显见了，在```ListSerializer```的```update```方法也提到需要由开发者自行编写。这其实是框架设计团队的权衡与取舍，毕竟写入的逻辑通常很复杂，由用户定义会比提供一套内置方法更加有价值。在各类社区中，有很多开发者也分享了写入场景及写入方法的代码。

框架中还出现了同一个方法的输入不一致等问题。比如对于```ListSerializer```的```to_representation```方法，输入的```data```是一个```Database Manager```，而对于字段类型的```Serializer```，则是对应的```value```。

这些问题都说明了，框架只能解决一部分的问题，框架也只想解决一部分的问题。框架提供了某一类非常方便的接口，其内部封装则是非常复杂的，这些封装在经过充分测试之后通常会变得稳定，尽管里面仍可能存在不好理解的地方。

因此，我们使用DRF的时候，如果可以充分利用其能力，达到低代码高稳定的效果，则尽管使用。但是，我们也不需要被```serializer```的设计框住，自定义必须的service来处理业务逻辑，反而可以使整个业务逻辑更清晰，更具备可测试性与可维护性。
