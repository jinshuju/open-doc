---
sidebar_custom_props:
  method: POST
sidebar_label: 复制表单
---

# v1 API 复制表单

> API使用者，可以通过本接口，复制一个已有表单为新表单（继承样式、主题、字段）

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 复制表单 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 可以复制 __自己创建__ 的表单；或者复制开启了「允许公开复制」的他人表单。
* 可选地指定新表单的标题，以及放入某个文件夹。
* 仅复制表单结构和样式，不复制数据。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/copy

{
    "name": "产品需求调研表（副本）",
    "folder_token": "aZ9bQ3"
}
```

<!-- openapi:params copyForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 源表单 Token（URL 路径参数） |
| name | 否 | String | 新表单的标题，默认在原标题前加 `[新]`，例如 `[新]问卷调查表` |
| folder_token | 否 | String | 目标文件夹 token；设置后新表单会放入该文件夹 |

<!-- /openapi -->

### Response

成功时返回新建表单的完整结构（同[获取单个表单结构](/api_v1/endpoints/get_form)）。

<!-- openapi:response copyForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String | 表单标题 |
| token | 是 | String | 表单 Token |
| url | 是 | String | 表单的公开填写链接，不能用 token 自行拼接 |
| description | 是 | String / null | 表单描述 |
| fields | 是 | Array([FieldMap](#fieldmap)) | 表单字段数据 |
| setting | 是 | [FormSetting](/api_v1/schemas/form_setting) | 表单设置对象；字段列表与含义见[表单设置 Schema](/api_v1/schemas/form_setting)。未启用的嵌套规则（如 `by_time_range_close_rule`）以 `null` 返回。 |

<!-- /openapi -->

### 状态码

<!-- openapi:status copyForm -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 复制成功 |
| 400 | 复制过程中发生错误 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 源表单已被冻结，或其创建者已被冻结 |
| 404 | 源表单不存在；或用户无权复制；或指定的文件夹不存在/无权管理 |

<!-- /openapi -->

## 数据类型

<!-- openapi:types -->

### FieldMap

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| \* | 否 | [FieldDefinition](/api_v1/schemas/field) | 键为字段的 `api_code`，值为字段定义 |
| \*.label | 是 | String | 字段标题 |
| \*.type | 是 | String | 字段类型 |
| \*.notes | 是 | String / null | 字段提示 |
| \*.private | 是 | Boolean | 字段隐藏 |
| \*.validation | 是 | [FieldValidation](#fieldvalidation) | 字段校验信息 |

### FieldValidation

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| required | 否 | Boolean | 是否必填 |
| unique | 否 | Boolean | 是否不能与已有数据重复 |
| white_list_limit | 否 | Boolean | 是否开启白名单限制 |
| access_control_list_limit | 否 | Boolean | 是否开启「白名单」「黑名单」限制 |
| access_control_type | 否 | String | 名单类型：`white` / `black` |
| white_list_values | 否 | Array(String) | 白名单取值（单行文字 / 手机） |
| acl_values | 否 | Array(String) | 名单取值（单行文字 / 手机） |
| min_selected | 否 | Integer | 最少选几项（多选 / 图片多选 / 排序） |
| max_selected | 否 | Integer | 最多选几项（多选 / 图片多选 / 排序） |
| minimum_length | 否 | Integer | 最少多少字（文本类字段） |
| maximum_length | 否 | Integer | 最多多少字（文本类字段） |
| min | 否 | Number | 最小值（数字字段） |
| max | 否 | Number | 最大值（数字字段） |
| start | 否 | String | 最早日期（日期字段） |
| end | 否 | String | 最晚日期（日期字段） |
| \* | 否 | Any | 其他字段类型特有的校验规则，见[字段结构](/api_v1/schemas/field) |

<!-- /openapi -->

## 示例代码

### HTTP

```http
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/copy

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "产品需求调研表（副本）",
  "folder_token": "aZ9bQ3"
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

response = requests.post(
    f'https://jinshuju.net/api/v1/forms/{form_token}/copy',
    headers={'Authorization': f'Bearer {access_token}'},
    json={"name": "产品需求调研表（副本）", "folder_token": "aZ9bQ3"}
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'
uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/copy")
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = { name: '产品需求调研表（副本）', folder_token: 'aZ9bQ3' }.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
