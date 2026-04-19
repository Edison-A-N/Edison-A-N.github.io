---
title: Multi-Agent LLM 系统架构全景调研（2023–2026）
tags:
  - Multi-Agent
  - LLM
  - AI Architecture
categories:
  - AI Agent
excerpt: >-
  从学术论文到工业实践，全面梳理 Multi-Agent LLM 系统的架构分类、通信协议、生产框架与工程挑战。覆盖
  30+ 篇核心论文、7 大架构范式、9 个生产框架对比，以及 Anthropic/Google/Microsoft/OpenAI
  等公司的一线实践经验。
date: 2026-04-19 00:00:00
toc: true
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

从学术论文到工业实践，全面梳理 Multi-Agent LLM 系统的架构分类、通信协议、生产框架与工程挑战。

---

## 一、核心 Survey 论文

在深入具体架构之前，先建立认知框架。以下六篇 Survey 是理解该领域分类体系的基础：

| 论文 | 年份 | 核心分类维度 |
|------|------|-------------|
| Guo et al. "[Large Language Model based Multi-Agents: A Survey of Progress and Challenges](https://arxiv.org/abs/2402.01680)" | IJCAI 2024 | profiling / communication / capability acquisition |
| Tran et al. "[Multi-Agent Collaboration Mechanisms: A Survey of LLMs](https://arxiv.org/abs/2501.06322)" | 2025 | types(合作/竞争/混合) × structures(P2P/集中/分布) × strategies(角色/模型) |
| Yan et al. "[Beyond Self-Talk: A Communication-Centric Survey of LLM-Based Multi-Agent Systems](https://arxiv.org/abs/2502.14321)" | 2025 | 系统级通信(架构/目标/协议) + 内部通信(策略/范式/对象/内容) |
| Luo et al. "[Large Language Model Agent: A Survey on Methodology, Applications and Challenges](https://arxiv.org/abs/2503.21460)" | 2025 | Construction → Collaboration → Evolution 三维框架 |
| "[LLMs Working in Harmony](https://arxiv.org/abs/2504.01963)" | 2025 | Architecture / Memory / Planning / Frameworks 四支柱 |
| "[Agentic AI: Architectures, Taxonomies, and Evaluation](https://arxiv.org/abs/2601.12560)" | 2026 | Perception/Brain/Planning/Action/Tool/Collaboration + Chain/Star/Mesh 拓扑 |

**研究者的共识分类维度**：

- **拓扑**：Chain（链式）/ Star（星型）/ Mesh（网状）/ Tree（树形）/ Dynamic（动态）
- **通信目标**：Cooperation（合作）/ Competition（竞争）/ Coopetition（混合）
- **控制模式**：Centralized（集中）/ Decentralized（去中心化）/ Hybrid（混合）

---

## 二、七大架构范式

### A. Supervisor / Orchestrator-Worker（星型拓扑）

**核心思想**：中央协调者分解任务 → 分发给 worker → 聚合结果。这是 **生产环境最常见的模式**，覆盖约 70% 的企业部署。

#### 学术论文

| 系统 | 年份/会议 | 核心设计 | 关键贡献 |
|------|----------|---------|---------|
| [AutoGen](https://arxiv.org/abs/2308.08155) (Microsoft) | COLM 2024 | ConversableAgent + GroupChat manager；支持 star/mesh 动态切换 | 灵活对话模式；GAIA benchmark #1 |
| [TalkHier](https://arxiv.org/abs/2502.11098) | 2025 | 图结构 G=(V,E) + 结构化通信协议（消息/中间输出/背景信息） | 首个集成结构化通信 + 层级细化的框架 |
| [HALO](https://arxiv.org/abs/2505.13516) | 2025 | 三层架构：规划 Agent → 角色设计 Agent → 推理 Agent + Workflow Search Engine | 动态角色实例化（非预定义） |
| [AgentOrchestra](https://arxiv.org/abs/2506.12508) | 2025 | 严格二层划分：Conductor 规划 + 专家子 Agent；函数调用 API 精确委派 | 闭环优化 + 成本敏感编排 |
| [DEPART](https://openreview.net/forum?id=Q4Nk6PlZYH) | arXiv 2025 (ICLR 2026 在审) | 三角色：planner / action executor / vision executor；HIMPO 交替优化策略 | 层级化多轮交互优化 |

#### 工业实践

**Anthropic Research System**（[工程博客](https://www.anthropic.com/engineering/built-multi-agent-research-system)）

Claude Research 功能的核心架构：

- **Lead Agent**（Claude Opus 4）负责规划和协调
- **3-5 Subagents**（Claude Sonnet 4）并行执行搜索任务
- Effort-scaling 规则：简单查询 1 agent + 3-10 tool calls；复杂查询最多 8 subagents
- **实测数据**：比单 Agent +90.2% 性能，但 **15x token 消耗**

> "Multi-agent architectures effectively scale token budgets in ways that single agents cannot."

**Salesforce Agentforce**（[博客](https://www.salesforce.com/blog/agentforce-reducing-latency/)）

- Atlas 推理引擎做图结构编排
- 用专用 SLM（HyperClassifier）替代 LLM 做路由分类，**30x 延迟降低**
- Superagent 架构：Primary Agent → Domain Agents → Specialist Agents

**Microsoft Magentic-One**（[GitHub](https://github.com/microsoft/autogen)）

- Orchestrator + 4 专家（WebSurfer, FileSurfer, Coder, ComputerTerminal）
- Task Ledger（外层循环）+ Progress Ledger（内层循环）做自反思

**LangChain Deep Agents**（[GitHub](https://github.com/langchain-ai/deepagents) · [文档](https://docs.langchain.com/deepagents)）

- 基于 LangGraph 的 "agent harness"，21K+ stars
- 核心四件套：**Planning**（`write_todos` 任务分解）+ **Subagents**（`task` 工具委派隔离上下文）+ **Filesystem**（持久化记忆）+ **Context Management**（对话过长时自动摘要）
- 设计哲学：batteries-included，开箱即用的 Orchestrator-Worker 模式，受 Claude Code 启发
- 被 [AgentHive (ACL ARR 2026 在审)](https://openreview.net/forum?id=BYiwNYYixO) 归类为 **Star MAS**——支持多 Agent 协作但依赖中央协调者
- 同时提供 Python SDK 和 [TypeScript 版本](https://github.com/langchain-ai/deepagentsjs)，以及终端 CLI（类 Claude Code / Cursor 体验）

#### 权衡

| 维度 | 优势 | 劣势 |
|------|-----|------|
| 控制性 | 集中调试，清晰审计链 | 协调者成为瓶颈 |
| 可靠性 | 简单的故障隔离 | 单点故障 |
| 成本 | 可做模型分层（贵模型编排，便宜模型执行） | 协调开销占 15-45% token 预算 |
| 延迟 | Worker 并行降低 wall-clock time | 串行编排推理增加延迟 |

---

### B. Chain / Pipeline（链式拓扑）

**核心思想**：Agent 按顺序执行，每个处理后传递给下一个。确定性控制流。

#### 学术论文

| 系统 | 年份/会议 | 核心设计 | 关键贡献 |
|------|----------|---------|---------|
| [MetaGPT](https://arxiv.org/abs/2308.00352) | ICLR 2024 | SOP 编码为 prompt 序列；软件公司流水线隐喻 | 减少级联幻觉；中间结果验证 |
| [ChatDev](https://arxiv.org/abs/2307.07924) | ACL 2024 | Chat Chain 划分开发阶段（Design → Coding → Testing） | Dehallucination 机制 |
| [Chain-of-Agents (CoA)](https://arxiv.org/abs/2406.02818) | NeurIPS 2024 | Worker 顺序处理长文本片段 → Manager 聚合 | 解决单 Agent 长上下文限制 |

#### 工业实践

**LangGraph StateGraph**（[文档](https://langchain-ai.github.io/langgraph/)）

- 有向图 + typed state channels + 条件边 + 循环支持
- 内置 `PostgresSaver` checkpointing + time-travel debugging
- 月搜索量 27,100，生产成熟度最高（38M+ 下载）

**CrewAI Sequential**（[GitHub](https://github.com/crewAIInc/crewAI)）

- `Process.sequential` 链式执行，task output 作为下一个 task 的 context
- 20 行代码即可启动，最快原型开发体验
- 450M agents/月 处理量

**Uber AI Coding Agents**（[技术博客](https://www.uber.com/ch/en/ai-solutions/the-agentic-ai-tech-stack/)）

- LangGraph 构建确定性 pipeline 做测试验证
- 节省 21,000 开发者工时；测试覆盖率 +10%

---

### C. Flat / Peer-to-Peer — 辩论与共识（Mesh 拓扑）

**核心思想**：平等地位的 Agent 直接交互，无中央协调。包括辩论、角色扮演、共识系统。

#### 学术论文

| 系统 | 年份/会议 | 核心设计 | 关键贡献 |
|------|----------|---------|---------|
| [CAMEL](https://ghli.org/camel.pdf) | NeurIPS 2023 | Inception Prompting 引导两个 Agent 自主角色扮演 | 首个自主多 Agent 协作框架 |
| [Multi-Agent Debate](https://proceedings.mlr.press/v235/du24c.html) (Du et al.) | ICML 2024 | 多轮辩论提升事实准确性和推理 | ~89% 共识率；优于 CoT/reflection |
| [ChatEval](https://arxiv.org/abs/2308.07201) | ICLR 2024 | 多 Agent 做评审裁判，通过结构化辩论评估文本质量 | 多 Agent 评估比单 Agent 更可靠 |
| [FREE-MAD](https://arxiv.org/abs/2509.11035) | 2025 | 无共识辩论 + 基于分数的决策 + 反从众机制 | 单轮即优于多轮共识，大幅省 token |
| [MAR (Multi-Agent Reflexion)](https://arxiv.org/abs/2512.20845) | 2025 | 多角色 critics 辩论取代单 Agent 反思 | 减少单 Agent 反思的停滞问题 |
| [SwarmSys](https://arxiv.org/abs/2510.10047) | 2025 | 信息素痕迹 + 辩论-共识循环 | 无中心控制的涌现协调 |

#### 关键发现

[Wei et al. (ACL 2025)](https://aclanthology.org/2025.acl-long.958.pdf) 的对比实验：

- **投票（Majority Voting）** 在推理任务上最优（+13.2%）
- **共识（Consensus）** 在知识任务上最优（+2.8%）
- 新研究 FREE-MAD 完全消除共识需求，用分数决策替代

---

### D. Dynamic / Adaptive（动态拓扑）

**核心思想**：系统根据任务动态调整架构、Agent 选择、拓扑结构。**这是 2025-2026 的学术前沿方向。**

| 系统 | 年份/会议 | 核心设计 | 关键贡献 |
|------|----------|---------|---------|
| [AgentVerse](https://openreview.net/forum?id=EHg5GDnyq1) | ICLR 2024 | 4 阶段框架：招募 → 协作决策 → 执行 → 评估；MDP 建模 | 动态调整团队组成 |
| [DyLAN](https://arxiv.org/abs/2310.02170) | COLM 2024 | 多层前馈网络 + Agent Importance Score（基于 peer rating） | 推理时 Agent 选择；MMLU +25% |
| [AMAS](https://aclanthology.org/2025.emnlp-industry.144.pdf) | EMNLP 2025 | Query-adaptive 图编排器从结构池中选最优拓扑 | 首个 per-query 异构拓扑适配 |
| [REDEREF](https://openreview.net/forum?id=bQgaTaN2eG) | arXiv 2025 (ICLR 2026 被拒) | 在线贝叶斯委派（Thompson Sampling）+ 校准自反思 + 证据校验聚合 | 无需训练的概率化动态路由 |

---

### E. Handoff / Swarm（控制权转移）

**核心思想**：Agent 间动态传递控制权，基于上下文判断"交给谁"。

| 系统 | 来源 | 核心设计 |
|------|-----|---------|
| [OpenAI Swarm](https://github.com/openai/swarm) → [Agents SDK](https://openai.github.io/openai-agents-python/) | OpenAI 2024-2025 | 极简两原语（Agent + Handoff）；无状态客户端执行；Swarm 为教育用途，Agents SDK 为生产版 |
| [Google ADK Agent Transfer](https://google.github.io/adk-docs/agents/multi-agents/) | Google 2025 | 层级交接 + scoped context（`include_contents` 控制子 Agent 可见范围） |

**Google ADK 的两种多 Agent 模式**（[工程博客](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)）：

1. **Agents as Tools**：root agent 把子 agent 当函数调用，子 agent 无历史上下文
2. **Agent Transfer**：控制权完全移交子 agent，子 agent 继承 session 视图

---

### F. Agent 平台与网络（Platform / Network）

**核心思想**：提供统一平台让多个异构 Agent 协作，强调开放性、可部署性和用户可访问性。

#### 学术论文

| 系统 | 年份/会议 | 核心设计 | 关键贡献 |
|------|----------|---------|---------|
| [OpenAgents](https://arxiv.org/abs/2310.10634) (xlang-ai) | COLM 2024 | 三专业 Agent 平台：Data Agent（Python/SQL 数据分析）+ Plugins Agent（200+ API 工具）+ Web Agent（自主浏览）；Observation → Deliberation → Action 决策循环 | 首个面向**非专家用户**的开放 Agent 平台；强调应用级设计和系统鲁棒性（自适应数据映射、流式响应、故障处理） |

#### 工业实践

**OpenAgents Network**（[GitHub](https://github.com/openagents-org/openagents) · [官网](https://openagents.com)）

- **定位**：AI Agent Networks 开放协作平台——"Slack for Agents"
- **三层架构**：
  - **Workspace**：浏览器端协作层，人与 Agent 共享线程、文件、实时浏览器
  - **Launcher**（`agn` CLI）：Agent 管理层，安装/配置/连接任意 coding agent（Claude Code, Codex CLI, Cursor, OpenCode 等 10+）
  - **Network SDK**：事件驱动架构，Mod 系统（messaging, files, browser, games），支持 MCP 和 A2A 协议
- **核心机制**：事件驱动通信（所有交互通过 events）；多传输协议（WebSocket:8700, HTTP:8500, gRPC:8600, MCP:8800）
- **开源**：Apache 2.0，无厂商锁定

---

### G. Consensus / Ensemble（并行投票）

**核心思想**：多个 Agent 独立处理同一输入，通过投票或加权聚合输出。

| 系统 | 来源 | 设计 | 效果 |
|------|-----|------|------|
| AI NeuroSignal（[参考](https://nicchin.com/blog/multi-agent-ai-systems-guide)） | 交易领域 | 20 agents 不同模型后端 + 加权投票 | 假信号减少 73% |
| Spotify Ads AI（[工程博客](https://engineering.atspotify.com/2026/2/our-multi-agent-architecture-for-smarter-advertising)） | 广告 | ParallelAgent 并行执行 Goal/Audience/MediaPlanner | 媒体计划：15-30min → 5-10sec |

---

## 三、通信协议标准化

Multi-Agent 系统正在形成分层协议栈：

```
┌─────────────────────────────────────────┐
│         用户界面 / 应用层                 │
├─────────────────────────────────────────┤
│  A2A  (Agent-to-Agent 水平协调)          │
├─────────────────────────────────────────┤
│  MCP  (Agent-to-Tool 垂直集成)           │
├─────────────────────────────────────────┤
│       外部 API / 数据库 / 文件            │
└─────────────────────────────────────────┘
```

### MCP — Model Context Protocol

- **解决问题**：N 个 Agent × M 个工具 → 统一为 N+M 的连接问题
- **传输**：JSON-RPC 2.0（stdio 或 HTTP+SSE）
- **原语**：Tools, Resources, Prompts, Sampling, Roots
- **采用规模**：VS Code, Claude Desktop, Cursor 等；97M+ 下载
- **维护者**：Anthropic
- **规范**：[modelcontextprotocol.io](https://modelcontextprotocol.io/docs/concepts/architecture)

### A2A — Agent-to-Agent Protocol

- **解决问题**：跨框架 Agent 互操作
- **传输**：JSON-RPC 2.0 over HTTPS；Agent Card 做服务发现
- **核心机制**：6 个任务状态（submitted → working → completed/failed/cancelled）；SSE 流式
- **治理**：Linux Foundation；150+ 合作伙伴；v1.0 于 2026 年 3 月发布
- **规范**：[a2aproject.github.io](https://a2aproject.github.io/A2A/latest/specification)

### ANP — Agent Network Protocol

- **解决问题**：去中心化 P2P Agent 网络
- **状态**：开放社区协议，早期阶段

---

## 四、规划与任务分解

这一方向关注 Agent 如何将复杂任务拆解为可执行子任务。

| 论文 | 年份 | 核心方法 | 关键发现 |
|------|------|---------|---------|
| "[Understanding the Planning of LLM Agents: A Survey](https://arxiv.org/abs/2402.02716)" | 2024 | 分类：Task Decomposition / Multi-Plan Selection / External Module / Reflection & Memory | 首个系统化 LLM 规划综述 |
| [MAP — A Brain-Inspired Agentic Architecture](https://doi.org/10.1038/s41467-025-63804-5) | Nature Comm. 2025 | 专用模块：TaskDecomposer / Actor / Monitor / Predictor / Evaluator | 超 CoT +32%，超辩论 +49%，超 ToT +68% |
| "[PlanGenLLMs: A Survey of LLM Planning](https://aclanthology.org/2025.acl-long.958.pdf)" | ACL 2025 | 6 维评价：completeness / executability / optimality / representation / generalization / cost | 识别多 Agent 规划为重要未充分探索方向 |

---

## 五、生产框架对比矩阵

| 框架 | 编排模型 | 状态持久化 | 模型锁定 | 成熟度 | 最佳场景 |
|------|---------|-----------|---------|-------|---------|
| **[LangGraph](https://langchain-ai.github.io/langgraph/)** | 有向图 + 条件边 | Checkpoint + time travel | 无 | ★★★★★ | 复杂分支/循环/HITL |
| **[CrewAI](https://docs.crewai.com/)** | 角色 + Seq/Hierarchical | Flow-based | 无 | ★★★★☆ | 角色化团队工作流 |
| **[OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)** | Handoff | Context Variables | OpenAI only | ★★★★☆ | OpenAI 原生栈 |
| **[Google ADK](https://google.github.io/adk-docs/)** | 层级 Agent 树 | Session State | Gemini 优化 | ★★★☆☆ | Google Cloud 生态 |
| **[Anthropic Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)** | Orchestrator-Worker | Via MCP | Claude only | ★★★★☆ | 安全关键应用 |
| **[AutoGen/AG2](https://github.com/microsoft/autogen)** | 对话 GroupChat / Actor | Event sourcing | 无 | 维护模式 | 研究/代码执行 |
| **[Deep Agents](https://github.com/langchain-ai/deepagents)** | Orchestrator-Worker (Star) | Filesystem + Checkpoint | 无 | ★★★★☆ (21K stars) | 长任务/编码/研究 |
| **[OpenAgents Network](https://github.com/openagents-org/openagents)** | 事件驱动 / P2P Network | Event-driven + Workspace | 无 | ★★★☆☆ | 异构 Agent 协作网络 |

更详细的对比可参考 [Best Multi-Agent Frameworks in 2026](https://gurusup.com/blog/best-multi-agent-frameworks-2026) 和 [Complete Guide to AI Agent Architectures](https://agnt.gg/articles/the-complete-guide-to-ai-agent-architectures-2026)。

---

## 六、生产工程挑战与解法

### 1. 状态管理

**问题**：Multi-Agent 系统天然有状态，崩溃即丢失进度。

**解法**：
- LangGraph `PostgresSaver` 做 checkpointing（支持 time-travel）
- 无状态 Agent + 外部状态存储（best practice）
- Pydantic typed state 做 schema 校验（防止 80% 运行时错误）

### 2. 错误恢复

**问题**：生产环境 41-87% 失败率；级联故障；无限循环。

**解法**：
- 熔断器（per-agent 和 per-tool）+ 指数退避
- 拓扑状态机检测循环（AutoGen [提案](https://github.com/microsoft/autogen/issues/7409)）
- max iteration 硬限 + 超时强制终止
- 优雅降级：工具失败时 LLM 自适应

### 3. 成本控制

**问题**：Multi-Agent 消耗 3-15x token（Anthropic [实测](https://www.anthropic.com/engineering/built-multi-agent-research-system) 15x）；失控循环烧预算。

**解法**：
- **模型分层**：贵模型（Opus）做编排，便宜模型（Sonnet/Haiku）做执行
- Prompt caching：~90% 成本降低
- Per-session 硬预算 + 成本异常告警（2x 日均即触发）
- Semantic caching：~31% 冗余消除

### 4. 延迟优化

**问题**：顺序 Agent 链路延迟累加；p99 随协调深度爆炸。

**解法**：
- 并行 fan-out（Spotify：15-30min → 5-10sec）
- 专用 SLM 替代 LLM 路由（Salesforce HyperClassifier：[30x 加速](https://www.salesforce.com/blog/agentforce-reducing-latency/)）
- 流式输出（LangGraph per-node streaming；SSE 实时更新）

### 5. 可观测性

**问题**：Agent "错但不宕"，传统监控盲区。

**解法**：
- OpenTelemetry + LLM 语义约定；trace ID 贯穿 Agent 调用链
- Per-request / per-user / per-model 成本追踪
- LLM-as-judge 质量指标
- Agent 决策模式监控（不只监控延迟和错误率）

详细的生产模式可参考 [Microsoft ISE: Patterns for Building a Scalable Multi-Agent System](https://devblogs.microsoft.com/ise/multi-agent-systems-at-scale/) 和 [Microsoft: Designing Multi-Agent Intelligence](https://developer.microsoft.com/blog/designing-multi-agent-intelligence)。

---

## 七、公司案例一览

| 公司 | 架构模式 | 框架 / 引擎 | 关键指标 | 参考 |
|------|---------|------------|---------|------|
| **Anthropic** | Orchestrator-Worker | Custom（Opus + Sonnet） | +90.2% vs 单 Agent | [工程博客](https://www.anthropic.com/engineering/built-multi-agent-research-system) |
| **Uber** | Supervisor + Event-Driven | LangGraph + Kafka | 21,000 dev hours saved | [技术博客](https://www.uber.com/ch/en/ai-solutions/the-agentic-ai-tech-stack/) |
| **Spotify** | Parallel Consensus | Google ADK | 15-30min → 5-10sec | [工程博客](https://engineering.atspotify.com/2026/2/our-multi-agent-architecture-for-smarter-advertising) |
| **Salesforce** | Hierarchical Superagent | Atlas Reasoning Engine | 70% 延迟降低 | [博客](https://www.salesforce.com/agentforce/ai-agents/superagents/) |
| **Google** | Hierarchical Agent Tree | ADK | Context-aware 多 Agent | [开发者博客](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/) |
| **Microsoft** | Orchestrator + Specialists | AutoGen / Magentic-One | Task + Progress Ledger | [设计博客](https://developer.microsoft.com/blog/designing-multi-agent-intelligence) |

---

## 八、关键结论

### 1. 拓扑即架构决策

- **Chain**：确定性工作流（编码、测试 pipeline）
- **Star/Supervisor**：集中协调（70% 生产场景首选）
- **Mesh/Debate**：头脑风暴、评估、事实校验
- **Tree/Hierarchical**：多领域复杂编排
- **Dynamic**：学术前沿，per-task 自适应拓扑

### 2. "先简单后复杂" 是工业共识

Anthropic、OpenAI、Google 一致强调：

> 从单 Agent + 好 prompt 开始，只在确实需要时才引入多 Agent。复杂性本身不是目标。
> — [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

### 3. 成本是一等架构约束

Anthropic 实测 multi-agent 系统 token 消耗是 chat 的 ~15x。必须在架构层面做：
- 模型分层（Brain/Worker 模式）
- Token 预算硬限
- Prompt caching

### 4. 协议在标准化

MCP（工具层）+ A2A（Agent 层）正在成为互操作基础设施。选择框架时应考虑对这两个协议的支持程度。

### 5. 动态自适应是学术前沿

2025-2026 的论文密集关注 per-task 拓扑自适应（AMAS, REDEREF, DyLAN），从固定架构走向 **运行时动态配置**。

### 6. 可观测性先于复杂性

在增加 Agent 数量之前，先确保你能看到每个 Agent 在做什么、花了多少钱、为什么失败。传统 APM 不够——需要 Agent 决策层面的追踪。

---

## 参考文献索引

### Survey 论文
1. Guo et al. "Large Language Model based Multi-Agents: A Survey of Progress and Challenges." IJCAI 2024. [arXiv:2402.01680](https://arxiv.org/abs/2402.01680)
2. Tran et al. "Multi-Agent Collaboration Mechanisms: A Survey of LLMs." 2025. [arXiv:2501.06322](https://arxiv.org/abs/2501.06322)
3. Yan et al. "Beyond Self-Talk: A Communication-Centric Survey." 2025. [arXiv:2502.14321](https://arxiv.org/abs/2502.14321)
4. Luo et al. "Large Language Model Agent: A Survey on Methodology." 2025. [arXiv:2503.21460](https://arxiv.org/abs/2503.21460)
5. "LLMs Working in Harmony." 2025. [arXiv:2504.01963](https://arxiv.org/abs/2504.01963)
6. "Agentic AI: Architectures, Taxonomies, and Evaluation." 2026. [arXiv:2601.12560](https://arxiv.org/abs/2601.12560)

### 框架论文
7. Wu et al. "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation." COLM 2024. [arXiv:2308.08155](https://arxiv.org/abs/2308.08155)
8. Li et al. "CAMEL: Communicative Agents for 'Mind' Exploration." NeurIPS 2023. [项目页](https://ghli.org/camel.pdf)
9. Hong et al. "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework." ICLR 2024. [arXiv:2308.00352](https://arxiv.org/abs/2308.00352)
10. Qian et al. "ChatDev: Communicative Agents for Software Development." ACL 2024. [arXiv:2307.07924](https://arxiv.org/abs/2307.07924)
11. Chen et al. "AgentVerse: Facilitating Multi-Agent Collaboration." ICLR 2024. [OpenReview](https://openreview.net/forum?id=EHg5GDnyq1)
12. Liu et al. "DyLAN: Dynamic LLM-Agent Network." COLM 2024. [arXiv:2310.02170](https://arxiv.org/abs/2310.02170)
13. Xie et al. "OpenAgents: An Open Platform for Language Agents in the Wild." COLM 2024. [arXiv:2310.10634](https://arxiv.org/abs/2310.10634)

### 平台与 Agent Harness
14. LangChain. "Deep Agents: Agent harness built with LangGraph." 2025. [GitHub](https://github.com/langchain-ai/deepagents) · [文档](https://docs.langchain.com/deepagents)
15. OpenAgents Network. "AI Agent Networks for Open Collaboration." 2025. [GitHub](https://github.com/openagents-org/openagents)

### 辩论与共识
16. Du et al. "Improving Factuality and Reasoning through Multiagent Debate." ICML 2024. [Proceedings](https://proceedings.mlr.press/v235/du24c.html)
17. Chan et al. "ChatEval: Towards Better LLM-based Evaluators through Multi-Agent Debate." ICLR 2024. [arXiv:2308.07201](https://arxiv.org/abs/2308.07201)
18. "FREE-MAD: Consensus-Free Multi-Agent Debate." 2025. [arXiv:2509.11035](https://arxiv.org/abs/2509.11035)
19. "MAR: Multi-Agent Reflexion." 2025. [arXiv:2512.20845](https://arxiv.org/abs/2512.20845)

### 规划
20. "Understanding the Planning of LLM Agents: A Survey." 2024. [arXiv:2402.02716](https://arxiv.org/abs/2402.02716)
21. Webb et al. "A brain-inspired agentic architecture to improve planning with LLMs." Nature Communications, 2025. [DOI](https://doi.org/10.1038/s41467-025-63804-5)

### 动态架构
22. "TalkHier." 2025. [arXiv:2502.11098](https://arxiv.org/abs/2502.11098)
23. "HALO." 2025. [arXiv:2505.13516](https://arxiv.org/abs/2505.13516)
24. "AMAS." EMNLP 2025. [ACL Anthology](https://aclanthology.org/2025.emnlp-industry.144.pdf)
25. "REDEREF." arXiv 2025 (ICLR 2026 被拒). [OpenReview](https://openreview.net/forum?id=bQgaTaN2eG)
26. Hsu et al. "DEPART: Hierarchical Multi-Agent System for Multi-Turn Interaction." arXiv 2025 (ICLR 2026 在审). [OpenReview](https://openreview.net/forum?id=Q4Nk6PlZYH)
27. Zhang et al. "AgentOrchestra: Orchestrating Multi-Agent Intelligence with the TEA Protocol." 2025. [arXiv:2506.12508](https://arxiv.org/abs/2506.12508)
28. Li et al. "SwarmSys: Decentralized Swarm-Inspired Agents." 2025. [arXiv:2510.10047](https://arxiv.org/abs/2510.10047)

### 工业实践
29. Anthropic. "How we built our multi-agent research system." 2025. [博客](https://www.anthropic.com/engineering/built-multi-agent-research-system)
30. Microsoft. "Designing Multi-Agent Intelligence." 2025. [博客](https://developer.microsoft.com/blog/designing-multi-agent-intelligence)
31. Microsoft ISE. "Patterns for Building a Scalable Multi-Agent System." 2025. [博客](https://devblogs.microsoft.com/ise/multi-agent-systems-at-scale/)
32. Google. "Architecting efficient context-aware multi-agent framework for production." 2025. [博客](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)
33. Spotify. "Our Multi-Agent Architecture for Smarter Advertising." 2026. [博客](https://engineering.atspotify.com/2026/2/our-multi-agent-architecture-for-smarter-advertising)
34. Zylos Research. "AI Agent Fork-Merge Patterns." 2026. [文章](https://zylos.ai/research/2026-03-10-ai-agent-fork-merge-patterns)
35. AGNT.gg. "The Complete Guide to AI Agent Architectures 2026." [文章](https://agnt.gg/articles/the-complete-guide-to-ai-agent-architectures-2026)
36. GuruSup. "Best Multi-Agent Frameworks in 2026." [文章](https://gurusup.com/blog/best-multi-agent-frameworks-2026)
