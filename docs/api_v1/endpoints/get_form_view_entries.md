# v1 API 获取表单视图数据列表

> API 使用者，可以通过本接口，按指定视图的字段、筛选、排序配置获取指定表单的数据列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单视图数据列表 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* API 使用者可以获取自己创建或有访问权限的共享表单数据。
* `VIEW_TOKEN` 可以从[获取表单视图列表](/api_v1/endpoints/get_form_views)接口取得。
* 返回的数据会应用视图的 `filter` 和 `sort` 规则。
* 返回的数据字段会受视图 `prefer_columns` 控制；当视图没有设置 `prefer_columns` 时，返回表单可推送字段。
* 数据过多时，接口会返回分页数据。每页 50 个。接口会返回下一页的标记。
* 未开通自定义视图能力时，仍可读取系统预设视图的数据，但不能读取自定义视图的数据。

## 接口描述

### Request

```
# 第一页
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/views/VIEW_TOKEN/entries

# 如果数据过多，请求后续的数据
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/views/VIEW_TOKEN/entries?next=51
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| VIEW_TOKEN | 是 | String | 视图 Token（URL 路径参数） |
| next | 否 | String | 分页参数。返回本次序号记录之后的数据 |

### Response

```json
{
    "total": 828,
    "count": 50,
    "data": [
        {
            "serial_number": 1,
            "field_1": "张三",
            "field_2": "13000000000",
            "created_at": "2026-05-26T02:00:00.000Z",
            "updated_at": "2026-05-26T02:00:00.000Z"
        },
        {
            "serial_number": 2,
            "field_1": "李四",
            "field_2": "13000000001",
            "created_at": "2026-05-26T02:10:00.000Z",
            "updated_at": "2026-05-26T02:10:00.000Z"
        }
    ],
    "next": 51
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| total | 是 | Number | 符合视图筛选条件的数据总数 |
| count | 是 | Number | 本次请求返回的数据数量 |
| data | 是 | Array | 数据数组 |
| data[].serial_number | 是 | String | 数据序号（标识符） |
| data[].field_* | 否 | 取决于字段类型 | 视图 `prefer_columns` 中包含的字段值 |
| data[].created_at | 是 | DateTime | 数据提交时间 |
| data[].updated_at | 是 | DateTime | 数据最后一次变更时间 |
| next | 否 | String | 分页参数。本次请求分页 ID。可用于请求下一页数据 |

> 返回字段详细结构，请[参考数据 Schema](/api_v1/schemas/entry)。

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2026-05-26T02:00:00.000Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API，或当前账户不支持读取自定义视图 |
| 404 | 表单或视图不存在，或无权访问 |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views/$VIEW_TOKEN/entries

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'
form_token = 'YOUR_FORM_TOKEN'
view_token = 'YOUR_VIEW_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views/{view_token}/entries',
    auth=(api_key, api_secret)
)

print(response.text)
```
