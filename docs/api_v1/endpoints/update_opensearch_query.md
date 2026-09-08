---
sidebar_custom_props:
  method: PATCH
sidebar_label: 编辑对外查询
---

# v1 API 编辑对外查询

> API 使用者，可以通过本接口，修改对外查询页面的配置，或启用/停用它

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

* 只能编辑**自己创建**的对外查询；别人创建的返回 404。
* **只有传入的 key 会被更新**，未传的 key 保持原值。
* `search_field_rules` / `display_field_rules` / `messages` / `search_button` 都是 **REPLACE 语义**：传该字段会整体替换当前值。改规则前请先用[获取单个对外查询](/api_v1/endpoints/get_opensearch_query)读出完整列表再合并后回传，否则没回传的规则会被静默删除。
* 合并 `messages` 时基于响应里的 `messages`（已存值），**不要基于 `default_messages`**，否则会把产品默认文案固化进记录。
* 停用查询只需传 `{"enabled": false}`。注意 `status` 字段与 `enabled` 无关，它描述的是「表单是否还在、数据量是否超出套餐上限」。
* 已有查询的编辑**不受套餐限制** —— 套餐不支持对外查询时，仍可以编辑或停用已存在的查询（只有新建会返回 402）。
* 来源表单已被删除的查询无法再编辑，返回 400。
* 也接受 `PUT` 方法，语义与 `PATCH` 相同。

## 接口描述

### Request

```
PATCH https://jinshuju.net/api/v1/opensearch/queries/QUERY_TOKEN

{
    "name": "2026 春季成绩查询",
    "enabled": false
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| QUERY_TOKEN | 是 | String | 对外查询 Token（URL 路径参数） |
| name | 否 | String | 查询页标题 |
| description | 否 | String | 查询页描述文案 |
| enabled | 否 | Bool | `false` 停用查询页，`true` 重新启用 |
| search_field_rules | 否 | Array | 查询条件组，**REPLACE 语义**；`api_code` 必须来自[可用字段接口](/api_v1/endpoints/get_opensearch_query_suggestions) |
| display_field_rules | 否 | Array | 展示字段，**REPLACE 语义**，不能为空 |
| messages | 否 | Object | 结果文案，**REPLACE 语义** |
| search_button | 否 | Object | 查询按钮外观，**REPLACE 语义** |
| allow_to_export_results | 否 | Bool | 是否允许访问者导出查询结果 |

### Response

返回更新后的完整配置，结构同[获取单个对外查询](/api_v1/endpoints/get_opensearch_query)。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功 |
| 400 | 参数不合法（`api_code` 不在可查询/可展示字段内、展示字段为空等），或来源表单已被删除；错误详情见 `error_description` |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 对外查询不存在，或不是当前调用方创建的 |

## 示例代码

### HTTP

```http
PATCH https://jinshuju.net/api/v1/opensearch/queries/$QUERY_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"enabled": false}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
query_token = 'YOUR_QUERY_TOKEN'
base = 'https://jinshuju.net/api/v1'
headers = {'Authorization': f'Bearer {access_token}'}

# 新增一个展示字段：先读全量，合并后整体回传
current = requests.get(f'{base}/opensearch/queries/{query_token}', headers=headers).json()
display_rules = [
    {k: v for k, v in rule.items() if v is not None}
    for rule in current['display_field_rules']
]
display_rules.append({'field_api_code': 'field_4'})

response = requests.patch(
    f'{base}/opensearch/queries/{query_token}',
    headers=headers,
    json={'display_field_rules': display_rules}
)

print(response.text)
```
