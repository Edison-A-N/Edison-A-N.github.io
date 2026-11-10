---
title: 全球垂类 Agent / SaaS Agent 调研：需要关注什么
tags:
  - AI Agent
  - Vertical AI
  - SaaS
  - Pricing
  - Deep Research
categories:
  - AI Agent
excerpt: >-
  垂类 AI 的钱和增长都在变多，但多数 agent 项目死在落地环节。决定成败的是四件事：切进具体工作流并嵌进现有系统、有自己积累的数据、算清每次运行的成本并按客户认可的结果收费、结果可评测可审计可复核。
date: 2026-11-09 17:00:00
toc: true
---

> **摘要**：垂类 AI 的钱和增长都在变多，但多数 agent 项目死在落地环节，原因很少是模型不够强。决定成败的是四件事：切进一个具体工作流并嵌进客户现有系统；有自己积累的数据；能算清每次运行的成本并按客户认可的结果收费；结果可评测、可审计、可复核，满足合规。
>
> 调研时间 2026 年 11 月，资料以公开报告和行业文章为主，部分数字各来源不一致，只适合看量级。

## 现状

### 钱在流向垂类

Menlo Ventures 2025 年企业 AI 报告：垂类 AI 支出从 2024 年的 12 亿美元涨到 2025 年的 35 亿美元，接近 3 倍。医疗约 15 亿美元，接近一半，超过排在后面的四个行业之和；法律约 6.5 亿美元。[来源](https://menlovc.com/wp-content/uploads/2025/12/menlo_ventures_enterprise_ai_report-2025-123125.pdf)

### 头部公司增长很快

| 公司 | 行业 | 公开数据 |
|-|-|-|
| Harvey | 法律 | 2025 年底 ARR 约 1.9 亿美元（一年前 5000 万）；2026 年 2 月传出 110 亿美元估值融资洽谈 |
| Abridge | 医疗（临床病历） | 合同 ARR 1.17 亿美元；积累 150 万次诊疗对话 |
| EvenUp | 法律（人身伤害索赔） | 估值超 20 亿美元；积累几十万个案件 |
| Hippocratic AI | 医疗 | 估值 35 亿美元，1.15 亿次临床交互 |

来源：[AI to ROI](https://ai2roi.substack.com/p/ai-to-roi-big-story-the-power-of)、[buildmvpfast](https://www.buildmvpfast.com/blog/vertical-ai-eating-horizontal-saas-2026)。Harvey 的 ARR 在不同文章里有写到 3 亿美元的，口径不一。

### 失败率也很高

- Gartner 预测到 2027 年超过 40% 的 agentic AI 项目会被砍掉，原因是成本失控、业务价值不清、风险控制不足。[来源](https://www.moring.ai/blogs/what-gartner-40pct-cancellation-means-for-ai)
- MIT NANDA 研究称 95% 的生成式 AI 试点拿不出可衡量的 ROI，根因是没能集成进真实业务流程。[来源](https://www.healthcareitnews.com/news/mit-95-enterprise-ai-pilots-fail-deliver-measurable-roi)

两份结论指向同一点：失败多数出在落地、成本和治理上，模型能力不是主因。

## 需要关注的点

### 从一个高摩擦工作流切进去

成功的公司都先吃下一个具体环节（病历记录、合同审查、索赔文书），再扩展成串起多个 agent 的完整系统。已经拿到一个工作流的数据上下文后，再加下一个 agent 的边际成本很低，所以多 agent 的公司收入高于单 agent 公司。[来源](https://www.saasmag.com/vertical-ai-agents-eating-horizontal-saas)

### 护城河在数据和流程嵌入

模型本身构不成壁垒。Abridge、EvenUp 的优势来自持续积累的专有数据；NFX 调查中超过一半的 VC 认为专有数据的质量和稀缺性是持久壁垒。底座模型厂商也在亲自进入大垂类，只靠 prompt 加模型的产品会被挤压。

### 跑在现有记录系统之上

EHR、账本、CRM 这类记录系统会留下来，agent 是它上面的执行层，试图整套替换现有系统的做法很难推。[来源](https://easyclaw.com/blog/ai-agent-101/best-vertical-ai-agents) 集成深度直接决定试点能不能转成生产使用，这正是 MIT 报告里 95% 失败的主要原因。

### 定价从按席位转向按结果

客服领域已经形成按结果计价的价格带：

| 产品 | 计费单位 | 价格 |
|-|-|-|
| Intercom Fin | 成功解决 | 0.99 美元 / 次 |
| Zendesk AI | 确认解决 | 1.2～2 美元 / 次 |
| Salesforce Agentforce | 对话 | 2 美元 / 次，不论是否解决 |

来源：[tech-insider](https://tech-insider.org/intercom-fin-vs-zendesk-ai-vs-agentforce-2026)。Forrester 数据显示，「基础订阅 + 用量或结果计费」的混合模式一年内从 27% 升到 41%，是目前的主流。[来源](https://www.paperclipped.de/en/blog/ai-agent-pricing-models)

按结果计价的前提是能可靠判定「这次算不算成功」，而且这个指标是买方本来就在跟踪的。

### 毛利结构不同，要从第一天算推理成本

- ICONIQ 2026 年报告：AI 原生产品平均毛利预计约 52%，传统 SaaS 是 75%～85%，差距主要来自推理成本。[来源](https://www.thesaascfo.com/how-to-calculate-the-inference-efficiency-ratio)
- Bessemer 把高增长 AI 公司分为两类：增长极快但毛利约 25% 的「超新星」，和毛利约 60%、稳步复利增长的「流星」。[来源](https://startupmentors.in/blog/supernovas-or-shooting-stars-what-bessemers-2025-ai-data-says-about-the-right-growth-path)

每次运行的 token 和计算成本要能归到具体客户和任务上。Gartner 列出的第一条砍项目原因就是成本失控。

### 可靠性、评测、审计是采购门槛

- 企业买方要求上线前有基于数据集和评分器的评测，上线后有生产 trace 监控。[来源](https://www.braintrust.dev/articles/best-llm-evaluation-tools-enterprise-teams-2026)
- 审计日志要能证明发生了什么、为什么发生、谁负责，普通日志不够。[来源](https://createos.sh/blogs/ai-agent-audit-trails-enterprise)
- 医疗、金融、法律等受监管行业要求结果可追溯、可复核，人在回路（HITL）是常规配置。

### 合规有明确时间点

EU AI Act 第 50 条从 2026 年 8 月 2 日起生效：与人直接交互的 AI 系统（包括 agent）必须告知用户对方是 AI，生成内容要带机器可读标记，罚款最高 1500 万欧元或全球营业额的 3%。[来源](https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026) 健康、法律、金融等敏感领域可能还要周期性重复提醒。[来源](https://www.traverssmith.com/knowledge/knowledge-container/is-it-a-bot-eu-ai-act-transparency-rules-take-effect-2-august-2026)

### 用标准协议做互操作

目前的分工共识是 MCP 负责 agent 调用工具，A2A 负责 agent 之间协作，A2A 已有 150 多家组织支持。[来源](https://www.babybots.ai/blog/a2a-protocol-enterprise-2026) Gartner 预测到 2028 年 90% 的 B2B 采购会经过 AI agent，API 优先、可组合的产品更容易被客户自己的 agent 调用。

### 每个项目要有负责人和量化指标

对应 Gartner 和 MIT 的结论，做法是一个工作流配一个负责人、一个可衡量的结果指标，治理和审批路径在试点之前就设计好。

## 对 SAR InSight 的启示

药物研发属于「数据敏感、结果必须可复核」的垂类，上面几条里最直接相关的是：

| 方向 | 含义 |
|-|-|
| 结果可复核 | 报告里的结论要能追溯到具体分子、数据和计算步骤；用户确认的关键选择（活性列、骨架等）要留痕 |
| 成本归因 | 一次 SAR 分析的模型调用和计算成本要能算到这次分析上，现有的用量计费标签是这个方向的基础 |
| 计价单位 | 如果以后按结果收费，需要先定义什么算「一份有效的 SAR 报告」，并且能自动判定 |
| 工作流嵌入 | 切入点是药化团队已有的 SAR 分析环节，结果要能回到他们现有的数据和工具里，而非另起一套系统 |
| 数据 | 客户化合物数据的隔离和合规是前提，在合规前提下积累的分析经验是潜在壁垒 |

## 来源说明

Menlo Ventures、ICONIQ、Gartner、MIT、Cooley、Travers Smith 是一手或权威来源；其余多为行业博客转述，个别数字（如 Harvey ARR）各处不一致。需要正式引用时应回到原始报告核对。
