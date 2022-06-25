---
layout: resume
title: Resume
---

## 张楠

---

Email zhangn661@gmail.com

---

## Education

2013-2017
: **BSc, 海洋科学**; [中山大学](https://www.sysu.edu.cn/)

## Career

2018.01 - 2019.06
: **Software Engineer**; [BGI](https://www.genomics.cn/)

2019.06 - now
: **Software Engineer**; [Xtalpi](https://www.xtalpi.com/zh-hans/)

## Experience

### 分子通用力场应用后台

2019.06-2020.06
分子通用力场是分子内与分子间的相互作用描述，后端应用承担能量计算任务提交到基础计算平台与力场拟合

- 负责项目力场数据存储格式改造
- 负责任务提交 API 开发

### 自由能计算应用后台

2020.06 -
自由能计算应用后台，主要承担对任务结果回收和解析

- 后台定时任务，回收解析任务结果
- 提供 JSONRPC-like API，支持持续发布输入校验算法

### 药物管线管理平台

2020.08 -
药物管线管理平台主要承担复杂的药物研发项目管理。

- 负责模型设计，基于药物研发里程碑与研发迭代周期分子推进业务，设计 Assignment 模块，支持分子 DMTA 周期任务分配流程
- 负责技术选型工作，demo 阶段选用 Django + Django RestFramework 组合，快速实现基于模型的 Rest API，验证功能与需求
- 调研多种权限管理模型与框架，使用 RBAC 模型及 Casbin 框架实现权限管理，以简化用户对权限功能理解，降低权限配置门槛

### 药物分子库

2020.08 -
药物分子库主要承担药物研发业务中，DMTA 全周期的分子数据存储管理，并提供在线分析能力

- 负责数据建模，基于 star-schema，建立分子在不同周期产生的计算评估与实验数据关联关系，以支持不同数据持续上传写入与完整结构化读取。

- 设计元数据模型，支持增删自定义字段，方便用户持续扩展计算实验周期新产生的复杂字段

- 建立统一在线算法服务调用 RPC 应用，标准化在线算法应用服务化建设流程，支持分子在线计算分析，简化算法迭代更新流程，加速算法在线分析应用。

### DMPK 实验管理平台

2022.04 -

DMPK 实验管理平台，主要用于提供 Assay的创建与编辑，并提供 API 给予不同客户端提交 Assay 订单，实验人员完成实验后上传结果并修改订单状态，系统回传 Assay 分析的结果数据。

- 负责模型设计，定义订单商品交付物等模块，基于 DDD 构建模型
- 负责技术选型，Web 框架选用[gin](https://github.com/gin-gonic/gin)，ORM 选用[bun](https://github.com/uptrace/bun)
- 搭建基于 DDD 的工程框架，
- 构建通信方案，拆分控制链路与数据链路，联通[药物分子库](#药物分子库)读取实验结果并解析入库

## Technical Experience

Programming Languages
: **first-lang:** Python
: **second-lang:** Golang

Database
: **Sql** Postgres, Mysql
: **NoSQL** Redis
: **Graph** ArangoDB, Neo4j, Nebula

Message Queue
: **MQ** RabitMQ, Kafka, Pulsar

Distributed System
