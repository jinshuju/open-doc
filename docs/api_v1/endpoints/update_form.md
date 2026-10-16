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
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| name | 否 | String |  |
| description | 否 | String / null |  |
| setting | 否 | Object | 创建 / 编辑表单时的 `setting`，只接受以下键，其他键忽略。写入的是「结果状态」：省略的键保持原值，传 `null` 表示清除。<br />• 只传 `success_message` 会自动把 `success_message_style` 设为 `text`；只传 `success_message_rich_text` 则设为 `rich_text`。<br />• `submission_region_limited=true` 需要套餐包含「填写地域限制」，且 `submission_regions` 至少一项。<br />• `merchant_account_id`（小金商户）不能与 `wxpay_account_id` / `alipay_account_id` 同时绑定；新传入的支付账户必须属于当前企业账户，绑定后 `payment_way` 自动为 `third_party`。<br />• `notification_rules` 整体替换由 API 创建的通知规则（传 `[]` 即清空），不影响桌面端创建的规则。<br />详见[API V1 表单设置 Schema](/api_v1/schemas/form_setting) |
| fields | 否 | Object | 字段增量操作，至少一个子键非空才生效 |
| fields.add | 否 | Array(Object) | 新增字段；可带 `position`（0 起）指定插入位置，缺省追加到末尾 |
| fields.remove | 否 | Array(String) | 要删除的字段 api_code；不存在时返回 400 |
| fields.update | 否 | Array(Object) | 按 api_code 定位已有字段做修改，只处理出现的键；类型专属属性写在不适用的类型上会被忽略<br />详见[API V1 字段结构 Schema](/api_v1/schemas/field) |
| fields.update_choices | 否 | Array(Object) | 对某个选项类字段（或矩阵 / 表格中的选项列）的选项做增量修改；字段不存在或不支持选项时返回 400 |
| fields.update_choices[].field_api_code | 是 | String |  |
| fields.update_choices[].add | 否 | Array(Any) | 选项；value 与 name 等价，任填其一 |
| fields.update_choices[].add[].value | 否 | String | 选项显示值 |
| fields.update_choices[].add[].name | 否 | String | 与 value 等价 |
| fields.update_choices[].add[].api_code | 否 | String | 指定选项 api_code；缺省由服务端生成，编辑时用于保留身份 |
| fields.update_choices[].add[].quota | 否 | Integer | 名额上限；不限名额时省略<br />取值范围：≥ 1 |
| fields.update_choices[].add[].operand_value | 否 | Number | 选项赋值 |
| fields.update_choices[].add[].selected | 否 | Boolean | 默认选中 |
| fields.update_choices[].add[].is_other | 否 | Boolean | 设为其他选项（选中后出现填写框），文字照原样保留；文字正好是 `其他` 或 `其它` 的选项不用设。只用于 RadioButton / CheckBox / DropDown |
| fields.update_choices[].remove | 否 | Array(String / Object) | 要删除的选项 api_code（或显示值），也可写成 `{"api_code": "..."}` |
| fields.update_choices[].update | 否 | Array(Object) |  |
| fields.update_choices[].update[].api_code | 是 | String |  |
| fields.update_choices[].update[].value | 否 | String | 新显示值 |
| fields.update_choices[].update[].operand_value | 否 | Number |  |
| fields.update_choices[].update[].selected | 否 | Boolean |  |
| field_rules | 否 | Object | 字段规则增量操作，`remove` / `update` 以 `GET /forms/{form_token}/field_rules` 返回的 0 起 `index` 定位；同一 index 不能同时删除和更新 |
| field_rules.add | 否 | Array(Object) |  |
| field_rules.add[].index | 否 | Integer | 仅 update 操作使用：要修改的规则下标（0 起） |
| field_rules.add[].targets | 否 | Array(String) | 受影响字段的 api_code；`targets_display_mode=abort` 时可省略 |
| field_rules.add[].targets_display_mode | 否 | String | `show` / `abort`，默认 show<br />可选值：`show`、`abort` |
| field_rules.add[].operator | 否 | String | 条件之间的关系，默认 or<br />可选值：`or`、`and` |
| field_rules.add[].conditions | 否 | Array(Object) |  |
| field_rules.add[].conditions[].trigger | 是 | String | 触发字段 api_code |
| field_rules.add[].conditions[].comparator | 否 | String | 比较符，缺省取该字段支持的第一个；不支持时返回 400 并列出可用比较符 |
| field_rules.add[].conditions[].value | 否 | Any | 比较值 |
| field_rules.remove | 否 | Array(Integer) |  |
| field_rules.update | 否 | Array(Object) |  |
| field_rules.update[].index | 否 | Integer | 仅 update 操作使用：要修改的规则下标（0 起） |
| field_rules.update[].targets | 否 | Array(String) | 受影响字段的 api_code；`targets_display_mode=abort` 时可省略 |
| field_rules.update[].targets_display_mode | 否 | String | `show` / `abort`，默认 show<br />可选值：`show`、`abort` |
| field_rules.update[].operator | 否 | String | 条件之间的关系，默认 or<br />可选值：`or`、`and` |
| field_rules.update[].conditions | 否 | Array(Object) |  |
| field_rules.update[].conditions[].trigger | 是 | String | 触发字段 api_code |
| field_rules.update[].conditions[].comparator | 否 | String | 比较符，缺省取该字段支持的第一个；不支持时返回 400 并列出可用比较符 |
| field_rules.update[].conditions[].value | 否 | Any | 比较值 |

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
| name | 是 | String |  |
| token | 是 | String |  |
| url | 是 | String | 表单对外填写地址（按企业账户的自定义域名 / 子域名生成，不能由 token 推算） |
| description | 是 | String / null | 表单描述（可能是 HTML 富文本） |
| fields | 是 | Array(Object) | 字段列表，按表单中的顺序排列；每个元素是以字段 api_code 为唯一键的对象 |
| fields[].\* | 否 | Object | 字段定义。所有字段都有 `label` / `api_code_alias` / `type` / `notes` / `private` / `validation`，其余属性按 `type` 出现。<br />`type` 取值与字段的对应关系：<br />type：字段<br />`single_line_text`：单行文字<br />`paragraph_text`：多行文字<br />`name` / `id_card` / `mobile` / `email` / `phone` / `link` / `address` / `geo_location`：姓名 / 身份证 / 手机 / 邮箱 / 电话 / 网址 / 地址 / 地理位置<br />`single_choice` / `multiple_choice` / `drop_down` / `cascade_drop_down`：单选 / 多选 / 下拉 / 多级下拉（颜色标记也是 `drop_down`）<br />`image_radio_button` / `image_check_box`：图片单选 / 图片多选<br />`number` / `formula` / `rating` / `nps` / `boolean`：数字 / 计算 / 评分 / NPS / 是否<br />`date_time` / `date` / `time`：日期 / 日期（旧）/ 时间<br />`attachment` / `audio` / `e_signature`：上传文件 / 语音 / 电子签名<br />`likert` / `matrix` / `matrix_scale` / `table` / `multiple_blanks` / `sort`：矩阵单选 / 矩阵填空 / 矩阵量表 / 表格 / 横向填空 / 排序<br />`goods` / `reservation`：商品 / 预约<br />`form_association` / `reversed_association`：表单关联 / 反向关联<br />详见[API V1 字段结构 Schema](/api_v1/schemas/field) |
| setting | 是 | Object | 表单设置；表单尚无设置时为空对象<br />详见[API V1 表单设置 Schema](/api_v1/schemas/form_setting) |

<!-- /openapi -->

### 状态码

<!-- openapi:status updateForm -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功，返回表单结构 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |
| 429 | 超过速率限制 |

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
