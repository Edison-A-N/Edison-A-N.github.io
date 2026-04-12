---
title: Harness Engineering：当 AI 的缰绳比 AI 本身更重要
tags:
  - LLM
  - AI Agent
  - Harness Engineering
categories:
  - AI Agent
date: 2026-04-12 00:00:00
excerpt: >-
  追溯 Harness 概念从 1980 年代测试工具到 2026 年 AI Agent 基础设施的完整演进，拆解 Agent = Model +
  Harness 的核心公式与六大组件，分析 OpenAI Codex、Manus、LangChain、Anthropic Claude Code
  四个改变行业认知的案例，并讨论 Build to Delete 原则与 Martin Fowler 的控制论框架。
toc: true
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

> 2025 年是 Agent 之年，2026 年是 Harness 之年。

2026 年 2 月，OpenAI 的一个三人团队公布了一项实验结果：他们用 5 个月时间交付了一个超过 100 万行代码的生产系统，发起了约 1,500 个 Pull Request —— **没有一行代码是人类手写的**。每一行应用逻辑、测试、CI 配置、文档，全部由 Codex Agent 生成。

工程师没有写代码。他们设计了让 AI 可靠写代码的系统。

这个系统 —— 约束、反馈循环、文档结构、lint 规则、生命周期管理 —— 被他们命名为 **Harness**。围绕它的工程实践，被称为 [Harness Engineering](https://openai.com/index/harness-engineering/)。

这篇文章追溯 Harness 概念从 1980 年代测试工具到 2026 年 AI Agent 基础设施的完整演进，拆解它的核心架构，分析几个改变行业认知的案例，并讨论它对工程师角色的深远影响。

---

## 一、一个延续了 40 年的隐喻

"Harness" 不是随便选的词。在马术中，harness 是缰绳、嚼子、鞍具的总称 —— 一套将强大动物的力量引导到有用方向的装备。马不自行决定去向；骑手通过 harness 操控。这个隐喻在 AI Agent 领域被广泛采用，[Anthropic 的 "Building Effective Agents" 文档](https://www.anthropic.com/engineering/building-effective-agents)、[OpenAI 的 Harness Engineering 博文](https://openai.com/index/harness-engineering/)和 [LangChain 的 Agent Harness 分析](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)都使用了这个类比。

这个隐喻精准映射到软件工程的每个时代：被包裹的核心能力（代码、模型、Agent）本身强大但无方向，Harness 是引导它产出可靠结果的一切基础设施。

**跨越 40 年不变的定义**：Harness = 包裹核心能力的运行时环境，负责控制执行、提供基础设施、管理状态、确保可复现性。

变化的只是"核心能力"是什么。

---

## 二、四个时代

### 时代一：Test Harness（1980s - 2000s）

**Harness 的职责：包裹代码，验证正确性。**

1987 年，IEEE Standard 1008 正式定义了软件单元测试术语，"test harness" 概念成型。按 ISTQB 的定义，test harness 是测试执行引擎、桩（stubs）、驱动（drivers）、测试夹具（fixtures）的集合，为被测代码提供模拟基础设施。

1997 年的一个关键时刻：Kent Beck 和 Erich Gamma 在飞往 OOPSLA 大会的航班上写出了 JUnit。此前 Kent Beck 已于 1989 年为 Smalltalk 编写了 SUnit，JUnit 将其移植到 Java，奠定了整个 xUnit 家族的基础。此后 NUnit、pytest 等相继出现，测试 harness 成为每个严肃工程团队的标配。

这个时代确立了一个重要区分：**Framework 提供编程模型**（注解、生命周期钩子），**Harness 是包含 framework 在内的完整运行时环境**。JUnit 是 framework，但让 JUnit 跑起来的整个配置、执行、报告体系是 harness。

### 时代二：CI/Build Harness（2000s - 2010s）

**Harness 的职责：从包裹"测试"扩展为包裹"整个交付流程"。**

随着测试与构建系统融合，harness 的边界大幅扩展：

| 时间      | 工具                                 | Harness 角色                        |
| --------- | ------------------------------------ | ----------------------------------- |
| 2004/2011 | Hudson（2004）→ Jenkins（2011 更名） | CI/CD harness + 插件生态            |
| 2011      | Travis CI                            | 声明式构建 harness（`.travis.yml`） |
| 2017      | Harness.io                           | 直接以 "Harness" 命名的 CI/CD 平台  |
| 2019      | GitHub Actions                       | YAML workflow harness               |

这个时代的 harness 开始具备 Test Intelligence（只跑受影响的测试）、Cache Intelligence（自动缓存依赖）、Pipeline-as-Code（声明式配置）等能力。harness 从一个测试工具变成了流水线编排器。

### 时代三：Evaluation Harness（2020 - 2024）

**Harness 的职责：从验证代码正确性，变为评估模型能力。**

2020 年 8 月，EleutherAI 发布了 [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness)。这是第一个统一的大语言模型评估框架，如今已有 12,000+ stars（截至 2026 年 4 月），驱动着 HuggingFace Open LLM Leaderboard。

它的核心设计极其优雅：所有模型实现三个统一接口（`loglikelihood`、`generate_until`、`loglikelihood_rolling`），60+ 基准测试通过 YAML 配置，评估完全可复现。

```python
# lm-evaluation-harness 的模型接口
class LM:
    def loglikelihood(self, requests) -> list[tuple[float, bool]]: ...
    def generate_until(self, requests) -> list[str]: ...
    def loglikelihood_rolling(self, requests) -> list[tuple[float, bool]]: ...
```

2022 年 11 月，Stanford CRFM 发布了 [HELM](https://github.com/stanford-crfm/helm)（Holistic Evaluation of Language Models），将评估扩展到 7 个维度（准确性、校准性、鲁棒性、公平性、偏见、毒性、效率）× 16 个核心场景，发表于 TMLR 2023。

这个时代的关键转变：Harness 的判定从确定性的 pass/fail 变为多维度、概率性的能力评估。被测对象从"代码"变成了"模型"。

### 时代四：Agent Harness（2024 - 2026，当前前沿）

**Harness 的职责：从评估模型，变为让模型在真实世界中可靠地完成工作。**

Agent Harness 的理论基础可以追溯到 2022 年 10 月 Yao et al. 发表的 [ReAct 论文](https://arxiv.org/abs/2210.03629)，它定义了 Thought → Action → Observation 的循环 —— 这正是 Agent Harness 编排的核心循环。

2024 年，LangChain、AutoGen、CrewAI 等 Agent Framework 兴起，但 framework 和 harness 是不同的东西（后文详述）。真正的转折发生在 2026 年初。

**2026 年的六个关键时刻**：

| 时间      | 事件                                                                                                                          | 意义                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 2026.2.5  | Mitchell Hashimoto 发表 "My AI Adoption Journey"                                                                              | 在个人实践中提出 "Engineer the Harness" 理念 |
| 2026.2.11 | [OpenAI 发表 "Harness Engineering"](https://openai.com/index/harness-engineering/)                                            | 100 万行零手写代码，正式命名学科             |
| 2026.3.10 | [LangChain 发表 "The Anatomy of an Agent Harness"](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)            | 提出 Agent = Model + Harness 核心公式        |
| 2026.3.31 | [Zylos Research 发表 "Agent Harness Design Patterns"](https://zylos.ai/research/2026-03-31-agent-harness-design-patterns)     | 系统化五层架构分析                           |
| 2026.4.2  | [Martin Fowler 发表 "Harness Engineering for Coding Agent Users"](https://martinfowler.com/articles/harness-engineering.html) | 工程方法论成熟标志                           |
| 2026.4.8  | [首篇学术综述 "Agent Harness for LLM Agents: A Survey"](https://www.preprints.org/manuscript/202604.0428)                     | 从实践走向学术体系化                         |

从 test harness 到 agent harness，40 年间被包裹的对象从代码 → 流水线 → 模型 → Agent，但 harness 的本质职责从未改变：**让强大但不可靠的东西变得可靠**。

---

## 三、核心公式与六大组件

### Agent = Model + Harness

[LangChain 在 2026 年 3 月的文章中](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)给出了一个精炼的定义：

> "A harness is every piece of code, configuration, and execution logic that isn't the model itself."
>
> Harness 是模型之外的一切。

如果你不是模型，你就是 harness。System prompt 是 harness。工具注册是 harness。执行循环是 harness。状态管理是 harness。验证逻辑是 harness。

一个裸模型不是 Agent。它只是一个文本生成器。是 harness 把它变成了能完成工作的 Agent。

### 六大核心组件

生产级 Agent Harness 需要哪些组件？LangChain、OpenAI、Anthropic 等团队在实践中独立收敛到了类似的答案。[LangChain 从 Agent 行为需求倒推出核心 harness 组件](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)，2026 年 4 月的[首篇学术综述](https://www.preprints.org/manuscript/202604.0428)则提出了一个六组件完整性矩阵（Execution environment, Tool integration, Context management, Scope negotiation, Loop management, Verification）。综合各方表述，可以归纳为以下六个核心组件：

| 组件                    | 职责                               | 缺失后果                   |
| ----------------------- | ---------------------------------- | -------------------------- |
| **Context Engineering** | 每步决定模型看到什么               | 幻觉、上下文腐化、状态丢失 |
| **Tool Integration**    | 外部系统访问（MCP、API、文件系统） | 工具调用级联失败           |
| **Memory & State**      | 会话持久化、跨窗口状态传递         | 长任务丢失进度             |
| **Orchestration**       | Agent 生成、路由、交接、终止       | 无方向运行或永不停止       |
| **Verification**        | 输出验证、自动测试                 | 错误结果被自信地交付       |
| **Safety & Guardrails** | 沙箱、权限、成本控制               | 失控成本、安全事故         |

用操作系统来类比：模型是 CPU（原始计算能力），上下文窗口是 RAM（有限的易失存储），Agent Harness 是操作系统（进程调度、驱动管理、安全策略），Agent 是应用程序。

### 五层架构

[Zylos Research 的分析](https://zylos.ai/research/2026-03-31-agent-harness-design-patterns)将生产级 harness 归纳为五层：

```
+---------------------------------------------+
|  Layer 5: Operations                        |
|  监控、成本控制、告警、事件响应               |
+---------------------------------------------+
|  Layer 4: Verification                      |
|  输出验证、Generator-Evaluator 分离          |
+---------------------------------------------+
|  Layer 3: Tool Integration                  |
|  MCP 服务器、API 注册、权限检查              |
+---------------------------------------------+
|  Layer 2: Context Management                |
|  上下文组装、窗口管理、信息驱逐策略          |
+---------------------------------------------+
|  Layer 1: Orchestration                     |
|  执行循环、轨迹评估、终止条件                |
+---------------------------------------------+
```

一个关键的量化事实：**每个请求的每一步都流经全部 5 层**。一个 20 步的 Agent 任务意味着 100 次层间交互。在大多数生产系统中，harness 做的工作量超过模型本身。

---

## 四、三个容易混淆的概念

### Framework vs. Harness

这两个词经常被混用，但它们描述的是不同的东西。

| 维度   | Agent Framework                      | Agent Harness                      |
| ------ | ------------------------------------ | ---------------------------------- |
| 是什么 | 蓝图 + 建材                          | 工厂车间                           |
| 举例   | LangChain, CrewAI, OpenAI Agents SDK | OpenAI Codex 运行时, Claude Code   |
| 关注点 | 编程模型、抽象、组件复用             | 运行时生命周期、可靠性、可观测性   |
| 类比   | React 是 framework                   | Next.js 部署在 Vercel 上 = harness |

Framework 给你积木块。Harness 是让积木块在生产环境中可靠运行的一切。

### Prompt → Context → Harness：三代递进

这三个概念代表了 AI 工程实践的三次范式跃迁：

| 时代      | 学科                | 控制什么             | 局限                   |
| --------- | ------------------- | -------------------- | ---------------------- |
| 2022-2024 | Prompt Engineering  | 模型说什么           | 单轮、无状态           |
| 2024-2025 | Context Engineering | 模型看到什么         | 单步优化，不管执行循环 |
| 2026-     | Harness Engineering | 模型运行在什么系统中 | 当前前沿               |

[Dev.to 上 Rex Zhen 的总结](https://dev.to/rex_zhen_a9a8400ee9f22e98/harness-engineering-the-next-evolution-of-ai-engineering-3ji7)很到位：Prompt Engineering 是在精心组织措辞；Context Engineering 是在策展信息；Harness Engineering 是在设计系统 —— 模型变成了系统中的一个组件，一个推理引擎被嵌入到更大的循环中。

这不是说前两代没有价值。Context Engineering 是 Harness Engineering 的一个子组件 —— 六大组件之一。Prompt Engineering 则是 Context Engineering 的一个子集。它们是包含关系，不是替代关系。

---

## 五、改变行业认知的四个案例

### 案例一：OpenAI Codex — 100 万行零手写代码

[OpenAI 在 2026 年 2 月公布了 Codex 的 harness 架构](https://openai.com/index/harness-engineering/)：

- **团队规模**：3 名人类工程师
- **产出**：100 万+ 行生产代码，~1,500 个 PR
- **时间**：5 个月
- **人类手写代码**：0 行

Codex Harness 的架构包括：Codex Core（Agent 循环库）、App Server（JSON-RPC 协议）、沙箱化的 Shell/文件操作、MCP 服务器集成。

OpenAI 团队的核心总结：

> "The wins come from tool design, memory strategy, and orchestration discipline, not from 'prompt magic.'"
>
> 胜利来自工具设计、记忆策略和编排纪律，不是"prompt 魔法"。

他们还分享了一个关键的失败教训：最初尝试用一个巨大的 `AGENTS.md` 指导 Agent，很快就失败了 —— 文件变得陈旧，Agent 无法分辨哪些内容仍然有效。解决方案是分层的、版本化的、积极修剪的文档结构。

### 案例二：Manus — 同一模型，60% vs 98%

Manus 在 2025 年初作为通用 AI Agent 爆火，后被 Meta 收购。他们做了一件大多数公司回避的事：[公开了自己的重写历史](https://medium.com/@epappas/the-agent-harness-is-the-architecture-and-your-model-is-not-the-bottleneck-5ae5fd067bb2)。

**6 个月内，他们多次重写 harness（据不同来源为 4-5 次）。模型没有换。**

每次重写遵循同一个模式：移除看似必要但实际降低性能的用户端复杂度，收紧 Agent 的能力边界。他们发明了 KV-Cache 感知的上下文工程来对抗 "lost-in-the-middle" 注意力衰减。

最有说服力的数据点：**使用相同模型，不同版本的 harness 导致任务完成率从 60% 到 98% 的差异**。这不是 prompt 调优能做到的事。这是基础设施层面的差距。

### 案例三：LangChain — 仅改 Harness，排名从 Top 30 到 Top 5

[LangChain 的 DeepAgents](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/) 在 Terminal Bench 2.0 排行榜上的表现提供了最干净的对照实验：

- **实验条件**：模型固定为 GPT-5.2-Codex，只改 harness
- **结果**：从 52.8% 提升到 66.5%，排名从 Top 30 跃升到 Top 5，提升 +13.7 个百分点

这是 "Harness-Only Benchmark" 方法的完美示范 —— 固定模型，变 harness，测 delta。它证明了在模型能力超过某个阈值之后，harness 质量是决定性因素。

### 案例四：Anthropic Claude Code — Generator-Evaluator 分离

Anthropic 发表了两篇关于长时间运行 Agent harness 的工程博文（["Effective harnesses for long-running agents"](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 和 ["Harness design for long-running application development"](https://www.anthropic.com/engineering/harness-design-long-running-apps/)），提出了几个影响深远的 harness 模式：

- **Generator-Evaluator 分离**：借鉴 GAN 的思路，生成代码的 Agent 和评估代码的 Agent 必须是不同的实例。让同一个 Agent 评估自己的输出，就像让学生批改自己的试卷。
- **Sprint Contracts**：每个 sprint 开始前，Generator 和 Evaluator 协商"完成"的定义，弥合高层产品规格与可测试实现之间的鸿沟。
- **Ralph Loop**：基于 Geoffrey Huntley 提出的模式 —— 每次迭代使用全新的上下文窗口，通过文件系统（而非对话上下文）传递状态，避免上下文累积导致的质量衰减。

最有启发的是他们的演进记录：

| 阶段 | 模型       | 关键 Harness 变化                                                                                 | 复杂度 |
| ---- | ---------- | ------------------------------------------------------------------------------------------------- | ------ |
| V1   | Sonnet 4.5 | Initializer + Coding Agent + Context Resets（Sonnet 4.5 有 "context anxiety"，需要 reset）        | 高     |
| V2   | Opus 4.5   | 加入 Planner + Generator + Evaluator + Sprint Contracts；去掉 Context Resets（Opus 4.5 不再需要） | 中高   |
| V3   | Opus 4.6   | 去掉 Sprint 结构（Opus 4.6 的长上下文和自我纠错能力使其不再必要）                                 | 中     |

**随模型能力提升，harness 应该变简单。** Harness 中的每个组件都编码了一个关于"模型做不到什么"的假设。当这些假设过期时，组件应该被移除。Anthropic 的原则是："Find the simplest solution possible, and only increase complexity when needed."

这直接引出了下一节的核心原则。

---

## 六、Build to Delete — 最反直觉的原则

[这是多个团队的实践独立收敛到的同一个结论](https://snowan.gitbook.io/study-notes/ai-blogs/how-to-build-agent-harness)：

- Manus 多次重写 harness
- LangChain 重新架构 4 次
- Vercel 删掉 80% 的工具，效果反而更好
- 2024 年需要复杂流水线才能做到的事，2026 年用简单 prompt 就够了

**Harness 中的每段手写逻辑都是负债。** 当下一个模型版本发布时，你精心设计的某个补偿机制可能瞬间变成多余的复杂度。

这意味着 harness 的设计哲学应该是：

1. **模块化**：每个组件可独立移除
2. **核心循环极简**：复杂度只在失败模式被观察到后才添加
3. **假设显式化**：每个 harness 组件都应标注"它补偿了模型的什么不足"
4. **预期淘汰**：今天构建的 harness 在几个月内会部分过时

> "Build harnesses that are easy to rip out and replace. Build to delete."

---

## 七、度量：Harness 质量的量化方法

没有度量就没有工程。[以下指标来自多个生产团队的实践](https://snowan.gitbook.io/study-notes/ai-blogs/how-to-build-agent-harness)：

| 指标                         | 测量什么                           | 来源      | 目标           |
| ---------------------------- | ---------------------------------- | --------- | -------------- |
| KV-Cache Hit Rate            | 上下文工程效率                     | Manus     | > 80%          |
| Task Completion Rate         | 端到端可靠性                       | 所有团队  | 按任务类型追踪 |
| Benchmark Score Delta        | 模型不变，harness 变化带来的分数差 | LangChain | 持续上升       |
| Verification Completion Rate | 提交前自检完成率                   | LangChain | > 95%          |

其中最有力的评估方法是 **Harness-Only Benchmark**：固定模型，变 harness，测 delta。这剥离了模型因素，直接度量 harness 的工程质量。LangChain 用这个方法证明了 +13.7 百分点的提升全部来自 harness 改进。

---

## 八、Martin Fowler 的控制论框架

[Martin Fowler 和 Birgitta Böckeler 在 2026 年 4 月发表的文章](https://martinfowler.com/articles/harness-engineering.html)为 Harness Engineering 提供了一个优雅的控制论视角，将 harness 的所有手段归为两类：

**前馈控制（Feedforward / Guides）**：在 Agent 行动前，引导它做对。

- `AGENTS.md` 文件
- 架构文档
- 代码示例
- 约束声明

**反馈控制（Feedback / Sensors）**：在 Agent 行动后，检测并纠正。

- Linter 和类型检查（确定性）
- 测试执行（确定性）
- LLM 代码审查（推断性）
- 输出质量采样（推断性）

每种控制手段又分为两类：

|          | 确定性（Computational） | 推断性（Inferential）  |
| -------- | ----------------------- | ---------------------- |
| **前馈** | Linter 规则、类型系统   | LLM 理解的架构文档     |
| **反馈** | 测试、CI 检查           | LLM-as-Judge、语义分析 |

这个 2x2 矩阵是设计 harness 时最实用的思维工具。大多数团队过度依赖推断性前馈（写更多 prompt/文档），而低估了确定性反馈（自动化测试和 lint）的价值。OpenAI Codex 团队的经验是：**机械化的强制执行（custom linters、structural tests）比文档更可靠**。

---

## 九、对工程师意味着什么

[GTCode 的深度分析](https://gtcode.com/articles/harness-engineering/)指出了一个根本性的变化：

> "The engineer's job is no longer to write code. It is to design the environment where code gets written."

这不是修辞。当 OpenAI 的三人团队交付 100 万行代码时，他们的日常工作是：

1. 观察 Agent 的失败模式
2. 设计防止该失败再次发生的机制
3. 将机制编码到 harness 中
4. 验证机制有效

Mitchell Hashimoto 将其总结为一句话：**"When an agent makes a mistake, build mechanisms so that mistake never happens again."** 这本质上是一个控制工程循环，不是软件开发循环。

工程师的核心技能从"写出正确的代码"变为：

- **系统设计**：设计让 Agent 可靠运行的环境
- **失败模式分析**：观察 Agent 在哪里、为什么失败
- **约束工程**：设计最小但充分的约束集
- **可观测性**：构建能看见 Agent 行为的仪表盘

有一个反直觉的发现值得强调：**约束越多，Agent 越强**。[Manus 的经验是移除工具提升了性能](https://medium.com/@epappas/the-agent-harness-is-the-architecture-and-your-model-is-not-the-bottleneck-5ae5fd067bb2)。Stripe 让 linting 成为强制的。Vercel 精简到核心工具集。能力边界越窄，Agent 的行为越可预测、越可靠。

---

## 十、从哪里开始

[一个 Minimum Viable Harness 可以在 2-4 小时内用 200-500 行代码搭建](https://snowan.gitbook.io/study-notes/ai-blogs/how-to-build-agent-harness)。成熟度分级如下：

| 级别    | 范围     | 时间     | 关键新增                 |
| ------- | -------- | -------- | ------------------------ |
| Level 1 | 个人使用 | 2-4 小时 | 基础循环 + 工具 + prompt |
| Level 2 | 小团队   | 2-3 天   | 持久化 + 错误恢复 + 日志 |
| Level 3 | 团队使用 | 1-2 周   | 权限 + 可观测性 + 中间件 |
| Level 4 | 生产环境 | 4-12 周  | 多租户 API + 评估 + 安全 |

生产级 harness 通常在 5,000 - 20,000 行代码之间。

最常见的错误是在理解失败模式之前就过度工程化。正确的做法是：从最简单的 harness 开始，观察 Agent 的实际失败模式，然后只针对观察到的失败添加复杂度。

---

## 结语：模型是大宗商品，Harness 是护城河

[APEX-Agents benchmark 的数据](https://harness-engineering.ai/blog/what-is-harness-engineering/)讲了一个残酷的故事：前沿模型在专业级任务（投行、咨询、法律等知识工作者场景）上的最佳首次通过率只有 24%。不是 74%，不是 54%，是 24%。

但 OpenAI 用同样级别的模型交付了 100 万行生产代码。Manus 用同一个模型达到了 98% 的任务完成率。LangChain 不换模型提升了 13.7 个百分点。

差异不在模型。差异在 harness。

[Evangelos Pappas 在 Medium 上的分析](https://medium.com/@epappas/the-agent-harness-is-the-architecture-and-your-model-is-not-the-bottleneck-5ae5fd067bb2)验证了一个假设：**在模型能力超过某个阈值后，harness 工程是 Agent 可靠性的首要决定因素。** 两个团队使用相同的 Claude 或 GPT 模型，可以看到 40 个百分点的任务完成率差异 —— 完全取决于 harness 质量。

模型之间的能力差距在缩小。Harness 质量的差距在扩大。

这就是为什么 2026 年是 harness 之年。不是因为模型不重要了，而是因为模型已经够好了 —— 够好到瓶颈不再是智能本身，而是引导智能的基础设施。

40 年前，harness 包裹的是代码。今天，harness 包裹的是智能。变化的是被驾驭的对象，不变的是驾驭本身的工程学。

---

_参考文献_

- [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)（2026.2）
- [OpenAI: Unlocking the Codex Harness](https://openai.com/index/unlocking-the-codex-harness/)（2026.2）
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)（2025.11）
- [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps/)（2026）
- [LangChain: The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)（2026.3）
- [LangChain: Improving Deep Agents with harness engineering](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/)（2026.2）
- [Martin Fowler: Harness Engineering for Coding Agent Users](https://martinfowler.com/articles/harness-engineering.html)（2026.4）
- [Dr. Sarah Chen: Complete Guide to Agent Harness](https://harness-engineering.ai/blog/agent-harness-complete-guide/)（2026.3）
- [Dr. Sarah Chen: What Is Harness Engineering?](https://harness-engineering.ai/blog/what-is-harness-engineering/)（2026.3）
- [Dr. Sarah Chen: Agent Harness Architecture](https://harness-engineering.ai/blog/agent-harness-architecture-how-the-system-works-under-the-hood/)（2026.3）
- [Zylos Research: Agent Harness Design Patterns](https://zylos.ai/research/2026-03-31-agent-harness-design-patterns)（2026.3）
- [Evangelos Pappas: The Agent Harness Is the Architecture](https://medium.com/@epappas/the-agent-harness-is-the-architecture-and-your-model-is-not-the-bottleneck-5ae5fd067bb2)（2026.2）
- [GTCode: Harness Engineering](https://gtcode.com/articles/harness-engineering/)（2026.3）
- [NxCode: Harness Engineering Complete Guide](https://www.nxcode.io/resources/news/harness-engineering-complete-guide-ai-coding-agents-2026)（2026.3）
- [Dev.to Rex Zhen: Harness Engineering The Next Evolution](https://dev.to/rex_zhen_a9a8400ee9f22e98/harness-engineering-the-next-evolution-of-ai-engineering-3ji7)（2026.4）
- [Preprints.org: Agent Harness for LLM Agents: A Survey](https://www.preprints.org/manuscript/202604.0428)（2026.4）
- [How to Build an Agent Harness: A Practical Guide](https://snowan.gitbook.io/study-notes/ai-blogs/how-to-build-agent-harness)
- [TestCollab: Harness Engineering What It Means for QA](https://testcollab.com/blog/harness-engineering)（2026.3）
- [EleutherAI: lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness)（2020）
- [Stanford CRFM: HELM](https://github.com/stanford-crfm/helm)（2022）
