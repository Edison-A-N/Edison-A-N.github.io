---
title: 用 OpenAgents Workspace 协调多 Agent 投研
tags:
  - AI Agent
  - OpenAgents
  - 投研
  - Multi-Agent
categories:
  - AI Agent
date: 2026-03-21 00:00:00
excerpt: >-
  通过 OpenAgents workspace 将多个 OpenCode agent 拉进同一工作空间，各司其职完成数据收集、深度研究、财务建模、投资决策和报告生成，实现多 agent 协作投研。
toc: true
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

> 一个人研究一家公司，需要收数据、做分析、建模型、写报告。
> 如果每个环节都是一个专职 Agent，你只需要说一句话。

项目地址：[Edison-A-N/investment-research-os](https://github.com/Edison-A-N/investment-research-os)

---

## 前置准备

### 安装 OpenCode

自行安装 [OpenCode](https://opencode.ai)，此处不展开。

### 选择对话客户端

OpenAgents workspace 不绑定特定客户端。你可以用 OpenCode、OpenClaw、Claude 等任何兼容客户端与 agent 对话。本文以 OpenCode 为例。

目前有两个上游 PR 需要关注：

- [fix: route all @mentions in messages, not just leading mention](https://github.com/openagents-org/openagents/pull/319) — 对话中 `@agent-name` 提及其他 agent 时能正确路由。**所有客户端都需要**，这是多 agent 协作的基础能力。
- [feat: add OpenCode as builtin agent](https://github.com/openagents-org/openagents/pull/316) — 让 OpenCode 作为内置 agent 接入 workspace。仅 OpenCode 用户需要。

> 用 OpenClaw 或 Claude 客户端的话，只需关注第一个 @mention 修复。

### 配置 Agent Memory

安装 [opencode-agent-memory](https://github.com/Edison-A-N/opencode-agent-memory)（从主 repo fork，增加了关闭 global memory 的能力）：

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["@Edison-A-N/opencode-agent-memory@0.2.0-a1"]
}
```

然后关闭 global memory：

```json
// ~/.config/opencode/agent-memory.json
{
  "memory": {
    "disable_global": true
  }
}
```

**为什么要关 global？** 多 agent 场景下，每个 agent 的记忆必须隔离。global scope 的 memory block（`persona`、`human`）会在所有项目、所有 agent 间共享——Research Agent 写入的记忆会污染 Analysis Agent 的上下文。关掉 global 后，每个 agent 只保留 project scope 的 memory（存在各自的 `.opencode/memory/` 下），互不干扰。

> 记忆共享是个有意思的话题，但不在本文范围内。以后单独聊。

### 启动 Workspace

按 [OpenAgents 官方文档](https://github.com/openagents-org/openagents) 配置好 workspace，然后：

```bash
openagents up
```

具体配置方式这里不做介绍——项目还在快速迭代，写死了容易过时。请以官方文档为准。

## 核心思路

OpenAgents 的 workspace 把多个 OpenCode agent 拉进同一个工作空间。每个 agent 有独立的 SKILL.md 定义角色边界，共享 `workspace/` 目录交换数据。人类只做两件事：**发起任务** 和 **做决策**。

```
你 (OpenCode)
 │
 ├─→ Data Agent        收数据（PDF、RSS、财报）
 ├─→ Research Agent    深度研究（行业、公司）
 ├─→ Analysis Agent    财务建模（DCF、估值）
 ├─→ Memory Agent      知识管理（存储、检索）
 ├─→ Decision Agent    投资决策（评估、风险）
 └─→ Report Agent      报告输出（图表、Excel）
```

## 关键设计

| 设计点 | 做法 |
|--------|------|
| **角色隔离** | 每个 agent 的 SKILL.md 明确写了「✅ 做什么」和「❌ 不做什么」 |
| **数据共享** | 统一用 `workspace/` 目录，`inbox/` 存原始数据，`output/` 存产出 |
| **工具即脚本** | 所有工具都是独立 Python 脚本，`uv run` 一行运行，零配置 |
| **人在回路** | Agent 做分析，人做决策。Decision Agent 提供建议而非替你下单 |

## 为什么是 Workspace 而不是单个 Agent

单个全能 Agent 的问题：上下文爆炸、角色混乱、输出不可控。

Workspace 的做法：每个 agent 专注一件事，通过文件系统松耦合协作。你可以单独跟任何一个 agent 对话，也可以让它们串联工作。就像一个投研团队——数据员、分析师、基金经理各司其职。
