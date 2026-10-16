---
sidebar_custom_props:
  method: DELETE
sidebar_label: 删除表单视图
---

# v1 API 删除表单视图

> API 使用者，可以通过本接口，删除指定表单下的自定义视图

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 删除表单视图 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* API 使用者可以删除自己创建或有管理权限的共享表单下的视图。
* `VIEW_TOKEN` 可以从[获取表单视图列表](/api_v1/endpoints/get_form_views)接口取得。
* 系统预设视图不允许删除。
* 单个表单至少需要保留一个视图。
* 删除自定义视图需要账户套餐支持自定义视图能力。

## 接口描述

### Request

```
DELETE https://jinshuju.net/api/v1/forms/FORM_TOKEN/views/VIEW_TOKEN
```

<!-- openapi:params deleteFormView -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| VIEW_TOKEN | 是 | String | 视图 token |

<!-- /openapi -->

### Response

删除成功时返回被删除的视图 Token。

```json
{
    "token": "vD3e4F"
}
```

<!-- openapi:response deleteFormView -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 被删除视图的 token |

<!-- /openapi -->

### 状态码

<!-- openapi:status deleteFormView -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 删除成功 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |
| 422 | 请求无法处理（视图数量达到上限、筛选条件不合法、模型校验失败、不允许删除等），响应体为 \{ error_description \} |

<!-- /openapi -->

## 示例代码

### HTTP

```http
DELETE https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views/$VIEW_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'
view_token = 'YOUR_VIEW_TOKEN'

response = requests.delete(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views/{view_token}',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
