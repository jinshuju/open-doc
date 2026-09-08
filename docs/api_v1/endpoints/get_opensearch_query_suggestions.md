---
sidebar_custom_props:
  method: GET
sidebar_label: 获取对外查询可用字段
---

# v1 API 获取对外查询可用字段

> API 使用者，在创建或编辑对外查询前，可以通过本接口获取该表单允许作为查询条件、允许展示的字段

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

* **创建或编辑对外查询前请先调用本接口**，`search_field_rules` / `display_field_rules` 里的 `api_code` 必须来自这里。
* 不要用[获取单个表单结构](/api_v1/endpoints/get_form)的 `api_code` 代替：对外查询额外提供表单结构里没有的字段（如 `serial_number`、`created_at`、`updated_at`、`info_filling_duration`、考试得分、展开的关联表单字段），同时也会拒绝一部分表单字段。用表单结构里的 `api_code` 可能被拒。
* 调用方需要是该表单的**管理员**；能读表单但无管理权时返回 403，表单不存在或不可访问时返回 404。
* `recommend_display_fields` 是编辑器的预选集合，几乎涵盖所有字段 —— **不要直接照搬**，应由使用者明确选择哪些字段可以对外展示。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/opensearch/query_suggestions?form_token=FORM_TOKEN
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form_token | 是 | String | 表单 Token（Query 参数）。注意这里传的是**表单** token，不是对外查询 token |

### Response

```json
{
    "form_token": "wX7pQ2",
    "search_fields": [
        {
            "api_code": "field_2",
            "label": "手机号",
            "type": "MobileField",
            "privacy_protectable": true,
            "for_associated": false
        }
    ],
    "display_fields": [
        {
            "api_code": "field_1",
            "label": "姓名",
            "type": "NameField",
            "privacy_protectable": true,
            "for_associated": false,
            "editable": false,
            "scorable": false
        }
    ],
    "recommend_search_fields": ["field_1", "field_2"],
    "recommend_display_fields": ["field_1", "field_2", "field_3", "created_at"]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form_token | 是 | String | 表单 Token |
| search_fields | 是 | Array | 可用作查询条件的字段，即 `search_field_rules[].search_field_settings[].field_api_code` 的合法取值 |
| display_fields | 是 | Array | 可用于展示的字段，即 `display_field_rules[].field_api_code` 的合法取值 |
| *[].api_code | 是 | String | 字段 `api_code` |
| *[].label | 是 | String | 字段标题 |
| *[].type | 是 | String | 字段类型名 |
| *[].privacy_protectable | 是 | Bool | 该字段的值能否脱敏；只有为 `true` 时 `display_field_rules[].protected` 才生效 |
| *[].for_associated | 是 | Bool | 是否来自关联表单的展开字段 |
| display_fields[].editable | 是 | Bool | 该字段能否允许访问者在结果页编辑；只有为 `true` 时 `display_field_rules[].editable` 才生效 |
| display_fields[].scorable | 是 | Bool | 是否为考试得分类字段 |
| recommend_search_fields | 是 | Array(String) | 推荐作为查询条件的 `api_code`，可直接使用。为空数组说明该表单没有手机号字段可推荐，此时应由使用者指定查询字段 |
| recommend_display_fields | 是 | Array(String) | 编辑器的展示字段预选集合，**不要不加筛选地直接使用** |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 能访问该表单但不是表单管理员 |
| 404 | 表单不存在或无权访问 |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/opensearch/query_suggestions?form_token=$FORM_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

response = requests.get(
    'https://jinshuju.net/api/v1/opensearch/query_suggestions',
    headers={'Authorization': f'Bearer {access_token}'},
    params={'form_token': 'YOUR_FORM_TOKEN'}
)

print(response.text)
```
