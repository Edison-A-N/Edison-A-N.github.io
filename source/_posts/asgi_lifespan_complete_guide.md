---
title: ASGI Lifespan 完整指南
tags: ASGI, Python, FastAPI
date: 2025-10-27
excerpt: 本文详细介绍了ASGI Lifespan协议的规范、Uvicorn实现、Starlette集成机制，并提供了实际应用示例和最佳实践。
---

## 目录
1. [ASGI Lifespan 协议概述](#asgi-lifespan-协议概述)
2. [协议规范详解](#协议规范详解)
3. [Uvicorn 实现分析](#uvicorn-实现分析)
4. [Starlette 集成机制](#starlette-集成机制)
5. [实际应用示例](#实际应用示例)
6. [最佳实践](#最佳实践)

## ASGI Lifespan 协议概述

### 什么是 Lifespan 协议？

ASGI Lifespan 协议是 ASGI 规范的一个子协议，用于管理应用程序的启动和关闭生命周期。它允许应用程序在服务器启动时执行初始化操作（如连接数据库），在服务器关闭时执行清理操作（如关闭连接）。

### 核心设计原则

根据 [ASGI 官方文档](https://asgi.readthedocs.io/en/latest/specs/lifespan.html#scope)：

1. **单一连接模式**：整个应用生命周期使用一个持久的连接
   > Lifespans should be executed once per event loop that will be processing requests
   > 
   > 来源：[ASGI Lifespan Protocol](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)

2. **事件驱动**：通过特定事件类型触发启动和关闭逻辑
3. **状态管理**：支持在应用状态中持久化数据
   > The `scope["state"]` namespace provides a place to store these sorts of things. The server will ensure that a _shallow copy_ of the namespace is passed into each subsequent request/response call into the application.
   > 
   > 来源：[ASGI Lifespan State](https://asgi.readthedocs.io/en/latest/specs/lifespan.html#lifespan-state)

4. **异常安全**：提供完整的错误处理机制
   > If an exception is raised when calling the application callable with a `lifespan.startup` message or a `scope` with type `lifespan`, the server must continue but not send any lifespan events.
   > 
   > 来源：[ASGI Lifespan Scope](https://asgi.readthedocs.io/en/latest/specs/lifespan.html#scope)

## 协议规范详解

### Scope 结构

根据 [ASGI Lifespan Scope 规范](https://asgi.readthedocs.io/en/latest/specs/lifespan.html#scope)：

```python
# ASGI Lifespan Scope 结构
{
    "type": "lifespan",                    # 固定值
    "asgi": {
        "version": "3.0",                 # ASGI 版本
        "spec_version": "2.0"             # Lifespan 协议版本
    },
    "state": {}                           # 应用状态字典（可选）
}
```

> The lifespan scope exists for the duration of the event loop. The scope information passed in `scope` contains basic metadata:
> - `type` (_Unicode string_) – `"lifespan"`
> - `asgi["version"]` (_Unicode string_) – The version of the ASGI spec
> - `asgi["spec_version"]` (_Unicode string_) – The version of this spec being used. Optional; if missing defaults to `"1.0"`
> - `state` Optional(_dict[Unicode string, Any]_) – An empty namespace where the application can persist state to be used when handling subsequent requests
> 
> 来源：[ASGI Lifespan Scope](https://asgi.readthedocs.io/en/latest/specs/lifespan.html#scope)

### 事件类型

根据 [ASGI Lifespan 事件规范](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)：

#### 接收事件（receive）

```python
# 启动事件
{
    "type": "lifespan.startup"
}

# 关闭事件
{
    "type": "lifespan.shutdown"
}
```

> **Startup - receive event**: Sent to the application when the server is ready to startup and receive connections, but before it has started to do so.
> 
> **Shutdown - receive event**: Sent to the application when the server has stopped accepting connections and closed all active connections.
> 
> 来源：[ASGI Lifespan Events](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)

#### 发送事件（send）

```python
# 启动完成
{
    "type": "lifespan.startup.complete"
}

# 启动失败
{
    "type": "lifespan.startup.failed",
    "message": "错误信息"
}

# 关闭完成
{
    "type": "lifespan.shutdown.complete"
}

# 关闭失败
{
    "type": "lifespan.shutdown.failed",
    "message": "错误信息"
}
```

> **Startup Complete - send event**: Sent by the application when it has completed its startup. A server must wait for this message before it starts processing connections.
> 
> **Startup Failed - send event**: Sent by the application when it has failed to complete its startup. If a server sees this it should log/print the message provided and then exit.
> 
> **Shutdown Complete - send event**: Sent by the application when it has completed its cleanup. A server must wait for this message before terminating.
> 
> **Shutdown Failed - send event**: Sent by the application when it has failed to complete its cleanup. If a server sees this it should log/print the message provided and then terminate.
> 
> 来源：[ASGI Lifespan Events](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)

### 标准应用实现

根据 [ASGI Lifespan 协议示例](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)：

```python
async def app(scope, receive, send):
    if scope['type'] == 'lifespan':
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                # 执行启动逻辑
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                # 执行关闭逻辑
                await send({'type': 'lifespan.shutdown.complete'})
                return
    else:
        # 处理其他类型的请求
        pass
```

> A possible implementation of this protocol is given below:
> 
> 来源：[ASGI Lifespan Protocol](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)

## Uvicorn 实现分析

基于 [Uvicorn 源码](https://github.com/encode/uvicorn) 的分析：

### 核心实现类

#### LifespanOn 类

```python
# uvicorn/lifespan/on.py
class LifespanOn:
    def __init__(self, config: Config) -> None:
        if not config.loaded:
            config.load()
        
        self.config = config
        self.logger = logging.getLogger("uvicorn.error")
        self.startup_event = asyncio.Event()
        self.shutdown_event = asyncio.Event()
        self.receive_queue: Queue[LifespanReceiveMessage] = asyncio.Queue()
        self.error_occured = False
        self.startup_failed = False
        self.shutdown_failed = False
        self.should_exit = False
        self.state: dict[str, Any] = {}
```

#### 启动流程

```python
async def startup(self) -> None:
    self.logger.info("Waiting for application startup.")
    
    # 创建 lifespan 主任务
    loop = asyncio.get_event_loop()
    main_lifespan_task = loop.create_task(self.main())
    
    # 发送 startup 事件
    startup_event: LifespanStartupEvent = {"type": "lifespan.startup"}
    await self.receive_queue.put(startup_event)
    
    # 等待应用完成启动
    await self.startup_event.wait()
    
    # 检查启动结果
    if self.startup_failed or (self.error_occured and self.config.lifespan == "on"):
        self.logger.error("Application startup failed. Exiting.")
        self.should_exit = True
    else:
        self.logger.info("Application startup complete.")
```

#### 关闭流程

```python
async def shutdown(self) -> None:
    if self.error_occured:
        return
    self.logger.info("Waiting for application shutdown.")
    
    # 发送 shutdown 事件
    shutdown_event: LifespanShutdownEvent = {"type": "lifespan.shutdown"}
    await self.receive_queue.put(shutdown_event)
    
    # 等待应用完成关闭
    await self.shutdown_event.wait()
    
    # 检查关闭结果
    if self.shutdown_failed or (self.error_occured and self.config.lifespan == "on"):
        self.logger.error("Application shutdown failed. Exiting.")
        self.should_exit = True
    else:
        self.logger.info("Application shutdown complete.")
```

#### 核心通信机制

```python
async def main(self) -> None:
    try:
        app = self.config.loaded_app
        
        # 创建 lifespan scope
        scope: LifespanScope = {
            "type": "lifespan",
            "asgi": {"version": self.config.asgi_version, "spec_version": "2.0"},
            "state": self.state,
        }
        
        # 调用应用的 lifespan 处理器
        await app(scope, self.receive, self.send)
        
    except BaseException as exc:
        self.asgi = None
        self.error_occured = True
        if self.startup_failed or self.shutdown_failed:
            return
        if self.config.lifespan == "auto":
            msg = "ASGI 'lifespan' protocol appears unsupported."
            self.logger.info(msg)
        else:
            msg = "Exception in 'lifespan' protocol\n"
            self.logger.error(msg, exc_info=exc)
    finally:
        self.startup_event.set()
        self.shutdown_event.set()
```

#### 事件处理

```python
async def send(self, message: LifespanSendMessage) -> None:
    assert message["type"] in (
        "lifespan.startup.complete",
        "lifespan.startup.failed",
        "lifespan.shutdown.complete",
        "lifespan.shutdown.failed",
    )

    if message["type"] == "lifespan.startup.complete":
        assert not self.startup_event.is_set(), STATE_TRANSITION_ERROR
        assert not self.shutdown_event.is_set(), STATE_TRANSITION_ERROR
        self.startup_event.set()

    elif message["type"] == "lifespan.startup.failed":
        assert not self.startup_event.is_set(), STATE_TRANSITION_ERROR
        assert not self.shutdown_event.is_set(), STATE_TRANSITION_ERROR
        self.startup_event.set()
        self.startup_failed = True
        if message.get("message"):
            self.logger.error(message["message"])

    elif message["type"] == "lifespan.shutdown.complete":
        assert self.startup_event.is_set(), STATE_TRANSITION_ERROR
        assert not self.shutdown_event.is_set(), STATE_TRANSITION_ERROR
        self.shutdown_event.set()

    elif message["type"] == "lifespan.shutdown.failed":
        assert self.startup_event.is_set(), STATE_TRANSITION_ERROR
        assert not self.shutdown_event.is_set(), STATE_TRANSITION_ERROR
        self.shutdown_event.set()
        self.shutdown_failed = True
        if message.get("message"):
            self.logger.error(message["message"])

async def receive(self) -> LifespanReceiveMessage:
    return await self.receive_queue.get()
```

### 配置选择机制

```python
# uvicorn/config.py
LIFESPAN: dict[str, str] = {
    "auto": "uvicorn.lifespan.on:LifespanOn",    # 自动检测
    "on": "uvicorn.lifespan.on:LifespanOn",      # 强制启用
    "off": "uvicorn.lifespan.off:LifespanOff",   # 禁用
}
```

## Starlette 集成机制

基于 [Starlette 源码](https://github.com/encode/starlette) 的分析：

### 事件路由

```python
# Starlette Application.__call__
async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
    scope["app"] = self
    if self.middleware_stack is None:
        self.middleware_stack = self.build_middleware_stack()
    await self.middleware_stack(scope, receive, send)
```

### Lifespan 处理

```python
async def lifespan(self, scope: Scope, receive: Receive, send: Send) -> None:
    """
    Handle ASGI lifespan messages, which allows us to manage application
    startup and shutdown events.
    """
    started = False
    app: Any = scope.get("app")
    await receive()  # 接收第一个 lifespan.startup 事件
    
    try:
        async with self.lifespan_context(app) as maybe_state:
            if maybe_state is not None:
                if "state" not in scope:
                    raise RuntimeError('The server does not support "state" in the lifespan scope.')
                scope["state"].update(maybe_state)
            await send({"type": "lifespan.startup.complete"})
            started = True
            await receive()  # 等待 lifespan.shutdown 事件
    except BaseException:
        exc_text = traceback.format_exc()
        if started:
            await send({"type": "lifespan.shutdown.failed", "message": exc_text})
        else:
            await send({"type": "lifespan.startup.failed", "message": exc_text})
        raise
    else:
        await send({"type": "lifespan.shutdown.complete"})
```

### 关键设计特点

根据 [Starlette Lifespan 实现](https://github.com/encode/starlette/blob/master/starlette/routing.py)：

1. **一次性处理**：`lifespan` 方法执行一次，处理整个应用生命周期
2. **阻塞等待**：通过两次 `await receive()` 分别处理 startup 和 shutdown 事件
3. **异常安全**：完整的错误处理和状态管理
4. **状态传递**：支持将 lifespan 结果传递给应用状态

> The lifespan protocol runs as a sibling task alongside your main application, allowing both to execute concurrently.
> 
> 来源：[Starlette Lifespan 文档](https://www.starlette.io/lifespan/)

## 实际应用示例

### 基础应用

基于 [FastAPI Lifespan 指南](https://fastapi.tiangolo.com/advanced/events/)：

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

# 数据库连接
db_connection = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    global db_connection
    print("Connecting to database...")
    db_connection = await connect_database()
    
    yield {"database": db_connection}
    
    # 关闭时执行
    print("Closing database connection...")
    await db_connection.close()

app = FastAPI(lifespan=lifespan)
```

> You can define lifespan events (startup and shutdown) with FastAPI using a `lifespan` parameter in the `FastAPI` app.
> 
> 来源：[FastAPI Lifespan 指南](https://fastapi.tiangolo.com/advanced/events/)

### 复杂资源管理

```python
from contextlib import AsyncExitStack

@asynccontextmanager
async def complex_lifespan(app: FastAPI):
    async with AsyncExitStack() as stack:
        # 动态管理多个资源
        db = await stack.enter_async_context(connect_database())
        cache = await stack.enter_async_context(connect_redis())
        session_pool = await stack.enter_async_context(create_session_pool())
        
        # 注册清理回调
        def cleanup_logs():
            cleanup_log_files()
        stack.callback(cleanup_logs)
        
        yield {
            "database": db,
            "cache": cache,
            "sessions": session_pool
        }
        # 所有资源会自动按相反顺序清理
```

### FastMCP 集成示例

```python
from fastmcp import FastMCP

mcp = FastMCP("MyServer")

@mcp.lifespan
async def my_lifespan(server):
    # 启动时执行
    print("Initializing MCP server...")
    await server.setup_tools()
    await server.connect_to_database()
    
    yield {"server": server}
    
    # 关闭时执行
    print("Shutting down MCP server...")
    await server.cleanup_tools()
    await server.close_database()

# 创建应用
app = mcp.create_app()
```

## 最佳实践

### 1. 资源管理

```python
@asynccontextmanager
async def proper_lifespan(app: FastAPI):
    resources = {}
    
    try:
        # 初始化资源
        resources["db"] = await connect_database()
        resources["cache"] = await connect_redis()
        resources["http_client"] = aiohttp.ClientSession()
        
        yield resources
        
    finally:
        # 确保资源被正确清理
        if "http_client" in resources:
            await resources["http_client"].close()
        if "cache" in resources:
            await resources["cache"].close()
        if "db" in resources:
            await resources["db"].close()
```

### 2. 错误处理

```python
@asynccontextmanager
async def robust_lifespan(app: FastAPI):
    try:
        # 启动逻辑
        db = await connect_database()
        yield {"database": db}
        
    except Exception as e:
        # 记录错误但不阻止应用启动
        logger.error(f"Failed to initialize database: {e}")
        yield {}
        
    finally:
        # 清理逻辑
        try:
            if 'db' in locals():
                await db.close()
        except Exception as e:
            logger.error(f"Failed to close database: {e}")
```

### 3. 状态管理

```python
@asynccontextmanager
async def stateful_lifespan(app: FastAPI):
    # 初始化应用状态
    app_state = {
        "startup_time": time.time(),
        "version": "1.0.0",
        "environment": os.getenv("ENV", "development")
    }
    
    # 连接数据库
    db = await connect_database()
    app_state["database"] = db
    
    # 设置全局配置
    app.state.config = app_state
    
    yield app_state
    
    # 清理
    await db.close()
```

### 4. 性能监控

```python
@asynccontextmanager
async def monitored_lifespan(app: FastAPI):
    start_time = time.time()
    
    try:
        # 启动监控
        metrics = await setup_metrics_collection()
        yield {"metrics": metrics}
        
    finally:
        # 记录运行时间
        runtime = time.time() - start_time
        logger.info(f"Application ran for {runtime:.2f} seconds")
```

## 总结

ASGI Lifespan 协议是现代异步 Python Web 应用的核心组件，它提供了：

1. **标准化的生命周期管理**：统一的启动和关闭流程
2. **异常安全保证**：确保资源正确清理
3. **状态管理**：支持应用状态持久化
4. **协议兼容性**：与所有 ASGI 服务器兼容

> The lifespan messages allow for an application to initialise and shutdown in the context of a running event loop. An example of this would be creating a connection pool and subsequently closing the connection pool to release the connections.
> 
> 来源：[ASGI Lifespan Protocol](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)

通过合理使用 Lifespan 协议，可以构建更加健壮和可维护的异步 Web 应用。

## 参考资源

- [ASGI Lifespan 协议规范](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)
- [Uvicorn 源码](https://github.com/encode/uvicorn)
- [Starlette 文档](https://www.starlette.io/lifespan/)
- [FastAPI Lifespan 指南](https://fastapi.tiangolo.com/advanced/events/)
