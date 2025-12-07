---
layout: page
title: About
---

## 张楠

**Software Engineer** | 6+ 年后端开发经验 | 专注 Agent 应用开发

---

### 关于我

拥有丰富的后端系统开发经验，擅长使用 Golang 和 Python 构建分布式、数据密集型应用。目前专注于 Agent 应用开发，在 LLM 应用、工具调用、多 Agent 协作等领域有实践经验。熟悉 DDD 架构设计、微服务架构和云原生技术栈，能够快速构建稳定、可扩展的 Agent 应用系统。

### 教育背景

**2013-2017** | **本科, 海洋科学** | [中山大学](https://www.sysu.edu.cn/)

### 工作经历

**2019.06 - 至今** | **Software Engineer** | [Xtalpi](https://www.xtalpi.com/zh-hans/)

**2018.01 - 2019.06** | **Software Engineer** | [BGI](https://www.genomics.cn/)

### 技术栈

**编程语言**

- **主要语言**: Python, Golang
- **了解**: Rust

**数据库**

- **关系型**: Postgres
- **NoSQL**: Redis
- **图数据库**: Nebula

**消息队列**

- RabbitMQ, Kafka, Pulsar

**分布式系统**

- TiDB, Consul

**其他**

- Kubernetes
- S3 存储
- Agent 框架（LangChain、LangGraph 等）
- MCP 协议

### 主要项目经验

#### 一、开源贡献

**MCP 生态贡献** (2025.07 -)

深度参与 Model Context Protocol (MCP) 生态建设，在多个核心项目中贡献代码：

- **[python-sdk](https://github.com/modelcontextprotocol/python-sdk)** (官方 MCP Python SDK, 20k+ stars): 修复 StreamableHTTP 传输中的竞态条件问题，处理 `ClosedResourceError` ([#1384](https://github.com/modelcontextprotocol/python-sdk/pull/1384)，已合并)；报告并修复 StreamableHTTP GET 请求连接问题
- **[mcpadapt](https://github.com/grll/mcpadapt)**: 修复 `outputSchema` 处理逻辑，优化 LLM prompt token 使用；添加 WebSocket 依赖支持
- **[fastapi_mcp](https://github.com/tadata-org/fastapi_mcp)**: 在 FastAPI 转 MCP 方向进行深入探索与实践，修复循环引用递归、实现 stateless HTTP 传输、集成请求上下文，总结 REST API 转 MCP 的设计思考与实践经验
- **[smolagents](https://github.com/huggingface/smolagents)**: 添加嵌套参数格式化支持
- **[inspector](https://github.com/modelcontextprotocol/inspector)**: 增强 `anyOf` schema 解析和枚举处理

**[Biomni](https://github.com/snap-stanford/Biomni)** (2025.07 - 2025.09)

通用生物医学 AI Agent 项目

- 修复 MCP 工具自动发现中的必需参数解析问题
- 实现依赖懒加载，优化 LLM 依赖导入性能
- 重构资源准备逻辑，引入流式处理机制

#### 二、[PatSight 平台](https://patent.xinsight-ai.com/home) (2024.07 -)

AI 驱动的药物专利数据挖掘与分析平台，由晶泰科技与 IDEA 研究院联合开发，1 小时内自动从专利中提取关键数据，并提供分子数据管理与 SAR 分析能力。

作为主要开发者，负责项目后台架构设计与研发。

#### 三、ID4 药物研发平台 (2019.06 - 2024.12)

SaaS + 私有化部署的药物研发计算平台，提供分子生成、自由能计算、力场拟合等计算服务，支持多租户、多云调度与统一数据管理。

负责平台微服务架构设计与核心服务研发，包括：

- **[XMolgen](https://en.xtalpi.com/xmolgen/)**（AI 分子生成平台）
- **[XFEP](https://en.xtalpi.com/xfep/)**（自由能微扰计算平台）
- **XFF**（专有力场平台）

#### 四、数字化平台建设 (2020.08 - 2023.10)

内部药物研发数字化平台，包含项目管理、数据管理与实验管理三大核心系统，支持 DMTA 全周期研发流程。

负责平台架构设计与核心系统研发，包括药物管线管理平台、药物分子库、DMPK 实验管理平台等。

### 联系方式

**Email**: zhangn661@gmail.com  
**GitHub**: [github.com/Edison-A-N](https://github.com/Edison-A-N)
