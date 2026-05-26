# v1 API 删除表单视图

> API 使用者，可以通过本接口，删除指定表单下的自定义视图

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 删除表单视图 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| VIEW_TOKEN | 是 | String | 视图 Token（URL 路径参数） |

### Response

删除成功时返回被删除的视图 Token。

```json
{
    "token": "vD3e4F"
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 被删除的视图 Token |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 删除成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API，或当前账户不支持自定义视图 |
| 404 | 表单或视图不存在，或无权访问 |
| 422 | 系统预设视图不允许删除，或表单至少需要保留一个视图 |

## 示例代码

### HTTP

```http
DELETE https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views/$VIEW_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'
form_token = 'YOUR_FORM_TOKEN'
view_token = 'YOUR_VIEW_TOKEN'

response = requests.delete(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views/{view_token}',
    auth=(api_key, api_secret)
)

print(response.text)
```
