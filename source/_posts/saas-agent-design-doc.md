---
title: SaaS Agent 应该怎么设计：从竞品实践到生产级架构
tags:
  - AI Agent
  - SaaS
  - LLM
  - 系统设计
  - 产品设计
categories:
  - AI Agent
excerpt: >-
  基于 OpenAI、Anthropic、LangGraph、Microsoft Agent Framework、Intercom Fin、Salesforce Agentforce、Zapier Agents、Dify、CrewAI、Relevance AI、Lindy、OpenHands 等公开资料，系统整理 SaaS Agent 的产品边界、技术架构、权限治理、工具调用、审批、评估、可观测性与 MVP 路线图。
date: 2026-05-13 00:00:00
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成，并基于 2025-2026 年公开官方文档、产品资料、开源项目与 SaaS 架构实践整理。文中的竞品拆解仅使用公开信息，不推断未公开内部架构。
</div>

如果要设计一个 **SaaS Agent**，最容易走偏的地方是：一上来就把它理解成“套一个大模型的聊天机器人”。

但从 2025-2026 年主流产品和框架的实践看，真正能进入生产环境的 Agent SaaS，核心并不是“模型多聪明”，而是：

1. 是否能接入真实业务系统；
2. 是否知道自己能做什么、不能做什么；
3. 是否能在高风险动作前暂停并让人审批；
4. 是否能追踪每一次工具调用、决策、失败和成本；
5. 是否能按租户隔离身份、数据、权限、密钥、账单与审计；
6. 是否能被业务团队持续配置、测试、发布、回滚和评估。

一句话总结：**SaaS Agent 不是“会聊天的 AI”，而是“被权限、流程、状态、审计和成本约束住的业务执行系统”。**

这篇文档会从调研结论、竞品实践、推荐架构、关键模块、MVP 路线图和风险清单几个角度系统展开。

> 标注说明：文中涉及外部产品、框架、官方文档或公开 blog 的事实性描述，会在对应段落后用“来源”标注；没有单独标注的架构图、数据模型、checklist 和路线图，主要是基于这些公开资料抽象出的设计建议。

## 一、先给结论：SaaS Agent 的设计原则

### 1. 先 workflow，后 autonomy

生产环境里最稳的设计不是“让 agent 全自动决定一切”，而是：

1. 先把关键业务路径做成显式 workflow；
2. 再把 LLM 放进局部步骤做判断、总结、规划、生成；
3. 再逐步开放工具调用、记忆、专家路由、多 agent 协作；
4. 最后才考虑更高自治程度。

LangGraph、Microsoft Agent Framework、Salesforce Agentforce、Dify、CrewAI 等框架和产品的公开资料，普遍支持类似设计取向：**workflow 负责确定性，LLM 负责不确定性。**（来源：[LangGraph overview](https://docs.langchain.com/oss/python/langgraph)、[Microsoft Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/)、[Salesforce Agentforce hybrid reasoning architecture](https://architect.salesforce.com/docs/architect/fundamentals/guide/hybrid-reasoning-agentforce-builder-agent-script.html)、[Dify Workflow & Chatflow](https://docs.dify.ai/en/use-dify/build/workflow-chatflow)、[CrewAI Docs index](https://docs.crewai.com/llms.txt)）

### 2. LLM 负责判断，系统负责执行

一个生产级 Agent 不能把“模型说要做什么”直接等同于“系统就执行什么”。更合理的分工是：

| 层次 | 适合交给 LLM | 应交给确定性系统 |
| --- | --- | --- |
| 意图理解 | 用户想做什么、缺什么信息 | 认证、租户解析 |
| 规划 | 候选步骤、风险解释 | 流程状态机、超时、重试 |
| 工具选择 | 推荐调用哪个工具 | 工具白名单、权限校验 |
| 参数生成 | 生成草稿参数 | schema 校验、资源权限校验 |
| 执行动作 | 低风险辅助动作 | 写入、删除、付款、发消息、审批 |
| 结果解释 | 总结、解释、建议 | 审计日志、计费、持久化 |

Salesforce Agentforce 的公开架构资料中提出了 hybrid reasoning 思路：能代码化的决策应走确定性逻辑，LLM 负责判断和生成。这个原则对任何 SaaS Agent 都适用。（来源：[Salesforce Agentforce hybrid reasoning architecture](https://architect.salesforce.com/docs/architect/fundamentals/guide/hybrid-reasoning-agentforce-builder-agent-script.html)）

### 3. 多租户边界就是系统边界

SaaS Agent 比普通 Agent 更难，因为每个租户都有自己的：

- 用户与组织；
- 数据与知识库；
- 工具与连接器；
- OAuth token / API key / webhook secret；
- 预算、额度和账单；
- 审计要求与保留策略；
- 合规边界和地区要求。

所以每一次请求、每一次工具调用、每一个后台任务、每一条日志、每一个 trace、每一笔用量都必须带上 `tenant_id`。如果 `tenant_id` 不是一等公民，这个 SaaS Agent 从第一天起就是不安全的。

### 4. 高风险动作默认 human-in-the-loop

Agent 可以帮人起草邮件、查知识库、总结工单、生成 SQL、推荐 CRM 更新，但不应该默认自动执行所有高风险动作。

高风险动作包括：

- 向外部客户发消息；
- 修改 CRM、ERP、财务系统；
- 删除或覆盖数据；
- 创建付款、退款、合同、发票；
- 调整权限、邀请成员、导出数据；
- 调用不可逆第三方 API。

这些动作前面应该有 approval gate。OpenAI、LangGraph、Microsoft 等生态中的暂停、checkpoint 或人工介入机制，本质都在解决同一件事：**让 Agent 可以暂停、解释、等待人类确认，然后再继续。**（来源：[OpenAI Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)、[LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)、[Microsoft Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/)）

### 5. 没有 eval 和 observability，就不要谈生产化

Agent 的质量不能靠感觉判断。至少要能回答：

- 哪些任务成功率下降了？
- 哪些工具最容易失败？
- 哪些租户成本异常？
- 哪个 prompt 版本引入了回归？
- 哪些审批总是被拒绝？
- 哪些 RAG 结果导致了错误答案？
- 哪些 agent 进入了重复循环？

Intercom Fin 的 Simulations / Analyze、LangSmith、OpenAI Traces、CrewAI Traces、Relevance AI 的评估能力、Dify Logs 等公开能力，共同指向一个产品判断：**Agent 产品应该把测试、评估、追踪、监控做成核心能力，而不是上线后再补。**（来源：[Intercom Fin Testing](https://fin.ai/testing)、[Intercom Fin Analyze](https://fin.ai/analyze)、[LangSmith Observability](https://docs.langchain.com/langsmith/observability)、[OpenAI Agent evals](https://developers.openai.com/api/docs/guides/agent-evals)、[CrewAI Docs index](https://docs.crewai.com/llms.txt)、[Dify Workflow & Chatflow](https://docs.dify.ai/en/use-dify/build/workflow-chatflow)）

## 二、别人是怎么做的：主流产品与框架实践

这一节只基于公开文档、产品页面、开发者资料和开源仓库做归纳。下面的“可迁移设计”是从公开能力中抽象出的产品和架构启发，不代表这些厂商的未公开内部实现。

### 1. OpenAI / Anthropic：标准 agent loop 与工具调用

OpenAI 和 Anthropic 的官方文档都把 Agent 执行抽象成类似循环。（来源：[OpenAI Running agents](https://developers.openai.com/api/docs/guides/agents/running-agents)、[Anthropic Claude tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)）

1. 模型读取上下文；
2. 模型决定是否调用工具；
3. 应用执行工具；
4. 工具结果回传给模型；
5. 模型继续判断或输出最终答案。

OpenAI 强调 running agents、handoff、session、trace；Anthropic 强调 tool schema、tool description、`tool_use` / `tool_result`、严格工具参数。（来源：[OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents)、[OpenAI Running agents](https://developers.openai.com/api/docs/guides/agents/running-agents)、[Anthropic Claude tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)）

可迁移到 SaaS Agent 的经验是：

- 工具 schema 要精确，不能只写一句自然语言描述；
- tool description 会显著影响模型调用质量；
- 并行工具调用要谨慎，存在顺序依赖时要显式串行；
- 工具执行层必须由业务系统控制，而不是模型直接访问外部系统；
- trace 要覆盖模型调用、工具调用、handoff、guardrail。

### 2. LangGraph：把 Agent 当成有状态工作流

LangGraph 的重要价值在于，它不是只提供一个“聊天循环”，而是强调以下能力。（来源：[LangGraph overview](https://docs.langchain.com/oss/python/langgraph)、[LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)）

- stateful graph；
- durable execution；
- checkpoint；
- replay / time travel；
- human-in-the-loop；
- memory；
- debugging。

这对 SaaS Agent 非常关键。因为 SaaS Agent 往往不是一次请求就结束，而是会经历：

1. 收到用户任务；
2. 查询数据；
3. 生成计划；
4. 等待审批；
5. 调用第三方 API；
6. 失败重试；
7. 写回结果；
8. 通知用户；
9. 记录审计。

这更像 workflow，而不是普通 HTTP handler。

### 3. Microsoft Agent Framework：企业级 session、memory、workflow、telemetry

Microsoft Agent Framework / Semantic Kernel 的公开资料强调以下企业级 agent 能力。（来源：[Microsoft Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/)）

- agent session；
- context provider；
- workflow；
- checkpointing；
- OpenTelemetry；
- human-in-the-loop；
- memory。

值得借鉴的是：它把 Agent 放在企业系统工程里理解，而不是单独看成模型 API 封装。尤其是 observability 中对敏感数据采集的控制，提醒 SaaS Agent 不能默认把 prompt、response、工具参数全量明文打进日志。

### 4. Intercom Fin：客服 Agent 的“流程 + 测试 + 分析”闭环

Intercom Fin 的公开产品能力里有几个非常值得学习的设计。（来源：[Intercom Fin Procedures](https://fin.ai/procedures)、[Intercom Fin Testing](https://fin.ai/testing)、[Intercom Fin Analyze](https://fin.ai/analyze)、[Intercom Fin Integrations](https://fin.ai/integrations)）

- **Procedures**：用自然语言和条件逻辑描述复杂客服流程；
- **Data Connectors / MCP / API**：连接企业内部数据；
- **Simulations**：上线前做端到端对话测试和回归测试；
- **Analyze / Monitors / Recommendations**：上线后看会话质量、风险和改进建议；
- **Handoff**：复杂或高风险问题升级人工。

它说明客服 Agent 的关键不是“让模型自由聊天”，而是把业务流程、知识、连接器、测试、监控和人工升级组合成闭环。

### 5. Salesforce Agentforce：确定性逻辑与 LLM 推理混合

Salesforce Agentforce 是企业 Agent 设计里非常值得单独研究的案例。它的公开资料反复传递一个信号：**企业 Agent 不能只靠 prompt 驱动，而要把可确定的业务逻辑、权限边界、测试追踪和治理能力产品化。**（来源：[Salesforce Agentforce hybrid reasoning architecture](https://architect.salesforce.com/docs/architect/fundamentals/guide/hybrid-reasoning-agentforce-builder-agent-script.html)、[Salesforce Agent Script](https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html)、[Salesforce Blog - Agent Script control plane](https://www.salesforce.com/blog/agent-script-control-plane/)）

官方 Architect 文档把 Agentforce 的新方向称为 **hybrid reasoning**。它的核心不是让 LLM 自由决定所有步骤，而是把系统拆成两类能力。（来源：[Salesforce Agentforce hybrid reasoning architecture](https://architect.salesforce.com/docs/architect/fundamentals/guide/hybrid-reasoning-agentforce-builder-agent-script.html)）

| 层次 | 适合放在确定性逻辑里 | 适合交给 LLM |
| --- | --- | --- |
| 规则 | 权限、状态、条件分支、字段校验 | 用户意图理解、模糊分类 |
| 流程 | 初始化、前置检查、收尾、失败处理 | 下一步建议、解释原因 |
| 数据 | CRM / Data 360 取数、结构化变量 | 基于上下文生成回复 |
| 动作 | action 调用顺序、审批、guardrail | 参数草稿、自然语言说明 |

Agent Script 是这个设计的关键。公开文档显示，Agent Script 不是普通 prompt 文件，而是把自然语言指令、变量、分支、动作和 reasoning 节点放进一个可执行结构里。Architect 文档进一步说明，Agent Script 会编译成 Agent Graph，由 Atlas Reasoning Engine 在运行时执行；这些公开描述更像“作者层 → 编译产物 → 运行时”的分层，而不是单一聊天循环。（来源：[Salesforce Agent Script](https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html)、[Salesforce Agentforce hybrid reasoning architecture](https://architect.salesforce.com/docs/architect/fundamentals/guide/hybrid-reasoning-agentforce-builder-agent-script.html)、[Salesforce Engineering - Agentforce Agent Graph](https://engineering.salesforce.com/agentforces-agent-graph-toward-guided-determinism-with-hybrid-reasoning/)）

更重要的是，它把“什么时候进入模型推理”变成了显式设计。官方材料里提到 `before_reasoning` / `after_reasoning` 这类确定性执行区，适合放初始化、校验、收尾、状态写入等稳定逻辑；带 prompt 的 reasoning 节点才进入 LLM。这个边界对 SaaS Agent 很关键：**代码决定能不能做、何时做、以什么权限做；模型负责理解、生成和处理模糊性。**（来源：[Salesforce Agentforce hybrid reasoning architecture](https://architect.salesforce.com/docs/architect/fundamentals/guide/hybrid-reasoning-agentforce-builder-agent-script.html)、[Salesforce Developers Blog - Agent Script decoded](https://developer.salesforce.com/blogs/2026/02/agent-script-decoded-intro-to-agent-script-language-fundamentals)）

从 Salesforce blog 和 Engineering 文章看，Agentforce 还在几个生产化方向上持续补强：

- **Testing Center / Testing API / Agentforce DX**：强调上线前的 conversation-level testing、自定义评估、运行历史和测试数据管理，说明 agent 测试不应停留在手工聊天试验（来源：[Salesforce Blog - Agentforce Testing Center](https://www.salesforce.com/blog/agentforce-testing-center/)、[Salesforce Agentforce Testing API](https://developer.salesforce.com/docs/ai/agentforce/guide/testing-api-get-started.html)）；
- **Session Tracing / OTel 导出**：官方开发者文档公开了会话追踪导出能力（Beta），可把 turns、messages、LLM calls、actions、metrics、feedback 等链路数据导出，便于接入外部可观测系统（来源：[Salesforce Agentforce Session Tracing Data Export](https://developer.salesforce.com/docs/ai/agentforce/guide/otel-api.html)）；
- **Trust Layer / Trusted Services / guardrails**：Salesforce 的安全与治理材料强调敏感信息保护、数据访问控制、运行时 guardrail 和可信服务，适合映射到 SaaS Agent 的权限、审计、脱敏和风险控制层（来源：[Salesforce Agentforce agentic patterns](https://architect.salesforce.com/docs/architect/fundamentals/guide/agentic-patterns.html)、[Salesforce Blog - Secure Agentforce with trusted services](https://www.salesforce.com/blog/secure-agentforce-with-trusted-services/)）；
- **CRM / Data 360 grounding**：公开架构资料强调用 live CRM data、Data 360、RAG retrievers 等企业数据源 grounding，而不是把业务事实长期塞进 prompt（来源：[Salesforce Agentforce agentic patterns](https://architect.salesforce.com/docs/architect/fundamentals/guide/agentic-patterns.html)、[Salesforce Blog - Data governance for the agentic era](https://www.salesforce.com/blog/data-governance-for-the-agentic-era/)）；
- **Custom Connections / Agent API / SDK**：Agentforce 同时提供 low-code builder 和 pro-code API / SDK / custom connection，说明企业 Agent 平台通常需要同时服务业务配置者、工程团队和外部应用集成（来源：[Salesforce Agentforce APIs and SDKs](https://developer.salesforce.com/docs/ai/agentforce/guide/get-started-agents.html)、[Salesforce Agentforce Custom Connections](https://developer.salesforce.com/docs/ai/agentforce/guide/custom-connections.html)）；
- **Latency 与平台化工程**：Salesforce Engineering 关于 Agentforce 延迟与企业 agent platform 的文章，至少说明它把 Agent 看成需要专门运行时、性能优化和平台工程支撑的生产系统，而不是一次模型 API 调用（来源：[Salesforce Engineering - Enterprise agent platform](https://engineering.salesforce.com/beyond-crm-how-salesforce-engineered-an-enterprise-agent-platform-for-any-workload/)、[Salesforce Blog - Reducing Agentforce latency](https://www.salesforce.com/blog/agentforce-reducing-latency/)）。

这对 SaaS Agent 的启发是：只给用户一个 prompt 编辑器远远不够。成熟产品通常需要：

1. 面向业务用户的配置界面，让业务规则、流程和知识可以被维护；
2. 面向工程团队的 SDK / API / 测试工具，让 agent 可以进入 CI、灰度、回滚和外部系统集成；
3. 面向管理员的权限、审计、guardrail、数据治理和发布控制；
4. 面向运营团队的 testing、simulation、run history、trace、评估和线上质量分析。

可以把 Agentforce 的公开设计总结成一句话：**它把 Agent 从“prompt 工程”推进到“可治理的业务执行系统”。**

### 6. Zapier Agents：模板、连接器、治理边界

Zapier Agents 的公开资料体现了自动化 SaaS 做 Agent 的优势。（来源：[Zapier Agents](https://zapier.com/agents)、[Zapier Help - Build an agent in Zapier Agents](https://help.zapier.com/hc/en-us/articles/24393442652557-Build-an-agent-in-Zapier-Agents)）

- 大量 app connectors；
- templates；
- command-based execution 和后台自动执行；
- activity monitoring；
- chat when needed；
- web/browser work；
- Agent 与 Chatbot、Automation 的产品边界区分。

可借鉴点是：Agent SaaS 的 onboarding 不应该从空白 prompt 开始，而应该从模板开始。用户先选一个“销售线索跟进 agent”“客服分流 agent”“会议纪要 agent”，连上工具，跑通测试，再逐步定制。

### 7. Relevance AI / Lindy：团队化、治理化、运营化

Relevance AI 和 Lindy 的公开资料都在强调团队化和治理化能力。（来源：[Relevance AI Docs index](https://relevanceai.com/docs/llms.txt)、[Relevance AI product overview](https://www.relevanceai.com/)、[Lindy Enterprise](https://www.lindy.ai/blog/lindy-enterprise-announcement)、[Lindy 3.0](https://www.lindy.ai/blog/lindy-3-0)）

- AI workforce / multi-agent teams；
- marketplace / templates；
- approvals；
- monitoring dashboards；
- audit logs；
- RBAC / SSO / SCIM；
- centrally managed agents；
- app permissions；
- evals。

这说明当 Agent 从个人效率工具进入团队 SaaS 后，真正重要的是治理：谁能创建 agent，谁能发布，谁能连接工具，谁能查看日志，谁能批准高风险动作，谁能导出数据。

### 8. Dify / CrewAI / AutoGPT / OpenHands：开源实现的工程启发

几个开源生态分别提供了不同启发。（来源：[Dify Workflow & Chatflow](https://docs.dify.ai/en/use-dify/build/workflow-chatflow)、[Dify Agent](https://docs.dify.ai/en/use-dify/build/agent)、[Dify Tools](https://docs.dify.ai/en/use-dify/workspace/tools)、[CrewAI Docs index](https://docs.crewai.com/llms.txt)、[AutoGPT](https://github.com/Significant-Gravitas/AutoGPT)、[OpenHands](https://github.com/OpenHands/OpenHands)）

- **Dify**：明确区分 Workflow / Chatflow / Agent，提供 logs、run history、version control、maximum iterations；
- **CrewAI**：强调 agents、crews、flows、memory、checkpointing、event listeners、traces、HITL；
- **AutoGPT**：公开 README 将其定位为可创建、部署和管理 continuous AI agents 的平台，并保留 agent protocol、benchmark、低代码 builder、workflow management、monitoring 等能力线索；
- **OpenHands**：公开 README 展示了 SDK、CLI、Local GUI、Cloud、Enterprise 等多种形态，Cloud/Enterprise 方向包含多用户、RBAC、权限、协作和托管/自托管能力线索。

可迁移到 SaaS Agent 的共同点是：

1. 执行事件要可存储、可分页、可回放；
2. 状态和 memory 要有 scope，不应无限增长；
3. 工具与 sandbox 要隔离；
4. 版本、日志、benchmark、checkpoint 是生产系统的基础能力。

## 三、SaaS Agent 的推荐产品分层

不要把所有能力都叫 Agent。更清晰的产品分层是：

| 层级 | 用户感知 | 适用场景 | 自治程度 | 风险 |
| --- | --- | --- | --- | --- |
| Chat | 问答助手 | 查询、总结、解释 | 低 | 低 |
| Copilot | 辅助操作 | 起草、推荐、填表 | 中低 | 中 |
| Workflow | 固定流程自动化 | 审批流、工单流、数据同步 | 中 | 可控 |
| Agent | 目标驱动执行 | 调研、排障、跟进、运营 | 中高 | 高 |
| Agent Team | 多角色协作 | 销售/客服/研发多步骤任务 | 高 | 很高 |

MVP 不建议一开始就做 Agent Team。更推荐：

1. 先做 Chat / Copilot，验证数据接入与权限；
2. 再做 Workflow，沉淀可控流程；
3. 再在 workflow 的局部节点引入 Agent；
4. 最后才做多 Agent 协作。

## 四、总体架构：一个生产级 SaaS Agent 应该有哪些模块

推荐架构如下：

```text
User / Admin / Auditor
        │
        ▼
Web App / API / Webhook / Slack / Email
        │
        ▼
AuthN → Tenant Resolve → RBAC / ABAC
        │
        ▼
Agent Gateway
  - quota check
  - policy check
  - risk classification
  - prompt injection detection
        │
        ▼
Orchestrator / Workflow Runtime
  - state machine
  - checkpoint
  - retry / timeout
  - human interrupt
        │
        ├───────────────► LLM Runtime
        │                   - model routing
        │                   - prompt assembly
        │                   - context window control
        │                   - structured output
        │
        ├───────────────► Tool Runtime
        │                   - tool registry
        │                   - schema validation
        │                   - permission check
        │                   - idempotency
        │                   - connector secrets
        │
        ├───────────────► Memory / RAG
        │                   - tenant namespace
        │                   - retrieval policy
        │                   - memory scope
        │                   - delete / export
        │
        └───────────────► Approval Queue
                            - risk explanation
                            - diff preview
                            - approver policy
                            - resume execution

Cross-cutting:
Audit Log / Trace / Metrics / Evals / Billing / Cost Control / Admin Console
```

这套架构的核心思想是：**Agent Gateway 管边界，Workflow Runtime 管过程，Tool Runtime 管副作用，Observability 管事实，Admin Console 管治理。**

## 五、关键模块设计

### 1. Tenant 与身份模型

SaaS Agent 的最小身份模型应该包括：

```text
Tenant
  ├── Organization
  ├── Workspace / Project
  ├── User
  ├── Role
  ├── Agent
  ├── Tool Connection
  ├── Knowledge Base
  ├── Policy
  └── Billing Account
```

每次请求至少解析出：

- `tenant_id`
- `workspace_id`
- `actor_id`
- `actor_role`
- `agent_id`
- `session_id`
- `request_id`

授权不应该只判断“用户是否登录”，而要判断：

1. 用户是否属于这个 tenant；
2. 用户是否有权限调用这个 agent；
3. agent 是否有权限访问这个工具；
4. 工具是否能访问目标资源；
5. 当前动作是否需要审批；
6. 当前租户是否还有额度。

### 2. 工具系统：Agent 连接真实世界的边界

工具层是 SaaS Agent 的核心资产，也通常是最大风险来源。

一个工具定义至少应包含：

| 字段 | 说明 |
| --- | --- |
| `tool_id` | 工具唯一标识 |
| `name` | 给模型看的工具名 |
| `description` | 清晰说明何时使用、何时不要使用 |
| `input_schema` | 结构化参数 schema |
| `output_schema` | 返回结构 schema |
| `risk_level` | read / write / external / destructive |
| `required_scopes` | OAuth/API 权限范围 |
| `tenant_policy` | 哪些租户可用 |
| `approval_policy` | 是否需要审批 |
| `rate_limit` | 调用频率限制 |
| `cost_policy` | 调用成本估算 |
| `idempotency_key` | 幂等策略 |

工具执行前必须做：

1. schema validation；
2. tenant permission check；
3. user-to-agent delegation check；
4. resource-level permission check；
5. quota / rate limit check；
6. risk classification；
7. approval gate；
8. audit log pre-write。

工具执行后必须做：

1. output validation；
2. sensitive data redaction；
3. audit log update；
4. trace span close；
5. billing meter；
6. retry or compensation if needed。

### 3. Memory 与 RAG：不要把所有东西都塞进“记忆”

建议把 Agent 的上下文分成五类：

| 类型 | 生命周期 | 用途 | 注意事项 |
| --- | --- | --- | --- |
| Prompt context | 单次模型调用 | 当前推理输入 | 不持久化敏感原文 |
| Session state | 一次任务/会话 | 当前步骤、变量、工具结果 | 可 checkpoint |
| Short-term memory | 多轮会话 | 用户偏好、近期上下文 | 有过期时间 |
| Long-term memory | 长期 | 稳定偏好、业务事实 | 需可删除、可导出 |
| Audit log | 长期合规 | 记录发生了什么 | 不等同于模型记忆 |

LangGraph 的一个重要建议是：**state 存原始数据，prompt 在运行时组装。** 这可以避免 prompt 被当作事实存储，也方便回放和升级 prompt。（来源：[LangGraph overview](https://docs.langchain.com/oss/python/langgraph)）

RAG / 向量库必须做到：

- tenant namespace 隔离；
- 检索结果二次权限过滤；
- 引用来源可追踪；
- 文档版本可追踪；
- 删除请求能级联到 index；
- 高敏数据可脱敏或禁止入库。

### 4. Orchestrator：不要把长任务塞进一次 HTTP 请求

Agent 经常是长任务：会调用多个工具、等待审批、等待外部 API、失败重试。因此应该用 workflow / job runtime 管理。

推荐能力：

- durable execution；
- checkpoint；
- retry with backoff；
- timeout；
- dead letter queue；
- pause / resume；
- cancellation；
- compensation；
- versioned workflow；
- tenant-aware priority queue。

Temporal、LangGraph、Microsoft workflow 都可以作为参考。关键不是选哪个框架，而是要有“长任务状态机”的意识。（来源：[LangGraph overview](https://docs.langchain.com/oss/python/langgraph)、[Microsoft Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/)）

### 5. Human-in-the-loop 审批

审批不是简单弹一个确认框，而应该是一个完整对象：

```text
ApprovalRequest
  - tenant_id
  - agent_run_id
  - actor_id
  - proposed_action
  - target_resource
  - before / after diff
  - risk_reason
  - tool_input_redacted
  - estimated_cost
  - approver_policy
  - expires_at
  - status
```

审批页面必须让人看懂：

1. Agent 想做什么；
2. 为什么要这么做；
3. 会影响哪些资源；
4. 失败或误操作后能不能回滚；
5. 这次动作的输入参数是什么；
6. 谁发起，谁批准。

审批后 workflow 从 checkpoint 恢复，而不是重新跑一遍前面的模型推理。否则容易出现“审批的是 A，执行的是 B”的严重问题。

### 6. Guardrails：不是一个提示词，而是一整层控制系统

SaaS Agent 至少需要四类 guardrail：

| 类型 | 例子 |
| --- | --- |
| 输入 guardrail | prompt injection 检测、PII 检测、恶意意图识别 |
| 上下文 guardrail | 检索来源过滤、租户隔离、敏感字段脱敏 |
| 工具 guardrail | allowlist、schema、权限、审批、rate limit |
| 输出 guardrail | 格式校验、事实引用、敏感信息过滤、风险提示 |

最容易被忽视的是工具 guardrail。真正造成损失的往往不是模型“说错话”，而是模型调用了不该调用的工具，或者用错误参数调用了真实系统。

### 7. Observability：trace 要能还原决策链

每一次 Agent run 都应该有完整 trace：

```text
AgentRun
  ├── user request
  ├── policy checks
  ├── prompt assembly
  ├── model calls
  ├── retrieval calls
  ├── tool calls
  ├── approvals
  ├── retries
  ├── final result
  └── billing events
```

关键指标包括：

- task success rate；
- tool error rate；
- approval rate / rejection rate；
- average steps per run；
- average cost per run；
- cost per tenant；
- latency p50 / p95 / p99；
- retry count；
- hallucination / groundedness score；
- escalation rate；
- prompt version regression。

生产环境要注意采样策略：普通成功路径可以采样，错误、高风险、高成本、企业审计路径应全量保留。（参考：[OpenTelemetry Sampling](https://opentelemetry.io/docs/concepts/sampling/)）

### 8. Eval：把“感觉变好了”变成可测量

SaaS Agent 的 eval 至少分四层：

| 层级 | 测什么 | 示例 |
| --- | --- | --- |
| Unit eval | 单个 prompt / tool 参数 | 是否生成正确 JSON |
| Scenario eval | 一条业务路径 | 客服退款流程是否正确 |
| Regression eval | 新版本是否退化 | prompt v2 是否比 v1 差 |
| Production eval | 线上真实质量 | 用户反馈、审批拒绝率、升级率 |

建议每个模板 / agent 都带测试集：

- happy path；
- missing information；
- permission denied；
- tool failure；
- prompt injection；
- high-risk action；
- ambiguous request；
- cost limit exceeded。

Fin Simulations、Relevance AI / Lindy 的企业评估能力、LangSmith Evals 等公开能力都指向同一个结论：没有评估闭环，Agent 就很难持续迭代。（来源：[Intercom Fin Testing](https://fin.ai/testing)、[Relevance AI Docs index](https://relevanceai.com/docs/llms.txt)、[Lindy Enterprise](https://www.lindy.ai/blog/lindy-enterprise-announcement)、[LangSmith Observability](https://docs.langchain.com/langsmith/observability)）

### 9. 计费、配额与成本控制

SaaS Agent 的成本不只是 token。还包括：

- LLM input / output token；
- embedding；
- rerank；
- vector search；
- tool calls；
- workflow steps；
- browser / sandbox runtime；
- external API；
- storage；
- retry；
- human review operations。

建议按 tenant 做三层限制：

| 层级 | 作用 |
| --- | --- |
| Soft limit | 提醒用户成本接近上限 |
| Hard limit | 超过后停止高成本任务 |
| Circuit breaker | 发现循环、异常重试、爆量调用时自动熔断 |

还应该支持按 agent、tool、user、workspace 单独设置预算。很多 Agent 成本事故来自循环调用和失败重试，而不是正常使用。

### 10. Secrets 与第三方连接器

每个租户的第三方连接必须隔离：

- OAuth token；
- refresh token；
- API key；
- webhook secret；
- service account；
- browser session。

这类 secret 管理原则可参考云厂商对 secret 生命周期、访问控制和轮换的通用设计。（参考：[AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)）

原则：

1. secret 不进入 prompt；
2. secret 不进入日志；
3. secret 不进入 trace 明文；
4. 工具执行时临时取用；
5. 支持租户级撤销；
6. 支持轮换；
7. 连接器最小权限 scope；
8. 集成断链要降级并提示重连。

### 11. 授权委托：Agent 不能超过授权者的有效权限

SaaS Agent 的权限不是“用户权限”或“agent 权限”二选一，而应该取多个边界的交集：

```text
effective_permission = tenant policy
                     ∩ actor permission
                     ∩ agent policy
                     ∩ tool scope
                     ∩ target resource permission
                     ∩ runtime risk policy
```

这意味着：

1. 用户没有权限做的事，Agent 也不能代替用户做；
2. 用户有权限做的事，Agent 也不一定能自动做，还要看 agent policy 和 tool policy；
3. 连接器拿到的 OAuth scope 应该小于或等于业务所需最小权限；
4. service account 场景必须明确“谁授权了这个 agent 使用服务身份”；
5. 高风险动作即使权限满足，也可以继续要求审批。

这个设计可以避免一个常见漏洞：用户通过一句自然语言，让 Agent 绕过 UI 或工作流里原本存在的权限限制。

多租户身份、组织和 RBAC 的基础模型可参考 Auth0 Organizations / RBAC 与 AWS SaaS tenant isolation 的公开资料。（参考：[Auth0 Organizations](https://auth0.com/docs/manage-users/organizations)、[Auth0 RBAC](https://auth0.com/docs/manage-users/access-control/rbac)、[AWS SaaS tenant isolation](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html)）

### 12. 数据保留、删除与导出策略

Agent SaaS 里的“数据”不只是业务表。至少要分别定义以下对象的保留期和删除路径：

| 数据类型 | 例子 | 建议策略 |
| --- | --- | --- |
| Prompt / response | 模型输入输出 | 默认脱敏；企业租户可配置是否保存明文 |
| Tool input / output | API 参数、返回结果 | 保存 redacted 版本；敏感字段不落库 |
| Trace / span | 调用链路 | 按租户配置保留期；错误和审计路径可更久 |
| Audit log | 谁在何时做了什么 | 合规需要较长保留，但应避免存明文 PII |
| Memory | 用户偏好、长期事实 | 支持查看、删除、导出和过期 |
| Eval dataset | 回归测试样例 | 真实数据进入前必须匿名化或脱敏 |
| Uploaded files | 文档、附件 | 支持租户级删除、保留期和导出 |

尤其要注意 eval 数据集：很多团队会把线上失败案例直接回灌测试集，如果不做脱敏，eval 反而会变成新的 PII 泄露源。

### 13. Kill switch 与环境隔离

生产 SaaS Agent 必须能快速止损。管理员至少需要：

- tenant-level agent disable；
- tool / connector disable；
- model route disable；
- workflow version rollback；
- budget circuit breaker；
- global emergency stop。

同时，agent、prompt、workflow、tool、eval dataset 都应该区分 dev / staging / production。不要让测试中的 prompt、连接器或 eval 数据直接影响生产租户；发布到生产前应经过 simulation、权限检查和审批。

## 六、一个推荐的 MVP 范围

如果从 0 开始做 SaaS Agent，不建议第一版做“万能 Agent”。推荐 MVP 是一个窄场景、可控、可评估的业务 Agent。

### MVP 目标

做一个“模板驱动的单任务 Agent 平台”，支持：

1. 用户从模板创建 agent；
2. 连接 2-3 个核心工具；
3. 执行一个明确业务目标；
4. 高风险动作需要审批；
5. 每次执行都有日志、trace、成本；
6. 管理员能配置权限和额度；
7. 支持基础 eval 和回归测试。

### MVP 不做什么

第一版不建议做：

- 完全开放的多 Agent 协作；
- 无限制工具市场；
- 自动长期记忆；
- 任意浏览器自动操作；
- 自动执行高风险写操作；
- 复杂 marketplace 分发；
- 通用插件系统。

### 推荐 MVP 模块优先级

| 优先级 | 模块 | 为什么 |
| --- | --- | --- |
| P0 | Tenant / Auth / RBAC | SaaS 基础边界 |
| P0 | Agent template | 降低首次使用门槛 |
| P0 | Tool registry | 连接真实业务系统 |
| P0 | Workflow runtime | 让任务可恢复、可暂停 |
| P0 | Approval gate | 控制高风险动作 |
| P0 | Audit log / trace | 出问题能复盘 |
| P0 | Quota / cost limit | 防止成本失控 |
| P0-lite | Basic admin console | 最少支持角色、工具开关、审批和额度配置 |
| P1 | Eval set | 支持持续改进 |
| P1 | Memory / RAG | 增强上下文能力 |
| P1 | Full admin console | 团队治理、版本管理、审计导出 |
| P2 | Marketplace | 分发成熟模板 |
| P2 | Multi-agent team | 复杂协作场景 |

### 最小可行 eval 基线

即使是 MVP，也不要完全没有测试集。推荐第一版至少准备：

- 20-50 条真实或半真实 scenario tests；
- 5-10 条 prompt injection / 越权尝试；
- 5-10 条 permission denied 场景；
- 5-10 条 tool failure / timeout 场景；
- 5 条 high-risk action 审批场景；
- 每次 prompt、model、workflow 变更前后做 regression comparison。

如果样例来自真实客户数据，进入 eval dataset 前必须做匿名化、脱敏和租户隔离。

## 七、典型场景设计示例：客服 SaaS Agent

以客服 Agent 为例，可以这样设计。

### 1. 用户路径

1. Admin 选择“退款客服 Agent”模板；
2. 连接 Helpdesk、订单系统、CRM；
3. 配置退款政策和升级规则；
4. 上传或连接知识库；
5. 跑 20 条 simulation；
6. 修正失败案例；
7. 灰度给 5% 会话；
8. 查看 monitor；
9. 扩大流量。

### 2. 执行路径

```text
用户咨询退款
  ↓
识别意图：退款 / 投诉 / 普通问答
  ↓
检索退款政策和订单信息
  ↓
判断是否满足自动处理条件
  ↓
低风险：生成回复草稿
高风险：创建审批请求
  ↓
审批通过后调用退款 API
  ↓
记录审计日志
  ↓
通知用户和客服团队
```

### 3. 关键 guardrail

- 金额超过阈值必须人工审批；
- VIP 客户必须升级人工；
- 缺少订单信息不能执行；
- 政策不明确时只能生成建议，不能自动退款；
- 每个用户每日退款次数有限制；
- 所有退款 API 调用必须幂等。

## 八、典型场景设计示例：销售运营 Agent

销售运营 Agent 可以处理线索跟进、CRM 更新、会议纪要、邮件草稿。

### 推荐边界

第一阶段让 Agent 做：

- 从会议记录提取客户需求；
- 生成 CRM 更新草稿；
- 推荐下一步动作；
- 起草跟进邮件；
- 提醒销售确认。

不建议第一阶段自动做：

- 直接给客户发邮件；
- 自动修改 deal stage；
- 自动承诺价格或合同条款；
- 自动导出客户列表。

### 为什么

销售场景里，错误成本不是技术错误那么简单，而可能影响客户关系、价格承诺和合规。所以更适合从 copilot 开始，再逐步开放 agentic execution。

## 九、技术选型建议

### 1. 编排层

可选方向：

- 简单场景：自研 state machine + job queue；
- 中等复杂度：LangGraph；
- 长任务 / 强可靠：Temporal；
- 企业 Microsoft 生态：Microsoft Agent Framework / Semantic Kernel；
- 低代码产品形态：参考 Dify / CrewAI Flow。

选择标准不是“哪个最火”，而是：

1. 是否支持 checkpoint；
2. 是否支持 pause / resume；
3. 是否支持 replay；
4. 是否支持人审；
5. 是否方便接 trace；
6. 是否能版本化 workflow。

### 2. 模型层

建议做 model router，而不是写死一个模型：

- 高复杂推理：强模型；
- 简单分类：小模型；
- JSON 结构化：支持 structured output 的模型；
- 高隐私租户：指定区域或私有部署；
- 成本敏感任务：低成本模型 fallback。

### 3. 工具协议

建议同时支持：

- 内部 typed tools；
- OpenAPI tools；
- MCP server；
- webhook / connector；
- browser fallback（谨慎开放）。

MCP 和 OpenAPI 适合扩展生态，但内部核心工具仍应有更强 schema、权限和审计控制。

这里的工具协议选择参考了 OpenAI / Anthropic tool use、Dify tools、Intercom integrations 与 Agentforce custom connections 等公开资料。（来源：[OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents)、[Anthropic Claude tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)、[Dify Tools](https://docs.dify.ai/en/use-dify/workspace/tools)、[Intercom Fin Integrations](https://fin.ai/integrations)、[Salesforce Agentforce Custom Connections](https://developer.salesforce.com/docs/ai/agentforce/guide/custom-connections.html)）

### 4. 数据层

推荐最小组合：

- Postgres：tenant、agent、run、tool、approval、audit；
- Redis：短期状态、rate limit、队列辅助；
- Object Storage：附件、导出、日志归档；
- Vector DB：tenant namespace 的知识库；
- Data warehouse：评估、成本、产品分析。

多租户隔离和 SaaS 架构的底层原则可参考 AWS SaaS 架构资料；用量计费事件的设计可参考 Stripe usage-based billing。（参考：[AWS SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html)、[AWS SaaS tenant isolation](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html)、[Stripe usage-based billing](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage)）

## 十、数据模型草案

### Agent

```text
Agent
  - id
  - tenant_id
  - name
  - description
  - template_id
  - version
  - status
  - system_prompt_version
  - workflow_version
  - tool_policy_id
  - memory_policy_id
  - risk_policy_id
  - created_by
  - updated_at
```

### AgentRun

```text
AgentRun
  - id
  - tenant_id
  - agent_id
  - actor_id
  - session_id
  - status
  - input_summary
  - current_step
  - checkpoint_id
  - cost_estimate
  - cost_actual
  - risk_level
  - started_at
  - finished_at
```

### ToolCall

```text
ToolCall
  - id
  - tenant_id
  - run_id
  - tool_id
  - input_redacted
  - output_redacted
  - status
  - idempotency_key
  - approval_id
  - latency_ms
  - error_code
  - created_at
```

### AuditEvent

```text
AuditEvent
  - id
  - tenant_id
  - actor_id
  - agent_id
  - run_id
  - event_type
  - resource_type
  - resource_id
  - action
  - before_hash
  - after_hash
  - metadata_redacted
  - trace_id
  - created_at
```

## 十一、上线与发布流程

Agent 的发布应该像软件发布，而不是改完 prompt 直接上线。

推荐流程：

1. Draft：编辑 agent / prompt / workflow / tools；
2. Static check：schema、权限、风险扫描；
3. Simulation：跑测试集；
4. Review：管理员或 owner 审核；
5. Canary：小流量灰度；
6. Monitor：观察成功率、拒绝率、成本、错误；
7. Promote：扩大流量；
8. Rollback：异常时回滚到上一版本。

每次发布要记录：

- prompt version；
- workflow version；
- tool version；
- model policy；
- eval result；
- approver；
- release note。

## 十二、风险清单

### 1. 安全风险

- prompt injection 导致越权工具调用；
- RAG 泄露其他租户数据；
- secret 被写入日志；
- Agent 误调用高风险 API；
- 第三方连接器权限过大；
- 审批绕过。

### 2. 产品风险

- 用户不知道 Agent 能做什么；
- 模板太空，首次使用失败；
- 失败原因不可解释；
- 人审太多，自动化价值下降；
- 自动化太多，用户不信任。

### 3. 工程风险

- 长任务不可恢复；
- 工具调用不幂等；
- trace 缺失导致无法排障；
- prompt 改动无法回滚；
- 多 agent 调试成本爆炸；
- 成本无限循环；
- 缺少 kill switch，异常 agent 无法快速下线；
- dev / staging / production 隔离不足，测试配置污染生产。

### 4. 合规风险

- 长期记忆无法删除；
- audit log 含过多 PII；
- 跨境数据不可控；
- 企业客户无法导出审计；
- 租户级数据保留策略不一致；
- eval 数据集混入未脱敏真实客户数据。

## 十三、落地 checklist

### 产品侧

- [ ] 是否有明确目标场景，而不是万能 Agent？
- [ ] 是否有模板化 onboarding？
- [ ] 用户是否能在 10 分钟内跑通第一个任务？
- [ ] 高风险动作是否需要审批？
- [ ] 是否能解释 Agent 做了什么、为什么做？
- [ ] 是否有失败升级人工路径？
- [ ] 是否有版本和回滚？
- [ ] 是否有紧急停用 agent / tool / connector 的入口？

### 工程侧

- [ ] 所有请求是否带 `tenant_id`？
- [ ] 所有数据查询是否做租户过滤？
- [ ] 工具调用是否有 schema 校验？
- [ ] 工具调用是否有权限校验？
- [ ] 外部副作用是否幂等？
- [ ] 长任务是否支持 checkpoint？
- [ ] 是否有 trace、metrics、audit log？
- [ ] 是否有成本和速率限制？
- [ ] dev / staging / production 是否隔离？
- [ ] 是否有 kill switch 和 circuit breaker？

### 安全与合规侧

- [ ] secret 是否永不进入 prompt / log / trace 明文？
- [ ] RAG 是否按租户隔离？
- [ ] memory 是否可删除、可导出？
- [ ] trace、prompt、tool I/O、上传文件是否有保留期？
- [ ] prompt injection 是否有检测和隔离？
- [ ] 审批链路是否可审计？
- [ ] 企业管理员是否能禁用工具或 agent？

### 评估侧

- [ ] 每个 agent 是否有 eval set？
- [ ] 是否覆盖 happy path 和 failure path？
- [ ] 是否能比较不同 prompt / model 版本？
- [ ] 是否能监控线上成功率和成本？
- [ ] 是否能从真实失败案例回灌测试集？
- [ ] eval 数据集是否做了匿名化和脱敏？

## 十四、推荐路线图

### Phase 0：研究与定义

- 选定一个窄场景；
- 明确用户角色和高风险动作；
- 定义工具清单；
- 定义成功指标；
- 收集 50-100 个真实任务样例。

### Phase 1：Copilot MVP

- 支持问答、总结、草稿生成；
- 接入 1-2 个只读工具；
- 做基础 RBAC；
- 做基础 trace；
- 不自动执行写操作。

### Phase 2：Workflow Agent

- 引入 workflow runtime；
- 支持状态、checkpoint、重试；
- 接入写工具，但默认审批；
- 做 audit log；
- 做 eval set 和 simulation。

### Phase 3：Team SaaS

- Admin console；
- agent versioning；
- tool permission；
- tenant quota；
- SSO / SCIM；
- cost dashboard；
- 灰度和回滚。

### Phase 4：Agent Platform

- marketplace；
- MCP / OpenAPI connector ecosystem；
- 多 agent collaboration；
- 高级 memory；
- 自动评估和推荐优化；
- 企业合规包。

## 十五、最后的设计判断

如果只记住一个判断，那就是：

> **SaaS Agent 的核心竞争力不是“模型调用”，而是“把模型放进一个可控、可审计、可恢复、可计费、可治理的业务系统里”。**

所以，设计 SaaS Agent 时不要先问“要不要多 Agent”“要不要长期记忆”“要不要自主规划”。应该先问：

1. 用户的真实任务是什么？
2. 哪些步骤必须确定性？
3. 哪些步骤适合 LLM？
4. 哪些动作有风险？
5. 失败后如何恢复？
6. 谁有权限批准？
7. 如何评估是否变好？
8. 如何控制成本和租户边界？

把这些问题答清楚，再谈 Agent，才是真正的 SaaS Agent 设计。

## 参考资料

- OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents
- OpenAI Running agents: https://developers.openai.com/api/docs/guides/agents/running-agents
- OpenAI Guardrails and human review: https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- OpenAI Agent evals: https://developers.openai.com/api/docs/guides/agent-evals
- Anthropic Claude tool use: https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
- LangGraph overview: https://docs.langchain.com/oss/python/langgraph
- LangGraph interrupts: https://docs.langchain.com/oss/python/langgraph/interrupts
- LangSmith Observability: https://docs.langchain.com/langsmith/observability
- Microsoft Agent Framework Overview: https://learn.microsoft.com/en-us/agent-framework/overview/
- CrewAI Docs index: https://docs.crewai.com/llms.txt
- Dify Workflow & Chatflow: https://docs.dify.ai/en/use-dify/build/workflow-chatflow
- Dify Agent: https://docs.dify.ai/en/use-dify/build/agent
- Dify Tools: https://docs.dify.ai/en/use-dify/workspace/tools
- Intercom Fin Procedures: https://fin.ai/procedures
- Intercom Fin Testing: https://fin.ai/testing
- Intercom Fin Analyze: https://fin.ai/analyze
- Intercom Fin Integrations: https://fin.ai/integrations
- Salesforce Agent Script: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html
- Salesforce Agentforce APIs and SDKs: https://developer.salesforce.com/docs/ai/agentforce/guide/get-started-agents.html
- Salesforce Agentforce hybrid reasoning architecture: https://architect.salesforce.com/docs/architect/fundamentals/guide/hybrid-reasoning-agentforce-builder-agent-script.html
- Salesforce Agentforce agentic patterns: https://architect.salesforce.com/docs/architect/fundamentals/guide/agentic-patterns.html
- Salesforce Agentforce Testing API: https://developer.salesforce.com/docs/ai/agentforce/guide/testing-api-get-started.html
- Salesforce Agentforce Session Tracing Data Export: https://developer.salesforce.com/docs/ai/agentforce/guide/otel-api.html
- Salesforce Agentforce Custom Connections: https://developer.salesforce.com/docs/ai/agentforce/guide/custom-connections.html
- Salesforce Engineering - Agentforce Agent Graph: https://engineering.salesforce.com/agentforces-agent-graph-toward-guided-determinism-with-hybrid-reasoning/
- Salesforce Developers Blog - Agent Script decoded: https://developer.salesforce.com/blogs/2026/02/agent-script-decoded-intro-to-agent-script-language-fundamentals
- Salesforce Blog - Agent Script control plane: https://www.salesforce.com/blog/agent-script-control-plane/
- Salesforce Blog - Agentforce Testing Center: https://www.salesforce.com/blog/agentforce-testing-center/
- Salesforce Blog - Secure Agentforce with trusted services: https://www.salesforce.com/blog/secure-agentforce-with-trusted-services/
- Salesforce Blog - Data governance for the agentic era: https://www.salesforce.com/blog/data-governance-for-the-agentic-era/
- Salesforce Engineering - Enterprise agent platform: https://engineering.salesforce.com/beyond-crm-how-salesforce-engineered-an-enterprise-agent-platform-for-any-workload/
- Salesforce Blog - Reducing Agentforce latency: https://www.salesforce.com/blog/agentforce-reducing-latency/
- Zapier Agents: https://zapier.com/agents
- Zapier Help - Build an agent in Zapier Agents: https://help.zapier.com/hc/en-us/articles/24393442652557-Build-an-agent-in-Zapier-Agents
- Relevance AI Docs index: https://relevanceai.com/docs/llms.txt
- Relevance AI product overview: https://www.relevanceai.com/
- Lindy Enterprise: https://www.lindy.ai/blog/lindy-enterprise-announcement
- Lindy 3.0: https://www.lindy.ai/blog/lindy-3-0
- OpenHands: https://github.com/OpenHands/OpenHands
- AutoGPT: https://github.com/Significant-Gravitas/AutoGPT
- AWS SaaS tenant isolation: https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html
- AWS SaaS Lens: https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html
- Auth0 Organizations: https://auth0.com/docs/manage-users/organizations
- Auth0 RBAC: https://auth0.com/docs/manage-users/access-control/rbac
- AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html
- AWS CloudTrail: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
- Stripe usage-based billing: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage
- OpenTelemetry Concepts: https://opentelemetry.io/docs/concepts/
- OpenTelemetry Sampling: https://opentelemetry.io/docs/concepts/sampling/
