---
title: LLM Agent 中 Skill/Tool 调用决策偏差：技术调研报告
tags:
  - LLM
  - AI Agent
  - Tool Calling
  - Prompt Engineering
categories:
  - AI Agent
excerpt: >-
  当 LLM Agent 配备了 tools 和 skills 后，模型在"直接回答还是调用工具"的决策上存在系统性偏差。
  本文从 DeepAgents 社区案例、学术研究、根因分析到解决方案，全面梳理了 Overconfidence 和 Over-tool-reliance 两类偏差的成因与应对策略。
date: 2026-04-14 12:00:00
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

## 1. 问题定义与现象

### 1.1 核心问题

当 LLM Agent 配备了 tools 和 skills 后，模型需要在每个推理步骤中做出一个**二元决策**：

> **"我应该用自己的知识直接回答，还是调用外部工具/加载 skill？"**

这个看似简单的决策存在系统性偏差。研究和工程实践表明，LLM 在该决策上存在**两个对称方向的失误**：

| 偏差类型 | 表现 | 后果 |
|---------|------|------|
| **Overconfidence（过度自信）** | 模型认为自己已掌握知识，跳过工具/skill 调用 | 输出基于过时/错误的训练数据，忽略最新信息 |
| **Over-tool-reliance（过度依赖）** | 模型对简单问题也调用工具 | 浪费 API 调用、增加延迟、降低用户体验 |

本报告聚焦于**第一类偏差（Overconfidence）**，因为它在 Agent Skill 场景下尤为突出且危害更大。

### 1.2 现象分类

在实际 Agent 系统中，overconfidence 表现为三种可观测的行为模式：

**模式 A：Prediction-First Behavior（预测优先）**

模型直接用训练数据回答问题，完全跳过可用的 tool/skill。这在"模型自认为擅长"的领域（如编程、常识问答）尤为常见。

**模式 B：Partial Skill Loading（部分加载）**

在 progressive disclosure 架构中，模型开始读取 skill 文档，但只读了开头部分就认为"已经理解"，跳过剩余内容直接执行。

**模式 C：Tool Availability Confusion（工具可用性混淆）**

模型将 skill 名称误认为已加载的工具，当用户要求"使用 xxx skill"时，agent 回复"xxx is not a tool"，然后用内置能力尝试完成任务。

### 1.3 这是设计特性，不是 Bug

一个关键洞察：**这种行为部分源自模型的训练目标**。

Anthropic 的 Claude 系统提示中明确写入（[Claude Code Issue #46212](https://github.com/anthropics/claude-code/issues/46212)）：

> "Claude does not search for queries that it can already answer well without a search."

Answer.AI 的研究进一步指出（[The Unauthorized Tool Call Problem](https://www.answer.ai/posts/2026-01-20-toolcalling.html)）：

> "Models were clearly trained to call only tools they are sure they have."
> — Piotr Czapla, Answer.AI, 2026

这意味着模型被**有意训练**为保守使用工具——训练信号告诉模型"能不用就不用"。这在对话型 AI 中是合理的（减少不必要的搜索调用），但在 **Agent 场景中会导致 skill 被系统性忽视**。

---

## 2. DeepAgents 社区的实际案例

[DeepAgents](https://github.com/langchain-ai/deepagents) 是当前最活跃的 AI Agent 框架之一。其 Skill 系统采用 **Progressive Disclosure** 设计——agent 启动时只注入 skill 的名称和描述，需要时由 LLM 主动调用 `read_file` 读取完整的 `SKILL.md`。

这一设计将 skill 加载的决策权交给了 LLM，直接暴露了上述 overconfidence 问题。

### 2.1 Issue #2446 — Skill 文档读取不完整（2026-04-03，OPEN）

**标题**: `skills can not proper work: read_file for SKILL.md not read fully before execute it`

**现象**: 当 `SKILL.md` 超过 200 行时，LLM 调用 `read_file` 只读取开头（受 `read_file` 默认 100 行限制），然后就认为"已经理解"开始执行任务。

**影响范围**:
- 弱模型（gpt-5.4-mini、gemma4 等）几乎不会自发分页读取
- 强模型（Claude Sonnet/Opus、gpt-5.4）偶尔也会出现

**社区讨论的解决方案**:

| 方案 | 描述 | 评估 |
|------|------|------|
| A. 修改 SKILLS_SYSTEM_PROMPT | 在提示中强调"必须读完全部内容" | 不可靠，LLM 仍可能忽略 |
| B. Python 层确定性读取 | 在 middleware 中直接读取并注入完整 skill | 绕过 LLM 决策，确定性高 |
| C. 专用 `load_skill` 工具 | 新建一个专门工具，一次性返回完整 skill 内容 | 仍依赖 LLM 决定是否调用 |
| D. 分段加载 | 将大 skill 拆分为索引页 + 子章节 | 增加复杂度，需要多轮调用 |

**官方回应**: 核心维护者 eyurtsev 开启了 Draft [PR #2448](https://github.com/langchain-ai/deepagents/pull/2448)，表示"需要先跑 eval，可能最终引入专用 skill loading tool"。

### 2.2 PR #1306 — Skill Tool 的引入与回退（2026-02-12）

**标题**: `feat(sdk): reimplement skill loading via skill tool calling`

这是 DeepAgents 社区**最重要的一次 skill 架构实验**。

**改动内容**:
- 引入专用 `skill` tool 替代 `read_file`
- 一次性读取完整 `SKILL.md`，不受 100 行限制
- 设计参考了 Claude Code / OpenCode 的 skill loading 方式

**结果**: 合并后发现 `loaded_skills` state key 泄漏到子 agent，导致子 agent 误认为自己也持有父级的 skills。PR 被 **REVERT**（commit 8cd2212）。

**教训**: 即使解决了"LLM 不读 skill"的问题，skill 状态管理在多 agent 架构中也是一个独立的挑战。

### 2.3 Issue #1857 — LLM 直接跳过 Skill

**现象**: 用户明确指示 "use xxx skill"，agent 回复 "xxx is not a tool"，然后直接扫描文件系统尝试完成任务——完全忽略了 skill 系统的存在。

这是 **模式 C（Tool Availability Confusion）** 的典型案例。模型没有理解 skill 和 tool 的区别，将 skill 名称当作工具名称在工具列表中查找，找不到后就 fallback 到内置能力。

### 2.4 其他相关 Issues

- [**#934**](https://github.com/langchain-ai/deepagents/issues/934): Skill 路径间歇性 "File not found"，在 system prompt 中 hardcode 路径后仍约 1/12 概率失败
- [**#2043**](https://github.com/langchain-ai/deepagents/issues/2043): LLM 无法正确识别 skill 目录结构
- [**#1502**](https://github.com/langchain-ai/deepagents/issues/1502): Windows 路径格式导致 skill 加载失败
- [**#949**](https://github.com/langchain-ai/deepagents/issues/949): Google AI Studio + Skills 组合时报错
- [**deepagentsjs #387**](https://github.com/langchain-ai/deepagentsjs/issues/387): `skillsMiddleware` 跳过特定目录中的 skill 发现
- [**#1862**](https://github.com/langchain-ai/deepagents/issues/1862): Daytona sandbox 环境中 skills 找不到

这些 issues 共同指向一个结论：**将 skill 加载决策交给 LLM 本身就是一个高风险的设计选择**。

---

## 3. 学术研究综述

### 3.1 Tool Use Alignment — H2A 原则

**论文**: Chen et al. ["Tool Use Alignment of Large Language Models."](https://aclanthology.org/2024.emnlp-main.82) EMNLP 2024.

该论文提出了评估 LLM tool use 的 **H2A 原则**:

- **H**elpfulness（有用性）: 回答是否正确
- **H**armlessness（无害性）: 是否避免了有害输出
- **A**utonomy（自主性）: LLM **应该直接回答能处理的问题**，不浪费工具调用

**关键贡献**: 首次将"不该调用工具时不调用"形式化为一个可度量的指标（Autonomy）。提出 ToolAlign 数据集用于评估。

**与本问题的关系**: H2A 框架承认了 over-tool-reliance 的存在，但 Autonomy 维度的优化可能**加剧** overconfidence——训练模型"少用工具"的同时，也可能训练出"该用时也不用"。

### 3.2 Alignment for Efficient Tool Calling

**论文**: Xu, Wang, Zhu et al. ["Alignment for Efficient Tool Calling of Large Language Models."](https://arxiv.org/abs/2503.06708) EMNLP 2025.

这是目前**最系统性地研究 tool calling 双向偏差**的论文。

**核心发现**:
- LLM 同时存在 **overconfidence**（该用工具不用）和 **over-tool-reliance**（不该用工具乱用）
- 两种偏差的比例因模型和领域而异

**提出的解决方案** — Multi-objective Alignment Framework:

1. **Probabilistic Knowledge Boundary Estimation**: 估计模型对每个问题的"知识边界"，决定是否需要外部工具
2. **Dynamic Decision-Making**: 根据估计的知识边界动态决定调用策略

**偏好排序（关键设计）**:

```
s(x, y_nc) > s(x, y_tc) > s(x, y_nw) > s(x, y_tw)
```

其中:
- `y_nc`: 不用工具，回答正确（最优）
- `y_tc`: 用了工具，回答正确
- `y_nw`: 不用工具，回答错误
- `y_tw`: 用了工具，回答错误（最差）

**Benefit-cost utility**:

```
u(y) = 1_helpfulness(y) − α · 1_cost(y)
```

α 参数控制"使用工具的成本惩罚"，可以根据场景调节。

### 3.3 Toolken+ — Reject Option

**论文**: Yakovlev, Nikolenko, Bout. ["Toolken+: Improving LLM Tool Usage with Reranking and a Reject Option."](https://arxiv.org/abs/2410.12004) EMNLP 2024 Findings.

**背景**: ToolkenGPT 将工具表示为特殊 token，LLM 在生成过程中可以"生成"工具调用。但模型经常在"是否使用工具"的决策上出错。

**解决方案**: 引入 **REJECT option**:

```
T' = T ∪ {REJ}
```

如果 REJ token 排名第一，则不调用任何工具，退回到普通词汇 token 生成。

**实验结果**（GSM8K）:

| 方法 | Vicuna-7B 准确率 |
|------|-----------------|
| Vanilla（无工具） | 16.2% |
| ToolkenGPT | 16.9% |
| **Toolken+** | **18.8%** |

REJECT 机制使模型能够在"自信不需要工具"时显式拒绝，而不是默默跳过。

### 3.4 Relign — Tool Hallucination 与可靠性对齐

**论文**: Xu, Zhu, Pan et al. ["Reducing Tool Hallucination via Reliability Alignment."](https://proceedings.mlr.press/v267/xu25ap) ICML 2025.

**贡献**:

1. **定义了两类 Tool Hallucination**:
   - **Tool Selection Hallucination**: 选错了工具，或该用工具时不用
   - **Tool Usage Hallucination**: 用对了工具，但参数/调用方式错误

2. **扩展 Action Space**: 引入 **Indecisive Actions**（犹豫动作）:
   - `defer`: 延迟决策，收集更多信息
   - `seek_clarification`: 向用户请求澄清
   - `adjust`: 调整先前的工具调用

3. **提出 RelyToolBench + Relign Framework**: 用于评估和训练模型的工具调用可靠性

**与本问题的关系**: Indecisive actions 的引入为 overconfidence 提供了一个**优雅的缓冲机制**——模型不必在"用/不用"之间做硬性二选一，可以选择"我不确定，先不做决定"。

### 3.5 The Confidence Dichotomy

**论文**: Xuan et al. ["The Confidence Dichotomy: Analyzing and Mitigating Miscalibration in Tool-Use Agents."](https://arxiv.org/abs/2601.07264) arXiv:2601.07264, Jan 2026.

**核心发现** — 不同类型的工具对模型置信度校准的影响截然不同:

| 工具类型 | 例子 | 准确率 | 置信度 | 校准状态 |
|---------|------|--------|--------|---------|
| Evidence tools | Web search | 65% | 100% | 严重过度自信 |
| Verification tools | Code interpreter | 80% | 90% | 较好校准 |

**解释**: Evidence tools（如搜索）提供"看起来权威"的信息，模型倾向于直接信任而不验证，导致置信度膨胀。Verification tools 提供可执行验证（代码运行、结果比对），能 ground reasoning。

**提出的解决方案**: **Calibration Agentic RL (CAR)** — 在 RL 训练中加入置信度校准目标。

### 3.6 Answer.AI — The Unauthorized Tool Call Problem

**文章**: Piotr Czapla. ["The Unauthorized Tool Call Problem."](https://www.answer.ai/posts/2026-01-20-toolcalling.html) Answer.AI Blog, 2026-02-18.

**核心发现**:
- Claude、Gemini、Grok 都能被诱导调用**未授权的工具**
- 模型的 tool calling 安全边界远比预期脆弱

**Simon Willison 的 "Lethal Trifecta"**:

```
Tools reaching outside the sandbox
  + Untrusted content in context
  + Access to private data
  = Security catastrophe
```

**与本问题的关系**: 如果模型的 tool calling 决策边界不可靠，那么依赖模型自行决定"是否加载 skill"同样不可靠。

---

## 4. 根因分析

综合 DeepAgents 社区案例和学术研究，skill/tool 调用决策偏差的根因可以分为四个层次：

### 4.1 训练层：保守使用工具的隐式偏见

LLM 的 RLHF 训练数据中包含大量"直接回答"的优质样本。模型学到了一个隐式规则：

> **"如果我能自己回答，就不要调用外部资源。"**

这在对话场景中是合理的（避免不必要的搜索），但在 Agent 场景中会导致模型跳过必要的 skill 加载。Anthropic 将这一行为明确写入了系统提示。

**信号竞争**: 当 system prompt 同时包含"使用 skill 完成任务"和模型内化的"能不用就不用"时，后者往往胜出——因为它是在权重级别编码的，而 prompt 指令只是上下文级别的软约束。

### 4.2 架构层：Progressive Disclosure 的固有脆弱性

DeepAgents 的 Skill 系统采用两阶段设计：

```
阶段 1 (before_agent): 注入 skill 名称 + 描述 → system prompt
阶段 2 (runtime):      LLM 决定是否调用 read_file 读取完整 SKILL.md
```

**问题**: 阶段 2 完全依赖 LLM 的判断。如果模型认为阶段 1 提供的描述已经足够（或者认为自己已经知道该怎么做），它就不会进入阶段 2。

**加剧因素**: `read_file` 工具的默认 100 行限制意味着即使模型决定读取 skill，它也可能只读到部分内容就认为"够了"。

### 4.3 信息层：Tool 提前全量加载的信号干扰

在 Agent 系统中，tools 通常在 agent 启动时**全量加载**到上下文中（function definitions 作为 system prompt 的一部分）。这意味着：

1. LLM 在第一次推理时就"看到"了所有可用工具的完整定义
2. Skill 提供的额外指令可能与已加载的 tool descriptions 存在语义重叠
3. LLM 产生"我已经有了所有需要的信息"的错觉

**类比**: 这就像一个工程师拿到了所有 API 的文档，但没有阅读项目的业务规范（skill）——他"技术上"可以调用所有 API，但不知道应该按什么流程、什么顺序调用。

### 4.4 评估层：缺乏标准化的"是否应该调用"度量

现有的 tool calling benchmark（如 ToolBench、API-Bank）主要评估：
- 给定需要工具的问题，模型是否**正确调用**了工具
- 工具调用的参数是否正确

它们很少评估：
- 给定一个任务，模型是否**正确决定**了需要调用工具
- 模型是否**正确识别**了需要加载 skill 的时机

这意味着模型在"是否调用"这个决策上几乎没有针对性的训练信号。

---

## 5. 解决方案分类

### 5.1 模型层（Model-Level）

**目标**: 改变模型内化的"保守使用工具"偏见。

| 方案 | 描述 | 来源 | 可行性 |
|------|------|------|--------|
| Multi-objective Alignment | 同时优化 helpfulness 和 tool-use efficiency | Xu et al. 2025 | 需要训练资源，终端用户无法实施 |
| REJECT Token | 扩展 token 空间加入显式拒绝选项 | Toolken+ (2024) | 需要修改 tokenizer，仅适用于自训练模型 |
| Calibration Agentic RL (CAR) | RL 中加入置信度校准目标 | Xuan et al. 2026 | 前沿研究，尚无生产级实现 |
| Indecisive Actions | 扩展 action space 加入 defer/clarify/adjust | Relign (2025) | 理念可工程化实现（见架构层方案） |

**评估**: 模型层方案效果最根本，但**终端开发者通常无法实施**。适合 LLM 厂商和大型研究机构。

### 5.2 架构层（Architecture-Level）

**目标**: 在系统设计中消除或减少 LLM 决策点。

#### 5.2.1 确定性 Skill 注入（Deterministic Injection）

```
改前: before_agent 注入描述 → LLM 决定是否读取 → read_file 读取 SKILL.md
改后: before_agent 直接读取并注入完整 SKILL.md 内容 → system prompt
```

**优点**: 完全绕过 LLM 决策，确定性 100%。
**缺点**: 大量 skill 会撑爆上下文窗口。
**适用场景**: skill 数量少、单个 skill 文档不超过 2000 token 时。

#### 5.2.2 专用 Skill Loading Tool

DeepAgents [PR #1306](https://github.com/langchain-ai/deepagents/pull/1306) 的方向——创建一个专门的 `load_skill` tool，语义上明确区分于通用的 `read_file`：

```python
@tool
def load_skill(skill_name: str) -> str:
    """Load a skill's complete instructions. MUST be called before executing any skill-related task."""
    return read_full_skill(skill_name)  # No line limit
```

**优点**: 语义明确，一次性返回完整内容。
**缺点**: 仍然依赖 LLM 决定是否调用。
**DeepAgents 状态**: [PR #1306](https://github.com/langchain-ai/deepagents/pull/1306) 因 state 泄漏被 revert，[PR #2448](https://github.com/langchain-ai/deepagents/pull/2448) (draft) 和 [PR #2466](https://github.com/langchain-ai/deepagents/pull/2466) 在探索改进方案。

#### 5.2.3 Pre-Completion Checklist（退出前强制检查）

LangChain 博客 ["Improving Deep Agents with Harness Engineering"](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering) 提出的 middleware 模式：

```python
class PreCompletionChecklistMiddleware:
    """Agent 准备输出最终结果前，强制检查是否遗漏了必要的 skill 调用。"""
    def process(self, state):
        if agent_is_about_to_finish(state):
            unchecked_skills = find_relevant_unchecked_skills(state)
            if unchecked_skills:
                inject_reminder(state, unchecked_skills)
```

**优点**: 不改变主流程，作为安全网存在。
**缺点**: 增加延迟；"relevant" 的判断本身也是一个 LLM 决策。

#### 5.2.4 Mandatory Skill Loading（强制加载）

在 middleware 层强制要求：如果 agent 被分配了 skills，必须在执行任何工具调用之前先加载所有 skills。

```python
class MandatorySkillsMiddleware:
    def before_agent(self, state):
        for skill in assigned_skills:
            content = backend.read_full(skill.path)
            inject_into_system_prompt(state, content)
```

**优点**: 确定性最高，不依赖 LLM 判断。
**缺点**: 如果 skill 很多或很长，会大幅增加 prompt 长度。
**适用场景**: skill 数量可控（< 5 个）且每个 skill 文档较短（< 3000 token）。

### 5.3 提示层（Prompt-Level）

**目标**: 通过更好的 prompt engineering 引导 LLM 做出正确的调用决策。

| 方案 | 描述 | 可靠性 |
|------|------|--------|
| 强制触发器 | "When the user mentions X, you MUST call Y" | 中 — 模型可能仍然跳过 |
| 参数化强制 | "Before answering any question about X, first call load_skill('X')" | 中 — 同上 |
| 描述工程 | 优化 tool/skill 描述，明确区分"何时应该用"和"何时不应该用" | 中 — 模型理解不稳定 |
| 自我修正提示 | "After generating your answer, verify: did you check all relevant skills?" | 低 — 模型往往自我确认 |
| 知识截断声明 | "Your training data may be outdated. ALWAYS check skills for current info." | 低 — 模型难以评估自身知识边界 |

**总体评估**: 提示层方案是**最容易实施**的，但也是**最不可靠**的。经验表明，即使精心设计的 prompt 也无法保证 LLM 每次都遵循指令。

**建议**: 提示层方案应作为**辅助手段**，配合架构层方案使用，不应作为唯一防线。

### 5.4 工程层（Engineering-Level）

**目标**: 在 skill 执行结果上进行验证和兜底。

#### 5.4.1 结果校验层（Post-Execution Validation）

在 agent 完成任务后，检查输出是否"看起来"使用了 skill 提供的信息：

```python
class SkillUsageValidator:
    def validate(self, result, loaded_skills):
        for skill in loaded_skills:
            if not evidence_of_skill_usage(result, skill):
                return ValidationResult(
                    passed=False,
                    reason=f"Skill '{skill.name}' was available but no evidence of usage"
                )
```

**缺点**: "evidence of usage" 的判断本身可能不可靠。

#### 5.4.2 Loop Detection + Retry

如果检测到 agent 在没有加载 skill 的情况下就开始执行，自动触发重试并强制注入 skill：

```python
class LoopDetectionMiddleware:
    def on_tool_call(self, state, tool_call):
        if is_task_relevant_tool(tool_call) and not skills_loaded(state):
            inject_skills(state)
            return RetrySignal("Skills not loaded, retrying with skill context")
```

#### 5.4.3 监控与告警

在生产环境中监控 skill 使用率，当某个 skill 的使用率异常低时触发告警：

```python
# Metrics
skill_offered_count.inc(skill_name)       # skill 被提供给 agent 的次数
skill_loaded_count.inc(skill_name)         # skill 被实际加载的次数
skill_usage_ratio = loaded / offered       # 使用率
alert_if(skill_usage_ratio < 0.5)          # 低于 50% 触发告警
```

### 5.5 方案选择建议

根据实施难度和可靠性，推荐的优先级排序：

```
高优先级（立即可实施）:
  1. 确定性 Skill 注入 / Mandatory Skill Loading（架构层）
  2. 结果校验层（工程层）

中优先级（需要开发）:
  3. 专用 load_skill 工具 + 语义优化（架构层 + 提示层）
  4. Pre-Completion Checklist middleware（架构层）

低优先级（依赖上游）:
  5. Multi-objective Alignment（模型层）
  6. Calibration RL（模型层）
```

**关键原则**: 不要依赖 LLM 做它不擅长的决策。在 skill 加载这件事上，**确定性方案（Python 层强制注入）永远优于概率性方案（prompt 引导 LLM 自行加载）**。

---

## 6. 结论与展望

### 6.1 核心结论

1. **LLM 在 tool/skill 调用决策上存在系统性偏差**。这不是某个模型或框架的 bug，而是 LLM 训练范式的固有特征。

2. **Overconfidence 和 Over-tool-reliance 是对称的两难**。优化一个方向可能恶化另一个方向（如 H2A 的 Autonomy 指标优化可能加剧 overconfidence）。

3. **Progressive Disclosure 设计在当前 LLM 能力水平下是高风险的**。将 skill 加载决策权完全交给 LLM 会导致不可预测的行为。

4. **确定性方案应优先于概率性方案**。在 skill 加载这个关键路径上，Python 层的强制注入比 prompt 层的引导更可靠。

5. **这是一个活跃的研究领域**。从 EMNLP 2024 到 ICML 2025，多篇论文从不同角度研究了该问题，但尚无"银弹"方案。

### 6.2 展望

**短期（6-12 个月）**:
- DeepAgents 社区预计会推出改进的 skill loading 机制（[PR #2448](https://github.com/langchain-ai/deepagents/pull/2448) 的方向）
- 更多框架会引入 mandatory skill injection 作为可选策略
- LLM 厂商可能在 tool calling 训练中加入更精细的"是否调用"信号

**中期（1-2 年）**:
- Multi-objective alignment 方法可能进入生产级 LLM 训练流程
- Agent 评估 benchmark 会增加 "tool-use decision quality" 维度
- Indecisive actions（defer/clarify/adjust）可能成为 Agent 框架的标准特性

**长期（2+ 年）**:
- 模型可能发展出更好的自我知识边界估计能力（"我知道我不知道什么"）
- Tool calling 和 skill loading 可能统一到一个更优雅的架构中
- 置信度校准可能成为 LLM 训练的标准目标之一

---

## 7. 参考文献

### 学术论文

1. Chen et al. ["Tool Use Alignment of Large Language Models."](https://aclanthology.org/2024.emnlp-main.82) *EMNLP 2024*.

2. Yakovlev, Nikolenko, Bout. ["Toolken+: Improving LLM Tool Usage with Reranking and a Reject Option."](https://arxiv.org/abs/2410.12004) *EMNLP 2024 Findings*.

3. Xu, Wang, Zhu et al. ["Alignment for Efficient Tool Calling of Large Language Models."](https://arxiv.org/abs/2503.06708) *EMNLP 2025*.

4. Xu, Zhu, Pan et al. ["Reducing Tool Hallucination via Reliability Alignment."](https://proceedings.mlr.press/v267/xu25ap) *ICML 2025*.

5. Xuan et al. ["The Confidence Dichotomy: Analyzing and Mitigating Miscalibration in Tool-Use Agents."](https://arxiv.org/abs/2601.07264) *arXiv:2601.07264*, Jan 2026.

### 技术文章与社区讨论

6. Piotr Czapla. ["The Unauthorized Tool Call Problem."](https://www.answer.ai/posts/2026-01-20-toolcalling.html) *Answer.AI Blog*, 2026-02-18.

7. DeepAgents [Issue #2446](https://github.com/langchain-ai/deepagents/issues/2446): "skills can not proper work: read_file for SKILL.md not read fully before execute it."

8. DeepAgents [PR #1306](https://github.com/langchain-ai/deepagents/pull/1306): "feat(sdk): reimplement skill loading via skill tool calling."

9. DeepAgents [PR #2448](https://github.com/langchain-ai/deepagents/pull/2448) (Draft): Skill loading improvement proposal by eyurtsev.

10. DeepAgents [Issue #1857](https://github.com/langchain-ai/deepagents/issues/1857): LLM skips skill and reports "xxx is not a tool."

11. DeepAgents [Issue #934](https://github.com/langchain-ai/deepagents/issues/934): Intermittent skill path discovery failure.

12. Claude Code [Issue #46212](https://github.com/anthropics/claude-code/issues/46212): "prediction-first behavior" safety concerns.

13. LangChain Blog. ["Improving Deep Agents with Harness Engineering."](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)

14. LangChain [Issue #34548](https://github.com/langchain-ai/langchain/issues/34548): Community request for native Agent Skills support.
