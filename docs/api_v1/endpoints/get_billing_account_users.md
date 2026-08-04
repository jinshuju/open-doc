---
sidebar_custom_props:
  method: GET
sidebar_label: 获取企业账户成员列表
---

# v1 API 获取企业账户成员列表

> API 使用者，可以通过本接口，列出当前企业账户下的成员（id / 姓名 / 邮箱 / 手机号 / 角色 / 状态）。常用于：把表单协作给某位成员前，先列出团队拿到目标 user id。

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取企业账户成员列表 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

## 接口说明

* 只列出当前凭证所属企业账户内的成员，无法跨账户查询。
* 排序：先 `status` 升序（active 在前），再 `created_at` 倒序。
* 默认返回前 50 条；通过 `limit` 调整，单次最多 100 条。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/billing_account/users
GET https://jinshuju.net/api/v1/billing_account/users?limit=20
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| limit | 否 | Number | 返回条数上限，默认 50，最多 100 |

### Response

```json
{
    "total": 3,
    "count": 3,
    "data": [
        {
            "id": "69ae2a7f126da845e46e1137",
            "name": "张三",
            "email": "zhangsan@example.com",
            "mobile": "13812345678",
            "role": "owner",
            "status": "active",
            "created_at": "2026-03-09T02:03:43Z"
        },
        {
            "id": "69b14ab1fa3d70c8a5e2c001",
            "name": "李四",
            "email": "lisi@example.com",
            "mobile": "13900000000",
            "role": "admin",
            "status": "active",
            "created_at": "2026-04-02T05:18:00Z"
        }
    ]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| total | 是 | Number | 当前账户内成员总数 |
| count | 是 | Number | 本次返回的成员数量 |
| data | 是 | Array | 成员信息数组 |
| data[].id | 是 | String | 成员（用户）ID |
| data[].name | 是 | String | 成员显示名 |
| data[].email | 是 | String | 邮箱 |
| data[].mobile | 否 | String | 手机号（可能为空） |
| data[].role | 是 | String | 角色（`owner` / `admin` / `worker` / `outworker`） |
| data[].status | 是 | String | 状态（`active` / `disabled`） |
| data[].created_at | 是 | DateTime | 成员加入时间（UTC） |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/billing_account/users

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
    'https://jinshuju.net/api/v1/billing_account/users',
    auth=(api_key, api_secret)
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI.parse('https://jinshuju.net/api/v1/billing_account/users')
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

request = Net::HTTP::Get.new(uri)
request.basic_auth(api_key, api_secret)

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
