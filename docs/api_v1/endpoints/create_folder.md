---
sidebar_custom_props:
  method: POST
sidebar_label: 创建文件夹
---

# v1 API 创建文件夹

> API使用者，可以通过本接口，创建一个新的文件夹

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 创建文件夹 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String | 文件夹名称 |

### Response

```json
{
    "token": "aZ9bQ3",
    "name": "2026 Q2 调研",
    "created_at": "2026-04-21T09:00:00.000Z"
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 文件夹 token |
| name | 是 | String | 文件夹名称 |
| created_at | 是 | DateTime | 文件夹创建时间 |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功 |
| 400 | name 为空 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |

## 示例代码

### HTTP

```http
POST https://jinshuju.net/api/v1/folders

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS

{"name": "2026 Q2 调研"}
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

response = requests.post(
    'https://jinshuju.net/api/v1/folders',
    auth=(api_key, api_secret),
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
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request.basic_auth(api_key, api_secret)
request.body = { name: '2026 Q2 调研' }.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
