---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单协作者
---

# v1 API 获取表单协作者

> API 使用者，可以通过本接口，获取表单的协作者及其角色

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单协作者 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 返回结果包含直接共享给用户的角色，也包含**从文件夹继承**的角色。
* 同一个用户既被直接共享、又通过文件夹被共享时，只返回一条记录，角色取**距离最近**的那一个（直接共享优先于文件夹继承）。
* 表单创建者也在列表中，角色为「表单管理员」。
* 只要能访问该表单即可调用，不需要管理权限。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/cooperators
```

<!-- openapi:params listFormCooperators -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |

<!-- /openapi -->

### Response

```json
{
    "count": 2,
    "data": [
        {
            "user_id": "6a054618200e25a4c1a10b1b",
            "name": "张三",
            "role": "表单管理员"
        },
        {
            "user_id": "6a054618200e25a4c1a10b2c",
            "name": "李四",
            "role": "数据查看者"
        }
    ]
}
```

<!-- openapi:response listFormCooperators -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| count | 是 | Integer |  |
| data | 是 | Array(Object) |  |
| data[].user_id | 是 | String | 用户 id |
| data[].name | 是 | String | 用户显示名 |
| data[].role | 是 | String / null | 角色名称 |

<!-- /openapi -->

### 状态码

<!-- openapi:status listFormCooperators -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 协作者列表 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/cooperators

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/cooperators',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
