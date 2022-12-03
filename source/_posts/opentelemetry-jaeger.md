---
title: opnetelemetry-jaeger
tags: '可观测性, opentelemetry'
date: 2022-12-03 15:43:31
---


在调研中，持续更新本篇 ...

# 架构

--------------------------------------------------------------------------------

## Tracing

### 核心概念

此处只介绍使用中会遇到的概念，具体细节请查阅[文档](https://opentelemetry.io/docs/reference/specification/trace/)

#### API

- **[TracerProvider](https://opentelemetry.io/docs/reference/specification/trace/api/#tracerprovider)** 提供访问 Tracer 的入口。作为一个池子放置和管理 `Tracer`s

- **[Span Exporter](https://opentelemetry.io/docs/reference/specification/trace/sdk/#span-exporter)** 定义一系列接口，执行 telemetry data 的序列化与反序列化，以将数据提交到不同的 backend。

# 应用

--------------------------------------------------------------------------------

## Tracing

根据其架构设计，所有的应用都可以实现为：

1. 定义 Resource
2. 创建 Provider
3. 设置全局 Provider (option)
4. 设置 Exporter (option)
5. server 中使用 Tracing

### **Python**

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.jaeger import JaegerPropagator

APP_NAME = "app"

def init():
    init_provider()

    set_global_textmap(JaegerPropagator())

def init_provider():

    trace.set_tracer_provider(
        TracerProvider(
            resource=Resource.create({SERVICE_NAME: APP_NAME})
        )
    )

    jaeger_exporter = JaegerExporter()
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )
```

常用的 package 如 `Flask`, `Django`, `FastAPI`, `psycopg2` 等都有提供 `instrument`, 实现基于AOP的注入。

**Golang**

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.10.0"
    jaegerpropagator "go.opentelemetry.io/contrib/propagators/jaeger"
)

const APP_NAME := "app"

func InitGlobalProvider() *sdktrace.TracerProvider {
    p, e := tracerProvider()
    if e != nil {
        return nil
    }

    otel.SetTracerProvider(p)

    return p
}

func tracerProvider(url string) (*sdktrace.TracerProvider, error) {
    serviceName := APP_NAME

    exp, err := jaeger.New(jaeger.WithAgentEndpoint())
    if err != nil {
        return nil, err
    }

    tp := sdktrace.NewTracerProvider(
        // Always be sure to batch in production.
        sdktrace.WithBatcher(exp),
        // Record information about this application in a Resource.
        sdktrace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String(serviceName),
        )),
    )
    return tp, nil
}

func InitGlobalPropagator() propagation.TextMapPropagator {
    otel.SetTextMapPropagator(jaegerpropagator.Jaeger{})
}
```

# 参考

--------------------------------------------------------------------------------

[Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html)
