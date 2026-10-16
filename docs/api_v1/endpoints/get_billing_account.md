---
sidebar_custom_props:
  method: GET
sidebar_label: 获取当前企业账户信息
---

# v1 API 获取当前企业账户信息

> API 使用者，可以通过本接口，查询当前凭证所属企业账户的套餐 / 月度用量 / 到期时间等信息。

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取企业账户信息 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 仅返回当前凭证所属的企业账户信息（无入参，天然只能查询自己）。
* `usage` 字段包含本月度的核心额度消耗情况；当账户尚未生成本月用量记录时，该字段为 `null`。
* `feature_trial` 反映特性试用状态（如企业版试用），非试用账户对应字段为 `false` / 空字符串。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/billing_account
```

<!-- openapi:params getBillingAccount -->

本接口没有参数。

<!-- /openapi -->

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

<!-- openapi:response getBillingAccount -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| id | 是 | String | 企业账户 ID |
| name | 是 | String / null | 企业账户名称 |
| subdomain | 是 | String / null | 企业子域名（未配置时为 `null`） |
| users_count | 是 | Integer | 当前 active 成员数 |
| plan | 是 | Object | 套餐信息（见下） |
| plan.code | 是 | String | 套餐代码（如 `e10` / `e20` / `e30` / `pro2` / `free`） |
| plan.name | 是 | String | 套餐展示名（中文） |
| plan.end_date | 是 | String | 套餐到期日期（`YYYY-MM-DD`），无到期日时为空字符串 |
| plan.org_plan | 是 | Boolean | 是否企业套餐 |
| plan.expired | 是 | Boolean | 企业套餐是否已过期 |
| usage | 是 | Object / null | 本月度用量信息；账户未生成本月用量记录时为 `null` |
| usage.next_reset_date | 是 | String | 下次重置日（`YYYY-MM-DD`） |
| usage.\* | 否 | Object | 各项额度数据（见下） |
| usage.\*.unit | 是 | String | 计量单位：`item` / `mb` / `second` / `cent` |
| usage.\*.unlimited | 否 | Boolean | 额度不限时为 `true`，此时不返回额度与余额 |
| usage.\*.total_quota | 否 | Integer | 本计费周期内的总额度 |
| usage.\*.total_balance | 否 | Integer | 当前剩余总额度 |
| usage.\*.month_balance | 否 | Integer | 当前剩余月度额度 |
| usage.\*.consumed_quota | 是 | Integer | 已消耗额度 |
| feature_trial | 是 | Object | 特性试用状态 |
| feature_trial.in_use | 是 | Boolean | 是否在试用中 |
| feature_trial.expired | 是 | Boolean | 试用是否已过期 |
| feature_trial.label | 是 | String / null | 试用套餐名称 |
| feature_trial.end_date | 是 | String | 试用到期日（无试用时为空字符串） |
| merchant_accounts | 是 | Array(Object) | 已绑定的收款商户 |
| merchant_accounts[].id | 是 | String | 收款商户 ID |
| merchant_accounts[].name | 是 | String / null | 商户名称 |
| merchant_accounts[].merchant_no | 是 | String / null | 商户号 |
| merchant_accounts[].channels | 是 | Array(String) | 已开通的支付渠道：`wxpay` / `alipay` |
| wxpay_accounts | 是 | Array(Object) | 已绑定的微信支付账户 |
| wxpay_accounts[].id | 是 | String | 微信支付账户 ID |
| wxpay_accounts[].mch_id | 是 | String / null | 微信支付商户号 |
| wxpay_accounts[].mch_name | 是 | String / null | 微信支付商户名称 |
| alipay_accounts | 是 | Array(Object) | 已绑定的支付宝账户 |
| alipay_accounts[].id | 是 | String | 支付宝账户 ID |
| alipay_accounts[].email | 是 | String / null | 支付宝账号邮箱 |
| alipay_accounts[].account_type | 是 | String / null | 支付宝接口类型：`create_direct_pay_by_user` / `create_partner_trade_by_buyer` / `trade_create_by_buyer` / `fast_instant_trade_pay` |

<!-- /openapi -->

### 状态码

<!-- openapi:status getBillingAccount -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/billing_account

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

response = requests.get(
    'https://jinshuju.net/api/v1/billing_account',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI.parse('https://jinshuju.net/api/v1/billing_account')
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{access_token}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
