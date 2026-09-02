---
sidebar_custom_props:
  method: PATCH
sidebar_label: 移动表单到/移出文件夹
---

# v1 API 移动表单到/移出文件夹

> API使用者，可以通过本接口，把表单放入某个文件夹，或将表单从文件夹中移出

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 移动表单到文件夹 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 移动到文件夹：需要当前用户是目标文件夹的 __管理员__。
* 移出文件夹：只需要能访问表单即可；显式传 `"folder_token": null` 表达「移出」。
* 每个用户对同一张表单的文件夹归属是独立的；本接口只影响当前调用方（user-level API）或账号 owner（account-level API）对该表单的文件夹归属，不影响其他协作者。

## 接口描述

### Request

```
# 放入文件夹
PATCH https://jinshuju.net/api/v1/forms/FORM_TOKEN/folder

{
    "folder_token": "aZ9bQ3"
}

# 移出文件夹（必须显式传 null）
PATCH https://jinshuju.net/api/v1/forms/FORM_TOKEN/folder

{
    "folder_token": null
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| folder_token | 是 | String \| null | 目标文件夹 token；传 `null` 表示移出文件夹；**字段必须存在**，否则返回 400 |

### Response

```json
{
    "form_token": "wX7pQ2",
    "folder_token": "aZ9bQ3"
}
```

移出文件夹时 `folder_token` 为 `null`。

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form_token | 是 | String | 表单 Token |
| folder_token | 是 | String \| null | 表单当前所在文件夹 token；`null` 表示不在任何文件夹 |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 成功 |
| 400 | 请求体缺少 `folder_token` 字段 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 表单不存在或无权访问；或指定的文件夹不存在/无权管理 |

> **提示**：出于避免 id 外泄的考虑，`folder_token` 参数**只接受文件夹的 token**（可通过[获取文件夹列表](/api_v1/endpoints/get_folders)得到）；传入 ObjectId 会返回 404。

## 示例代码

### HTTP

```http
# 放入
PATCH https://jinshuju.net/api/v1/forms/$FORM_TOKEN/folder

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"folder_token": "aZ9bQ3"}
```

```http
# 移出
PATCH https://jinshuju.net/api/v1/forms/$FORM_TOKEN/folder

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"folder_token": null}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

# 放入
requests.patch(
    f'https://jinshuju.net/api/v1/forms/{form_token}/folder',
    headers={'Authorization': f'Bearer {access_token}'},
    json={"folder_token": "aZ9bQ3"}
)

# 移出
requests.patch(
    f'https://jinshuju.net/api/v1/forms/{form_token}/folder',
    headers={'Authorization': f'Bearer {access_token}'},
    json={"folder_token": None}
)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'
uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/folder")
access_token = 'YOUR_ACCESS_TOKEN'

# 放入
request = Net::HTTP::Patch.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = { folder_token: 'aZ9bQ3' }.to_json

Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }

# 移出
request = Net::HTTP::Patch.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = { folder_token: nil }.to_json

Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }
```
