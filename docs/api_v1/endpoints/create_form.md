---
sidebar_custom_props:
  method: POST
sidebar_label: 创建表单
---

# v1 API 创建表单

> API使用者，可以通过本接口，创建一个新的表单，并配置字段

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 创建表单 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，以自己身份创建表单。
* 企业全局 API，以企业 owner 身份创建表单。
* 可选地将新表单放入某个文件夹，通过 `folder_token` 参数指定目标文件夹的 token（可通过[获取文件夹列表](/api_v1/endpoints/get_folders)得到）。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/forms

{
    "name": "产品需求调研表",
    "description": "感谢您能抽出几分钟时间填写以下内容",
    "fields": [
        { "type": "TextField", "label": "姓名", "required": true },
        { "type": "MobileField", "label": "手机号" },
        {
            "type": "RadioButton",
            "label": "您对产品的整体评价",
            "choices": [
                { "value": "非常满意" },
                { "value": "满意" },
                { "value": "一般" },
                { "value": "不满意" }
            ]
        }
    ],
    "setting": {
        "success_message": "感谢您的反馈！",
        "password_required": true,
        "access_password": "abc123",
        "fill_frequency": { "fill_type": "once", "condition": "by_ip" }
    },
    "folder_token": "aZ9bQ3"
}
```

<!-- openapi:params createForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String | 表单名称 |
| description | 否 | String | 表单描述 |
| fields | 是 | Array(Object) | 表单字段定义，按 type 分支；各分支只接受该类型的属性<br />数量：≥ 1 项<br />详见[API V1 字段结构 Schema](/api_v1/schemas/field) |
| setting | 否 | Object | 创建 / 编辑表单时的 `setting`，只接受以下键，其他键忽略。写入的是「结果状态」：省略的键保持原值，传 `null` 表示清除。<br />• 只传 `success_message` 会自动把 `success_message_style` 设为 `text`；只传 `success_message_rich_text` 则设为 `rich_text`。<br />• `submission_region_limited=true` 需要套餐包含「填写地域限制」，且 `submission_regions` 至少一项。<br />• `merchant_account_id`（小金商户）不能与 `wxpay_account_id` / `alipay_account_id` 同时绑定；新传入的支付账户必须属于当前企业账户，绑定后 `payment_way` 自动为 `third_party`。<br />• `notification_rules` 整体替换由 API 创建的通知规则（传 `[]` 即清空），不影响桌面端创建的规则。<br />详见[API V1 表单设置 Schema](/api_v1/schemas/form_setting) |
| folder_token | 否 | String | 放入的文件夹 token（或 id），必须可管理且 kind 为 form |
| scene | 否 | String | 表单场景，缺省为普通表单<br />可选值：`form`、`survey`、`registry`、`vote`、`exam`、`reservation`、`customer_acquisition`、`evaluation`、`online_payment`、`quickpay` |
| layout | 否 | String | 布局，仅 survey / form / exam / evaluation 场景有效；card 为分页式<br />可选值：`classic`、`card` |

<!-- /openapi -->

#### 分页式表单

传 `layout: "card"` 可创建**分页式**（一页一题、自动翻页）表单。分页式由整表样式控制，不要用 `PageBreak` 分页字段去拼。

分页式无法渲染以下字段类型，请求里出现任何一个都会返回 400（错误信息会列出是哪些）：

`PageBreak` `MatrixField` `MatrixScaleField` `TableField` `GoodsField` `ESignatureField` `FormAssociation` `MultipleBlanksField` `WidgetMap` `WidgetContact` `WidgetVideo` `WidgetButton` `WidgetMarquee`

#### 支持的字段类型

**基础字段（19 种）**：

`TextField` `TextArea` `NumberField` `EmailField` `MobileField` `TelephoneField` `IdCardField` `NameField` `AddressField` `LinkField` `GeoField` `AttachmentField` `DateTimeField` `TimeField` `RatingField` `NpsField` `RadioButton` `CheckBox` `DropDown`

**进阶字段**：

`TableField` `CascadeDropDown` `SortField` `LikertField` `MatrixField` `MatrixScaleField` `ImageRadioButton` `ImageCheckBox` `GoodsField` `FormulaField` `ReservationField` `FormAssociation` `ESignatureField` `AudioField`

**装饰 / 控件类**（不收集数据）：

`PageBreak` `SectionBreak` `WidgetButton` `WidgetContact` `WidgetMap` `WidgetMarquee`

> `SectionBreak` 即"描述字段"，用于在表单里插入一段说明文字（不收集数据）。

> 部分字段需要专业版及以上套餐（`FormulaField` / `GoodsField` / `FormAssociation` / `ESignatureField` / `WidgetButton` 等）；账号套餐不支持时返回 400 并附带升级提示。

表格题（TableField）的列可选类型：`TextField` `TextArea` `NumberField` `EmailField` `MobileField` `IdCardField` `NameField` `CheckBox` `DropDown` `DateTimeField` `RatingField`

#### 字段特定属性

下列属性按字段类型分组，仅对应类型识别，传给其他类型会被静默忽略。所有属性均可选；不传则使用字段默认值。

| 字段类型 | 属性 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| `TextField` / `TextArea` / `MobileField` / `TelephoneField` / `LinkField` | predefined_value | String | 默认预填值 |
| 同上 | placeholder | String | 占位提示文案 |
| `EmailField` | placeholder | String | 占位提示文案 |
| `NumberField` | predefined_value | String | 默认预填值 |
| `NumberField` | placeholder | String | 占位提示文案 |
| `NumberField` | range_min | Number | 允许的最小值（闭区间） |
| `NumberField` | range_max | Number | 允许的最大值（闭区间） |
| `NumberField` | precision | Integer | 小数位数（0–6） |
| `DateTimeField` | predefined_value | String | 默认值。可填与 precision 匹配的日期串，或 `today` / `yesterday` / `tomorrow` |
| `DateTimeField` | precision | String | 精度：`year` / `month` / `day`（默认） / `hour` / `minute` / `second` |
| `TimeField` | predefined_value | String | 默认值（`HH:MM` 或 `HH:MM:SS`） |
| `TimeField` | include_second | Bool | 是否精确到秒 |
| `AddressField` | predefined_value | Object | 默认地址 `{province, city, district, street}` |
| `AddressField` | changeable | Bool | 用户是否可在填写页修改 |
| `AddressField` | enable_auto_position | Bool | 是否启用自动定位 |
| `AttachmentField` | max_size | Number | 单文件最大尺寸（MB） |
| `AttachmentField` | max_file_quantity | Integer | 最多上传文件数（1–15） |
| `AttachmentField` | media_type | String | `all` / `image` / `video` 等 |
| `AttachmentField` | mobile_camera_only | Bool | 移动端是否仅允许拍照（不开放相册） |
| `NpsField` | minimum_ratings_display_text | String | 最低分文案 |
| `NpsField` | maximum_ratings_display_text | String | 最高分文案 |
| `RatingField` | rating_max | Number | 评分最大分（3 / 5 / 10，默认 5） |
| `SortField` | random_choices | Bool | 选项随机展示 |
| `AudioField` | max_duration | Number | 最大录音时长（秒） |
| `CascadeDropDown` | levels | Integer | 级联层数 |
| `CascadeDropDown` | choice_filterable | Bool | 是否允许搜索选项 |
| `CascadeDropDown` | random_choices | Bool | 选项随机展示 |
| `LikertField` / `MatrixField` / `MatrixScaleField` | horizontal_on_mobile | Bool | 移动端横向排版 |
| `LikertField` | likert_choice_style | String | 单选样式 |
| `LikertField` | minimum_length / maximum_length | Integer | 单选数量限制 |
| `GoodsField` | unit | String | 计量单位文案（如「件」） |
| `GoodsField` | collapse_on_mobile | Bool | 移动端折叠展示 |
| `GoodsField` | columns_on_mobile | Integer | 移动端列数 |
| `FormulaField` | formula_display | String | 公式表达式（HTML 标签内嵌字段引用） |
| `FormulaField` | result_display_type | String | 结果展示形式（`text` / `number` / `date`） |
| `FormulaField` | precision / display_as_percentage / thousands_separator | - | 数字结果展示控制 |
| `ReservationField` | allow_multiple_items | Bool | 是否允许选多个时段 |
| `ReservationField` | item_allow_multiple_reservations | Bool | 单时段是否允许多人预约 |
| `FormAssociation` | associated_form_token | String | 被关联表单的 token |
| `FormAssociation` | associated_field_api_codes | Array(String) | 关联字段（最多 4 个） |
| `FormAssociation` | privacy_safe | Bool | 是否隐去关联表单的隐私字段 |
| `PageBreak` | disable_previous_page | Bool | 禁止返回上一页 |
| `PageBreak` | previous_page_text / next_page_text | String | 自定义按钮文案 |

> 完整属性以及最新约束以服务端为准；常见用法可参考 [MCP `describe_field_type`](/mcp/) 工具的输出。

### Response

响应结构与[获取单个表单结构](/api_v1/endpoints/get_form)相同。

```json
{
    "name": "产品需求调研表",
    "description": "感谢您能抽出几分钟时间填写以下内容",
    "fields": [
        {
            "field_1": {
                "label": "姓名",
                "type": "single_line_text",
                "notes": "",
                "private": false,
                "validation": { "required": true }
            }
        },
        {
            "field_2": {
                "label": "手机号",
                "type": "mobile",
                "notes": "",
                "private": false,
                "validation": {}
            }
        }
    ]
}
```

<!-- openapi:response createForm -->

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

<!-- openapi:status createForm -->

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功，返回表单结构 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | folder_token 指定的文件夹不存在或不可管理 |
| 429 | 超过速率限制 |

<!-- /openapi -->

## 示例代码

### 伪代码

```
access_token = "YOUR_ACCESS_TOKEN"

auth_header_payload = "Bearer " + access_token
headers = {"Authorization": auth_header_payload, "Content-Type": "application/json"}

body = {
  "name": "产品需求调研表",
  "fields": [{"type": "TextField", "label": "姓名", "required": true}]
}

http.post("https://jinshuju.net/api/v1/forms", headers, body)
```

### HTTP

```http
POST https://jinshuju.net/api/v1/forms

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "产品需求调研表",
  "fields": [{"type": "TextField", "label": "姓名", "required": true}]
}
```

### Postman

```
POST https://jinshuju.net/api/v1/forms

authorization 选择 `Bearer Token`
Token 输入 Access Token

Body (raw, JSON):
{
  "name": "产品需求调研表",
  "fields": [{"type": "TextField", "label": "姓名", "required": true}]
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

payload = {
    "name": "产品需求调研表",
    "fields": [{"type": "TextField", "label": "姓名", "required": True}]
}

response = requests.post(
    'https://jinshuju.net/api/v1/forms',
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

uri = URI.parse('https://jinshuju.net/api/v1/forms')
access_token = 'YOUR_ACCESS_TOKEN'

payload = {
  name: '产品需求调研表',
  fields: [{ type: 'TextField', label: '姓名', required: true }]
}

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = payload.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
