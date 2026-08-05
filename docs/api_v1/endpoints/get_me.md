---
sidebar_custom_props:
  method: GET
sidebar_label: 获取当前用户信息
---

# v1 API 获取当前用户信息

> API 使用者，可以通过本接口，查询当前调用方的用户信息（id / 姓名 / 邮箱 / 手机号 / 角色 / 所属企业账户）。

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取当前用户信息 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

## 接口说明

* 用个人 / 子账号凭证调用，返回该用户信息。
* 用企业全局 API 凭证（账户级 token）调用，返回该企业账户的 owner 信息。
* 角色 `role` 取值：`owner` / `admin` / `worker` / `outworker`。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/me
```

无参数。

### Response

```json
{
    "id": "69ae2a7f126da845e46e1137",
    "name": "张三",
    "email": "zhangsan@example.com",
    "mobile": "13812345678",
    "role": "owner",
    "billing_account_id": "69ae2a7f126da845e46e1139",
    "created_at": "2026-03-09T02:03:43Z"
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| id | 是 | String | 用户 ID |
| name | 是 | String | 用户显示名 |
| email | 是 | String | 邮箱 |
| mobile | 否 | String | 手机号（可能为空） |
| role | 是 | String | 在企业账户中的角色（`owner` / `admin` / `worker` / `outworker`） |
| billing_account_id | 是 | String | 所属企业账户 ID |
| created_at | 是 | DateTime | 用户创建时间（UTC） |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/me

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

response = requests.get(
    'https://jinshuju.net/api/v1/me',
    auth=(api_key, api_secret)
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI.parse('https://jinshuju.net/api/v1/me')
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

request = Net::HTTP::Get.new(uri)
request.basic_auth(api_key, api_secret)

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
