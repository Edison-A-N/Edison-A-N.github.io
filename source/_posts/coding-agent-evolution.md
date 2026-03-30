---
title: 从代码到行动：Coding Agent 如何演变为通用数字助手
tags:
  - AI
  - Agent
  - Claude Code
  - MCP
  - Harness Engineering
categories:
  - AI Agent
excerpt: >-
  本文梳理了 Coding Agent 从 GitHub Copilot 到 Claude Code，再到 Universal Agent 的完整演进历程，
  重点探讨了 MCP 协议、Skill 系统、Harness Engineering 等关键概念，揭示了 AI 从「会说话」到「会行动」的范式转移。
date: 2025-03-30 12:00:00
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

## 序章：铺垫 (2021-2024)

2021年6月，GitHub Copilot 的发布标志着 AI 正式进入程序员的工作流。随后几年里，Cursor、GitHub Copilot X、OpenAI Codex 等工具相继涌现，将代码生成的体验不断提升。但这一切都有一个共同的局限：**它们本质上仍是「被动工具」**——等待人类输入，给出建议，然后再次等待。

AI 可以帮你写函数，但不能自己决定应该写什么函数；AI 可以帮你修复 bug，但不能自己发现 bug 在哪里。这种「反应式」的交互模式，限制了 AI 在软件工程中的上限。

直到 2025年2月24日，一切开始改变。

---

## 第一章：Claude Code 的诞生——AI 学会行动

Anthropic 在这一天发布了 Claude Code 的 Research Preview。这不是又一个代码编辑器插件，而是一个运行在终端里的 **Agent**。

Claude Code 的核心突破在于它打破了传统的「输入-输出」模式：

**传统模式**：人类描述需求 → AI 生成代码 → 人类执行 → 人类反馈

**Claude Code 模式**：人类描述需求 → AI **自主探索**代码库 → AI **制定计划** → AI **执行操作**（写代码、运行测试）→ AI **观察结果**（读取错误信息）→ AI **调整策略** → 循环直到完成

这个「计划-执行-观察-调整」的循环，就是 AI 行业所称的 **Agentic Behavior（代理行为）**。Claude Code 将其从研究概念变成了开发者日常工作中可用的现实。

更重要的是，Claude Code 采用了 **垂直整合** 策略：Anthropic 同时控制底层模型（Claude 3.7 Sonnet）和上层工具。这就像 Apple 同时设计芯片和操作系统，可以实现深度优化。当模型能力提升时，工具层可以立即利用；当工具需要特定模型行为时，可以双向调整。

这种架构优势，是竞争对手难以复制的。

---

## 第二章：MCP——连接世界的协议

在 Claude Code 发布的三个月前（2024年11月25日），Anthropic 已经悄悄埋下了一颗重要的种子：**Model Context Protocol（MCP）**。

MCP 的本质很简单：它定义了 AI Agent 如何与外部工具通信的标准。在此之前，每个 AI 应用都需要单独对接每个工具（Slack、GitHub、数据库、浏览器...），而 MCP 让这一切标准化了。

**MCP 的核心设计**：
- **Server**：暴露工具能力的端点（如 GitHub MCP Server、PostgreSQL MCP Server）
- **Client**：消费这些能力的 AI 应用（如 Claude Code）
- **协议**：统一的工具描述格式、调用方式、返回格式

Claude Code 原生支持 MCP，这意味着它不仅能操作本地代码，还能通过 MCP Server 连接任何外部服务：查询数据库、创建 GitHub PR、发送 Slack 消息、控制浏览器...

2025年，MCP 迅速成为行业标准。Google Gemini Code Assist、OpenAI 的生态、以及无数开源项目都采纳了这一协议。这为 Coding Agent 向通用 Agent 演进铺平了道路。

---

## 第三章：Computer Use——AI 开始控制电脑

在 Claude Code 发布前的一个月（2024年10月），Anthropic 已经展示了另一个关键能力：**Computer Use**。

通过 Computer Use API，Claude 可以像人一样操作电脑：
- 查看屏幕截图
- 移动鼠标、点击按钮
- 输入文字
- 完成多步骤任务

这是 AI 从「文本世界」进入「图形界面世界」的桥梁。代码编辑器里的 AI 只能处理文本，而 Computer Use 让 AI 可以操作任何有图形界面的软件。

但这还不足以构成通用 Agent。Computer Use 提供了「眼睛和手」，但缺少「大脑」——它知道如何操作界面，但不知道如何规划复杂任务、如何分解步骤、如何在失败时调整策略。

**Claude Code 提供了这个「大脑」**。

---

## 第四章：从 Coding Agent 到 Universal Agent——核心逻辑的展开

### 4.1 关键洞察：为什么 Claude 天然适合成为通用 Agent？

Claude Code 的演进揭示了一个深刻的洞察：

> **大模型（特别是 Claude）擅长写代码，而代码的本质是「精确的结构化指令」。因此，AI 天然擅长通过编写和执行指令来完成任何数字任务。**

让我们拆解这个逻辑链：

| 能力层级 | 示例 | 说明 |
|---------|------|------|
| **写代码** | Python/JavaScript/Go | 为软件工程编写的结构化逻辑 |
| **写脚本** | Bash/Python 自动化脚本 | 调用系统命令、处理文件、操作进程 |
| **调用 API** | HTTP 请求、GraphQL | 通过网络与外部服务通信 |
| **控制软件** | 通过 GUI 自动化（Computer Use）| 操作没有 API 的传统软件 |
| **编排硬件** | IoT 设备控制、机器人指令 | 向物理世界发送指令 |

**关键认知转变**：Coding Agent 不只是「帮程序员写代码的工具」，而是「一个擅长生成可执行指令的系统」。当这个系统被赋予：
1. 执行环境（终端、浏览器、API）
2. 反馈机制（观察执行结果）
3. 迭代能力（根据反馈调整）

它就能完成任何可以通过指令描述的任务。

### 4.2 Claude Code 的通用化路径

Claude Code 从「代码助手」向「通用 Agent」演进，经历了三个阶段的扩展：

**阶段一：代码库内部的操作**
- 读取、编辑文件
- 运行测试、检查错误
- Git 工作流（commit、branch、PR）
- 代码搜索、重构

**阶段二：通过 MCP 连接外部服务**
- 浏览器控制（访问网页、提取数据、填写表单）
- 数据库操作（查询、更新）
- 第三方 API 调用（Slack、Notion、GitHub、AWS...）
- 文件系统操作（处理本地和云端文件）

**阶段三：多 Agent 协作（Subagents）**
- 主 Agent 分解任务，spawn 多个子 Agent
- 子 Agent 并行执行不同子任务
- 例如：一个 Agent 读代码、一个 Agent 写测试、一个 Agent 生成文档
- 通过 session 机制保持上下文连续性

这种架构让 Claude Code 从一个「单兵作战」的工具，进化为「指挥官 + 军队」的系统。

### 4.3 Skill 系统的提出——能力的封装与复用

Claude Code 的发展催生了 **Skill** 这一核心概念。

**什么是 Skill？**

Skill 是一个封装了「上下文 + 工具定义 + 执行逻辑」的结构化单元。它包含：
- **描述**：Skill 能做什么（自然语言 + 结构化 schema）
- **工具**：Skill 使用的 MCP tools 或自定义脚本
- **提示词**：如何调用 LLM 来处理特定任务
- **示例**：展示 Skill 的使用方式

**Skill 的价值**：

1. **模块化**：复杂能力被拆分为可独立开发、测试、部署的单元
2. **可组合**：Agent 可以动态加载、组合多个 Skills 完成复杂任务
3. **可分享**：开发者可以创建、发布、分享自己的 Skills
4. **安全性**：通过 Skill 的权限控制，限制 Agent 的操作范围

**实际例子**：

```yaml
# 一个典型的 Skill 定义
name: database-query
description: 查询 PostgreSQL 数据库并返回结构化结果
tools:
  - mcp-server-postgres/query
prompt: |
  你是一个数据库专家。用户会问关于数据库的问题，
  你需要：1) 分析需求 2) 生成正确的 SQL 3) 执行查询 4) 解释结果
examples:
  - query: "上个月销售额最高的产品是什么？"
    sql: "SELECT product_name, SUM(amount) FROM sales WHERE date > NOW() - INTERVAL '1 month' GROUP BY product_name ORDER BY SUM(amount) DESC LIMIT 1"
```

当 Claude Code 加载这个 Skill 后，它就能自动处理数据库相关的任务，而无需每次重新描述上下文。

### 4.4 OpenClaw 与 Lobster——开源生态的爆发

Claude Code 的模式启发了一系列开源项目，其中最值得注意的是 **OpenClaw**。

**OpenClaw 的定位**：
> "Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞"

OpenClaw 基于 Claude Code 的核心思想，构建了一个更加开放和可扩展的平台：

**核心特性**：

1. **5400+ Skills 生态**
   - 官方 Skill Registry 收录了数千个社区贡献的 Skills
   - 覆盖 coding、浏览器自动化、系统管理、通讯、数据分析等
   - 类似 App Store 的发现和安装机制

2. **多平台支持**
   - 支持 20+ 通讯渠道（WhatsApp、Telegram、Slack、Discord、iMessage 等）
   - Agent 可以通过用户已经在使用的渠道交互
   - 不仅限于 Terminal，也可以是聊天应用

3. **Lobster——确定性工作流运行时**
   - OpenClaw 的核心编排引擎
   - 支持将 Skills 组合成「工作流」（Workflow）
   - 关键特性：**确定性执行 + 人工审批门控**
   
   这意味着：
   - 对于可预测的步骤，使用确定性的 pipeline（无 LLM 决策）
   - 对于关键操作，设置人工确认点
   - 平衡了自动化效率和安全性

4. **本地优先（Local-first）**
   - Gateway 运行在用户本地设备
   - 数据不经过第三方服务器
   - 隐私和可控性

**OpenClaw 的意义**：

它证明了 Claude Code 的模式不仅适用于 Anthropic 的封闭生态，也可以被开源社区复现和扩展。更重要的是，它将「Coding Agent」的概念推向了更广泛的「Personal AI Assistant」——不仅帮程序员写代码，而是帮任何人完成任何数字任务。

### 4.5 范式转移的本质

让我们总结这一演进的核心逻辑——这不是堆叠的"层级"，而是**能力的不断扩展**：

**演进路线图：从单一能力到通用智能**

```
                    ┌──────────────────────────────────────┐
                    │   Stage 3: Universal Agent           │
                    │   通用数字助手                         │
                    │   能操作任何软件、API、GUI、硬件        │
                    │   示例：OpenClaw、AI-Native OS        │
                    └──────────────┬───────────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │  关键突破：Skill 系统  │
                        │  + Computer Use      │
                        │  + Harness Engineering│
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴───────────────────────┐
                    │   Stage 2: Connected Agent           │
                    │   工具连接型 Agent                    │
                    │   通过 MCP 连接外部服务                │
                    │   示例：Claude Code + MCP Servers    │
                    └──────────────┬───────────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │  关键突破：MCP 协议   │
                        │  标准化工具连接      │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴───────────────────────┐
                    │   Stage 1: Coding Agent              │
                    │   代码型 Agent                        │
                    │   只能在代码库内操作                   │
                    │   示例：Cursor、Copilot、早期工具      │
                    └──────────────────────────────────────┘
```

**演进的关键节点**：

| 阶段 | 能力范围 | 关键突破 | 代表产品 |
|------|----------|----------|----------|
| **Stage 1** | 代码库内部 | Agent Loop（自主规划与执行） | Claude Code |
| **Stage 2** | 外部服务 | MCP 协议（标准化工具连接） | Claude Code + MCP |
| **Stage 3** | 任意数字系统 | Skill + Computer Use + Harness | OpenClaw、未来 AI OS |

**为什么这一演进是必然的？**

因为现代数字世界的本质是可编程的：
- 软件有 API
- 操作系统有命令行
- 网页有 DOM 可以被操作
- 硬件有驱动程序

**只要 AI 能生成正确的指令（代码/脚本/API 调用），它就能控制这一切。**

而 Claude 系列模型（以及后来的 GPT-4、Gemini 等）已经证明，它们在代码理解和生成方面达到了前所未有的水平。这不是巧合——代码训练数据的高质量、结构化特性，让 LLM 在这方面的能力远超其他领域。

**因此，Coding Agent 成为 Universal Agent 的「特洛伊木马」**：
- 以「帮程序员写代码」为切入点，获得了大量的代码训练数据和用户反馈
- 逐步扩展能力边界，从代码到脚本、从脚本到 API、从 API 到 GUI
- 最终成为能操作整个数字世界的通用代理

---

## 第五章：Harness Engineering——从「能用」到「可靠」的关键跃迁

### 5.1 什么是 Harness Engineering？

2026年初，AI 领域出现了一个重要的新概念：**Harness Engineering**（Harness 工程）。OpenAI、Martin Fowler 等权威机构和个人纷纷撰文讨论这一话题，它迅速成为行业焦点。

**定义**：Harness Engineering 是设计和构建「控制框架」的学科——这个框架围绕 AI 模型，决定模型如何接收输入、调用工具、处理反馈、纠正错误，最终可靠地完成任务。

用一个比喻来理解：
- **模型（Model）** 是引擎——提供动力
- **Harness** 是传动系统、底盘、控制系统——决定引擎的动力如何转化为实际的行驶能力

没有 harness，引擎只是轰鸣；有了 harness，汽车才能安全、可控地到达目的地。

### 5.2 一个惊人的数据

行业观察发现，同样的底层模型，在不同的 harness 配置下，性能表现可能有巨大差异——有案例显示，在同一个 coding benchmark 上的得分差距可达一倍以上（例如从 40% 提升到 80%）。

这不是模型的差距，而是 harness 的差距。

这意味着什么？**模型能力只是基础，harness 设计才是决定 AI Agent 实际表现的关键。**

### 5.3 Harness 的核心组件

一个完整的 Agent Harness 包括：

**1. 输入处理层（Input Sanitization）**
- 如何解析用户的自然语言指令
- 如何将其转化为结构化的任务描述
- 如何识别歧义和缺失信息

**2. 工具编排层（Tool Orchestration）**
- 何时调用什么工具（MCP Server、API、系统命令）
- 如何处理工具调用的失败和超时
- 如何组合多个工具完成复杂任务

**3. 反馈循环（Feedback Loop）**
- 如何观察工具执行的结果（成功、失败、部分成功）
- 如何将结果反馈给模型进行下一轮决策
- 何时终止、何时重试、何时请求人类介入

**4. 错误处理与恢复（Error Handling）**
- 如何分类不同类型的错误（语法错误、逻辑错误、权限错误、网络错误）
- 如何自动修复常见错误
- 何时将错误上报给人类

**5. 安全与沙箱（Safety & Sandbox）**
- 限制 Agent 的操作范围（文件系统、网络、敏感数据）
- 记录所有操作供审计
- 关键操作的人工审批门控

**6. 上下文管理（Context Management）**
- 如何维护长期任务的上下文
- 何时压缩、何时丢弃、何时总结历史信息
- 多 Agent 协作时的上下文隔离与共享

### 5.4 为什么 Harness Engineering 现在才火？

Harness 的概念并非突然出现。回顾我们之前的章节：

- **Claude Code 的 Agent Loop**：就是一种 harness——定义了「计划-执行-观察-调整」的循环
- **MCP 协议**：是工具连接层的标准化 harness
- **Skill 系统**：是可复用的 harness 模块
- **Lobster**：是确定性 workflow 的 harness

但 2026年的 Harness Engineering 将这些零散实践 **系统化、理论化** 了。它回答了一个关键问题：

> **「如何工程化地构建可靠的 AI Agent？」**

之前的 Agent 开发更像是「炼丹」——调整提示词、尝试不同模型、碰运气。Harness Engineering 将其转变为 **可设计、可测量、可改进的工程学科**。

### 5.5 Harness > Model：范式转变

Harness Engineering 的兴起标志着行业认知的重大转变：

**旧认知**：模型能力是瓶颈 → 追求更强的模型（GPT-5、Claude 4、Gemini 3）

**新认知**： harness 设计是瓶颈 → 追求更好的 harness（工具编排、错误恢复、多 Agent 协作）

**这不是说模型不重要，而是说：在模型能力达到一定阈值后，harness 的质量决定了 AI 能否在实际生产环境中可靠运行。**

正如 Martin Fowler 网站上 Birgitta Böckeler 的文章所言：

> *"The harness is the product."*
> 
> *（Harness 就是产品本身。）*

### 5.6 Harness Engineering 与 Coding Agent 演进的关系

让我们把 Harness Engineering 放入整个演进脉络中：

```
┌────────────────────────────────────────────────────────────┐
│ 2024-2025: Agent 原型期                                     │
│ • Claude Code、MCP、Skill 概念出现                          │
│ • 验证「Agent 能做什么」                                    │
│ • 探索不同架构和模式                                        │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 2026+: Harness Engineering 时代                             │
│ • 系统化总结 Agent 设计模式                                 │
│ • 建立工程化的 Agent 开发方法                               │
│ • 从「原型」到「生产级产品」                                │
└────────────────────────────────────────────────────────────┘
```

**Harness Engineering 是 Coding Agent 向 Universal Agent 演进的必然阶段**：
- Universal Agent 需要操作更多类型的工具（代码、API、GUI、硬件）
- 工具越多，失败模式越多，越需要 robust 的 harness
- 只有系统化的 harness 设计，才能让 Universal Agent 在生产环境可用

### 5.7 实际案例：Harness 如何改变开发流程

**场景**：让 Agent 重构一个大型代码库

**没有 Harness** 的 Agent：
- 读取代码 → 尝试重构 → 遇到编译错误 → 陷入循环或报错退出
- 可能删除关键文件而不自知
- 无法处理跨文件依赖
- 最终需要人类接手收拾残局

**有 Harness** 的 Agent：
1. **规划阶段**：先分析代码结构，识别依赖关系，制定重构计划
2. **沙箱阶段**：在隔离环境中执行重构，不影响生产代码
3. **验证阶段**：自动运行测试，检查编译结果
4. **回滚机制**：如果失败率超过阈值，自动回滚并报告
5. **人工门控**：涉及关键文件时，暂停并请求确认
6. **分阶段提交**：小步快跑，每步都可验证、可回滚

**Harness 让 Agent 从「赌博式尝试」变成「工程化交付」。**

---

## 第六章：范式转移的验证 (2025-2026)

Claude Code 的发布引发了整个行业的快速跟进，验证了「Agentic AI」这一方向的价值。

### 6.1 竞争对手的响应

**2025年4月**：OpenAI 发布 **Codex CLI**
- 基于 o3 和 o4-mini 模型
- Terminal-based agent，架构与 Claude Code 类似
- 承认「终端 Agent」模式的有效性

**2025年6月**：Google 发布 **Gemini CLI**
- 基于 Gemini 2.5 Pro
- 同样采用 Agent Loop + MCP 的架构

**2025年全年**：
- Cursor 从「AI 编辑器」转向「Agentic IDE」
- Windsurf、Kilo Code 等工具加入 Agent 能力
- OpenCode 成为主流开源替代（GitHub 7万+ stars）

**行业共识形成**：Terminal-based Agent + MCP + Subagents 成为标准架构。

### 6.2 商业数据验证

Claude Code 的商业表现证明了这一模式的盈利能力：

- **发布后3个月**：使用增长 **10 倍以上**
- **年化收入**：突破 **5 亿美元**（截至2025年9月，后续增长至数十亿美元级别）
- **用户群体**：从专业开发者扩展到非技术人员

对于一个「Terminal 里的黑屏白字」工具，这些数据是惊人的。它说明：
1. 开发者愿意为能真正自主完成任务的 AI 付费
2. Agent 模式的价值感知远超传统的代码补全工具
3. 市场教育成本比预期低——一旦体验过 Agent 的能力，用户就回不去了

### 6.3 用户群体的扩展——从开发者到「数字工匠」

最具说服力的验证来自用户群体的变化。

**传统 Coding Tool 的用户**：专业软件工程师，熟悉 Terminal、Git、编程语言。

**Claude Code 的新用户**：
- 产品经理：用自然语言描述需求，让 Agent 构建原型
- 设计师：自动化设计稿到代码的转换
- 数据分析师：通过 Agent 清洗数据、生成可视化
- 运营人员：自动化重复性的数据录入和报表生成
- 创业者：独立构建 MVP，无需雇佣工程师

**关键转变**：这些用户可能看不懂 Agent 生成的代码，但他们能评估结果是否满足需求。

> "当开发者停止阅读代码，仅仅评估应用是否按预期工作时，他们就已经跨越了那条线。他们不再是在 AI 辅助下完成工作——他们变成了「编排者」。"

这种「编排者模式」正是 Universal Agent 的核心价值：
- 人类负责：意图表达、结果评估、关键决策
- AI Agent 负责：执行细节、错误处理、迭代优化

### 6.4 技术成熟度的标志

2025-2026年间，几个技术指标标志着 Agent 的成熟：

**1. 成功率提升**
- 早期 Claude Code（3.7 Sonnet）：复杂任务成功率约 60-70%
- 后期（Claude 4、o3、Gemini 2.5）：成功率提升到 80-90%
- 关键改进：错误恢复能力、长上下文理解、多步骤规划

**2. 生态系统完善**
- MCP Servers：从几十种扩展到数千种
- Skill Registry：类似 npm/pypi 的包管理生态
- 开发工具：调试 Agent、可视化 Agent 执行流程的工具

**3. 安全与可控性**
- 沙箱执行环境（防止 Agent 破坏系统）
- 权限分级（不同 Skill 有不同权限）
- 人工审批门控（关键操作需确认）
- 审计日志（追踪 Agent 的所有行为）

这些基础设施的完善，让 Agent 从「实验性玩具」变成了「生产级工具」。

---

## 第七章：未来展望——Agent 时代的黎明

### 7.1 技术演进方向

**短期（1-2年）**：

1. **多 Agent 协作成为常态**
   - 复杂任务需要多个 Specialist Agent 协同
   - 出现「Agent 编排层」（如 Lobster 的进化版）
   - 类似于微服务架构，但 Agent 是动态组合、而非静态部署

2. **Skill 生态爆发**
   - 每个垂直领域都会有专门的 Skill 生态
   - 出现「Skill 开发者」这一新职业
   - Skill 商店成为新的应用分发渠道

3. **模型与工具的进一步融合**
   - 模型原生支持工具调用（Function Calling 成为基础能力）
   - 模型可以「自省」——评估自己是否需要调用工具
   - 工具调用不再是「附加功能」，而是「核心能力」

**中期（3-5年）**：

1. **AI-Native OS 的出现**
   - 操作系统层面集成 Agent 能力
   - 用户与计算机的交互从「直接操作」变为「通过 Agent 委托」
   - 文件系统、网络、硬件都通过 Agent 暴露为可编程接口

2. **物理世界的扩展**
   - Agent 不仅控制软件，还通过机器人控制物理世界
   - 代码生成 → 脚本执行 → API 调用 → 机器人指令
   - 「数字助手」进化为「全能助手」

3. **人机协作模式重构**
   - 职业定义变化：从「执行任务」到「定义任务、监督执行、评估结果」
   - 组织架构变化：Agent 成为「数字员工」，有明确的责任边界
   - 经济模式变化：按任务结果付费，而非按工时付费

### 7.2 社会影响的思考

**积极的方面**：

- **创造民主化**：任何人都能将想法转化为软件产品
- **效率提升**：重复性工作被自动化，人类专注于创造性工作
- **教育变革**：编程教育从「学习语法」转向「学习问题分解、系统设计」

**挑战与风险**：

- **就业冲击**：初级程序员、数据录入员等岗位可能被取代
- **技术依赖**：人类可能过度依赖 Agent，失去底层技能
- **安全风险**：Agent 被攻击或滥用可能造成更大破坏
- **责任归属**：当 Agent 犯错时，责任在谁？

**应对策略**：

- 教育体系需要培养「与 AI 协作」的能力
- 企业需要建立 Agent 治理框架
- 社会需要讨论 Agent 的伦理边界

### 7.3 回到起点：为什么 Claude Code 如此重要？

回顾 2025年2月24日那个「没人注意的发布」，我们现在可以回答：为什么 Claude Code 比 ChatGPT、Cursor、Codex 都更重要？

**ChatGPT**（2022年11月）开启了 AI 的大众认知，但它是「聊天机器人」——AI 只是对话，不采取行动。

**Cursor/Copilot**（2021-2023年）提升了开发效率，但它们是「被动工具」——等待人类触发，无法自主工作。

**Claude Code**（2025年2月）第一次让 AI **自主地、持续地、有目的地** 行动。它证明了：
- AI 可以规划多步骤任务
- AI 可以观察环境反馈
- AI 可以迭代调整策略
- AI 可以调用工具完成实际工作

这不是渐进式改进，而是**范式转移**——从「AI 辅助人类」到「人类监督 AI」。

正如 dentro.de 的那篇文章所言：

> *"Where ChatGPT was the most visible AI event in history, Claude Code was one of the least visible, and yet the shift it represents - from AI that talks to AI that acts - may prove to be the more consequential one."*
> 
> *（ChatGPT 是 AI 历史上最引人注目的事件，而 Claude Code 是最不引人注目的之一。但它所代表的转变——从会说话的 AI 到会行动的 AI——可能被证明是更具深远影响的。）*

### 7.4 最终思考

我们正在见证一个历史性的转变：

**从软件工程的角度看**：Coding Agent 不是终点，而是通往 Universal Agent 的必经之路。代码是数字世界的通用语言，掌握代码生成的 AI，自然能掌握整个数字世界。

**从人类社会的角度看**：这不是「AI 取代人类」的故事，而是「人类角色转变」的故事。我们从「做具体工作」的人，变成「定义目标、配置 Agent、评估结果」的人。这既是解放，也是挑战。

**从技术的本质看**：Claude Code 揭示了一个简单但深刻的真理——

> **大模型擅长写代码，而写代码的本质是生成结构化指令。在数字时代，所有软件、服务、硬件都可以通过指令控制。因此，擅长写代码的 AI，天然就是 Universal Agent。**

这不是巧合，而是必然。Coding Agent 的进化史，就是 AI 逐步掌握数字世界控制权的进程史。

而我们，正站在这个进程的起点。

---

## 附录：关键时间节点

| 时间 | 事件 | 意义 |
|------|------|------|
| 2021年6月 | GitHub Copilot 发布 | AI 代码补全时代开启 |
| 2022-2023年 | Cursor、Codex 等工具涌现 | 代码生成体验提升，但仍是被动工具 |
| 2024年10月 | Anthropic Computer Use | AI 开始能控制图形界面 |
| 2024年11月 | MCP 协议发布 | 工具连接标准化 |
| **2025年2月** | **Claude Code 发布** | **第一个真正的 Agentic Coding Tool** |
| 2025年4月 | OpenAI Codex CLI | 竞争对手跟进 |
| 2025年6月 | Google Gemini CLI | 行业共识形成 |
| 2025年 | OpenClaw 成熟 | 开源生态爆发，5400+ Skills |
| 2025-2026年 | Skill 生态、多 Agent 协作 | 向 Universal Agent 演进 |
| **2026年初** | **Harness Engineering 提出** | **Agent 从「能用」到「可靠」的关键跃迁** |

---

*本文基于公开资料整理，部分预测性内容代表作者观点。*
