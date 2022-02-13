---
title: DRF Query On Star Model
date: 2022-02-13 22:04:17
tags: thinking
---


### commit message format

#### 提交格式
```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

##### type
- `build`：对构建系统或者外部依赖项进行了修改
- `ci`：对CI配置文件或脚本进行了修改
- `feature`：增加新的特征，一般指的是大的变更
- `func`： 增加新的功能，一般指小的功能
- `fix`：修复bug
- `impr`: improvement，小的代码设计改进
- `conf`: 仅配置变化，Spring配置、properties文件
- `perf`：提高性能的代码更改
- `refactor`：既不是修复bug也不是添加特征的代码重构
- `docs`：对文档进行了修改
- `style`：不影响代码含义的修改，比如空格、格式化、缺失的分号等
- `typo`: 修复小的拼写错误
- `test`：增加确实的测试或者矫正已存在的测试
- `revert`: 回滚提交

##### scope
选填，一般填写作用于哪个文件

##### subject
必填，变更的摘要
- 使用动宾语句，仅讲变更的内容
- 现在时态：`change`不是`changing`也不是`changed`
- 不要大写首字母
- 不在末尾添加句号

##### body
和主题设置类似，使用命令式、现在时态

应该包含修改的动机以及和之前行为的对比.

- 回滚操作，需要添加本句：`This reverts commit hash: **********`

##### footer
- `BREAKING CHANGE`: 不兼容的更新说明，比如public API的修改等
- `Closes`: 指针对哪个issue的修改，可以关联某个story或者bug

### 一些想法
#### 为什么需要规范
git提交规范，有利于代码变动的稳定性监控。更大的价值是，后续跟进维护的同学可以通过commit查找变更的细节，以及了解某段代码引入的目的。

#### 中文or英文
在内部工程中，如果团队大多数都是中国人，建议还是使用中文描述。不准确的英文描述会影响后续对commit的阅读，也就无所谓理解了。当然，最好还是使用英文。


### 参考

[Commit message 和 Change log 编写指南 - 阮一峰](https://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)
[Angular提交信息规范](https://zj-git-guide.readthedocs.io/zh_CN/latest/message/Angular%E6%8F%90%E4%BA%A4%E4%BF%A1%E6%81%AF%E8%A7%84%E8%8C%83/)
[美团 GIT Commit Log规范](https://cloud.tencent.com/developer/article/1762300)