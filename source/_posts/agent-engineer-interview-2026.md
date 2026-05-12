---
title: 2026 Agent 开发工程师面试指南：从架构、MCP 到生产化
tags:
  - AI Agent
  - LLM
  - MCP
  - 面试
categories:
  - AI Agent
excerpt: >-
  系统梳理 2026 年 Agent 开发工程师面试的高频问题、真实考察价值与生产级回答框架：为什么这些题值得准备，以及强回答应该如何体现工程能力。
date: 2026-05-08 00:00:00
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成，并基于 2025-2026 年公开资料、官方文档、招聘 JD 与工程实践趋势整理。
</div>

如果你在 2026 年准备 **Agent 开发工程师 / LLM Engineer / AI Platform Engineer** 面试，一个很重要的判断是：生产导向岗位已经不太满足于“我会写 prompt”这种回答了。

更准确地说，2026 年很多 Agent 面试正在从“LLM 知识问答”转向“生产系统设计”。面试官真正想知道的是：你能不能把一个 agent 从 demo 推到线上，能不能控制失败模式，能不能做 eval，能不能接工具，能不能控制成本、延迟和安全边界。

一句话总结：**对生产导向的 Agent 岗位来说，大部分高价值考察点都在工程能力，LLM 知识只是基础门槛。**

下面这篇文章分两部分：

1. 先确认这些问题到底值不值得准备。
2. 再逐项回答高频问题，并给出面试中的强回答框架。

## 一、这些问题真的有面试价值吗？

结论：**有，而且非常高。**

从 2025-2026 年公开资料看，Agent 工程岗位的高频主题高度集中在以下几个方向：

1. Agent 架构与编排
2. Tool Calling 与 MCP
3. Context Engineering / Grounding / RAG
4. Stateful / Durable Execution
5. 安全、Guardrails 与权限控制
6. Eval、Tracing 与可观测性
7. Testing、Release、SRE 与成本可靠性

这些不是“概念题”，而是生产系统题。LangChain 的《State of AI Agents》调查显示，很多团队已经把 agent 上线，observability 与 offline eval 已经变成工程实践的一部分。Anthropic、OpenAI、GitHub、Microsoft、LangGraph、CrewAI 等官方资料也都在强调工具调用、评估、可观测性、权限、安全和状态管理。

更直接的证据来自招聘 JD：不少 2026 年 Agent/LLM 相关岗位已经直接写到 **agent orchestration、MCP server development、RAG、eval、observability、cost management、prompt injection defense、least privilege、runtime governance** 等关键词。

所以，这些题的价值可以这样排序：

| 优先级 | 主题 | 为什么重要 |
| --- | --- | --- |
| P0 | Agent 架构 / 编排 | 系统设计主轴，决定 agent 是否可控 |
| P0 | Tool Calling / MCP | agent 连接真实世界的关键接口 |
| P0 | Context Engineering / Grounding | 决定模型到底看到什么、信什么、引用什么 |
| P0 | Eval / Observability | 判断 agent 是否真的变好的唯一工程手段 |
| P0 | Safety / Guardrails / Governance | 生产环境的必答题，不是附加题 |
| P0 | Durable Execution / Release | 决定长任务能否恢复、灰度、回滚和审计 |
| P1 | 成本 / 延迟 / 可靠性 | 决定能不能规模化上线 |
| P1 | Memory | long-running agent、coding agent、多轮任务越来越重要 |

面试官最看重的信号不是“背过多少框架名”，而是你能不能像设计分布式系统一样设计 agent：状态如何持久化，失败如何恢复，工具调用如何幂等，权限如何收敛，执行轨迹如何复现，成本如何估算，风险如何隔离。

## 二、Agent 架构设计：ReAct、Plan-and-Execute 与 Multi-Agent

### 1. ReAct 什么时候用？什么时候不用？

ReAct 的核心是让模型在 **Reasoning → Action → Observation** 循环中边想边调用工具。它适合：

- 信息不完整，需要逐步探索的问题；
- 工具结果会改变下一步决策的任务；
- 搜索、诊断、代码理解、数据分析等开放式任务；
- 需要模型根据 observation 动态调整路径的场景。

但 ReAct 不适合所有任务，更不应该在高风险流程里作为唯一控制器。面试中强回答一定要讲“不优先用它”的场景：

- **低延迟场景**：每一轮工具调用都会增加延迟。
- **简单确定性任务**：普通函数、规则引擎或 pipeline 更便宜、更稳定。
- **强合规流程**：步骤固定、审批明确时，应优先使用 workflow，而不是开放循环。
- **高风险动作**：支付、删库、发邮件、发交易指令等动作不能让模型自由循环；如果使用 ReAct，也应该被审批、预算、超时和回退机制包住。

面试里的好回答是：**ReAct 是一种动态决策 loop，不是默认架构。只要任务能用 deterministic pipeline 解决，就不要先上开放式 agent loop。**

### 2. Plan-and-Execute vs ReAct

Plan-and-Execute 通常先生成计划，再逐步执行。它的优点是：

- 计划更清晰，便于展示给用户或审批；
- 适合长任务和多阶段任务；
- 更容易做 checkpoint、resume 和 human-in-the-loop；
- 比纯 ReAct 更容易控制成本和执行边界。

缺点是：初始计划可能过时，执行中需要 replanning；如果计划过粗，会变成“看似结构化的幻觉”。

面试中可以这样回答：

> 对探索性强、工具结果不可预知的问题，我倾向 ReAct；对长时间运行、需要审批、需要恢复的任务，我倾向 Plan-and-Execute 或 LangGraph-style workflow。生产系统里常见做法是 deterministic workflow 外壳 + agentic reasoning 内核。

### 3. Agentic Loop vs 顺序 Pipeline 的本质区别

顺序 pipeline 的路径通常是预定义的：A → B → C。它的可测试性强、延迟可控、失败点明确。

Agentic loop 的路径是运行时动态决定的：模型根据上下文、工具结果和目标决定下一步。这带来灵活性，也带来不确定性。

本质区别不是“有没有 LLM”，而是：

- pipeline 的控制流由工程师写死；
- agentic loop 的控制流部分交给模型；
- 一旦交给模型，就必须补上 eval、tracing、权限、预算、终止条件和回滚机制。

### 4. Multi-Agent 系统怎么设计？

Multi-Agent 是 2026 面试高频题，但最强答案往往不是“多 agent 很酷”，而是“什么时候不该多 agent”。

常见编排模式有三类：

1. **层级式**：一个 manager agent 分派任务给 specialist agents。
2. **流水线式**：researcher → planner → executor → reviewer。
3. **对等式**：多个 agent 互相讨论、投票或协作。

生产环境里更常见的是前两种，尤其是“deterministic workflow + specialist agent”。开放式 multi-agent swarm 在研究、探索、头脑风暴场景有价值，但在业务关键链路里通常很难调试，成本高，责任边界也不清楚。

这里的“流水线式”不一定意味着每次都死板地完整执行 researcher → planner → executor → reviewer 四步。更合理的生产实现是：**固定阶段模型 + LLM router + 状态机校验**。

也就是说，工程师先定义清楚有哪些阶段、每个阶段需要产出什么 artifact、完成条件是什么、失败后如何恢复；LLM 可以根据当前任务状态判断下一步建议走哪里，比如已有充分 research 时跳到 planner，已有 approved plan 时跳到 executor，或者执行后发现风险较高时强制进入 reviewer。但这个判断最好是结构化输出，而不是一句自然语言“我觉得可以跳过”。系统还要检查 checkpoint、artifact、权限和风险等级，确认真的满足条件后才允许跳转。

面试里可以这样总结：**LLM 负责判断“建议走哪一步”，workflow 负责约束“能不能走这一步”。** 如果完全靠 prompt 让 LLM 自己梳理流程，短任务 demo 可能能跑，但生产里很难保证恢复、审计、幂等、权限和失败重试；如果完全写死流程，又会浪费成本和延迟。比较稳的折中是把 researcher / planner / executor / reviewer 做成显式状态或图节点，再用 LLM router 做动态路由，用状态机和 checkpoint 决定哪些阶段可以跳过或重跑。

回答 Multi-Agent 题时建议强调：

- 每个 agent 的职责必须单一；
- agent 间通信要结构化，不要只靠自然语言聊天；
- 需要统一状态存储和执行 trace；
- 需要终止条件、预算限制和失败恢复；
- 高风险动作必须 human-in-the-loop；
- 不要用多 agent 掩盖单 agent prompt/schema 设计不良。

## 三、Tool Calling 与 MCP：Agent 连接真实世界的接口

### 1. 如何设计可靠的 tool schema？

Tool schema 是 agent 可靠性的第一道门。弱 schema 会导致参数幻觉、错误工具选择、不可恢复的副作用。

可靠 schema 的原则：

- 工具名要表达动作，而不是抽象概念；
- description 要写清楚何时使用、何时不要使用；
- 参数要尽量结构化，避免自由文本大杂烩；
- enum、format、minimum、maximum 等约束尽量显式；
- destructive action 要有 dry-run 或 confirmation 参数；
- 工具返回值要结构化，包含 status、error_code、retryable、data；
- 不要一次暴露几十个相似工具，工具过多会增加选择错误和 token 成本。

一个强回答可以这样说：

> 我会把 tool schema 当 API contract 设计，而不是给模型看的注释。schema 要约束输入，返回值要可机器解析，错误要可分类，危险动作要有审批和幂等键。

### 2. Tool 调用失败怎么处理？

面试官常问：工具失败了怎么办？

不要只回答“重试”。生产系统里的失败处理应该分层：

1. **参数错误**：返回结构化 validation error，让模型修正参数。
2. **暂时性错误**：指数退避重试。
3. **依赖不可用**：降级到备用工具或人工处理。
4. **权限错误**：不要重试，直接请求授权或终止。
5. **高风险动作失败**：记录审计日志并进入人工审批。
6. **连续失败**：触发 circuit breaker，避免 agent 死循环烧钱。

关键是：工具错误不是普通异常，而是 agent loop 的 observation。错误返回要设计成模型能理解、系统能监控、工程师能复现。

### 3. MCP 是什么？能叫“Agent 的 REST”吗？

MCP（Model Context Protocol）是 2026 年非常值得准备的主题。它试图标准化 AI 应用与工具、资源、提示之间的连接方式。

但严格说，**MCP 不是 REST**。MCP 官方规范基于 JSON-RPC 2.0，支持 stdio 与 Streamable HTTP 等传输方式，有 capability negotiation、tools、resources、prompts 等概念。

这里还有一个容易暴露“资料是否过期”的细节：当前 MCP 文档更推荐说 **Streamable HTTP**，但早期资料和兼容旧 server 的实现里仍可能见到 SSE。面试中更稳妥的说法是：MCP 是 JSON-RPC 消息协议，标准传输包括 stdio 和 Streamable HTTP；SSE 主要作为旧实现或兼容语境来理解。

所以，“Agent 的 REST”只是一个松散类比。更准确的说法是：

- MCP 更像 **AI 应用的 LSP**；
- 或者说是 **agent/tool RPC protocol over stdio or HTTP**；
- 它标准化的是工具、资源、提示和上下文的交互协议，不是普通 REST API。

面试里可以这样答：

> MCP 的价值在于把工具接入从每个应用的私有 glue code 变成标准协议。它的意义类似 LSP 对编辑器生态的意义。但它不是 REST，本质上是状态化的 JSON-RPC 协议。生产中还要注意不同厂商 MCP 支持范围不完全一致，比如有的只支持 tools，不支持 resources/prompts。

当然，某些具体实现会把 MCP 的一部分能力包装成“类似 RESTful API”的请求-响应模式，比如只暴露 tool 调用子集。但这应该被理解为实现层或子集应用的简化，而不是 MCP 协议本身等同于 REST。

### 4. Structured Outputs 与工具返回值

Tool Calling 还有一个经常被低估的点：**结构化输出不是锦上添花，而是可靠性的前提**。

OpenAI 的 structured outputs、Anthropic 的 `tool_use` / `tool_result` 格式，以及 MCP 的 input/output schema，本质上都在解决同一个问题：不要让模型从一大段自然语言里“猜”字段。工具返回值越接近稳定的数据契约，后续 agent loop 越容易评估、重试、审计和回放。

面试里可以这样表达：

> 我会同时约束 tool input 和 tool output。input schema 防止模型传错参数，output schema 防止模型误读结果。复杂对象要拆小，避免让 LLM 解析深层嵌套 JSON；高风险工具还要返回可审计的 operation id、幂等键和审批状态。

### 5. Tool / Skill Decision Quality

2026 年还有一个越来越重要但容易被忽略的点：**不是“会调用工具”就够了，还要知道什么时候不该调用工具。**

真实系统里常见两类错误：

- **Over-tool-reliance**：简单问题也调用工具，浪费成本、增加延迟，还可能引入错误状态。
- **Under-tool-use / overconfidence**：需要查实时数据、读文档、加载 skill 时，模型却凭记忆回答。

所以面试里可以主动讲 tool decision quality：哪些任务必须调用工具，哪些任务禁止调用工具，哪些工具需要审批，哪些 skill 应该显式加载而不是靠模型“想起来”。这也是 DeepAgents 等 harness 设计里强调 skills、middleware、filesystem、permission 和 eval 的原因。

## 四、Context Engineering 与 Memory：模型到底该看到什么

如果说 RAG 是“把资料找回来”，Context Engineering 就是“决定哪些资料、状态、工具结果、历史记忆、系统约束应该进入模型上下文”。2026 年生产 Agent 面试里，这个主题的重要性已经不低于传统 RAG。

强回答要覆盖：

- **上下文预算**：context window 不是越大越好，长上下文也会带来成本、延迟和注意力稀释。
- **上下文选择**：任务目标、用户身份、权限、当前状态、相关文档、工具结果要分层进入上下文。
- **上下文压缩**：长 trace 要摘要，但摘要必须保留决策、证据、失败原因和未完成事项。
- **上下文污染**：外部网页、用户输入、检索文档都可能携带 prompt injection，不能与系统指令混在一起。
- **grounding policy**：什么时候必须引用证据，什么时候必须调用工具，什么时候应该拒答或追问。

面试里可以这样总结：**RAG 解决“从哪里找信息”，Context Engineering 解决“模型此刻应该相信什么”。**

## 五、Memory 系统：短期、情景与长期记忆

Memory 在 2026 年的重要性明显上升，尤其是 coding agent、long-running agent、多 session assistant。

一个实用的三层模型是：

1. **短期记忆**：当前 context window，包括用户当前任务、工具结果、临时推理状态。
2. **情景记忆**：历史 trace、过去任务、失败记录、用户偏好、项目上下文。
3. **长期语义记忆**：向量库、知识图谱、结构化 profile、可检索文档。

### 长时间运行 agent 的状态管理

长任务不能只靠 prompt。需要：

- checkpoint：关键阶段保存状态；
- resume：中断后可以恢复；
- event log：记录每一步 action/observation；
- task state：区分 pending、in_progress、completed、failed；
- deterministic replay：重要任务能重放执行轨迹。

LangGraph 和 Microsoft Agent Framework 明确强调 checkpoint、state、workflow、human-in-the-loop 这类生产编排能力；CrewAI Flow 也提供面向业务流程的编排抽象，但具体持久化、可观测和治理能力要结合版本与部署方式判断。它们共同指向一个事实：long-running agent 不能只靠一次上下文窗口。

框架选型也要注意时效性：AutoGen 在 multi-agent 研究和原型阶段非常有影响力，已有系统继续维护或迁移也完全合理；但如果是 2026 年新项目，应该重点关注 Microsoft Agent Framework、LangGraph / DeepAgents、CrewAI Flow 这类更强调持久化、工作流、可观测和治理的方向。

这里要特别区分 **LangGraph** 和 **DeepAgents**：LangGraph 更像底层 stateful graph runtime，适合你显式建图、做 checkpoint、HITL、durable execution；DeepAgents 则是构建在 LangGraph 之上的更高层 **agent harness**，预置了 planning、virtual filesystem、subagents、skills、memory、sandbox、permissions、context management 等能力，更贴近长任务 coding/research agent 的产品化形态。所以不是“DeepAgents 替代 LangGraph”，而是：**LangGraph 是 runtime，DeepAgents 是更 opinionated 的 harness。**

面试里不要只背“我会某某框架”，而要说明为什么选择某个层次：简单 agent 用平台 SDK 或 LangChain agent 即可；复杂状态机用 LangGraph / MAF；长时间复杂任务、需要文件系统、skills、subagents、sandbox 的场景，可以重点看 DeepAgents；业务流程自动化可以评估 CrewAI Flow；已有 AutoGen 系统则考虑维护、迁移或实验性 multi-agent 研究。

### 记忆压缩、过期与矛盾处理

Memory 的难点不是“存进去”，而是“什么时候信它”。

生产中要考虑：

- 压缩：把长 trace 总结成结构化摘要；
- 过期：旧偏好、旧 API、旧业务规则要失效；
- 冲突：新事实与旧记忆矛盾时要保留 provenance；
- 权限：不同用户、项目、租户之间记忆不能串；
- 可解释：模型引用记忆时最好能说明来源。

面试强回答：**Memory 不是一个向量库，而是一套状态、检索、权限、生命周期和冲突处理系统。**

## 六、RAG 进阶：从“能搜到”到“能答对”

RAG 仍然是高价值面试题，但重点已经不是“什么是 embedding”。面试官更关心：检索结果相关但 agent 仍答错时，你怎么 debug？

### 1. Hybrid Search

生产系统常用 hybrid search：

- 向量检索擅长语义相似；
- BM25/关键词检索擅长专有名词、错误码、精确字段；
- metadata filter 负责权限、时间、文档类型；
- reranker 负责把候选文档重新排序。

强回答不是“用向量库”，而是：**先 recall，再 precision；先扩大候选，再 rerank；先保证权限过滤，再交给模型。**

### 2. Semantic Chunking vs Fixed-size Chunking

Fixed-size chunking 简单稳定，但容易切断语义。Semantic chunking 更贴近段落、章节、代码结构，但实现复杂，成本更高。

选择依据：

- FAQ/短文档：固定 chunk 足够；
- 法务/技术文档：按标题、段落、层级切；
- 代码仓库：按函数、类、文件结构切；
- 表格/财务数据：不要盲目 chunk，要结构化解析。

### 3. Lost in the Middle

“Lost in the Middle” 指模型容易忽略上下文中间位置的信息。应对方式包括：

- rerank 后只放最关键片段；
- 把答案所需证据放在靠前或靠后位置；
- 对长 context 做分段摘要；
- 使用 citation，让模型必须引用证据；
- 对重要字段做结构化抽取，而不是整段塞进 prompt。

### 4. RAG vs Tool Calling 怎么选？

一个非常实用的区分：

- **RAG** 适合读知识：政策、文档、历史案例、手册。
- **Tool Calling** 适合做动作或查实时状态：查订单、发邮件、建 ticket、跑 SQL、调用内部 API。

如果问题需要最新状态或副作用，优先 tool；如果问题需要知识 grounding，优先 RAG。很多生产 agent 会两者结合：先 RAG 找规则，再 tool 执行动作。

## 七、安全、权限与治理：从输入到运行时的分层防护

2026 年安全题权重明显上升，因为 agent 不再只是聊天，它会调用工具、访问数据、执行动作。

### 1. Prompt Injection 怎么防？

不要说“清洗输入就行”。Prompt injection 无法靠单一手段彻底解决，需要分层防御：

1. **输入层**：标记不可信内容，隔离用户输入、网页内容、检索文档。
2. **上下文层**：系统指令与外部内容分区，不让文档覆盖系统规则。
3. **工具层**：工具权限最小化，危险工具需要审批。
4. **输出层**：结构化输出验证，敏感信息扫描。
5. **运行时层**：沙箱、网络 allowlist、文件系统隔离、审计日志。

最重要的是：**不要让不可信文本直接决定高权限工具调用。**

### 2. Human-in-the-loop

Human-in-the-loop 不是失败兜底，而是权限模型的一部分。

适合人工审批的场景：

- 资金、交易、退款；
- 删除、覆盖、发布；
- 对外发送消息；
- 修改权限或配置；
- 低置信度或高影响决策。

成熟系统会按风险分级：低风险自动执行，中风险抽样审核，高风险强制审批。

### 3. 最小权限原则

Agent 的工具权限应该像云权限一样收敛：

- 按任务授予临时 token；
- 按用户身份执行，而不是共享超级账号；
- 工具有 scope 和 allowlist；
- session 结束后权限失效；
- 所有高风险调用写审计日志。

强回答：**agent 安全不是 prompt 安全，而是权限系统、运行时沙箱和审计系统的组合。**

### 4. Data Governance 与多租户隔离

企业 Agent 面试里，安全题经常会继续追问到治理层：

- PII 如何识别、脱敏、留存和删除？
- 用户身份如何透传到 tool？是 service account 还是 delegated user token？
- 多租户场景下，memory、cache、trace、RAG index 如何隔离？
- prompt、tool 参数、模型输出是否会进入日志？日志里是否有敏感信息？
- 审计日志能否回答“谁在什么时候让 agent 调用了哪个工具，影响了什么资源”？

这类问题的强回答不是“加个 guardrail”，而是把 agent 放进企业安全模型里：身份、授权、密钥、审计、数据保留、租户隔离、合规策略都要有明确边界。

## 八、Eval、测试与可观测性：Agent 是否变好，要能证明

Eval 是 2026 Agent 面试的核心主题之一。很多候选人会说“我看输出还不错”，但生产系统不能靠感觉。

### 1. Eval-Driven Development

Agent eval 至少包含：

- golden dataset：代表真实任务的样本集；
- expected behavior：不一定只有标准答案，也可以是 rubric；
- LLM-as-Judge：适合开放式任务，但要校准；
- code evaluator：适合格式、约束、工具调用正确性；
- human review：高风险样本需要人评；
- regression gate：每次 prompt、模型、工具变更都要跑回归。

### 2. Trajectory 评估

Agent 不能只看最终答案。一个答案对了，但中间调用了错误工具、泄露了敏感信息、绕过了审批，也是不合格。

Trajectory eval 要看：

- 是否选择了正确工具；
- 参数是否正确；
- 是否遵守权限；
- 是否出现无意义循环；
- 是否在低置信度时请求帮助；
- token、延迟、成本是否在预算内。

这也是 tracing 很重要的原因。没有 trace，就无法 debug agent 的行为路径。

### 3. Shadow Testing / A-B Testing

上线前可以用 shadow testing：让新 agent 在真实流量旁路运行，但不产生真实副作用。比较新旧版本的答案质量、工具调用、成本、延迟和安全事件。

A/B 测试适合低风险场景；高风险场景则要先离线 eval，再 shadow，再灰度，再逐步放权。

### 4. Prompt Drift 监控

Prompt drift 包括：

- 上游模型版本变化导致行为变化；
- 检索语料变化导致答案风格变化；
- 工具 schema 变化导致调用错误；
- 用户行为变化导致历史 eval 不再覆盖真实分布。

所以 eval dataset 也要持续维护，从生产 trace 中抽样补充。

### 5. Testing & Release Strategy

Eval 不能替代工程测试。生产 Agent 至少还需要：

- **tool contract tests**：工具 schema、错误码、分页、超时、权限错误是否符合契约；
- **prompt / model / tool versioning**：每次改 prompt、换模型、改 tool schema 都要可追踪；
- **golden traces**：不只保存输入输出，还保存中间工具调用轨迹；
- **canary release**：新版本先跑小流量或 shadow traffic；
- **rollback**：模型、prompt、retriever、tool schema 都要能回滚；
- **mock LLM / fake tools**：让 CI 能稳定验证控制流，而不是每次依赖真实模型随机输出。

面试中把 eval、测试和发布放在一起讲，会比只说“我会用 LLM-as-Judge”更像生产工程师。

## 九、生产化、SRE 与成本优化：能不能规模化上线

### 1. Model Routing

不是所有任务都需要最强模型。常见策略：

- 分类、抽取、简单改写用小模型；
- 复杂推理、规划、代码修改用大模型；
- 高风险任务用强模型 + judge；
- 失败重试时可以升级模型。

面试中可以强调：model routing 不是只为省钱，也是为了延迟、吞吐和稳定性。

### 2. 缓存、批处理与流式输出

成本优化包括：

- prompt/template cache；
- embedding cache；
- retrieval cache；
- tool result cache；
- 批量处理离线任务；
- 对长任务使用 streaming 提升用户体验。

但缓存要注意权限和 freshness。用户 A 的检索结果不能被用户 B 复用；价格、库存、权限等实时数据不能长期缓存。

### 3. 幂等性、队列与异步编排

生产 agent 经常是长任务，通常要考虑：

- request id / idempotency key；
- job queue；
- retry policy；
- timeout；
- dead-letter queue；
- partial progress；
- 用户取消任务；
- resume from checkpoint。

这就是为什么优秀候选人会把 agent 当分布式系统，而不是聊天机器人。

### 4. Incident Response 与 Runbook

生产 Agent 迟早会出事故：模型供应商故障、工具 API 降级、检索索引污染、成本异常飙升、agent 死循环、错误审批、缓存串租户。面试里如果能主动讲 incident response，会非常加分。

需要准备的点包括：

- SLO：成功率、延迟、成本、人工升级率、工具失败率；
- rate limit 与 budget guardrail：防止单个任务无限烧钱；
- fallback：小模型失败升级大模型，工具失败转人工，RAG 失败只给保守回答；
- kill switch：发现异常时能快速停用某个 tool、某个 agent 或某个模型版本；
- runbook：on-call 如何根据 trace 定位是模型、retriever、tool、权限还是外部依赖的问题；
- postmortem：事故样本进入 eval dataset，防止同类问题复发。

## 十、系统设计题：日处理 1 万工单的客服 Agent

如果面试官让你设计一个日处理 1 万工单的客服 agent，可以按这个结构回答。

### 1. 目标与约束

- 日处理 1 万工单，峰值 QPS 需要估算；
- 支持分类、检索、回答、升级人工、创建内部 ticket；
- 高风险动作需要审批；
- 需要控制成本、延迟和错误率。

### 2. 架构

可以设计为：

1. Ingestion：接入邮件、聊天、表单。
2. Classifier：判断意图、语言、优先级、风险级别。
3. Retrieval：从知识库、历史工单、产品文档中检索。
4. Agent Orchestrator：决定回答、追问、调用工具或升级人工。
5. Tool Layer：查订单、查账户、建 ticket、退款申请等。
6. Guardrails：权限、PII、prompt injection、防越权。
7. Human Review：高风险或低置信度进入人工队列。
8. Observability：trace、eval、cost、latency、tool error。

一条典型请求的执行路径可以这样描述：用户提交问题后，系统先做身份与租户校验，再由 classifier 判断意图和风险；低风险 FAQ 走 RAG 生成草稿，高风险账户/退款问题必须调用内部工具查实时状态；orchestrator 根据检索证据、工具结果和策略规则决定是直接回复、追问缺失信息、创建工单，还是升级人工。整个过程中的 prompt、检索结果、工具参数、审批状态和最终回复都要写入 trace，后续才能做回放、评估和事故排查。

### 3. 为什么不是全自动？

因为客服系统有明显的风险分层：

- FAQ 可自动回复；
- 账户问题需要身份验证；
- 退款、赔偿、封号需要审批；
- 法务、投诉、舆情必须升级人工。

强回答要体现：**自动化率不是唯一指标，错误成本和用户信任更重要。**

### 4. Eval 指标

- resolution rate；
- escalation precision；
- first response latency；
- hallucination rate；
- policy compliance；
- tool call success rate；
- cost per resolved ticket；
- human override rate；
- customer satisfaction。

## 十一、面试官真正想听到什么？

强候选人通常会体现这些信号：

1. **上线经验**：不是 demo，而是真实用户、真实失败、真实成本。
2. **Failure modes 意识**：幻觉、死循环、错误工具调用、context 污染、silent failure。
3. **Eval 思维**：任何改动都要能衡量。
4. **安全边界**：最小权限、审批、审计、沙箱。
5. **分布式系统思维**：幂等、重试、checkpoint、队列、trace。
6. **成本和延迟意识**：知道 token、工具调用、模型路由如何影响单位经济性。
7. **知道何时不用 agent**：这是高级工程判断。

反过来，弱回答通常是：

- 只讲 prompt，不讲系统；
- 只讲框架，不讲 tradeoff；
- 只讲最终答案，不讲 trajectory；
- 只讲“加 guardrail”，不讲权限和运行时；
- 只讲“用 RAG”，不讲 chunking、rerank、eval；
- 只讲“多 agent”，不讲成本、终止条件和调试。

## 十二、一套高质量准备路线

如果只有一周时间，优先准备：

1. ReAct、Plan-and-Execute、workflow 的区别；
2. tool schema 设计与失败处理；
3. MCP 的概念、价值和“不是 REST”的 nuance；
4. eval/tracing/trajectory eval；
5. prompt injection 与最小权限；
6. 一个完整系统设计题：客服 agent 或 coding agent。

如果有一个月时间，建议补充：

- 做一个小型 agent 项目，但必须包含 tracing 和 eval；
- 接一个 MCP server；
- 做一组 golden dataset；
- 实现 tool retry/circuit breaker；
- 做 RAG 的 hybrid search + reranker 对比；
- 写一篇 postmortem：agent 失败时如何定位。

如果想继续沿着本站已有文章深入，可以按这个顺序读：先看 [Agent Loop 技术调研报告](/2026/03/16/agent-loop-study/) 建立 loop 直觉，再看 [Harness Engineering：当 AI 的缰绳比 AI 本身更重要](/2026/04/12/harness-engineering/) 理解为什么生产 agent 需要运行时约束，最后看 [MCP Output Schema：数据验证与结构化输出的技术实现](/2025/09/29/mcp-output-schema/) 补足工具 schema 与结构化输出细节。

## 十三、参考资料

- MCP Specification: https://modelcontextprotocol.io/specification/latest
- MCP Architecture: https://modelcontextprotocol.io/docs/learn
- Anthropic MCP announcement: https://www.anthropic.com/news/model-context-protocol
- Anthropic tool use: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/how-tool-use-works
- Anthropic MCP connector: https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector
- Anthropic evals for agents: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Anthropic writing tools for agents: https://www.anthropic.com/engineering/writing-tools-for-agents
- OpenAI Agents docs: https://developers.openai.com/api/docs/guides/agents
- OpenAI tools / MCP docs: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
- OpenAI agent evals: https://developers.openai.com/api/docs/guides/agent-evals
- LangGraph overview: https://docs.langchain.com/oss/python/langgraph/overview
- LangGraph workflows and agents: https://docs.langchain.com/oss/python/langgraph/workflows-agents
- Deep Agents overview: https://docs.langchain.com/oss/python/deepagents/overview
- Deep Agents production guide: https://docs.langchain.com/oss/python/deepagents/going-to-production
- Deep Agents harness capabilities: https://docs.langchain.com/oss/python/deepagents/harness
- LangChain State of Agent Engineering: https://langchain.com/state-of-agent-engineering
- CrewAI production architecture: https://docs.crewai.com/en/concepts/production-architecture
- Microsoft AutoGen: https://github.com/microsoft/autogen
- Microsoft Agent Framework: https://github.com/microsoft/agent-framework
- GitHub MCP Server: https://github.com/github/github-mcp-server
- GitHub Copilot Memory: https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/
- Ragas docs: https://docs.ragas.io/en/stable/
- DeepEval docs: https://deepeval.com/docs/introduction
- LangSmith evaluation: https://docs.langchain.com/langsmith/evaluation

## 结语

2026 年的 Agent 工程师面试，本质上是在问一个问题：**你能不能把不确定的 LLM 行为，包进一个可观测、可评估、可恢复、可控成本、可控权限的生产系统里？**

如果你的回答能围绕这个问题展开，你就已经超过了只会谈 prompt 和框架名的大多数候选人。
