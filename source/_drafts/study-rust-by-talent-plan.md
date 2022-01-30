---
title: 通过 talent-plan 项目学习rust
date: 2022-01-28
---

[toc]

### 前言
本篇不介绍基本的条件语句，变量初始化等语法，相关语法通过阅读教程可以学习，通过编写项目可以很快掌握。本篇更多的是介绍Rust的一些核心特性。
### talent-plan项目介绍

[talent-plan](https://github.com/pingcap/talent-plan) 是[pingcap](https://en.pingcap.com/)提供的一个github课程，包括实现基本kv存储引擎，实现分布式引擎等等课程。具体可查看对应链接。

### Rust核心特征
通过完成project-1，我们可以接触到许多rust的核心。
#### 面向对象设计
- 定义对象
```Rust
#[derive(Default)]
pub struct KvStore {
    pub store_map: HashMap<String, String>,
}
```
Rust只有`struct`的概念，通过定义`struct`来定义一个面向对象语言中的“类”，并且为其定义属性。其中，通过添加`pub`表示该属性为`public`类型的属性
- 定义对象的方法
```Rust
impl KvStore {
    pub fn new() -> KvStore {
        KvStore {
            store_map: HashMap::new(),
        }
    }
    pub fn set(&mut self, key: String, value: String) {
        self.store_map.insert(key, value);
    }
    pub fn get(&self, key: String) -> Option<String> {
        let value = &self.store_map.get(&key);
        return match value {
            None => None,
            Some(data) => Some(data.to_string()),
        };
    }
    pub fn remove(&mut self, key: String) {
        self.store_map.remove(&key);
    }
}
```
其中，`pub`指定了该方法是一个`public`类型的方法，不指定则是一个`private`的方法。由于Rust不使用继承，通过组合来结构代码，所以不需要`protected`的方法。
- 参考
[rust面向对象语言的特征](https://kaisery.github.io/trpl-zh-cn/ch17-01-what-is-oo.html)

#### 泛型支持
#### 枚举与模式匹配
#### 变量生命周期
变量生命周期管理的设计，是Rust作为一门手动管理内存的语言能同时保证安全与高性能的原因。作为基础介绍，将直接看代码，详细介绍可以看参考，以及其他blog。

#### 引用与借用
引用与借用，是基于变量生命周期管理设计的变量传递的方法，单独描述

#### trait定义
trait在project-1中没有直接应用，如果有使用到简短的方法来定义command，在理解为什么可以这么实现的时候，就会开始接触到trait
