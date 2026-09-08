---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单字段规则
---

# v1 API 获取表单字段规则

> API 使用者，可以通过本接口，获取表单的字段显示规则（条件显示逻辑）

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单字段规则 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 字段规则用于「当某个触发字段的值满足条件时，显示指定的目标字段」或「终止填写」。
* 每条规则都带一个 **0 起的 `index`**。[编辑表单](/api_v1/endpoints/update_form)的 `field_rules.update` / `field_rules.remove` 就是按这个 `index` 定位规则的，所以要改某条规则前，先用本接口把当前的 `index` 读出来。
* 规则的顺序即 `index` 的顺序；删除一条规则后，其余规则会重新编号，因此每次改动前都应重新读取。
* 表单没有任何字段规则时返回 `{"count": 0, "data": []}`。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/field_rules
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |

### Response

```json
{
    "count": 2,
    "data": [
        {
            "index": 0,
            "targets": ["field_4"],
            "targets_display_mode": "show",
            "operator": "or",
            "conditions": [
                { "trigger": "field_3", "comparator": "equal", "value": ["SOLH"] }
            ]
        },
        {
            "index": 1,
            "targets": ["DYNAMIC_TARGETS"],
            "targets_display_mode": "abort",
            "operator": "or",
            "conditions": [
                { "trigger": "field_3", "comparator": "equal", "value": ["KEFD"] }
            ]
        }
    ]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| count | 是 | Number | 本次返回的规则数量 |
| data | 是 | Array | 规则数组 |
| data[].index | 是 | Number | 规则的 0 起序号；[编辑表单](/api_v1/endpoints/update_form)按此值定位要更新/删除的规则 |
| data[].targets | 是 | Array(String) | 条件满足时显示的字段 `api_code` 列表。`targets_display_mode` 为 `abort` 时该字段返回固定占位值 `["DYNAMIC_TARGETS"]`（终止填写不需要目标字段） |
| data[].targets_display_mode | 是 | String | `show` = 条件满足时显示 `targets` 中的字段；`abort` = 条件满足时终止填写（隐藏后续所有字段） |
| data[].operator | 是 | String | 多个条件之间的关系：`and` = 全部满足；`or` = 任一满足 |
| data[].conditions | 是 | Array | 触发条件数组 |
| data[].conditions[].trigger | 是 | String | 触发字段的 `api_code` |
| data[].conditions[].comparator | 是 | String | 比较符，取值取决于触发字段类型，见下表 |
| data[].conditions[].value | 是 | Array \| String \| Number | 比较值；形态取决于 `comparator`，见下表 |

比较符与触发字段类型的对应关系：

| comparator | 适用触发字段类型 | value 形态 | 说明 |
| ------ | ------ | ------ | ------ |
| equal | 单选/多选/下拉/多级下拉/排序/预约/表单关联 | Array(String) | 选中项包含所给选项中的任一个（包含任一） |
| none_in | 同上 | Array(String) | 选中项不包含所给选项中的任何一个 |
| between | 评分题 / NPS | Array(Number)，两个元素 | 数值落在 `[min, max]` 区间内 |
| like | 单行文本/多行文本/邮箱/手机号/座机/链接/身份证 | String | 文本包含该子串 |
| not_like | 同上 | String | 文本不包含该子串 |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 表单不存在或无权访问 |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/field_rules

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
    f'https://jinshuju.net/api/v1/forms/{form_token}/field_rules',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
