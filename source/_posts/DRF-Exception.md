---
layout: post
title: DRF Exception Handle
author: Edison
date: 2021-06-17
---

### 框架报错源码解析
- exception 处理器
```python
# rest_framework.views 71-101
def exception_handler(exc, context):
    """
    Returns the response that should be used for any given exception.

    By default we handle the REST framework `APIException`, and also
    Django's built-in `Http404` and `PermissionDenied` exceptions.

    Any unhandled exceptions may return `None`, which will cause a 500 error
    to be raised.
    """
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()

    if isinstance(exc, exceptions.APIException):
        headers = {}
        if getattr(exc, 'auth_header', None):
            headers['WWW-Authenticate'] = exc.auth_header
        if getattr(exc, 'wait', None):
            headers['Retry-After'] = '%d' % exc.wait

        if isinstance(exc.detail, (list, dict)):
            data = exc.detail
        else:
            data = {'detail': exc.detail}

        set_rollback()
        return Response(data, status=exc.status_code, headers=headers)

    return None
```
从处理器源码可以看到，当抛出一个```str```的错误的时候，处理器会主动为其添加一个```detail```的```key```来包裹成可以被后续处理为```json```的格式，而对于```list```与```dict```的格式，则直接返回。

- ValidationError 处理

```python
#rest_framework.exceptions.ValidationError 140-158
class ValidationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = _('Invalid input.')
    default_code = 'invalid'

    def __init__(self, detail=None, code=None):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        # For validation failures, we may collect many errors together,
        # so the details should always be coerced to a list if not already.
        if isinstance(detail, tuple):
            detail = list(detail)
        elif not isinstance(detail, dict) and not isinstance(detail, list):
            detail = [detail]

        self.detail = _get_error_details(detail, code)
```
对于```ValidationError```错误，会强制将最后的值转换为```list```类型，这是考虑到一个```field```可能有多条不同的错误需要累积。

- 序列化报错处理

```python
#rest_framework.serializers 323-346
def as_serializer_error(exc):
    assert isinstance(exc, (ValidationError, DjangoValidationError))

    if isinstance(exc, DjangoValidationError):
        detail = get_error_detail(exc)
    else:
        detail = exc.detail

    if isinstance(detail, Mapping):
        # If errors may be a dict we use the standard {key: list of values}.
        # Here we ensure that all the values are *lists* of errors.
        return {
            key: value if isinstance(value, (list, Mapping)) else [value]
            for key, value in detail.items()
        }
    elif isinstance(detail, list):
        # Errors raised as a list are non-field errors.
        return {
            api_settings.NON_FIELD_ERRORS_KEY: detail
        }
    # Errors raised as a string are non-field errors.
    return {
        api_settings.NON_FIELD_ERRORS_KEY: [detail]
    }
```
drf中的序列化器```serializers```，在运行```run_validation```序列化报错的过程中，会给没有列出具体字段错误的```detail```信息，即不是```dict```格式的信息，带上一个```non_field_errors```的key来标准化。

### 推荐方案
- 非400报错
对于403，404等错误码，直接获取```detail```下的值即可
- 400报错
对于ValidationError错误，需要做两种处理
  1. 单独创建，报错如下，直接识别到错误的字段
  ```
  {
    "id": ["Not Unique"]
  }
  ```
  2. 批量创建，报错如下，按顺序识别创建的条目的错误字段。如果为空，则说明无校验错误。
  ```
  [
    {},
    {
      "id": ["Not Unique"]
    },
    {},
    {}
  ]
  ```
  此外，关于返回值为数组，需要前端进行相应处理具有多个错误信息的报错。
### 其他方案
根据参考方案，按照团队习惯，可以自定义```exception_handler```，以定义团队使用的错误信息格式。
### 参考文档
[drf-exception](https://www.django-rest-framework.org/api-guide/exceptions/#custom-exception-handling)
