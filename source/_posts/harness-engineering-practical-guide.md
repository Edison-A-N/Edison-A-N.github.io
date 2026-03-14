---
title: Harness Engineering 实践指南：来自 OpenAI、Stripe、Anthropic 等团队的一线经验
tags:
  - LLM
  - AI Agent
  - Harness Engineering
categories:
  - AI Agent
excerpt: >-
  基于 OpenAI、Stripe、Anthropic、LangChain、Mitchell Hashimoto
  等团队的一线经验，系统整理 Harness Engineering 的十大实践，涵盖 AGENTS.md、架构约束、闭环验证、会话间记忆、熵治理等核心主题，附量化证据与 16 篇参考文献。
date: 2026-03-14 00:00:00
toc: true
---

<div style="color: #666; font-style: italic; font-size: 0.9em; margin-bottom: 1em;">
本文内容由 AI 协助生成
</div>

> 基于 OpenAI、Stripe、Anthropic、LangChain、Mitchell Hashimoto 等团队的一线经验整理。
>
> 整理时间：2026 年 3 月

---


## 总论：一个核心认知转变

> "Our most difficult challenges now center on designing environments, feedback loops, and control systems."
> — OpenAI Harness Engineering 团队 [1]

Harness Engineering 的核心认知转变是：**当 Agent 犯错时，问题几乎不是"代码写错了"，而是"环境缺了什么"。** 修复方式不是"再试一次"，而是"诊断缺少的能力，然后让 Agent 自己把这个能力补上"。[1]

工程师的角色从 **代码作者** 变为 **系统设计师**：设计约束、构建反馈回路、维护文档基础设施、管理 Agent 工作流。[2][3]

---

## 实践一：AGENTS.md — 把文档变成免疫系统

### 核心原则

Mitchell Hashimoto 的定义最为精炼：

> "Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."
> — Mitchell Hashimoto [4]

AGENTS.md 不是写一次就忘的文档。它是一个**免疫系统**：每次 Agent 犯错，就增加一条规则防止再犯。

### 具体做法

**做法 A：渐进式披露（Progressive Disclosure）**

不要写一个巨大的单一文件。OpenAI 团队的经验教训：[1]

- ❌ 巨型 AGENTS.md → 上下文拥挤（挤掉了真正的任务和代码）、过度指导（所有东西都标记"重要"则等于没有重要的）、即时腐烂（无法机械验证）。
- ✅ AGENTS.md 作为**目录表**（约 100 行），指向深层文档。OpenAI 仓库有 **88 个 AGENTS.md 文件**，每个子系统一个。[1]

推荐结构（来自 OpenAI）：[1]

```
AGENTS.md               ← 目录表（~100 行）
ARCHITECTURE.md         ← 顶层领域地图
docs/
├── design-docs/        ← 带索引的架构决策
├── exec-plans/
│   ├── active/
│   ├── completed/
│   └── tech-debt-tracker.md
├── generated/
│   └── db-schema.md
├── product-specs/
├── references/         ← 外部库文档（为 LLM 重新格式化）
└── ...
```

**做法 B：每一行对应一个具体的过去错误**

Hashimoto 的 Ghostty 项目 AGENTS.md [4] 中，每一行都对应一次具体的 Agent 失败。示例：

```markdown
# Inspector AGENTS.md
- 使用 `zig build test` 而不是 `zig test`
- Inspector 模块使用 wasm target，不要用 native target 测试
- 不要修改 build.zig，除非明确要求
```

**做法 C：命令优先、代码示例优于文字解释**

GitHub 对 2500+ 仓库的分析发现：[8] 表现最好的 AGENTS.md 文件具有以下特征：
- 把命令放在最前面
- 使用代码示例而非文字解释
- 设置清晰的边界
- 精确指定技术栈
- 覆盖六个核心领域：命令、测试、项目结构、代码风格、git 工作流、边界

---

## 实践二：架构约束机械化执行

### 核心原则

> Agent 擅长模式复制 — 包括坏模式。文档记录的规则不够，必须用 linter 和 CI 门禁机械强制执行。[1][2]

### 具体做法

**做法 A：分层依赖强制（OpenAI）**

OpenAI 在每个业务域内定义了严格的分层依赖方向：[1]

```
Types → Config → Repo → Service → Runtime → UI

横切关注点（auth, connectors, telemetry, feature flags）
只能通过 Providers 进入。其他路径被禁止。
```

依赖方向由 CI 级别的 linter 强制检查。**linter 本身也是 Codex 写的。** [1]

**做法 B：Linter 错误消息 = 修复指令**

OpenAI 和 Stripe 的 linter 错误消息不仅标记违规，还**告诉 Agent 如何修复**。[2][7] 工具在阻止错误的同时训练 Agent。

**做法 C：工具数量控制（Stripe）**

Stripe 的 Toolshed 包含近 500 个工具，但不会把全部暴露给 Agent。确定性编排器扫描任务，筛选出约 15 个相关工具。[7] 工具太多会导致"token 瘫痪"— Agent 浪费时间选择工具而非做事。

**做法 D：选择"无聊"的技术**

OpenAI 团队倾向于使用"无聊的"技术 — 稳定 API 的可组合库，且在模型训练数据中有充分表示。[2] Birgitta Böckeler 指出了反直觉的结论：提高 AI 生成代码的信任度需要**约束**解决方案空间，而非扩展它。[5]

---

## 实践三：让应用对 Agent 可见

### 核心原则

> "Because the fixed constraint has been human time and attention, we've worked to add more capabilities to the agent by making things like the application UI, logs, and app metrics themselves directly legible to Codex."
> — OpenAI [1]

Agent 只看代码是不够的。它还需要能"看到"运行中的应用。

### 具体做法

**做法 A：Chrome DevTools Protocol 集成**

OpenAI 将 Chrome DevTools Protocol 直接接入 Agent 运行时：[1]
- DOM 快照
- 截图捕获
- 浏览器导航

Agent 的反馈循环变成：选择目标 → 快照前状态 → 触发 UI 路径 → 观察运行时事件 → 修复 → 重启 → 再快照 → 循环直到通过。

**做法 B：每个 worktree 独立的可观测性栈**

OpenAI 为每个 git worktree 提供独立的观测管道：[1]
- Vector 作为扇出路由器
- Victoria Logs（LogQL 查询）
- Victoria Metrics（PromQL 查询）
- 分布式追踪

这使得像 **"确保服务启动在 800ms 内完成"** 或 **"关键用户旅程中没有 span 超过 2 秒"** 这类指令变得可执行。[1]

**做法 C：浏览器自动化测试（Anthropic）**

Anthropic 发现，Agent 倾向于用 `curl` 或单元测试声称功能完成，但不会进行端到端验证。[6] 显式提示 Agent 使用 Puppeteer MCP 做浏览器自动化测试后，性能显著提升。[6]

已知局限：Agent 无法通过 Puppeteer 看到浏览器原生 alert 弹窗，依赖这类弹窗的功能 bug 率更高。[6]

---

## 实践四：闭环自验证（Build-Verify Loop）

### 核心原则

> "The most common failure pattern was that the agent wrote a solution, re-read its own code, confirmed it looks ok, and stopped."
> — LangChain [9]

模型有对第一个看起来合理的方案产生偏见的倾向（first plausible solution bias）。不主动验证，就等于开环控制。

### 具体做法

**做法 A：四步循环（LangChain）**

LangChain 在系统提示中加入结构化的问题解决流程：[9]

1. **规划与发现（Planning & Discovery）**：读取任务 → 扫描代码库 → 基于任务规范和验证方法构建计划
2. **构建（Build）**：实现计划，同时构建测试
3. **验证（Verify）**：运行测试 → 读取完整输出 → 对照原始需求（而非自己的代码）比较
4. **修复（Fix）**：分析错误 → 回溯原始规范 → 修复问题

**做法 B：退出前检查清单中间件**

LangChain 使用 `PreCompletionChecklistMiddleware`：在 Agent 尝试退出前拦截，强制它对照任务规范运行验证。[9] 类似"Ralph Wiggum Loop"— 一个 hook 在退出时强制 Agent 继续执行验证。

**做法 C：循环检测中间件**

LangChain 使用 `LoopDetectionMiddleware` 追踪每个文件的编辑次数。[9] 同一文件编辑超过 N 次后，注入上下文："考虑重新审视你的方案"。帮助 Agent 从 doom loop（同一个坏方案反复微调 10+ 次）中恢复。

**做法 D：推理计算的"三明治"策略**

LangChain 发现最优的推理预算分配是 **"高-中-高"三明治**：[9]
- 规划阶段：高推理（充分理解问题）
- 实现阶段：中等推理（节省时间/token）
- 验证阶段：高推理（捕获错误）

纯高推理反而得分低（53.9%），因为 Agent 超时。中等推理得到 63.6%，三明治策略达到 66.5%。[9]

---

## 实践五：长时运行 Agent 的会话间记忆

### 核心原则

> 想象一个软件项目由轮班工程师负责，每个新工程师到达时对之前班次发生的事情毫无记忆。
> — Anthropic [6]

### 具体做法

**做法 A：初始化 Agent + 编码 Agent 双体架构（Anthropic）**

Anthropic 的方案：[6]

1. **初始化 Agent**：第一次会话专用，职责：
   - 从高级 prompt 生成**全面的功能列表**（JSON 格式，200+ 个具体功能，每个都有明确的测试步骤）
   - 所有功能初始标记为 `"passes": false`
   - 创建 `init.sh` 脚本
   - 创建 `claude-progress.txt` 进度日志
   - 初始化 git 仓库

2. **编码 Agent**：每个后续会话，职责：
   - 读取 `claude-progress.txt` 和 git 日志了解当前状态
   - 运行 `init.sh` 启动开发服务器
   - 做基本端到端测试确认现有功能正常
   - 选择**一个**未完成功能（只做一个！）
   - 实现 → 测试 → 提交 → 更新进度日志

**做法 B：JSON 优于 Markdown**

Anthropic 发现用 JSON 格式追踪功能状态比 Markdown 更好，因为 Agent 不太可能意外编辑或覆盖结构化数据。[6]

用强措辞指令保护功能列表：

> "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality." [6]

**做法 C：每次会话的标准启动序列**

Anthropic 总结的标准启动步骤：[6]

```
1. 运行 pwd 查看工作目录
2. 读取 git 日志和进度文件了解最近的工作
3. 读取功能列表，选择最高优先级的未完成功能
4. 启动开发服务器
5. 运行基本端到端测试确认应用未处于损坏状态
6. 然后才开始实现新功能
```

---

## 实践六：熵治理 — 对抗 AI Slop

### 核心原则

> Agent 忠实地复制并放大代码库中已有的模式 — 包括坏模式。OpenAI 团队曾每周五花 20% 时间手动清理"AI slop"。[1]

### 具体做法

**做法 A：Golden Principles（黄金原则）编码进仓库**

OpenAI 的做法：[1]
- 将有主见的、机械化的规则直接编码进仓库
- 示例规则：
  - 优先使用共享工具包，而非手写帮助函数（保持不变量集中）
  - 在边界验证数据，而非推测性地探测数据形状
  - 使用团队自己的 OpenTelemetry 并发工具，而非第三方并发原语

**做法 B：后台清理 Agent**

一组后台 Codex 任务按固定周期运行：[1]
- 扫描偏离黄金原则的代码
- 更新每个产品域和架构层的质量评分
- 自动开出有针对性的重构 PR
- 大多数 PR 审查时间 < 1 分钟，可自动合并

关键性质：**清理 Agent 的吞吐量与代码生成吞吐量成正比。** 生成越多代码，就运行越多清理。这是手动方式无法扩展但自动化后自然平衡的系统。[1]

**做法 C：Flaky Test 修复（Stripe）**

Stripe 的 Minions 专门处理人类工程师通常搁置的技术债：[7]
- 运行 flaky test 数千次以复现故障
- 分析竞争条件
- 提交修复补丁
- 维护 300 万+ 测试的测试套件

---

## 实践七：并行管理与人类注意力分配

### 核心原则

> 稀缺资源从"计算"变为"人类注意力"。等待很贵，纠正很便宜。[1]

### 具体做法

**做法 A：有人值守并行（Attended Parallelization）**

Mitchell Hashimoto 的方式：[4]
- 同时运行 1 个 Agent（目前）
- 使用 git worktree 隔离
- **关闭桌面通知**：上下文切换成本极高。在自然休息时主动查看 Agent，而非被通知打断
- 目标：工作日 10-20% 的时间有后台 Agent 运行

Peter Steinberger（OpenClaw 作者）的方式：[7]
- 同时运行 5-10 个 Agent
- 一个月 6,600+ commits
- 不逐行阅读代码，但深度关注架构和可扩展性
- 在 Discord 中只讨论架构和大决策，不讨论代码

**做法 B：无人值守并行（Unattended Parallelization）**

Stripe Minions 的方式：[7]
- 工程师在 Slack 中发布任务
- Agent 写代码 → 通过 CI → 开 PR
- 人类只在 review 阶段介入
- 每周 1,300+ PR 合并

**关键前提**：Stripe 能做到无人值守，是因为他们花了多年构建人类开发者基础设施 — 10 秒 devbox 启动、300 万测试、广泛的内部工具。**为 Agent 做的最好准备，就是本来就该做好的工程实践。** [7]

**做法 C：合并哲学调整**

OpenAI 的高吞吐量环境下：[1]
- PR 短生命周期
- 最小化阻塞合并门禁
- Flaky test 用后续运行解决，而非无限阻塞进度
- 前提：有快速检测和回滚机制

---

## 实践八：Blueprint 模式 — 确定性与概率性节点交替

### 核心原则

> 模型不运行系统。系统运行模型。这个反转就是一切。[2]

### 具体做法

Stripe 引入了 **Blueprint** 概念：一个在确定性代码节点和弹性 Agent 循环之间交替的工作流。[7]

```
┌─────────────────┐
│   触发            │  ← Slack / CLI / 自动触发
└────────┬────────┘
         │
         v
┌─────────────────┐
│  预热 Devbox     │  ← EC2, 预克隆仓库, ~10 秒就绪
│ （隔离沙箱）      │     无互联网, 无生产访问
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Blueprint 编排   │  ← 状态机: 确定性 + Agent 节点
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    v          v
 [Agent]    [确定性]
 "实现"     "跑 linter"
 "修 CI"    "推送更改"
    │          │
    └────┬─────┘
         │
         v
┌─────────────────┐
│  本地 Lint       │  ← 启发式, <5 秒
│ （左移检查）      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  远程 CI         │  ← 完整测试套件
└────────┬────────┘
         │
         v
┌─────────────────┐
│  开 PR            │  ← 人类审查
└─────────────────┘
```

核心设计：**确定性门禁"夹住"概率性的 LLM 工作。** [7] Agent 最多尝试 2 轮 CI，然后要么成功要么放弃。

---

## 实践九：Trace 驱动的迭代改进

### 核心原则

> Harness engineering is not vibes-based. [2]

### 具体做法

**做法 A：Trace 分析技能（LangChain）**

LangChain 的迭代改进配方：[9]

1. 从 LangSmith 获取实验 traces
2. 并行启动错误分析 Agent → 主 Agent 综合发现 + 建议
3. 汇总反馈，对 harness 做针对性修改
4. 人类验证修改（避免过拟合到特定任务）

这类似于机器学习中的 **boosting**：专注于前一轮的失败案例。[9]

**做法 B：度量指标体系**

有用的度量聚类为几个桶：[2]
- **吞吐量**：首次 PR 时间、合并时间、每日完成任务数、每任务迭代次数
- **质量**：合并时 CI 通过率、缺陷逃逸率、回滚频率、回归检测平均时间
- **人类注意力**：每 PR 审查分钟数、升级次数、需要人类判断的任务百分比
- **Harness 健康**：文档新鲜度违规、架构边界违规、测试 flake 率
- **安全**：被阻止的出站请求、权限拒绝、secret 扫描命中

**关键**：这些指标要让 Agent 也能看到（通过工具和仪表板），而非仅供人类查看。Harness 在 Agent 能看到"什么是好的"时改进最快。[2]

---

## 实践十：渐进式采纳路径

### Mitchell Hashimoto 的六步路径 [4]

| 阶段 | 做什么 | 关键认知 |
|------|--------|----------|
| **Step 1** | 停止用聊天机器人编码 | 必须用 Agent（能读文件、执行程序、发 HTTP 请求） |
| **Step 2** | 重复自己的工作 | 手动做一遍 → 用 Agent 重做一遍，强迫自己学会什么有效、什么无效 |
| **Step 3** | 下班前 Agent | 每天最后 30 分钟启动 Agent 做调研/分诊/探索，第二天有"热启动" |
| **Step 4** | 外包必杀任务 | Agent 做有把握的任务，你**同时做另一件事**。关掉通知，自然休息时查看 |
| **Step 5** | 工程化缰绳 | Agent 犯错 → 更新 AGENTS.md 或写工具，确保不再犯同类错误 |
| **Step 6** | 始终有 Agent 在运行 | 目标：Agent 不在运行时问自己"有什么事可以让 Agent 做" |

Hashimoto 的关键建议：[4]
- 知道何时**不**用 Agent 是效率的重要来源
- 不要为了运行 Agent 而运行 Agent，只在真正有帮助时使用
- **不要让 Agent 通知你** — 你控制何时查看它，而非它控制你

---

## 量化证据

| 来源 | 数据 | 变量 |
|------|------|------|
| **Can.ac 实验** [10] | 同一模型从 6.7% → 68.3%（Grok Code Fast 1） | 仅改变 harness 的编辑接口格式，未修改模型权重 |
| **LangChain** [9] | 52.8% → 66.5%（+13.7 分），Top 30 → Top 5 | 仅改变 harness（系统提示、工具、中间件），模型固定为 gpt-5.2-codex |
| **OpenAI Codex 团队** [1] | 5 个月, 100 万行, 零手写代码, ~1500 PR | 3 人起步，人均每天 3.5 PR，随团队扩展吞吐量增加 |
| **Stripe Minions** [7] | 每周 1300+ PR 合并 | 无人值守，Slack 触发 → 自动写代码 → CI → PR |
| **Peter Steinberger** [7] | 一个月 6600+ commits, 5-10 Agent 并行 | 独立开发者，不逐行读代码，只管架构 |

---

## 尚未解决的问题

### 行为验证（Behavioral Verification）

结构质量（linting, 架构, 命名）基本可解。**行为正确性**（产品真的做对了吗？）仍未解决。[2][5]

数据佐证：
- Google DORA 报告：AI 采用率增加 90%，代码审查时间增加 91% [2]
- LinearB：AI 生成 PR 被拒率 67.3%，手动代码 15.6% [2]
- METR 研究：有经验的开发者使用 AI 工具后慢了 19%，但认为自己快了 20%（感知差距 39 个百分点）[2]

### 编辑格式问题

Agent 应用代码变更没有标准可靠方式。Can.ac 证明改变单个格式变量就能让 15 个模型提升 5-14 个百分点。[10] Cursor 专门构建了一个 700 亿参数模型，唯一用途是正确合并编辑。[2]

### 棕地项目（Brownfield）适用性

所有成功案例要么是绿地项目，要么是团队从零构建了基础设施。[5] 把 harness engineering 应用到 10 年历史的代码库（无架构约束、不一致的测试、残缺的文档）是更难的问题。

### Agent 置信度校准

Agent 对正确输出和幻觉输出表现出同等的置信度。[2] 在 Agent 能表达"我不确定"之前，人类必须以同等严格度审查每个输出。

### Harness 应该趋向简化

Manus 团队在 6 个月内重写了 5 次 harness，方向是**简化而非复杂化**。[11] 如果 harness 持续变复杂，可能是过度工程化的信号。

---

## 参考文献

| 编号 | 来源 | 标题 | 日期 | 链接 |
|------|------|------|------|------|
| [1] | OpenAI (Ryan Lopopolo) | Harness engineering: leveraging Codex in an agent-first world | 2026-02 | https://openai.com/index/harness-engineering/ |
| [2] | Ekewaka Lono (GTCode) | Harness Engineering: The Discipline of Building Systems That Make AI Agents Work | 2026-03-04 | https://gtcode.com/articles/harness-engineering/ |
| [3] | Aditya Puranik | The Control Theory Behind Harness Engineering: A First-Principles Map | 2026-03-03 | https://adityashrishpuranik.com/writing/harness-engineering-as-control-theory |
| [4] | Mitchell Hashimoto | My AI Adoption Journey | 2026-02-05 | https://mitchellh.com/writing/my-ai-adoption-journey |
| [5] | Birgitta Böckeler (Martin Fowler) | Harness Engineering | 2026-02-17 | https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html |
| [6] | Anthropic (Justin Young) | Effective harnesses for long-running agents | 2025-11-26 | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| [7] | Charlie Guo (Artificial Ignorance) | The Emerging "Harness Engineering" Playbook | 2026-02-22 | https://www.ignorance.ai/p/the-emerging-harness-engineering |
| [8] | GitHub Blog | How to write a great AGENTS.md: lessons from over 2,500 repositories | 2026 | https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/ |
| [9] | LangChain (Vivek Trivedy) | Improving Deep Agents with harness engineering | 2026-02-17 | https://blog.langchain.com/improving-deep-agents-with-harness-engineering/ |
| [10] | Can.ac | I Improved 15 LLMs at Coding in One Afternoon. Only the Harness Changed. | 2026-02 | https://blog.can.ac/2026/02/12/the-harness-problem/ |
| [11] | SmartScope | What Is Harness Engineering: Defining the "Outside" of Context Engineering | 2026-02 | https://smartscope.blog/en/blog/harness-engineering-overview/ |
| [12] | Stripe Engineering (Alistair Gray) | Minions: Stripe's one-shot, end-to-end coding agents | 2026-02-09 | https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents |
| [13] | Kirill Dubovitskiy (bra1ndump) | Harness Engineering Report | 2026-02-20 | https://bra1ndump.com/blog/research/harness-engineering |
| [14] | Mohit Sewak, Ph.D. | What is AI Harness Engineering? Your Guide to Controlling Autonomous Systems | 2026-03-03 | https://medium.com/be-open/what-is-ai-harness-engineering-your-guide-to-controlling-autonomous-systems-30c9c8d2b489 |
| [15] | Cobus Greyling | The Rise of AI Harness Engineering | 2026-03-13 | https://cobusgreyling.substack.com/p/the-rise-of-ai-harness-engineering |
| [16] | Vitthal Mirji | Build the harness, not the code: a staff/principal engineer's guide to AI-agent systems | 2026-02-19 | https://vitthalmirji.com/2026/02/build-the-harness-not-the-code-a-staff/principal-engineers-guide-to-ai-agent-systems/ |
