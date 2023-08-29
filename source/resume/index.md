---
layout: resume
title: Resume
---

## 张楠

---

Email zhangn661@gmail.com

## Education

---

2013-2017

: **本科, 海洋科学**; [中山大学](https://www.sysu.edu.cn/)

## Career

---

2018.01 - 2019.06

: **Software Engineer**; [BGI](https://www.genomics.cn/)

2019.06 - now

: **Software Engineer**; [Xtalpi](https://www.xtalpi.com/zh-hans/)

## Personal Advantage

---

1. 熟悉 Golang 与 python ，了解 Rust
2. 熟悉 Postgres、Redis 数据库，S3 存储、Pulsar 等消息中间件
3. 了解分布式系统、数据密集型应用架构设计
4. 了解 Kubernetes

## Experience

---

### ID4 药物研发平台

### 分子生成应用后台

2022.12 -

分子生成应用支持选择不同类型的分子生成模型，配置参数并提交计算任务; 对结果进行迭代分析，并支持进行同步与异步分析任务

1. 基于 DDD 设计代码架构，将 entity、infrastructure、service 封装在 internal 中，并对外提供 application 与 facade 以支持其他子域与 HTTP 请求访问, 基于[Hertz](https://github.com/cloudwego/hertz)构建应用
2. 基于 FastAPI 搭建 短时计算 RPC 服务，支持算法接口自动注册为 HTTP API ，便捷算法发布与客户端调用
3. 基于 GRPC Stream 搭建分子库 Proxy Service ，支持多云调度的计算任务与业务 Service 读写分子库数据
4. 结果回收处理：
   - 封装了`moldb`层，提供简单的`Add`、`Get`、`Index` API 支持查询，将结果 dump 成多个文件，支持读取；
   - 封装`handle`层，集成多个`moldb`，支持构建出客户端欲查询的结果；
   - 基于策略模式回收不同算法结果，并转换成不同数据格式供客户端读取；
   - 基于 redlock 的租约设计，支持对 id 生成，分子名生成的并发处理；

### 自由能计算(FEP)应用后台

2020.06 -

自由能计算应用后台，主要承担对任务结果回收和解析

1. 后台定时任务，回收解析任务结果
2. 提供 JSONRPC-like API，支持持续发布输入校验算法

### 分子通用力场应用后台

2019.06 - 2020.06

分子通用力场是分子内与分子间的相互作用描述，后端应用承担能量计算任务提交到基础计算平台与力场拟合

1. 负责项目力场数据存储格式改造
2. 负责任务提交 API 开发

### 数字化平台建设

#### 药物管线管理平台

2020.08 -

药物管线管理平台主要承担复杂的药物研发项目管理。

1. 负责模型设计，基于药物研发里程碑与研发迭代周期分子推进业务，设计 Assignment 模块，支持分子 DMTA 周期任务分配流程
2. 负责技术选型工作，demo 阶段选用 Django + Django RestFramework 组合，快速实现基于模型的 Rest API，验证功能与需求
3. 调研多种权限管理模型与框架，使用 RBAC 模型及 Casbin 框架实现权限管理，以简化用户对权限功能理解，降低权限配置门槛
4. 基于 Redis 搭建缓存应用，支持对数据分析结果暂存，维护分析 session ，提升数据分析流畅度
5. 应用 Pulsar 作为 Message Queue ，与自研第三方应用进行数据通信与消息通知，以支持数据推

### 药物分子库

2020.08 -

药物分子库主要承担药物研发业务中，DMTA 全周期的分子数据存储管理，并提供在线分析能力

1. 负责数据建模，基于 star-schema，建立分子在不同周期产生的计算评估与实验数据关联关系，以支持不同数据持续上传写入与完整结构化读取。
2. 设计元数据模型，支持增删自定义字段，方便用户持续扩展计算实验周期新产生的复杂字段，
3. 基于 FAAS、RPC 服务构建计算应用，支持同步与异步计算分析与后台入库

#### DMPK 实验管理平台

2022.04 -

DMPK 实验管理平台，主要用于提供 Assay 的创建与编辑，并提供 API 给予不同客户端提交 Assay 订单，实验人员完成实验后上传结果并修改订单状态，系统回传 Assay 分析的结果数据。

- 负责模型设计，定义订单商品交付物等模块，基于 DDD 构建模型
- 负责技术选型，Web 框架选用[gin](https://github.com/gin-gonic/gin)，ORM 选用[bun](https://github.com/uptrace/bun)
- 搭建基于 DDD 的工程框架，
- 构建通信方案，拆分控制链路与数据链路，联通[药物分子库](#药物分子库)读取实验结果并解析入库

## Technical Experience

---

Programming Languages
: **first-lang:** Python
: **second-lang:** Golang

Database
: **Sql:** Postgres
: **NoSQL:** Redis
: **Graph:** Nebula

Message Queue
: **MQ:** RabitMQ, Kafka, Pulsar

Distributed System
: **APP:** TiDB, Consul
