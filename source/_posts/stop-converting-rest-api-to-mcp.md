---
title: 停止转换REST API到MCP：设计AI原生接口的正确方式
tags:
  - LLM
  - AI Agent
  - MCP
  - API Design
categories:
  - AI Agent
date: 2025-09-29 00:00:00
excerpt: 本文分析了自动转换REST API到MCP的陷阱和问题，探讨了传统API设计与AI原生接口的根本差异，提出了从代理故事开始设计、遵循单一职责原则等最佳实践，为构建真正适合AI代理的接口提供设计指导。
---

### 为什么开发者想要转换REST API到MCP

随着AI代理的兴起，许多开发者面临一个现实需求：如何让现有的REST API能够被LLM直接使用。这催生了各种自动转换工具，如 [fastapi_mcp](https://github.com/tadata-org/fastapi_mcp) 和 [FastMCP 的 `from_openapi()` 功能](https://gofastmcp.com/integrations/fastapi#mounting-an-mcp-server)，它们基于 OpenAPI 规范自动将 Web API 转换为符合 MCP Tool 规范的接口。

这种转换看似便利，但实际上存在根本性问题。

### 自动转换的陷阱

正如 Jeremiah Lowin 在 [Stop Converting Your REST APIs to MCP](https://www.jlowin.dev/blog/stop-converting-rest-apis-to-mcp) 一文中指出的，"为人类构建的 API 会毒害你的 AI 代理"。自动转换工具虽然方便，但存在以下根本性问题：

#### 1. 上下文污染
- **Token成本**：LLM 必须处理每个工具的名称、描述和参数，每个端点都是需要支付token和延迟成本的税
- **认知负担**：过多的工具选择会淹没LLM的决策能力
- **无关内容干扰**：人类开发者擅长发现并忽略无关内容，但LLM会被过多的选择淹没

#### 2. 原子性反模式
- **昂贵往返**：每个工具调用都是昂贵的往返过程
- **链式调用问题**：强制代理链式调用多个原子调用既缓慢又容易出错
- **状态管理复杂**：多个原子操作之间的状态同步变得困难

#### 3. 选择过载
- **决策瘫痪**：过多的工具选择导致LLM难以做出最优决策
- **性能下降**：选择过载会显著影响响应时间和准确性
- **维护困难**：复杂的工具集合难以维护和调试

### 传统API设计与AI原生接口的根本差异

#### 设计理念的差异

**传统REST API设计**：
- 面向人类开发者
- 强调资源导向
- 支持复杂的查询和过滤
- 提供丰富的元数据

**AI原生MCP接口设计**：
- 面向LLM代理
- 强调任务导向
- 简化输入输出
- 最小化认知负担

#### 交互模式的差异

**人类交互模式**：
- 可以处理复杂的UI交互
- 能够理解上下文和隐含信息
- 可以处理多步骤的复杂流程
- 能够从错误中学习和调整

**AI交互模式**：
- 需要明确的指令和参数
- 依赖结构化的输入输出
- 难以处理复杂的多步骤流程
- 对错误和异常处理要求更高

### 存量API适配的现实挑战

#### 1. 处理逻辑依赖前端交互

大多数传统API设计面向客户端交互，具有以下特点：
- **业务逻辑耦合**：处理逻辑严重依赖前端交互模式，不适合 LLM 直接使用
- **客户端集成复杂**：客户端集成复杂度极高，难以直接交给 LLM 思考并使用
- **缺乏清晰映射**：缺乏清晰的资源-行为映射关系，增加了 LLM 的理解复杂度

#### 2. RESTful设计的一致性问题

即使是公开API，如果无法保证：
- **资源行为分离**：资源(resource)和行为(action)的清晰分离
- **URI设计一致性**：比如 resource/<id>/action与action/resource混用，即使是细微差别也会提高LLM的理解复杂度
- **统一错误处理**：统一的错误处理和状态码机制

都会显著增加LLM理解和使用API的难度，进而造成call API错误。

### 正确的设计方式：从代理故事(Agent Story)开始

#### 1. 引导而非部署

基于 Jeremiah Lowin 的观点，自动转换工具应该遵循以下原则：

- **快速探索**：使用自动转换功能进行快速探索和内部演示
- **不要部署到生产**：避免将转换后的API直接部署到生产环境
- **学习工具**：将转换作为学习和理解现有API的工具

#### 2. 积极策划

将策划作为构建代理的核心部分：

- **创建新版本**：使用转换功能创建新的LLM友好版本
- **重新设计**：基于AI代理的需求重新设计接口
- **优化体验**：专注于提升AI代理的使用体验

#### 3. 从代理故事开始

为关键工作流构建新的最小化MCP服务器：

- **需求驱动**：从代理需求出发而非API规范
- **任务导向**：围绕具体任务设计接口
- **简化设计**：避免过度复杂的功能设计

### 设计AI原生MCP接口的最佳实践

#### 1. 直接构建MCP原生服务

- **避免中间层**：直接构建符合MCP规范的HTTP服务，避免搭建web API再套壳
- **协议层面考虑**：从协议层面考虑LLM的使用模式
- **AI代理优化**：建立专门为AI代理优化的接口设计

#### 2. 持续优化

- **性能监控**：监控接口的使用性能和成功率
- **用户反馈**：收集AI代理使用过程中的反馈
- **迭代改进**：基于使用情况持续优化接口设计

### 结论

AI代理的承诺不仅仅是让现有软件变得"健谈"，而是设计更简洁、更有意图、以机器为先的接口的机会。

**停止转换你的REST API，开始策划它们**：从代理故事(Agent Story)开始，直接构建AI原生的MCP接口，而不是简单地将人类设计的API强加给AI系统。

## 参考资料
1. [Stop Converting Your REST APIs to MCP](https://www.jlowin.dev/blog/stop-converting-rest-apis-to-mcp)
2. [FastMCP FastAPI Integration](https://gofastmcp.com/integrations/fastapi#mounting-an-mcp-server)
3. [fastapi_mcp](https://github.com/tadata-org/fastapi_mcp)
4. [MCP Official Documentation](https://modelcontextprotocol.io/)
