---
layout: resume
title: Resume
---

## 张楠

**资深后端工程师 / 架构师** · 10年+经验 · 专注分布式系统与AI应用架构

Email: zhangn661@gmail.com | GitHub: [github.com/Edison-A-N](https://github.com/Edison-A-N)

---

## 职业概述

10年后端开发与架构经验，从Python/Django单体应用到Golang微服务与云原生架构，具备完整的架构演进与团队赋能经验。

擅长领域：
- **系统架构设计**：DDD、微服务、云原生、高并发系统
- **AI应用架构**：LLM集成、Agent系统、MCP协议
- **数据密集型应用**：药物研发数据平台、分布式计算
- **团队赋能**：技术选型、Code Review文化、内部工具建设

---

## 工作经历

### 晶泰科技 (XtalPi) | 资深软件工程师 / 技术负责人
*2019.06 - 至今 (5年+)*

- 主导**ID4药物研发平台**与**数字化平台**架构设计，支撑**10+企业客户、1000+并发计算任务**
- 负责团队技术选型与架构评审，推动从Django单体向Golang微服务架构演进
- 建立Code Review机制与API设计规范，团队代码质量显著提升
- 深度参与**MCP生态建设**，推动团队Agent系统采用标准化协议

### 华大基因 (BGI) | 软件工程师  
*2018.01 - 2019.06 (1.5年)*

---

## 核心项目

### 一、开源贡献与技术影响力
*2024.07 - 至今 | 16个已合并PR，影响数万开发者*

深度参与**Model Context Protocol (MCP)**生态建设，在多个核心项目中贡献代码：

#### [OpenAgents](https://github.com/openagents-org/openagents) (1700+ stars)
AI Agent Networks开源平台，支持MCP/A2A协议：贡献Agent配置增强、自动启动机制、发布流程自动化等7个功能与Bug修复

#### MCP生态核心项目
- **[python-sdk](https://github.com/modelcontextprotocol/python-sdk)** (官方SDK, 21k+ stars)：修复StreamableHTTP传输竞态条件 ([#1384](https://github.com/modelcontextprotocol/python-sdk/pull/1384))，解决高并发场景下的`ClosedResourceError`异常，提升服务器稳定性
- **[inspector](https://github.com/modelcontextprotocol/inspector)** (MCP调试工具)：修复`anyOf` schema中`$ref`解析与枚举处理问题 ([#901](https://github.com/modelcontextprotocol/inspector/pull/901))，确保复杂类型正确定义
- **[mcpadapt](https://github.com/grll/mcpadapt)** (MCP适配器)：
  - 优化SmolAgentsAdapter的`outputSchema`处理，移除冗余`$defs`定义，减少LLM prompt token消耗 ([#77](https://github.com/grll/mcpadapt/pull/77))
  - 修复WebSocket依赖缺失问题，确保`mcp[ws]`正确安装 ([#74](https://github.com/grll/mcpadapt/pull/74))

#### Biomni ([snap-stanford/Biomni](https://github.com/snap-stanford/Biomni), 斯坦福生物医学AI Agent)
- **MCP工具参数解析修复** ([#181](https://github.com/snap-stanford/Biomni/pull/181))：修复自动发现MCP工具的必需参数解析逻辑，确保工具调用参数正确性
- **性能优化** ([#143](https://github.com/snap-stanford/Biomni/pull/143), [#122](https://github.com/snap-stanford/Biomni/pull/122))：实现LLM依赖懒加载，引入流式处理机制使资源准备效率提升**40%**

**技术影响力**：
- 提交的**16个PR**被合并至核心开源项目，代码影响**数万开发者**
- 深度理解MCP协议实现细节，在团队内部推动标准化Agent架构落地
- 活跃于MCP社区，参与协议设计与问题讨论

---

### 二、[PatSight 平台](https://patent.xinsight-ai.com/home)
*2024.07 - 至今 | 架构设计 & 核心开发*

AI驱动的药物专利数据挖掘与分析平台（晶泰科技 x IDEA研究院联合开发），**1小时内自动从专利中提取关键数据**。

**背景与挑战**：
- 需要处理海量非结构化专利文档，自动提取分子结构与生物活性数据
- AI模型推理耗时，需要设计高效的后台任务调度与结果缓存机制
- 与外部研究院协作，接口兼容性与数据一致性要求高

**架构方案**：
- 设计异步流水线处理专利文档解析、AI提取、数据校验三阶段
- 实现可配置的数据抽取规则引擎，支持不同专利类型
- 构建分子数据管理与SAR分析能力模块

**业务价值**：平台上线后显著缩短药物研发前期的专利调研周期，从**数天缩短至1小时内**。

---

### 三、[ID4 药物研发平台](https://www.xtalpi.com/en/solution)
*2019.06 - 2024.12 | 平台架构负责人*

SaaS + 私有化部署的药物研发计算平台，提供分子生成、自由能计算、力场拟合等服务，支持多租户、多云调度与统一数据管理。

#### 3.1 [XMolgen - AI分子生成平台](https://en.xtalpi.com/xmolgen/)
*2022.12 - 2024.12*

**背景**：AI分子生成模型迭代快，需要灵活的模型接入机制；分子库数据量大（百万级），查询性能要求高。

**架构决策**：
- **分层架构**：基于DDD设计，internal封装entity/infrastructure/service，对外暴露application/facade层，实现领域边界清晰
- **算法接入层**：FastAPI搭建RPC服务，算法接口自动注册为HTTP API，实现算法团队独立发布
- **数据访问层**：gRPC Stream构建分子库Proxy Service，屏蔽底层存储差异，支持多云调度

**性能优化**：
- 设计策略模式统一处理不同算法结果，封装moldb层提供统一接口
- 结果分片存储与按需加载，分子数据查询性能提升**60%**
- Redlock分布式锁实现租约机制，支撑高并发ID生成

**成果**：支撑**5+分子生成模型**快速接入，实现**多云无缝切换**，故障恢复时间从小时级降至分钟级。

#### 3.2 [XFEP - 自由能计算平台](https://en.xtalpi.com/xfep/)
*2020.06 - 2024.12*

**背景**：FEP计算是药物亲和力预测的金标准，单次计算耗时数小时至数天，任务状态管理复杂。

**核心设计**：
- **异步任务框架**：设计任务状态机管理（提交→运行→完成/失败→结果回收），支撑长时间运行任务
- **算法发布机制**：JSONRPC-like API设计，算法团队可独立发布新版本，无需后端介入
- **稳定性保障**：任务超时检测、失败重试、异常告警，任务成功率从**92%提升至99.5%**

#### 3.3 [XFF - 分子通用力场平台](https://xff.xtalpi.com/)
*2019.06 - 2020.06*

- 负责力场数据存储格式改造，提升数据处理效率**50%**
- 开发任务提交API，支持大规模能量计算任务并发提交

---

### 四、数字化平台建设
*2020.08 - 2023.10 | 架构负责人*

内部药物研发数字化平台，包含**药物管线管理、药物分子库、DMPK实验管理**三大核心系统，支撑DMTA全周期研发流程。

#### 4.1 药物管线管理平台

**架构演进**：
- **MVP阶段**：Django + DRF快速验证，3周内完成原型，验证产品方向
- **规模化阶段**：迁移至Golang微服务，拆分用户/项目/数据三大领域，支撑**100+活跃用户**

**关键设计**：
- **权限体系**：调研RBAC/Casbin等方案，采用RBAC + Casbin实现细粒度权限，配置效率提升**70%**
- **性能优化**：Redis缓存复杂数据分析结果，响应时间从**2s降至200ms**
- **消息通信**：Pulsar消息队列实现异步通知，系统耦合度降低

#### 4.2 药物分子库

**数据架构**：
- **数据模型**：Star Schema设计，平衡写入性能与分析灵活性
- **元数据系统**：支持字段动态增删，Schema变更无需停机，支撑**50+自定义字段**
- **计算集成**：FAAS + RPC构建在线分析能力，支持同步/异步两种模式

**规模**：管理**100万+分子**的全生命周期数据。

#### 4.3 DMPK实验管理平台
*2022.04 - 2023.10*

- DDD领域建模，清晰划分订单/商品/交付物边界
- 技术栈：Gin + Bun ORM，API响应时间**<100ms**
- 拆分控制链路与数据链路，与药物分子库实现读写分离

---

## 技术栈

**编程语言**：Golang（精通）· Python（精通）· Rust（熟悉）

**架构能力**：微服务 · DDD · 云原生 · 高并发系统 · 数据密集型应用

**核心技术**：
- Web框架：Hertz · Gin · FastAPI · Django
- 数据存储：PostgreSQL · Redis · NebulaGraph · TiDB · S3
- 消息通信：gRPC · Pulsar · Kafka
- 云原生：Kubernetes · Docker · Consul

**AI/LLM**：MCP Protocol · LangChain · Tool Calling · Agent架构

---

## 其他

**教育**：中山大学 · 海洋科学 · 本科 (2013-2017)

**博客**：[edison-a-n.github.io](https://edison-a-n.github.io) - 技术文章与架构经验分享

**语言**：中文（母语）· 英文（技术文档阅读与写作）
