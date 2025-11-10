---
title: MCP 近期内容分享：从 Resources、Tools 到 Prompts 的实践探索
tags:
  - LLM
  - AI Agent
  - MCP
categories:
  - AI Agent
excerpt: >-
  本文是对近期接触 Model Context Protocol (MCP) 相关知识的分享，涵盖了 Resources、Tools、Prompts
  等核心功能的设计理念、用户交互模型对比，以及在实际应用中的思考与实践。
date: 2025-11-10 00:00:00
---


<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

### 一、Resources、Tools 与 Prompts 的用户交互模型对比

Model Context Protocol (MCP) 中的 Resources、Tools 和 Prompts 三种功能在设计理念和用户交互模型上存在显著差异。基于[MCP官方文档](https://modelcontextprotocol.io/specification/2025-06-18/)的规范，以下是三种功能的详细对比：

| 维度 | Resources（资源） | Tools（工具） | Prompts（提示） |
|------|------------------|--------------|----------------|
| **控制方式** | 应用程序驱动（Application-driven）<br>[参考文档](https://modelcontextprotocol.io/specification/2025-06-18/server/resources#user-interaction-model) | 模型控制（Model-controlled）<br>[参考文档](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#user-interaction-model) | 用户控制（User-controlled）<br>[参考文档](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts#user-interaction-model) |
| **用户交互模型描述** | 资源设计为应用程序驱动，主机应用程序根据需要决定如何整合上下文。应用程序可以：<br>• 通过 UI 元素以树状或列表视图显式选择资源<br>• 允许用户搜索和过滤可用资源<br>• 基于启发式或 AI 模型的选择实现自动上下文包含 | 工具设计为模型控制，语言模型可以根据其上下文理解和用户的提示自动发现和调用工具。协议本身不强制任何特定的用户交互模型。 | 提示从服务器暴露给客户端，用户可以明确选择使用。通常通过用户界面中的用户发起命令触发，允许用户自然地发现和调用可用的提示。 |
| **典型交互方式** | • 树状或列表视图选择<br>• 搜索和过滤<br>• 自动上下文包含 | • 模型自动发现和调用<br>• 基于上下文理解自动执行 | • 用户发起的命令（如斜杠命令）<br>• 明确的用户选择<br>• 自然发现和调用 |
| **控制权归属** | 应用程序决定如何整合和使用资源 | AI 模型自动发现和调用，但需要人工确认 | 用户完全控制何时使用 |
| **交互主动性** | 被动提供，由应用程序主动选择 | 主动执行，由模型根据上下文自动调用 | 被动等待，由用户主动触发 |
| **安全机制** | 通过 URI 验证和访问控制保障安全<br>• 服务器必须验证所有资源 URI<br>• 对敏感资源实施访问控制 | 必须有人工确认环节，防止恶意或意外操作<br>• 提供清晰的工具暴露 UI<br>• 工具调用时插入视觉指示器<br>• 对操作提供确认提示 | 用户完全控制何时使用提示，风险相对较低 |

#### 设计理念的启示

这三种不同的交互模型反映了 MCP 协议在不同场景下的设计考量：

- **Resources** 强调应用程序的灵活性和上下文管理能力
- **Tools** 强调 AI 模型的自主性和执行能力，但必须保证安全可控
- **Prompts** 强调用户的主动性和控制权

这种分层设计使得 MCP 能够同时支持自动化 AI 代理和人工辅助的交互模式，为不同类型的应用场景提供了灵活的实现方案。

### 二、Code Execution with MCP：协议应用的子集与限制

在实际应用中，`code-execution-with-mcp` 这类实践可以视为 MCP 协议应用的一个**子集**，它在某些场景下会呈现出与标准 MCP 协议不同的特征和限制。参考 [Anthropic 的 Code Execution with MCP 实践](https://www.anthropic.com/engineering/code-execution-with-mcp)。

#### 子集特性：类似 RESTful 的请求处理

`code-execution-with-mcp` 的实现往往更倾向于处理类似 RESTful API 的请求模式：

- **请求-响应模式**：主要关注工具调用的请求和响应，而非完整的 MCP 协议能力
- **简化的交互**：可能只实现了 MCP 协议中的部分功能，特别是 Tools 相关的功能
- **API 化倾向**：将 MCP 工具调用抽象为类似 RESTful 接口的调用方式

这种实现方式虽然能够满足代码执行等特定场景的需求，但可能会丢失 MCP 协议的一些核心优势。

#### `_meta` 能力的潜在丢失

根据 [MCP 协议规范](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#_meta)，`_meta` 属性允许客户端和服务器在交互中附加额外的元数据：

- **协议级元数据**：某些键名被 MCP 保留用于协议级元数据
- **自定义元数据**：实现可以添加特定用途的元数据，遵循命名规范
- **扩展性**：`_meta` 机制为协议提供了良好的扩展能力

在 `code-execution-with-mcp` 这类子集实现中，`_meta` 的能力可能会丢失，原因包括：

1. **简化实现**：为了快速实现代码执行功能，可能跳过了 `_meta` 的支持
2. **协议理解不足**：对 MCP 协议的完整理解不够深入，只关注核心功能
3. **工具链限制**：使用的工具链或框架可能不支持 `_meta` 的传递和处理

#### `_meta` 在实际应用中的丰富用途

`_meta` 不仅仅是简单的元数据容器，在实际生产环境中承载着重要的功能配置。以 [OpenAI Apps SDK](https://developers.openai.com/apps-sdk/build/mcp-server#describe-your-tools) 为例，`_meta` 被广泛用于：

- **UI 组件关联**：`_meta["openai/outputTemplate"]` 将工具与 HTML UI 模板关联，实现富交互界面
- **组件工具访问控制**：`_meta["openai/widgetAccessible"]` 允许组件内部发起工具调用
- **安全策略配置**：`_meta["openai/widgetCSP"]` 定义内容安全策略，控制组件的外部资源访问
- **用户体验优化**：`_meta["openai/toolInvocation/invoking"]` 和 `_meta["openai/toolInvocation/invoked"]` 提供工具调用时的状态提示
- **本地化支持**：`_meta["openai/locale"]` 支持多语言和区域化内容
- **客户端上下文**：`_meta["openai/userAgent"]` 和 `_meta["openai/userLocation"]` 提供客户端环境信息
- **组件描述**：`_meta["openai/widgetDescription"]` 帮助模型理解组件功能，避免冗余响应

这些 `_meta` 字段在实际应用中发挥着关键作用，但在 `code-execution-with-mcp` 这类简化实现中，这些高级功能往往被忽略，导致：

- **UI 交互能力受限**：无法实现丰富的组件化界面
- **安全策略缺失**：缺少细粒度的安全控制机制
- **用户体验下降**：缺少状态提示和本地化支持
- **功能扩展困难**：无法利用 `_meta` 的扩展性实现定制化功能

#### 实践建议

在使用 `code-execution-with-mcp` 这类实现时，需要注意：

- **明确使用场景**：理解这是 MCP 协议的子集应用，而非完整实现
- **评估功能损失**：评估丢失 `_meta` 等能力对实际应用的影响
- **主动检查能力**：需要主动检查 MCP server 的能力声明，甚至 tool 的 `_meta` 信息等，确认该 tool 是否适合按照 `code-execution-with-mcp` 的实现方式执行。并非所有 tool 都适合这种简化的执行模式
- **保留原有方案**：原本的大模型 call tool 的方案很可能还需要继续保留，作为 fallback 或用于处理不适合 `code-execution-with-mcp` 模式的 tool
- **考虑升级路径**：如果未来需要更完整的 MCP 能力，考虑向标准实现迁移

这种子集实现虽然有其适用场景，但在设计系统架构时，应该充分理解其与完整 MCP 协议的差异，以便做出合适的技术选择。在实际应用中，可能需要同时支持两种执行模式，根据 tool 的特性和能力声明动态选择合适的执行方式。

### 三、OpenAI Apps SDK：Resource + `_meta` 实现 UI 组件渲染

[OpenAI Apps SDK](https://developers.openai.com/apps-sdk/build/mcp-server#describe-your-tools) 通过 **Resource + `_meta`** 的组合方式，实现了在 ChatGPT 应用中渲染 MCP server 提供的 UI 组件。这种设计巧妙地利用了 MCP 的 Resource 机制来承载 UI 组件，通过 `_meta` 来配置组件的行为和属性。

#### 工作机制

1. **注册 UI 模板资源**：MCP server 通过 `registerResource` 注册一个 HTML 资源，其 `mimeType` 为 `text/html+skybridge`，资源 URI（如 `ui://widget/kanban-board.html`）成为组件的唯一标识符

2. **工具关联模板**：在 tool 的 descriptor 中，通过 `_meta["openai/outputTemplate"]` 将工具与资源 URI 关联，告诉 ChatGPT 当该工具被调用时应该渲染哪个 UI 组件

3. **数据注入**：工具返回的 `structuredContent` 会被 ChatGPT 注入到 iframe 中，作为 `window.openai.toolOutput` 供组件使用

4. **元数据配置**：通过 `_meta` 配置组件的各种属性：
   - `openai/widgetCSP`：定义内容安全策略
   - `openai/widgetDomain`：配置组件子域名
   - `openai/widgetAccessible`：允许组件内部发起工具调用
   - `openai/widgetDescription`：帮助模型理解组件功能


#### 补充阅读

**MCP 协议的分裂风险**

[grapeot 的文章](https://grapeot.me/mcp-revisited.html)从另一个角度讨论了**协议分裂的风险**：[OpenAI Apps SDK](https://developers.openai.com/apps-sdk) 通过 `_meta` 域创建了私有扩展（`openai/*` 命名空间），这可能导致 MCP 协议出现类似 SQL dialect 的分裂。

**MCP 忽视 40 年 RPC 最佳实践的风险**

[Julien Simon 的文章](https://julsimon.medium.com/why-mcps-disregard-for-40-years-of-rpc-best-practices-will-burn-enterprises-8ef85ce5bc9b)深入分析了 MCP 协议在企业级应用中的潜在风险。文章指出，虽然 MCP 的简洁性加速了采用，但它系统性地忽视了分布式系统领域 40 年来的经验教训，包括类型安全、分布式追踪、服务发现、版本管理等关键能力。这些缺失可能导致企业在生产环境中面临调试困难、成本归因危机、安全漏洞等严重问题。文章强调，MCP 需要从 UNIX RPC、CORBA、REST、SOAP、gRPC 等历史协议中学习，才能真正满足企业级部署的需求。