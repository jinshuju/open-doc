---
sidebar_custom_props:
  method: POST
sidebar_label: 上传附件
---

# v1 API 上传附件

> API 使用者，可以通过本接口向表单的「上传文件」字段上传附件，上传成功后会返回附件的 `id`。随后在[新增数据](/api_v1/endpoints/create_form_entry)或[修改数据](/api_v1/endpoints/update_form_entry)时，将该 `id` 填入对应的附件字段即可完成附件提交。

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 上传附件 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: multipart/form-data`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* 「上传文件」字段的附件需要分两步提交：
  1. 调用本接口上传文件，拿到附件的 `id`；
  2. 在[新增数据](/api_v1/endpoints/create_form_entry) / [修改数据](/api_v1/endpoints/update_form_entry)时，把一个或多个 `id` 以数组形式填入对应附件字段。
* 文件需使用 `multipart/form-data` 编码上传，不支持 URL 或 base64。
* 单个附件字段可上传的附件数量、单个文件大小，受字段在表单中设置的「数量上限」（最多 15 个）与「大小上限」限制。
* 个人版用户/企业子账号用户，只可以向 __自己创建__ 的表单上传附件。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/entry_attachments

Content-Type: multipart/form-data

field_api_code=field_1
file=@/path/to/report.pdf
```

<!-- openapi:params uploadEntryAttachment -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| field_api_code | 是 | String | 附件字段的 api_code；表格字段中的附件列则传表格字段的 api_code |
| dimension_api_code | 否 | String | 表格字段中附件列的 api_code，`field_api_code` 为表格字段时必填 |
| attachment_token | 否 | String | 一次性上传令牌，以 `entry_att_tok_` 开头；传入时代替常规凭证 |
| base64 | 是 | String | 文件内容的 Base64 字符串，可带 `data:<mime>;base64,` 前缀，解码后不超过 5 MB；亦可用 `data` 键 |
| data | 否 | String | 与 `base64` 等价的别名 |
| file_name | 否 | String | 文件名，缺省为 `attachment`；亦可用 `filename` 键 |
| filename | 否 | String | 与 `file_name` 等价的别名 |
| content_type | 否 | String | MIME 类型，缺省取 data URI 前缀，否则为 `application/octet-stream` |

<!-- /openapi -->

### Response

```json
{
    "id": "5f3a1b2c4d5e6f7a8b9c0d1e",
    "file_name": "report.pdf",
    "content_type": "application/pdf",
    "file_size": 102400,
    "download_url": "https://example.jinshuju.net/...",
    "preview_url": "https://example.jinshuju.net/..."
}
```

<!-- openapi:response uploadEntryAttachment -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| id | 是 | String | 附件 ID，创建 / 更新数据时填入附件字段 |
| file_name | 是 | String | 文件名 |
| content_type | 是 | String | MIME 类型 |
| file_size | 是 | Integer | 文件字节数 |
| download_url | 是 | String | 下载地址（长期有效） |
| preview_url | 否 | String | 图片预览地址，仅图片附件返回 |

<!-- /openapi -->

### 在新增数据时引用附件

拿到附件 `id` 后，在[新增数据](/api_v1/endpoints/create_form_entry)请求中，把 `id` 以数组形式填入附件字段：

```json
{
    "field_1": ["5f3a1b2c4d5e6f7a8b9c0d1e", "5f3a1b2c4d5e6f7a8b9c0d2f"]
}
```

### 状态码

<!-- openapi:status uploadEntryAttachment -->

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 上传成功 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |
| 422 | 附件未通过校验（如超过字段的单文件大小上限）或存储失败 |

<!-- /openapi -->

## 错误响应

| HTTP 状态码 | error_description | 说明 |
| ------ | ------ | ------ |
| 400 | `file is required` | 未上传文件，或 `file` 不是有效的文件 |
| 400 | `field_api_code must reference an attachment field` | `field_api_code` 指向的不是附件字段 |
| 400 | `dimension_api_code is required when field is a table field` | 目标为表格字段但未提供 `dimension_api_code` |
| 400 | `dimension_api_code must reference an attachment dimension` | `dimension_api_code` 指向的不是附件子字段 |
| 404 | `field_api_code not found` | 表单中不存在该 `field_api_code` |
| 404 | `dimension_api_code not found` | 表格字段中不存在该 `dimension_api_code` |
| 422 | 文件相关错误信息 | 文件超出大小上限、类型不被允许或上传失败 |

## 示例代码

### curl

```bash
curl -X POST "https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entry_attachments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "field_api_code=field_1" \
  -F "file=@/path/to/report.pdf"
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

url = f'https://jinshuju.net/api/v1/forms/{form_token}/entry_attachments'

with open('/path/to/report.pdf', 'rb') as f:
    response = requests.post(
        url,
        headers={'Authorization': f'Bearer {access_token}'},
        data={'field_api_code': 'field_1'},
        files={'file': f}
    )

attachment_id = response.json()['id']

# 再用 attachment_id 新增数据
entry_url = f'https://jinshuju.net/api/v1/forms/{form_token}/entries'
requests.post(entry_url, headers={'Authorization': f'Bearer {access_token}'}, json={'field_1': [attachment_id]})
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entry_attachments")

request = Net::HTTP::Post.new(uri)
request['Authorization'] = "Bearer #{access_token}"
form_data = [
  ['field_api_code', 'field_1'],
  ['file', File.open('/path/to/report.pdf')]
]
request.set_form(form_data, 'multipart/form-data')

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

attachment_id = JSON.parse(response.body)['id']
puts(attachment_id)
```
