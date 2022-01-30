---
layout: post
title: DRF Query On Star Model 
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
- `docs`：对文档进行了修改
- `feature`：增加新的特征
- `fix`：修复bug
- `pref`：提高性能的代码更改
- `refactor`：既不是修复bug也不是添加特征的代码重构
- `style`：不影响代码含义的修改，比如空格、格式化、缺失的分号等
- `test`：增加确实的测试或者矫正已存在的测试

##### scope
选填，一般填写作用于哪个文件

##### subject
- 使用命令式，现在时态：`change`不是`changing`也不是`changed`
- 不要大写首字母
- 不在末尾添加句号

##### body
和主题设置类似，使用命令式、现在时态

应该包含修改的动机以及和之前行为的对比

### 参考

[Commit message 和 Change log 编写指南 - 阮一峰](https://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)

[Angular提交信息规范](https://zj-git-guide.readthedocs.io/zh_CN/latest/message/Angular%E6%8F%90%E4%BA%A4%E4%BF%A1%E6%81%AF%E8%A7%84%E8%8C%83/)