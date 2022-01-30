---
layout: post
title: DRF Query On Star Model 
---

### 星型模型与维度表

### 调用链

list -> get_queryset -> filter_queryset -> pagination

serializer -> serializer.data -> list_serializer.to_representation -> model.to_representation -> field.get_attribute -> field.to_representation

ListSerializer -> to_representation -> queryset.all() -> iter
##### DRF Serializer

##### Django QuerySet

Model -> ModelBase -> Manager -> QuerySet -> add_to_class -> contribute_to_class

QuerySet.all() -> _chain() -> _clone() -> __getitem__ -> _fetch_all -> _iterable_class -> ModelIterable -> yield results

QuerySet -> __iter__ -> _fetch_all -> _iterable_class -> ModelIterable