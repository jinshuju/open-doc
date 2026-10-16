---
sidebar_custom_props:
  method: PATCH
sidebar_label: 编辑表单
---

# v1 API 编辑表单

> API使用者，可以通过本接口，编辑现有表单的名称/描述/设置，以及增加、删除、更新字段

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 编辑表单 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，只可以编辑 __自己创建__ 的表单。无法编辑共享的表单。
* 企业全局 API，可以编辑整个企业所有的表单。
* 顶层只有 5 个 key：`name` / `description` / `setting` / `fields` / `field_rules`。字段的增删改都归并在 `fields` 对象下，字段显示规则的增删改归并在 `field_rules` 对象下。
* 一次请求可以同时更改多处（改名 + 加字段 + 删字段 + 改选项），服务端原子保存。
* 至少要传一个编辑操作，否则返回 400。

## 接口描述

### Request

```
PATCH https://jinshuju.net/api/v1/forms/FORM_TOKEN

{
    "name": "产品需求调研表（2026 版）",
    "description": "用于 Q2 客户满意度调研",
    "setting": {
        "success_message": "感谢您的反馈！",
        "password_required": true,
        "access_password": "abc123",
        "allowed_audience": "public",
        "fill_frequency": { "fill_type": "repeatable", "condition": "by_ip", "cycle_period": "every_day", "limited_time": 3 },
        "by_time_range_close_rule": { "start_time": "2026-05-01T09:00:00+08:00", "end_time": "2026-05-31T18:00:00+08:00" }
    },
    "fields": {
        "add": [
            { "type": "NumberField", "label": "年龄" },
            {
                "type": "RadioButton",
                "label": "您从哪里了解我们",
                "position": 1,
                "choices": [
                    { "value": "搜索引擎" },
                    { "value": "朋友推荐" }
                ]
            }
        ],
        "remove": ["field_3"],
        "update": [
            { "api_code": "field_1", "label": "全名", "required": true },
            { "api_code": "field_2", "private": true }
        ],
        "update_choices": [
            {
                "field_api_code": "field_5",
                "add": [{ "value": "其他" }],
                "remove": [{ "api_code": "option3" }],
                "update": [{ "api_code": "option1", "value": "搜索引擎（Google/百度）" }]
            }
        ]
    }
}
```

<!-- openapi:params updateForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| name | 否 | String | 表单名称 |
| description | 否 | String / null | 表单描述 |
| setting | 否 | Object | 表单设置对象，涵盖提交后行为、表单状态、提交限制、权限、Webhook、通知规则等。完整字段见[表单设置 Schema](/api_v1/schemas/form_setting)。仅传入的 key 会被更新，未提交的 key 保持原值；但 `setting.notification_rules` 是 **REPLACE 语义**——传该字段会清除当前 API 创建的所有通知规则后重建。 |
| fields | 否 | Object | 字段操作聚合对象，包含 `add` / `remove` / `update` / `update_choices` 四个子键 |
| fields.add | 否 | Array(Object) | 要新增的字段；结构同[创建表单](/api_v1/endpoints/create_form)的 `fields`；可额外指定 `position` 指定插入位置（0-based） |
| fields.remove | 否 | Array(String) | 要删除的字段的 `api_code` 数组 |
| fields.update | 否 | Array(Object) | 字段属性更新数组 |
| fields.update[].api_code | 是 | String | 要更新的字段 `api_code` |
| fields.update[].label | 否 | String | 新的字段标题 |
| fields.update[].required | 否 | Boolean | 是否必填，与 `private` 互斥 |
| fields.update[].private | 否 | Boolean | 是否隐藏；设为 true 会自动清空校验 |
| fields.update[].notes | 否 | String / null | 新的描述/提示 |
| fields.update[].rating_max | 否 | Integer | 评分题新的最大分 |
| fields.update[].dimensions | 否 | Array(Object) | 表格题列替换，需带 `api_code` 以保留列身份 |
| fields.update_choices | 否 | Array(Object) | 选项增删改；适用于单选/多选/下拉，以及表格题列（下拉/多选列） |
| fields.update_choices[].field_api_code | 是 | String | 要改的字段 `api_code`（表格题列则传列的 `api_code`） |
| fields.update_choices[].add | 否 | Array(Object) | 要新增的选项 |
| fields.update_choices[].add[].value | 否 | String | 选项展示值，与 `name` 二选一 |
| fields.update_choices[].add[].name | 否 | String | 同 `value` |
| fields.update_choices[].add[].api_code | 否 | String | 选项 `api_code`；不传则由服务端生成 |
| fields.update_choices[].add[].quota | 否 | Integer | 选项可选配额上限 |
| fields.update_choices[].add[].operand_value | 否 | Number | 选项赋值；字段开启 `calculable` 时必传 |
| fields.update_choices[].add[].selected | 否 | Boolean | 是否默认选中 |
| fields.update_choices[].add[].is_other | 否 | Boolean | 设为「其他」选项（选中后出现填写框）；仅单选 / 多选 / 下拉 |
| fields.update_choices[].remove | 否 | Array(String / Object) | 要删除的选项（按 `api_code`） |
| fields.update_choices[].update | 否 | Array(Object) | 要修改的选项（按 `api_code`），可改 `value` / `operand_value` / `selected` |
| fields.update_choices[].update[].api_code | 是 | String | 要修改的选项 `api_code` |
| fields.update_choices[].update[].value | 否 | String | 新的选项展示值 |
| fields.update_choices[].update[].operand_value | 否 | Number | 新的选项赋值 |
| fields.update_choices[].update[].selected | 否 | Boolean | 是否默认选中 |
| field_rules | 否 | Object | 字段显示规则操作聚合对象，包含 `add` / `update` / `remove` 三个子键。见下方「字段显示规则」 |
| field_rules.add | 否 | Array(Object) | 要新增的规则，追加到规则列表末尾 |
| field_rules.add[].index | 否 | Integer | 仅 `update` 使用，新增时不需要传 |
| field_rules.add[].targets | 否 | Array(String) | 条件满足时显示的字段 `api_code`；`targets_display_mode` 为 `show` 时必传，`abort` 时忽略 |
| field_rules.add[].targets_display_mode | 否 | String | `show` = 条件满足时显示 `targets` 中的字段；`abort` = 条件满足时终止填写 |
| field_rules.add[].operator | 否 | String | 多个条件之间的关系：`and` 全部满足 / `or` 任一满足，默认 `or` |
| field_rules.add[].conditions | 否 | Array(Object) | 触发条件数组 |
| field_rules.add[].conditions[].trigger | 是 | String | 触发字段的 `api_code` |
| field_rules.add[].conditions[].comparator | 否 | String | 比较符，必须与触发字段类型匹配，否则请求被拒绝；省略时取该字段类型的默认比较符。取值见[获取表单字段规则](/api_v1/endpoints/get_form_field_rules) |
| field_rules.add[].conditions[].value | 否 | Any | 比较值，形态取决于 `comparator` |
| field_rules.remove | 否 | Array(Integer) | 要删除的规则的 `index` 数组；其余规则保持不变 |
| field_rules.update | 否 | Array(Object) | 按 `index` 原地修改已有规则；只有传入的 key 会变 |
| field_rules.update[].index | 否 | Integer | 要修改的规则的 0 起序号，来自[获取表单字段规则](/api_v1/endpoints/get_form_field_rules) |
| field_rules.update[].targets | 否 | Array(String) | 条件满足时显示的字段 `api_code`；传入时整体替换 |
| field_rules.update[].targets_display_mode | 否 | String | `show` = 条件满足时显示 `targets` 中的字段；`abort` = 条件满足时终止填写 |
| field_rules.update[].operator | 否 | String | 多个条件之间的关系：`and` 全部满足 / `or` 任一满足 |
| field_rules.update[].conditions | 否 | Array(Object) | 触发条件数组；传入时整体替换 |
| field_rules.update[].conditions[].trigger | 是 | String | 触发字段的 `api_code` |
| field_rules.update[].conditions[].comparator | 否 | String | 比较符，必须与触发字段类型匹配，否则请求被拒绝；省略时取该字段类型的默认比较符。取值见[获取表单字段规则](/api_v1/endpoints/get_form_field_rules) |
| field_rules.update[].conditions[].value | 否 | Any | 比较值，形态取决于 `comparator` |

<!-- /openapi -->

#### 字段显示规则

* `field_rules` 是**增量操作**：只传要改的规则，其余规则原样保留。
* `update` / `remove` 按规则的 **0 起 `index`** 定位，这个 `index` 必须先从[获取表单字段规则](/api_v1/endpoints/get_form_field_rules)读出来。删除规则后其余规则会重新编号，所以每轮改动前都要重新读一次。
* `update` 里传了 `conditions` 或 `targets` 时，该规则的对应列表会被整体替换。
* 目标字段必须在触发字段**之后**，否则规则会被静默丢弃；目标字段也不能是隐藏字段（`private: true`）—— 隐藏字段对外永不可见，规则无法把它显示出来。

> **字段特定属性（`fields.update[]` 子项）**：可选 `predefined_value` / `placeholder` / `range_min` / `range_max` / `precision` / `max_size` / `max_file_quantity` / `minimum_ratings_display_text` / `maximum_ratings_display_text` 等，详见[创建表单](/api_v1/endpoints/create_form)的「字段特定属性」。仅对应类型识别，传给其他类型会被静默忽略。未传的属性保持原值。

> **重要**：修改选项名字请使用 `fields.update_choices[].update`，**不要** remove 再 add，否则选项的 `api_code` 会变，历史数据会出错。

### Response

成功时返回更新后的表单完整结构（同[获取单个表单结构](/api_v1/endpoints/get_form)）。

<!-- openapi:response updateForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String | 表单标题 |
| token | 是 | String | 表单 Token |
| url | 是 | String | 表单的公开填写链接，不能用 token 自行拼接 |
| description | 是 | String / null | 表单描述 |
| fields | 是 | Array(Object) | 表单字段数据 |
| fields[].\* | 否 | Object | 键为字段的 `api_code`，值为字段定义 |
| setting | 是 | Object | 表单设置对象；字段列表与含义见[表单设置 Schema](/api_v1/schemas/form_setting)。未启用的嵌套规则（如 `by_time_range_close_rule`）以 `null` 返回。 |

<!-- /openapi -->

### 状态码

<!-- openapi:status updateForm -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功 |
| 400 | 未指定任何编辑操作；要删除/更新的字段不存在；字段不支持选项；字段类型非法；表单设置校验失败（详见[表单设置 Schema](/api_v1/schemas/form_setting)的"错误处理"小节） |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单不存在或无权访问 |
| 429 | 超过请求速率限制 |

<!-- /openapi -->

## 示例代码

### HTTP

```http
PATCH https://jinshuju.net/api/v1/forms/$FORM_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "产品需求调研表（2026 版）",
  "fields": {
    "add": [{ "type": "NumberField", "label": "年龄" }]
  }
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

payload = {
    "name": "产品需求调研表（2026 版）",
    "fields": {
        "add": [{"type": "NumberField", "label": "年龄"}]
    }
}

response = requests.patch(
    f'https://jinshuju.net/api/v1/forms/{form_token}',
    headers={'Authorization': f'Bearer {access_token}'},
    json=payload
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'
uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}")
access_token = 'YOUR_ACCESS_TOKEN'

payload = {
  name: '产品需求调研表（2026 版）',
  fields: {
    add: [{ type: 'NumberField', label: '年龄' }]
  }
}

request = Net::HTTP::Patch.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = payload.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
