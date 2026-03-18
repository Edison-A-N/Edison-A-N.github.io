---
title: Agent Loop 技术调研报告
tags:
  - LLM
  - AI Agent
  - Agent Loop
categories:
  - AI Agent
date: 2026-03-14 00:00:00
excerpt: >-
  本文对四大平台的 Agent Loop 实现进行了系统性调研与对比分析，涵盖 Anthropic Agent SDK、OpenAI Codex
  CLI、OpenClaw 运行时与 Google ADK Loop Agents。从控制论视角剖析 Agent Loop
  的本质，并对 ReAct、Reflection 等扩展范式的工程价值进行了审视。
toc: true
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

> **日期**：2026-03-14
> **摘要**：本文对四大平台的 Agent Loop 实现进行了系统性调研与对比分析，涵盖 Anthropic Agent SDK、OpenAI Codex CLI、OpenClaw 运行时与 Google ADK Loop Agents。在文献总结基础上，进一步从控制论视角剖析 Agent Loop 的本质，并对 ReAct、Reflection 等扩展范式的工程价值进行了审视。

---

## 目录

1. [引言](#1-引言)
2. [文献来源](#2-文献来源)
3. [Anthropic Agent SDK](#3-anthropic-agent-sdk)
4. [OpenAI Codex CLI](#4-openai-codex-cli)
5. [OpenClaw Agent Runtime](#5-openclaw-agent-runtime)
6. [Google ADK Loop Agents](#6-google-adk-loop-agents)
7. [横向对比](#7-横向对比)
8. [分析与讨论](#8-分析与讨论)
   - 8.1 [Agent Loop 的控制论本质](#81-agent-loop-的控制论本质)
   - 8.2 [Agent Loop 与 ReAct 的关系](#82-agent-loop-与-react-的关系)
   - 8.3 [Reflection 及其他扩展范式的工程价值](#83-reflection-及其他扩展范式的工程价值)
9. [结论](#9-结论)
10. [参考文献](#10-参考文献)

---

## 1. 引言

大语言模型（LLM）从"单轮问答"走向"自主执行任务"，核心转变在于引入了 **Agent Loop**——一个让模型持续感知环境、调用工具、获取反馈、再次决策的闭环结构。

本报告选取了四个代表性平台的 Agent Loop 文档进行调研：

- **Anthropic Agent SDK**：面向开发者的客户端 SDK，侧重易用性与安全控制
- **OpenAI Codex CLI**：本地编码助手，侧重推理性能优化
- **OpenClaw**：服务端 Agent 运行时，侧重多会话与会话级/全局并发控制、插件扩展
- **Google ADK Loop Agents**：工作流式 Agent 编排，侧重「循环执行子 Agent」的确定性流程

四者定位不同，但 Agent Loop 的核心结构高度一致。本文在梳理各平台实现细节的基础上，从控制论视角提炼 Agent Loop 的本质，并对 ReAct、Reflection 等学术界常见的扩展范式进行工程价值评估。

---

## 2. 文献来源

| 编号 | 来源 | 标题 | URL |
|------|------|------|-----|
| [1] | Anthropic | How the agent loop works | https://platform.claude.com/docs/en/agent-sdk/agent-loop |
| [2] | OpenAI | Unrolling the Codex agent loop | https://openai.com/index/unrolling-the-codex-agent-loop/ |
| [3] | OpenClaw | Agent Loop | https://docs.openclaw.ai/concepts/agent-loop |
| [4] | Google | Loop agents | https://google.github.io/adk-docs/agents/workflow-agents/loop-agents/ |

---

## 3. Anthropic Agent SDK

### 3.1 核心循环

Anthropic Agent SDK 的 Agent Loop 通过 `agent.run()` 启动，内部为异步迭代循环 [1]：

1. 将当前消息列表发送给 Claude 模型
2. 模型返回 response（文本或 `tool_use`）
3. 若 response 包含 `tool_use` → 执行对应工具 → 将 `tool_result` 追加到消息列表 → 回到步骤 1
4. 若 response 仅包含文本（`stop_reason = "end_turn"`）→ 循环终止，返回最终结果

开发者通过 `async for event in agent.run(...)` 以流式方式获取循环中的所有中间事件 [1]。

### 3.2 Turn 与 Message 模型

Anthropic 定义了明确的 Turn 和 Message 概念 [1]：

- **Turn**：一次模型调用及其后续的全部工具执行，构成一个完整的决策-行动单元
- **消息类型**（5 种）：
  - `SystemMessage`：系统指令
  - `UserMessage`：用户输入
  - `AssistantMessage`：模型响应（含文本和/或工具调用）
  - `ToolResultMessage`：工具执行结果
  - `ResultMessage`：最终输出

### 3.3 工具系统

Agent SDK 的工具系统支持多种类型 [1]：

| 工具类型 | 说明 |
|---------|------|
| `computer` | 屏幕操作（截图、点击、输入） |
| `text_editor` | 文件查看与编辑 |
| `bash` | Shell 命令执行 |
| `mcp` | Model Context Protocol 工具 |
| 自定义 Python 函数 | 开发者定义的 `@tool` 函数 |

**权限模型**：每个工具可配置 `allowed_policies`，支持 `allow`（自动执行）、`deny`（禁止调用）、`ask_user`（需人工确认）三种策略 [1]。

**并行执行**：当 Claude 在单次响应中输出多个 `tool_use` block 时，SDK 会并行执行所有工具调用并批量返回结果，以减少循环轮次 [1]。

### 3.4 上下文管理

对话上下文过长时，SDK 自动触发 **Compaction**（上下文压缩）：将历史消息摘要化，保留关键信息，防止超出上下文窗口限制。开发者可配置压缩策略和触发阈值 [1]。

### 3.5 扩展机制

- **Hooks**：在循环关键节点注入回调（模型调用前后、工具执行前后等），用于日志、审计、拦截等场景 [1]
- **Subagents**：主 Agent 可派生子 Agent，子 Agent 拥有独立的工具集与 system prompt，适用于任务分解 [1]
- **Sessions**：支持会话持久化，跨多次 `run()` 调用保持完整上下文 [1]

---

## 4. OpenAI Codex CLI

### 4.1 核心循环

Codex CLI 同样采用 while 循环模式，但强调 **无状态设计** [2]：

- 每次循环迭代调用 Responses API，传入完整消息历史
- 客户端负责维护全部对话状态，服务端不持有 session

循环结构 [2]：

```
while True:
    response = responses_api.create(instructions, tools, input)
    if response.has_tool_calls():
        results = execute_tools(response.tool_calls)
        input.append(results)
    else:
        return response.text
```

### 4.2 Prompt 构建

Codex CLI 的 prompt 由三部分拼接而成 [2]：

1. **`instructions`**（system 角色）：系统指令，定义 Agent 行为
2. **`tools`**（system 角色）：工具定义（JSON Schema）
3. **`input`**（user/assistant 角色）：用户消息与对话历史

角色优先级为：**system > developer > user > assistant** [2]。

### 4.3 Prompt 前缀缓存（核心优化）

这是 Codex CLI 最关键的工程设计。Responses API 对 prompt 的 **前缀部分** 执行 KV Cache [2]：

- `instructions` 和 `tools` 固定在 prompt 头部，作为稳定前缀
- 每次循环迭代仅新增尾部消息需要计算 → 推理延迟大幅降低
- **关键约束**：前缀必须保持严格不变，否则触发 cache miss，性能骤降

Codex 团队将 prompt 前缀缓存视为一等设计约束而非事后优化，整个工程实现围绕 cache hit 率展开 [2]。

### 4.4 Compaction

当上下文过长时，Codex 调用 `/responses/compact` 端点，由模型自动摘要历史消息 [2]。但 compaction 会改变 prompt 前缀内容，导致 cache miss——这是一个需要权衡的 tradeoff [2]。

### 4.5 特殊设计

- **SSE 流式输出**：通过 Server-Sent Events 实时接收生成 token [2]
- **加密推理（encrypted_content）**：推理 token 加密存储，可用于 prompt cache 但不可被外部读取，保护模型内部推理过程 [2]
- **ZDR（Zero Data Retention）支持**：无状态设计天然兼容零数据留存的合规需求 [2]

---

## 5. OpenClaw Agent Runtime

### 5.1 定位与入口

OpenClaw 是一个 **服务端 Agent 运行时**，面向多会话的平台级场景；通过 per-session 队列与可选的 global lane 做并发控制 [3]。提供两种入口：

- **Agent RPC**：服务间调用，用于生产环境
- **CLI**：本地开发与调试

### 5.2 会话并发控制

OpenClaw 实现了两级并发控制 [3]：

- **Per-session 队列**：同一会话内的请求严格排队执行
- **Global lanes**：跨会话的全局并发限制，防止资源耗尽

### 5.3 循环前准备

在进入 Agent Loop 之前，OpenClaw 执行一系列准备工作 [3]：

- **Workspace 初始化**：git clone 或 checkout 目标代码仓库
- **Skills 加载**：将 Markdown 格式的技能文件注入 prompt
- **Prompt 组装**：系统指令 + 技能上下文 + 会话历史

### 5.4 Hook 系统

OpenClaw 拥有三个平台中 **最丰富的 Hook 系统** [3]：

- **内部 hooks**：框架自带的生命周期钩子
- **Plugin hooks**：15+ 扩展点，覆盖完整的 Agent 生命周期：

| Hook 类别 | 示例 |
|-----------|------|
| 会话级 | `on_session_start`、`on_session_end` |
| Turn 级 | `on_turn_start`、`on_turn_end` |
| 模型调用级 | `on_before_model_call`、`on_after_model_call` |
| 工具执行级 | `on_before_tool_execution`、`on_after_tool_execution` |
| 异常处理 | `on_compaction`、`on_timeout`、`on_error` |

### 5.5 流式输出

OpenClaw 支持三通道并行流式输出 [3]：

- **Lifecycle stream**：会话状态变化事件
- **Assistant stream**：模型生成 token
- **Tool stream**：工具执行实时输出

### 5.6 其他机制

- **Reply shaping / suppression**：控制模型输出格式，抑制不需要的回复 [3]
- **Compaction + retry**：上下文溢出时自动压缩并重试当前请求 [3]
- **Timeout 机制**：配置全局与单 turn 超时，防止无限循环 [3]

---

## 6. Google ADK Loop Agents

### 6.1 定位与概念

Google Agent Development Kit (ADK) 的 **LoopAgent** 是一种 **工作流 Agent（Workflow Agent）**，与前述「单 Agent + 工具」的 ReAct 式循环不同：它 **按顺序反复执行一组子 Agent**，用于迭代式任务（如反复修订文档、直到满足条件或达到最大轮数）[4]。

- **核心语义**：`LoopAgent` 在循环中依次调用各子 Agent 的 `Run Async`，子 Agent 可以是 LLM Agent 或其它 Agent；循环由 **最大迭代次数** 或 **子 Agent 发出的终止信号** 结束。
- **与 ReAct 的区别**：ADK 的 Loop 是 **编排层** 的循环（谁在何时运行），不替代单 Agent 内部的「思考 → 工具 → 观察」循环；子 Agent 内部仍可有自己的工具与 LLM 调用。

### 6.2 执行流程

当 `LoopAgent` 的 `Run Async` 被调用时 [4]：

1. **子 Agent 执行**：按 `sub_agents` 列表顺序，依次调用每个子 Agent 的 `Run Async`。
2. **终止判断**：Loop 本身 **不主动决定何时停止**，必须通过以下之一避免无限循环：
   - **Max Iterations**：在 `LoopAgent` 上设置最大迭代次数，达到后强制结束。
   - **子 Agent 上报终止**：由某个子 Agent 通过 **escalation**（如调用 `exit_loop` 工具并设置 `tool_context.actions.escalate = True`）或共享状态中的标志位通知上层「条件已满足，可结束循环」。

### 6.3 典型示例：迭代式文档改进

ADK 文档给出的完整示例是「迭代式文档改进」[4]：

- **InitialWriterAgent**（LlmAgent）：根据主题写一份简短初稿，输出写入状态 `current_document`。
- **RefinementLoop**（LoopAgent）：内有两个子 Agent，最多跑 5 轮：
  - **CriticAgent**：审阅 `current_document`，若未达标准则输出改进建议，若达标则输出固定句「No major issues found.」，结果写入 `criticism`。
  - **RefinerAgent**：若 `criticism` 为「No major issues found.」则 **调用 `exit_loop` 工具** 终止循环；否则根据批评意见改写文档并写回 `current_document`。
- **根 Agent**：`SequentialAgent(InitialWriterAgent, RefinementLoop)`，先写初稿，再进入 refinement 循环。

终止机制要点：RefinerAgent 被赋予 `exit_loop` 工具；该工具内部设置 `tool_context.actions.escalate = True`（以及可选的 `skip_summarization = True`），从而向 ADK 运行时发出「结束当前 Loop」的信号 [4]。

### 6.4 设计要点小结

| 维度 | 说明 |
|------|------|
| **确定性** | LoopAgent 自身无 LLM，执行顺序与次数由配置和子 Agent 的终止信号决定，行为可复现。 |
| **终止** | 必须显式设计：要么 `max_iterations`，要么子 Agent 通过工具/事件/状态发出「停止」信号。 |

---

## 7. 横向对比

### 7.1 核心架构对比

| 维度 | Anthropic Agent SDK [1] | OpenAI Codex CLI [2] | OpenClaw [3] | Google ADK Loop [4] |
|------|------------------------|---------------------|--------------|---------------------|
| **定位** | 客户端 SDK | 本地 CLI 编码助手 | 服务端运行时 | 工作流编排 |
| **状态管理** | SDK 内部 + Sessions 持久化 | 完全无状态（客户端维护） | 服务端 Session 队列 | 工作流状态 + 子 Agent 状态 |
| **核心优化** | 并行工具执行、Subagents | Prompt 前缀缓存 | 会话级/全局 lane 并发、Plugin 扩展 | 确定性循环 + 子 Agent 终止信号 |
| **Compaction** | 自动触发，可配策略 | `/responses/compact` 端点 | 自动压缩 + 重试 | 依赖子 Agent 实现 |
| **Hook/扩展** | Hooks + Subagents | 无（极简设计） | 15+ Plugin hooks | 工作流节点级配置 |
| **工具权限** | 内置权限模型（allow/deny/ask） | 沙箱隔离 | Workspace 隔离 | 子 Agent 内建 |
| **流式输出** | async generator | Server-Sent Events | 三通道并行 stream | 工作流/子 Agent 流 |
| **适用场景** | 构建 AI 应用/产品 | 开发者本地编码 | 平台级 Agent 服务 | 迭代式多步任务编排 |

### 7.2 共性

尽管四者定位各异，其 Agent Loop（或编排层 Loop）的基本结构在「单 Agent + 工具」场景下一致：

```python
while True:
    response = model.call(messages)
    if response.has_tool_calls():
        results = execute_tools(response.tool_calls)
        messages.extend(results)
    else:
        return response.text
```

各平台均实现了以下共性机制（ADK 在子 Agent 内部）：

- **工具调用作为唯一的环境交互方式**：模型不直接操作外部系统，而是通过结构化的工具调用 + 结果回传完成闭环
- **上下文压缩（Compaction）**：应对长对话的上下文窗口限制（ADK 由子 Agent 自行处理）
- **流式输出**：支持实时的中间结果推送

### 7.3 差异根源

差异并非源于对 Agent Loop 本身的不同理解，而是各自产品定位的延伸：

- **Anthropic** 服务于 SDK 用户 → 强调易用性（async generator API）和安全性（工具权限模型）
- **OpenAI** 服务于本地 CLI 场景 → 强调推理性能（prompt 前缀缓存是第一优先级）
- **OpenClaw** 服务于平台运营 → 强调可运维性（并发控制、插件扩展、多通道流式）
- **Google ADK** 服务于工作流编排 → 强调确定性循环与子 Agent 终止信号，适合迭代式任务

---

## 8. 分析与讨论

### 8.1 Agent Loop 的控制论本质

Agent Loop 本质上是 **控制论（Cybernetics）中的负反馈控制回路**。其结构直接对应经典的 OODA 循环（Observe-Orient-Decide-Act）：

| OODA 阶段 | Agent Loop 对应 |
|-----------|----------------|
| Observe（观察） | 接收工具执行结果 / 用户输入 |
| Orient（定向） | 上下文窗口中的全部历史信息 |
| Decide（决策） | LLM 推理：生成文本或工具调用 |
| Act（行动） | 执行工具 / 输出最终响应 |

这个闭环结构的关键特征是 **负反馈**：工具执行的结果（无论成功或失败）被回注到系统输入端，驱动下一轮决策。编译错误、API 返回码、测试失败——这些外部信号构成了 Agent 自主纠错的基础。

从这个视角看，Agent Loop 并非 AI 领域的发明，而是控制论在 LLM 场景下的自然应用。其有效性来源于两个条件：

1. **决策者（LLM）具备足够的推理能力**：能从反馈信号中提取有效信息并调整策略
2. **反馈通道（工具系统）提供高质量信号**：工具执行结果是确定性的、可验证的

### 8.2 Agent Loop 与 ReAct 的关系

ReAct（Reason + Act）模式由 Yao et al. [5] 提出，要求模型在每次行动前显式输出推理过程（Thought），形成 `Thought → Action → Observation` 的交替序列。

**Agent Loop 与 ReAct 没有本质区别**。ReAct 是 Agent Loop 的一个具体实例化：

| | Agent Loop（泛称） | ReAct |
|---|---|---|
| 核心结构 | while (有工具调用) { 执行 → 反馈 } | 相同 |
| 推理过程 | 隐式（模型内部完成） | 显式（强制输出 Thought） |
| 历史背景 | 工程实践中的通用术语 | 学术论文中的命名 |

值得注意的是，**本报告调研的平台均未强制 ReAct 格式** [1][2][3][4]。原因在于：当前主流模型（Claude 3.5+、GPT-4+）的推理能力已足够强，模型在内部完成推理后直接输出工具调用指令，无需外部强制 Thought 步骤。ReAct 论文的核心贡献——"让模型在行动前显式推理"——已被模型能力本身所吸收。

### 8.3 Reflection 及其他扩展范式的工程价值

学术界在基础 Agent Loop 之上提出了多种扩展范式：

| 扩展范式 | 机制 | 本质 |
|---------|------|------|
| Reflection [6] | 模型生成结果后自我审查 | 额外的循环迭代 |
| Planning | 先输出执行计划，再按计划执行 | 前置推理步骤 |
| Multi-Agent Debate | 多个 Agent 交叉审查 | 多循环串联 |
| Self-Correction | 失败后自动重试修复 | 错误处理分支 |

这些扩展的共同特点是：**在基础循环之上增加额外的模型调用轮次**。

#### 工程实践中的评估

从本次调研的工业级实现来看，**没有任何一个在核心 Agent Loop 中内置 Reflection 机制** [1][2][3]。这一现象背后有清晰的工程逻辑：

**1. 工具反馈优于自我反思**

Agent Loop 的威力来源于 **外部工具提供的确定性反馈**，而非模型的自我审视。编译错误信息、测试执行结果、API 返回状态码——这些信号的可靠性远高于模型对自身输出的主观评估。在工具反馈充分的场景下，Reflection 是冗余的。

**2. 模型自我反思的可靠性有限**

LLM 的 Reflection 本质上是模型对自身输出的二次评估。然而，如果模型在第一次推理中犯了错误，没有新的外部信息输入的情况下，第二次推理大概率会重复相同的错误或产生新的幻觉。

**3. 成本与延迟的线性增长**

每增加一轮 Reflection 调用，意味着：
- Token 消耗线性增长
- 响应延迟线性增长
- Prompt 前缀缓存可能失效（如 Codex 场景 [2]）

#### 何时 Reflection 可能有价值

在特定场景下，额外的审查轮次仍有其价值：

- **缺乏外部验证手段**：纯文本生成任务（写作、翻译），没有编译器或测试框架提供客观反馈
- **高风险决策**：安全关键操作（数据删除、生产部署），需要额外确认层
- **模型能力不足**：使用较弱模型时，多轮推理可弥补单轮推理的不足——但更优方案通常是换用更强的模型

#### 小结

Reflection 等扩展范式在学术研究中有其价值，但在工程实践中应谨慎使用。**优先投入方向应为**：更好的工具设计（提供高质量反馈信号）、更精准的 prompt 工程、更高效的上下文管理——而非让模型反复审视自身输出。

---

## 9. 结论

1. **Agent Loop 是 LLM Agent 的基础架构范式**，其本质是控制论中的负反馈闭环。各平台实现印证了这一结构的普适性与稳健性。

2. **ReAct 是 Agent Loop 的学术命名**，而非独立范式。随着模型推理能力的提升，显式 Thought 步骤已不再必要。

3. **工业实践的共识是保持循环简洁**：核心循环尽可能精简，工程复杂度集中在循环 **周围**——状态管理、性能优化、安全控制、可观测性。

4. **Reflection 等扩展范式应按需引入**，而非作为默认配置。在工具反馈充分的场景下，额外的自我审查轮次往往是冗余的。

5. **各平台的差异源于产品定位而非技术分歧**：Anthropic 优化易用性，OpenAI 优化推理性能，OpenClaw 优化运维能力，Google ADK 优化工作流编排与迭代流程。选择参考对象时应匹配自身场景。

---

## 10. 参考文献

- [1] Anthropic. "How the agent loop works." *Claude Agent SDK Documentation*. https://platform.claude.com/docs/en/agent-sdk/agent-loop
- [2] Bolin, M. "Unrolling the Codex agent loop." *OpenAI Blog*, 2025. https://openai.com/index/unrolling-the-codex-agent-loop/
- [3] OpenClaw. "Agent Loop." *OpenClaw Documentation*. https://docs.openclaw.ai/concepts/agent-loop
- [4] Google. "Loop agents." *Agent Development Kit (ADK) Documentation*. https://google.github.io/adk-docs/agents/workflow-agents/loop-agents/
- [5] Yao, S. et al. "ReAct: Synergizing Reasoning and Acting in Language Models." *ICLR 2023*. https://arxiv.org/abs/2210.03629
- [6] Shinn, N. et al. "Reflexion: Language Agents with Verbal Reinforcement Learning." *NeurIPS 2023*. https://arxiv.org/abs/2303.11366
