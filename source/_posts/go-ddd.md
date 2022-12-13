---
title: go-ddd
tags: DDD
date: 2022-12-13 14:43:04
---


# 基于 `internal` 规划工程目录

[Go internal package design](https://docs.google.com/document/d/1e8kOo3r51b2BWtTs_1uADIA5djfXhPT36s6eHVRIvaU/edit)介绍了设计的原因

> Go encourages structuring a program as a collection of packages interacting using exported APIs. However, all packages can be imported. This creates a tension when implementing a library or command: it may grow large enough to structure as multiple packages, but splitting it would export the API used in those additional packages to the world. Being able to create packages with restricted visibility would eliminate this tension.

一个大的 `GO` 工程自然会含有大量的模块，我们会从拆分不同的 `.go` 文件到拆分不同的 `package`。一旦拆多个 `package` 就会遇到不得不把一些 `API` 和 `struct` 暴露出去的需求。`internal` 很好的解决了必须拆分 `package` 但是又希望相关的 `package` 只在当前工程中应用的问题。

基于这样的设计，我们可以将一个 `Domain Context` 目录设计成如下的样子

```bash
- module
|- internal
   |- domain
      |- entity
      |- value_obj
      |- repo
      |- service
|- facade
|- app
|- utils
|- ...
```

## **app**

`app` 即`应用服务`，在 `DDD` 中是编排`领域对象`和`领域服务`的模块。在实现中，通常是负责实现 `HTTP框架` 的对应 `Handler`

# DTO、PO 与 Entity

## **DTO**

`DTO` 通常指的是请求传入 `app` 的数据，在[序列化反序列化 - 美团](https://tech.meituan.com/2015/02/26/serialization-vs-deserialization.html)中介绍了分层与实现。在 `WEB API` 中通常使用 `Rest` 风格，配合使用的是 `json` 进行序列化。而 `RPC` 风格的 `API` 则除了 `json` 外，也会使用 `protobuf` 等进行序列化。

## **PO**

`PO` 也是 `MVC` 常遇到的数据对象，英文是 `Persistent Object`。一般是在与数据库（MySQL 或者 MongoDB）交互的数据对象，会作为数据库模型的数据映射。

数据映射，一般有两种形式：

- **[Active Record](https://en.wikipedia.org/wiki/Active_record_pattern)**: 包含了数据和数据处理方法
- **[Data Mapper](https://en.wikipedia.org/wiki/Data_mapper_pattern)**: 仅取出数据，并在内存模型中存储数据

**本质上是将数据序列化封装在`ORM`库中**

## 实现

- 通常，`DTO` 需要重新定义 `struct`，对于使用 `json` 进行序列化的实现，则需在实现 `Request` 来做请求数据的 binding 与 validation。对于使用 `protobuf` 进行序列化的实现，则代码生成工具会帮助生成对应的对象。
- `Entity` 是领域中流转的对象，需要尽可能保持自身的独立。
- `PO` 一般仅在 `Repo` 中使用，根据 `Repo` 使用的 `ORM` 做设计。对于直接由 `Entity` 映射的数据模型，则可以使用 _结构体组合(此时，`Entity` 通常也需要定义一些 `ORM` 需要的 `tag`)_ 。复杂的 `PO` 需要重新定义并转化。
