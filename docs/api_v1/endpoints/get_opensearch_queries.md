---
sidebar_custom_props:
  method: GET
sidebar_label: 获取对外查询列表
---

# v1 API 获取对外查询列表

> API 使用者，可以通过本接口，获取自己创建的对外查询页面列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 对外查询 | ❌ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 「对外查询」是一个公开页面：访问者填入查询条件，即可查到匹配的表单数据。
* **对外查询归创建者所有**，本接口只返回当前调用方创建的查询。使用账号级 API（Account Access Token）时，身份等同于账号 owner，因此返回的是 owner 创建的查询。
* 传 `form_token` 可只看某张表单下的查询。**该 token 必须指向一张调用方能访问的表单**，否则返回 404 —— 不会退化成「返回全部查询」。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/opensearch/queries
GET https://jinshuju.net/api/v1/opensearch/queries?form_token=FORM_TOKEN
```

<!-- openapi:params listOpensearchQueries -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form_token | 否 | String | 按表单 token 过滤 |

<!-- /openapi -->

### Response

```json
{
    "count": 1,
    "data": [
        {
            "token": "o5qeEX",
            "url": "https://demo.jinshuju.net/os/o5qeEX",
            "name": "成绩查询",
            "enabled": true,
            "form_token": "wX7pQ2",
            "created_at": "2026-09-07T16:11:37.532+08:00",
            "searches_count": 128,
            "views_count": 356
        }
    ]
}
```

<!-- openapi:response listOpensearchQueries -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| count | 是 | Integer | 返回的查询数量 |
| data | 是 | Array(Object) |  |
| data[].token | 是 | String | 对外查询 token |
| data[].url | 是 | String | 对外查询公开访问地址（/os/\{token\}，使用账户子域名或自定义域名） |
| data[].name | 是 | String | 名称 |
| data[].enabled | 是 | Boolean | 是否启用 |
| data[].form_token | 是 | String / null | 所属表单 token，表单已删除时为 null |
| data[].created_at | 是 | DateTime | 创建时间 |
| data[].searches_count | 是 | Integer | 累计查询次数 |
| data[].views_count | 是 | Integer | 累计访问次数 |

<!-- /openapi -->

### 状态码

<!-- openapi:status listOpensearchQueries -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 对外查询列表 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/opensearch/queries

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

response = requests.get(
    'https://jinshuju.net/api/v1/opensearch/queries',
    headers={'Authorization': f'Bearer {access_token}'},
    params={'form_token': 'YOUR_FORM_TOKEN'}  # 可选
)

print(response.text)
```
