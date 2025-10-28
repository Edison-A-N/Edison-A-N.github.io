---
title: Tool Args Documentation Format Comparison Analysis
tags:
  - LLM
  - AI Agent
  - Tool Format
categories:
  - AI Agent
date: 2025-10-28 00:00:00
excerpt: 本文对比分析了 smolagents 项目中两种不同的 args_doc 组织形式（Indent 格式 vs JSON 格式），评估了它们在 Token 消耗、可读性、LLM 理解能力等方面的优劣势，并提出了推荐方案和使用场景建议。
---

# Tool Args Documentation Format Comparison Analysis

## 概述

本文档对比分析了 [smolagents](https://github.com/huggingface/smolagents) 项目中两种不同的 `to_code_prompt` 方法中 `args_doc` 组织形式的优劣势。这两种格式分别实现在以下分支中：

- **Indent 格式**: [feature/nested-args-formatting](https://github.com/Edison-A-N/smolagents/tree/feature/nested-args-formatting)
- **JSON 格式**: [feature/json-input-schema-formatting](https://github.com/Edison-A-N/smolagents/tree/feature/json-input-schema-formatting)

## 两种格式对比

### 1. Indent 格式 ([feature/nested-args-formatting](https://github.com/Edison-A-N/smolagents/tree/feature/nested-args-formatting))

#### 实现方式
- 使用递归函数 `format_nested_args` 格式化嵌套参数
- 采用缩进层级显示参数结构
- **智能深度限制**：最大深度固定为 3 层，这是经过深思熟虑的设计决策
- 简洁的描述性文本格式

**深度限制的设计理念**：
- **LLM 理解优化**：超过 3 层的嵌套结构会使 LLM 难以理解和准确配置参数
- **实用性平衡**：3 层深度已覆盖绝大多数实际使用场景
- **性能考虑**：避免过深的嵌套导致信息过载，影响 LLM 的决策质量
- **可扩展性**：如需要更深嵌套，可在未来版本中讨论和改进

#### 示例输出
```python
def search_items_v1_item_search(page: integer, page_size: integer, filter: object, sort: array) -> dict:
    """Search items

    Important: This tool returns structured output! Use the JSON schema below to directly access fields like result['field_name']. NO print() statements needed to inspect the output!

    Args:
        page: Page number
        page_size: Page size
        filter: 查询项目的请求参数
            project_id: Project ID
            id__in: Item ID to include, split by comma
            tags__in: Tags name to include, split by comma
            # ... 更多嵌套参数
        sort (array): see tool description
    """
```

#### 优势
1. **Token 效率高**：内容简洁，token 消耗少
2. **可读性强**：层级结构清晰，人类容易理解
3. **简洁明了**：只显示关键信息（参数名和描述）
4. **智能嵌套处理**：通过 3 层深度限制，平衡了复杂性和可理解性
5. **LLM 优化设计**：专门针对 LLM 的理解能力进行优化，避免信息过载
6. **实用性导向**：覆盖绝大多数实际使用场景，避免过度复杂化

#### 劣势
1. **信息不完整**：缺少详细的类型约束、枚举值、默认值等
2. **结构化程度低**：不是标准化的 JSON Schema 格式
3. **验证信息缺失**：缺少 `required`、`minLength`、`maxLength` 等验证规则

### 2. JSON 格式 ([feature/json-input-schema-formatting](https://github.com/Edison-A-N/smolagents/tree/feature/json-input-schema-formatting))

#### 实现方式
- 直接使用 `json.dumps()` 序列化完整的 `inputs` 字典
- 保持完整的 JSON Schema 结构
- 包含所有类型信息和约束条件

#### 示例输出
```python
def search_items_v1_item_search(page: integer, page_size: integer, filter: object, sort: array) -> dict:
    """Search items

    Important: This tool returns structured output! Use the JSON schema below to directly access fields like result['field_name']. NO print() statements needed to inspect the output!

    Args:
        dict (input schema): This tool expects arguments that strictly adhere to the following JSON schema:
            {
                "page": {
                    "type": "integer",
                    "minimum": 1.0,
                    "title": "Page",
                    "description": "Page number",
                    "default": 1
                },
                "page_size": {
                    "type": "integer",
                    "maximum": 10000.0,
                    "minimum": 1.0,
                    "title": "Page Size",
                    "description": "Page size",
                    "default": 25
                },
                # ... 完整的 JSON Schema
            }
    """
```

#### 优势
1. **信息完整**：包含完整的 JSON Schema 信息
2. **标准化**：符合 JSON Schema 标准，便于程序化处理
3. **详细约束**：包含类型、枚举、默认值、验证规则等
4. **精确匹配**：提供精确的参数结构定义
5. **未来扩展性**：易于添加新的 Schema 属性

#### 劣势
1. **Token 消耗大**：内容冗长，token 消耗多
2. **可读性差**：对 LLM 来说，大量 JSON 结构可能造成信息过载
3. **解析复杂**：LLM 需要从大量 JSON 中提取关键信息
4. **冗余信息**：包含很多 LLM 可能不需要的详细约束

## 性能对比分析

> **重要说明**：以下性能数据基于前述方法的单一测试用例，仅作为定性示例展示两种格式的差异趋势，不应用于定量判断或生产环境的性能评估。实际性能可能因具体使用场景、模型类型、参数复杂度等因素而有所差异。

### Token 使用量对比

| 格式 | Step 1 Tokens | Step 2 Tokens | 总 Tokens | 相对差异 |
|------|---------------|---------------|-----------|----------|
| Indent 格式 | 53,953 | 108,123 | 162,076 | 基准 |
| JSON 格式 | 76,436 | 153,135 | 229,571 | +42% |

**结论**：JSON 格式比 Indent 格式多消耗约 42% 的 tokens


### 参数内容长度对比

| 格式 | 输出行数 | 相对差异 |
|------|----------|----------|
| Indent 格式 | 874 行 | 基准 |
| JSON 格式 | 1,269 行 | +45% |

**结论**：JSON 格式比 Indent 格式多约 45% 的内容

## 准确性对比

### 参数匹配准确性
- **Indent 格式**：✅ 能正确识别和匹配复杂参数
- **JSON 格式**：✅ 能正确识别和匹配复杂参数
- **结论**：两种格式的参数匹配准确性基本相同

### 任务执行结果
- **Indent 格式**：✅ 成功执行任务，返回正确结果 (291)
- **JSON 格式**：✅ 成功执行任务，返回正确结果 (291)
- **结论**：两种格式都能正确完成任务

## 综合评估

### 推荐方案：Indent 格式

基于全面的分析，**推荐使用 Indent 格式**，理由如下：

1. **成本效益最优**：Token 消耗减少 42%，成本显著降低
2. **准确性相当**：两种格式的参数匹配准确性基本相同
3. **LLM 友好**：简洁的格式更适合 LLM 理解和处理
4. **实用性更强**：对于大多数用例，LLM 只需要知道参数名和基本描述

### 可能的改进建议

1. **混合方案**：可以考虑在 Indent 格式基础上，为关键参数添加类型信息
2. **关键约束保留**：对于重要的验证规则（如 `required`），可以在描述中体现
3. **分层显示**：简单参数用 Indent 格式，复杂嵌套参数可选择 JSON 格式

### 使用场景建议

#### 推荐使用 Indent 格式的场景：
- 大多数常规工具调用场景
- 成本敏感的应用
- 需要快速响应的应用
- 参数结构相对简单的工具

#### 可考虑使用 JSON 格式的场景：
- 需要严格参数验证的场景
- 参数结构极其复杂的工具
- 需要程序化处理 Schema 的场景
- 对成本不敏感的应用

## 结论

基于单一测试用例的对比分析，虽然 JSON 格式提供了更完整的信息，但在测试场景中，**Indent 格式在保持相同准确性的同时，显著降低了成本**。更重要的是，Indent 格式的设计体现了对 LLM 认知特性的深度理解：

> **测试局限性说明**：本分析基于特定的测试用例，实际效果可能因具体应用场景而异。建议在生产环境中进行更全面的测试验证。

1. **成本效益最优**：在保持功能完整性的前提下，最大化成本效益
2. **用户体验导向**：优先考虑 LLM 的理解能力和开发者的使用体验

**最终建议**：采用 Indent 格式作为默认方案，其设计哲学体现了对技术细节的深度思考。同时保留 JSON 格式作为可选的高级配置选项，以满足特殊场景的需求。这种设计既保证了实用性，又为未来的优化和改进留下了空间。

---

*基于分支：[feature/nested-args-formatting](https://github.com/Edison-A-N/smolagents/tree/feature/nested-args-formatting) vs [feature/json-input-schema-formatting](https://github.com/Edison-A-N/smolagents/tree/feature/json-input-schema-formatting)*
