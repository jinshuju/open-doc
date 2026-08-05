---
sidebar_custom_props:
  method: POST
sidebar_label: 创建表单
---

# v1 API 创建表单

> API使用者，可以通过本接口，创建一个新的表单，并配置字段

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 创建表单 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String | 表单标题 |
| fields | 是 | Array | 字段定义数组，至少一个字段 |
| fields[].type | 是 | String | 字段类型，见下方「支持的字段类型」 |
| fields[].label | 是 | String | 字段标题 |
| fields[].required | 否 | Bool | 是否必填（默认 false） |
| fields[].private | 否 | Bool | 是否隐藏字段（默认 false），与 required 互斥 |
| fields[].notes | 否 | String | 字段描述/提示文字 |
| fields[].choices | 否 | Array | 选项数组（仅适用于选择类字段） |
| fields[].choices[].value | 是 | String | 选项展示值 |
| fields[].choices[].quota | 否 | Number | 选项可选配额上限 |
| fields[].rating_max | 否 | Number | 评分字段最大分（支持 3/5/10，默认 5） |
| fields[].init_row_length | 否 | Number | 表格题初始行数（1-5，默认 3） |
| fields[].dimensions | 否 | Array | 表格题列定义 |
| description | 否 | String | 表单描述 |
| setting | 否 | Object | 表单设置对象（提交后行为、表单状态、提交限制、权限、Webhook、通知规则等）。完整字段见[表单设置 Schema](/api_v1/schemas/form_setting)。`setting.notification_rules` 用于配置企微 / 钉钉 / Webhook 类高级通知规则，详见 schema。 |
| folder_token | 否 | String | 目标文件夹 token；设置后新表单会放入该文件夹 |

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

响应结构与[获取单个表单结构](/api_v1/endpoints/get_form)相同。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功 |
| 400 | 参数校验失败（name 或 fields 为空、字段类型非法、表单设置校验失败等；设置校验规则详见[表单设置 Schema](/api_v1/schemas/form_setting)的"错误处理"小节） |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 指定的 folder_token 不存在，或当前账号无权管理该文件夹 |

## 示例代码

### 伪代码

```
api_key = "YOUR_API_KEY"
api_secret = "YOUR_API_SECRET"

credentials = api_key + ":" + api_secret
encoded_credentials = base64_encode(credentials)
auth_header_payload = "Basic " + encoded_credentials
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
Authorization: Basic BASE_64_ENCODED_CREDENTIALS

{
  "name": "产品需求调研表",
  "fields": [{"type": "TextField", "label": "姓名", "required": true}]
}
```

### Postman

```
POST https://jinshuju.net/api/v1/forms

authorization 选择 `Basic Auth`
Username 输入 API Key
Password 输入 API Secret

Body (raw, JSON):
{
  "name": "产品需求调研表",
  "fields": [{"type": "TextField", "label": "姓名", "required": true}]
}
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

payload = {
    "name": "产品需求调研表",
    "fields": [{"type": "TextField", "label": "姓名", "required": True}]
}

response = requests.post(
    'https://jinshuju.net/api/v1/forms',
    auth=(api_key, api_secret),
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
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

payload = {
  name: '产品需求调研表',
  fields: [{ type: 'TextField', label: '姓名', required: true }]
}

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request.basic_auth(api_key, api_secret)
request.body = payload.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
