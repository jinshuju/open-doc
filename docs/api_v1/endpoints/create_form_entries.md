---
sidebar_custom_props:
  method: POST
sidebar_label: 批量新增数据
---

# v1 API 批量新增数据

> API 使用者，可以通过本接口一次向自己创建的表单中新增多条数据。适合一次导入大量记录的场景，相比逐条调用[新增数据](/api_v1/endpoints/create_form_entry)能显著减少请求次数。

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 批量新增数据 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token |
| entries | 是 | Array | 数据对象数组，最多 200 条；每个元素的格式同[新增单条数据](/api_v1/endpoints/create_form_entry) |

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| created_count | 是 | Number | 本次成功写入的数据条数 |
| errors | 是 | Array | 校验失败的数据列表，元素为 `{ index, reason }` |
| errors[].index | 是 | Number | 出错数据在请求 `entries` 数组中的下标（从 0 开始） |
| errors[].reason | 是 | String | 该条数据的失败原因 |

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
  -u "$API_KEY:$API_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"entries":[{"field_1":"张三","field_2":"13000000000"},{"field_1":"李四","field_2":"13000000001"}]}'
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'
form_token = 'YOUR_FORM_TOKEN'

url = f'https://jinshuju.net/api/v1/forms/{form_token}/entries/batch'

payload = {
    'entries': [
        {'field_1': '张三', 'field_2': '13000000000'},
        {'field_1': '李四', 'field_2': '13000000001'},
    ]
}

response = requests.post(url, auth=(api_key, api_secret), json=payload)

print(response.json())
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'
form_token = 'YOUR_FORM_TOKEN'

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries/batch")

payload = {
  entries: [
    { field_1: '张三', field_2: '13000000000' },
    { field_1: '李四', field_2: '13000000001' }
  ]
}

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request.basic_auth(api_key, api_secret)
request.body = payload.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
