---
sidebar_custom_props:
  method: GET
sidebar_label: 获取当前企业账户信息
---

# v1 API 获取当前企业账户信息

> API 使用者，可以通过本接口，查询当前凭证所属企业账户的套餐 / 月度用量 / 到期时间等信息。

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取企业账户信息 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

## 接口说明

* 仅返回当前凭证所属的企业账户信息（无入参，天然只能查询自己）。
* `usage` 字段包含本月度的核心额度消耗情况；当账户尚未生成本月用量记录时，该字段为 `null`。
* `feature_trial` 反映特性试用状态（如企业版试用），非试用账户对应字段为 `false` / 空字符串。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/billing_account
```

无参数。

### Response

```json
{
    "id": "69ae2a7f126da845e46e1139",
    "name": "示例企业",
    "subdomain": null,
    "users_count": 1,
    "plan": {
        "code": "e30",
        "name": "企业高级版",
        "end_date": "2027-03-09",
        "org_plan": true,
        "expired": false
    },
    "usage": {
        "next_reset_date": "2026-05-09",
        "sms": {
            "total_quota": 5000,
            "total_balance": 5000,
            "month_balance": 5000,
            "consumed_quota": 0
        },
        "active_mail": {
            "total_quota": 1500,
            "total_balance": 1500,
            "month_balance": 1500,
            "consumed_quota": 0
        },
        "entry_quota": {
            "total_quota": 500000,
            "total_balance": 499963,
            "month_balance": 499963,
            "consumed_quota": 37
        },
        "storage_quota": {
            "total_quota": 51200,
            "total_balance": 51200,
            "month_balance": 51200,
            "consumed_quota": 0
        }
    },
    "feature_trial": {
        "in_use": false,
        "expired": false,
        "label": "企业高级版",
        "end_date": ""
    }
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| id | 是 | String | 企业账户 ID |
| name | 是 | String | 企业账户名称 |
| subdomain | 否 | String | 企业子域名（未配置时为 `null`） |
| users_count | 是 | Number | 当前 active 成员数 |
| plan | 是 | Object | 套餐信息（见下） |
| plan.code | 是 | String | 套餐代码（如 `e10` / `e20` / `e30` / `pro2` / `free`） |
| plan.name | 是 | String | 套餐展示名（中文） |
| plan.end_date | 是 | String | 套餐到期日期（`YYYY-MM-DD`） |
| plan.org_plan | 是 | Boolean | 是否企业套餐 |
| plan.expired | 是 | Boolean | 企业套餐是否已过期 |
| usage | 否 | Object \| null | 本月度用量信息；账户未生成本月用量记录时为 `null` |
| usage.next_reset_date | 是 | String | 下次重置日（`YYYY-MM-DD`） |
| usage.sms / active_mail / entry_quota / storage_quota | 是 | Object | 各项额度数据（见下） |
| usage.\{vas\}.total_quota | 是 | Number | 本计费周期内的总额度 |
| usage.\{vas\}.total_balance | 是 | Number | 当前剩余总额度 |
| usage.\{vas\}.month_balance | 是 | Number | 当前剩余月度额度 |
| usage.\{vas\}.consumed_quota | 是 | Number | 已消耗额度 |
| feature_trial | 是 | Object | 特性试用状态 |
| feature_trial.in_use | 是 | Boolean | 是否在试用中 |
| feature_trial.expired | 是 | Boolean | 试用是否已过期 |
| feature_trial.label | 否 | String | 当前生效套餐展示名 |
| feature_trial.end_date | 否 | String | 试用到期日（无试用时为空字符串） |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/billing_account

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
    'https://jinshuju.net/api/v1/billing_account',
    auth=(api_key, api_secret)
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI.parse('https://jinshuju.net/api/v1/billing_account')
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

request = Net::HTTP::Get.new(uri)
request.basic_auth(api_key, api_secret)

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
