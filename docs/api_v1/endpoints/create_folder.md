---
sidebar_custom_props:
  method: POST
sidebar_label: 创建文件夹
---

# v1 API 创建文件夹

> API使用者，可以通过本接口，创建一个新的文件夹

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 创建文件夹 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，以自己身份创建文件夹，自动成为该文件夹的管理员。
* 企业全局 API，以企业 owner 身份创建文件夹。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/folders

{
    "name": "2026 Q2 调研"
}
```

<!-- openapi:params createFolder -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String | 文件夹名称，不能为空<br />长度：≥ 1 个字符 |
| kind | 否 | String / null | 文件夹类型；一个文件夹只能放一类内容，表格只能放进 `table` 文件夹。缺省为 `form`<br />可选值：`form`、`table`；默认值：`form` |

<!-- /openapi -->

### Response

```json
{
    "token": "aZ9bQ3",
    "name": "2026 Q2 调研",
    "created_at": "2026-04-21T09:00:00.000Z"
}
```

<!-- openapi:response createFolder -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 文件夹 token |
| name | 是 | String | 文件夹名称 |
| kind | 是 | String / null | 文件夹类型：`form` 放表单、`table` 放表格；早期创建的表单文件夹可能为 null，按 `form` 对待<br />可选值：`form`、`table`、`quickpay` |
| created_at | 是 | DateTime | 创建时间（UTC） |

<!-- /openapi -->

### 状态码

<!-- openapi:status createFolder -->

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |

<!-- /openapi -->

## 示例代码

### HTTP

```http
POST https://jinshuju.net/api/v1/folders

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"name": "2026 Q2 调研"}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

response = requests.post(
    'https://jinshuju.net/api/v1/folders',
    headers={'Authorization': f'Bearer {access_token}'},
    json={"name": "2026 Q2 调研"}
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://jinshuju.net/api/v1/folders')
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = { name: '2026 Q2 调研' }.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
