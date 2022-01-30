---
layout: post
title: Django With DDD
author: Edison
date: 2021-06-15
---

在[DRF业务逻辑实现](https://zhangn661.com/2021/03/30/DRF-Bussiness-Logic/)篇中，提到关于使用Django框架编写业务逻辑的一些局限性以及可能的解决方案。当业务开始扩展的时候，渐渐发现，框架对复杂业务的支持能力明显不足，已经超出了使用service来处理的能力了。

当开始尝试使用DDD来进行模块与架构设计时，不仅要理解DDD是什么，同时需要去理解DDD在Django中应用的困难[^1][^2]

一种有效的方法是，从```serializers```中封装```domail_serializers```，用来承担```view```中的业务逻辑执行，担任一个```实体```。```view```作为一个```bounded context```的存在，绑定多个```serializers```，完成一个业务逻辑的执行。

显然，```DRF```已经基于这样的方式实现了，不足之处在于```serializers```的能力有限，同时，```DRF```没有强调```serializers```是一个```domain```

(先占坑，后续再补充DDD的调研与实践...)



[^1]: [django-design-philosophies](https://docs.djangoproject.com/en/3.2/misc/design-philosophies/#include-all-relevant-domain-logic)
[^2]: [active-record](https://www.martinfowler.com/eaaCatalog/activeRecord.html)