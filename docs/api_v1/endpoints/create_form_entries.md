---
sidebar_custom_props:
  method: POST
sidebar_label: 批量新增数据
---

# v1 API 批量新增数据

> API 使用者，可以通过本接口一次向自己创建的表单中新增多条数据。适合一次导入大量记录的场景，相比逐条调用[新增数据](/api_v1/endpoints/create_form_entry)能显著减少请求次数。

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 批量新增数据 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* 单次请求最多提交 **200** 条数据，超过会返回 `400`。
* 每条数据的字段格式与[新增单条数据](/api_v1/endpoints/create_form_entry)完全一致，键必须是字段的 `api_code`，选项字段的值传选项 `api_code`。
* **支持部分成功**：逐条做字段校验，校验通过的写入，失败的跳过并在 `errors` 中按下标返回原因。只要有任意一条写入成功即返回 `201`；全部失败返回 `422`。
* **不是幂等接口**：重复提交会产生重复数据，本接口不做去重 / upsert。
* 批量写入复用与 Excel 导入相同的引擎，**跳过逐条提交的 save 回调**，公式字段会在写入后异步重算。
* 配额检查按本次批量条数整体判断；若写入后会超出表单条目上限，返回 `403`，且本批数据均不写入。
* 个人版用户/企业子账号用户，只可以向 __自己创建__ 的表单中新增数据；企业全局 API 可操作整个企业所有表单。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries/batch

{
    "entries": [
        { "field_1": "张三", "field_2": "13000000000" },
        { "field_1": "李四", "field_2": "13000000001" }
    ]
}
```

<!-- openapi:params createEntriesBatch -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| entries | 是 | Array(Object) | 写入数据时的字段值，键为字段 api_code 或 api_code_alias。未知键与不可写字段（签名、计算）被忽略。 选项类字段可传选项 api_code 或显示值，多级下拉与选项补充文本见下表；数字字段接受数字或数字字符串。<br />字段：写法<br />单行 / 多行文字、姓名、手机、邮箱、电话、网址、身份证：字符串<br />单选、下拉：`"选项 api_code"` 或 `"选项显示值"`；补充文本用 `"<api_code>_extended_text": {"<选项>": "补充"}`，「其他」文本用 `"<api_code>_other": "..."`<br />多选：数组，元素同上<br />图片单选 / 图片多选：选项 api_code（字符串 / 数组）<br />多级下拉：`{"level_1": "...", "level_2": "..."}`（api_code 或显示值）<br />数字、评分、NPS：数字<br />是否：布尔<br />日期：`"2012-12-25"` 或 `"2012-12-25 12:13:15"`（北京时间）<br />时间：`{"hour": "12", "minute": "15"}`<br />地址：`{"province","city","district","street"}`<br />地理位置：`{"longitude","latitude","address"}`<br />上传文件（可多个）：数组，元素可为：已上传附件的 id；本表单已有附件的下载地址（用于保留）；`{"base64": "...", "file_name": "a.png", "content_type": "image/png"}`（≤ 5MB，`base64` 也可为 data URI）；`{"attachment_token": "..."}`（预上传令牌）<br />商品：`[{"value": "商品 api_code", "number": 2, "specification": {"规格维度": "选项"}?}]`<br />矩阵填空 / 矩阵量表：`{"<题目 api_code>": {"<列 api_code>": 值}}`<br />矩阵单选：`{"<题目 api_code>": "选项 api_code"}`<br />表格：`[{"<列 api_code>": 值}, ...]`，附件列写法同上传文件<br />横向填空：`{"<子字段 api_code>": "..."}`<br />排序：有序数组 `["选项 api_code", ...]`<br />表单关联：关联数据的 token / id，或用关联键匹配的显示值（多个关联键传数组）<br />预约：`[{"api_code": "项目", "scheduled_at": "2021-04-26", "end_at"?: "...", "number": 1}]`<br />颜色标记：`"color_mark": "<颜色 api_code 或名称>"`<br />国际手机号：另传 `"<api_code>_country_id"` / `"<api_code>_country_code"`<br />数量：1 ~ 200 项 |

<!-- /openapi -->

### Response

```json
{
    "created_count": 2,
    "errors": []
}
```

部分成功时，`errors` 按出错数据在 `entries` 中的下标返回原因：

```json
{
    "created_count": 1,
    "errors": [
        { "index": 1, "reason": "姓名 不能为空" }
    ]
}
```

<!-- openapi:response createEntriesBatch -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| created_count | 是 | Integer |  |
| errors | 是 | Array(Object) |  |
| errors[].index | 是 | Integer | 请求数组中的下标 |
| errors[].reason | 是 | String |  |

<!-- /openapi -->

### 状态码

<!-- openapi:status createEntriesBatch -->

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 至少一条创建成功 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 表单数据量已达上限，或 OAuth scope 不足 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |
| 422 | 全部条目创建失败 |
| 429 | 超过速率限制 |

<!-- /openapi -->

## 错误响应

| HTTP 状态码 | 说明 |
| ------ | ------ |
| 201 | 至少有一条数据写入成功（可能伴随部分 `errors`） |
| 422 | `entries` 全部校验失败，无任何数据写入 |
| 400 | `Entries cannot be empty`：`entries` 为空；`A batch can contain at most 200 entries`：超过单批上限 |
| 403 | `Form has reached entries limit`：写入后会超出表单条目上限 |

## 示例代码

### curl

```bash
curl -X POST "https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/batch" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"entries":[{"field_1":"张三","field_2":"13000000000"},{"field_1":"李四","field_2":"13000000001"}]}'
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

url = f'https://jinshuju.net/api/v1/forms/{form_token}/entries/batch'

payload = {
    'entries': [
        {'field_1': '张三', 'field_2': '13000000000'},
        {'field_1': '李四', 'field_2': '13000000001'},
    ]
}

response = requests.post(url, headers={'Authorization': f'Bearer {access_token}'}, json=payload)

print(response.json())
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries/batch")

payload = {
  entries: [
    { field_1: '张三', field_2: '13000000000' },
    { field_1: '李四', field_2: '13000000001' }
  ]
}

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = payload.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
