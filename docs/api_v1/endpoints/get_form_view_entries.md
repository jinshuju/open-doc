---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单视图数据列表
---

# v1 API 获取表单视图数据列表

> API 使用者，可以通过本接口，按指定视图的字段、筛选、排序配置获取指定表单的数据列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单视图数据列表 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

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

<!-- openapi:params listFormViewEntries -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| VIEW_TOKEN | 是 | String | 视图 token |
| next | 否 | Integer | 上一页响应中的 next 值（行偏移量，从 0 开始），负数按 0 处理<br />取值范围：≥ 0 |
| include_labels | 否 | Boolean | 为 true 时，每条数据中表单字段的值改为 `{"label": "<字段标题>", "value": <原值>}`，免去再读一次表单结构。 系统键（如 `serial_number`、`creator_id`、`token`）与考试 / 测评的 `<api_code>_extra_value` 保持原样。缺省为 false。<br />默认值：`false` |

<!-- /openapi -->

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

<!-- openapi:response listFormViewEntries -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| total | 是 | Integer | 满足条件的数据总数 |
| count | 是 | Integer | 本页条数 |
| data | 是 | Array(Object) | 一条数据。键为字段 api_code（配置了 api_code_alias 的字段以别名为键），另有以下系统键： `token`、`serial_number`、`created_at`、`updated_at`、`creator_name`（提交人姓名）、`color_mark`（颜色标记）、 `info_filling_duration`（填写时长，秒）、`info_platform`、`info_os`、`info_browser`、`info_region`（`{country, province, city}`）、`info_remote_ip`， 以及按表单能力出现的 `gen_code`（确认码）、`total_price` / `preferential_price`（有商品时）、`x_field_weixin_*`（微信信息）、`referral_link` 等。 考试 / 测评题目还会多出 `<api_code>_extra_value: { correct_answer, score }`；反向关联字段多出 `<api_code>_entries`，关联字段多出 `<api_code>_related_entries`。<br />各类型字段值的形态：<br />字段：值<br />单行 / 多行文字、姓名、手机、邮箱、电话、网址、身份证：字符串<br />单选、下拉、图片单选：选项显示值（字符串）<br />多选、图片多选：选项显示值数组<br />多级下拉：`{"level_1": "...", "level_2": "..."}`<br />数字、评分、NPS、计算：数字（评分可能为字符串）<br />是否：布尔<br />日期：按精度格式化的北京时间字符串，如 `2021-09-23`<br />时间：`HH:MM` 或 `HH:MM:SS`<br />上传文件：下载地址数组（带签名，10 年有效）<br />电子签名：下载地址字符串<br />语音：`{"url": "...", "audio_text": "..."}`<br />地址：`{"province","city","district","street"}`<br />地理位置：`{"longitude","latitude","address"}`<br />商品：`[{"name","number","price","original_price","inventory","layout","spec"?}]`<br />矩阵填空 / 矩阵量表：`[{"statement": "题目", "dimensions": {"列名": 值}}]`<br />矩阵单选：`[{"statement": "题目", "choice": "选项"}]`（多选样式为 `choices` 数组）<br />表格：`[{"列名": 值}]`（每行一个对象，空值省略）<br />横向填空：`{"<子字段 api_code>": "..."}`<br />排序：`[{"rank": 1, "choice": "选项"}]`<br />预约：`[{"item_name","scheduled_label","number", ...}]`<br />表单关联：关联数据的显示值字符串<br />关联（表格）：关联表格中被关联数据的序号数组，如 `[1, 3]`；另附 `<api_code>_related_entries`：`[{"serial_number": 1, "value": "..."}]`，value 为该数据第一列的值<br />请求带 `include_labels=true` 时，表单字段的值包装为 `{label, value}`。 |
| data[].token | 是 | String | 数据唯一标识 |
| data[].serial_number | 是 | Integer |  |
| data[].created_at | 否 | DateTime |  |
| data[].updated_at | 否 | DateTime |  |
| data[].creator_name | 否 | String |  |
| data[].color_mark | 否 | String |  |
| data[].info_filling_duration | 否 | Number |  |
| data[].info_platform | 否 | String |  |
| data[].info_os | 否 | String |  |
| data[].info_browser | 否 | String |  |
| data[].info_region | 否 | Object |  |
| data[].info_region.country | 否 | String |  |
| data[].info_region.province | 否 | String |  |
| data[].info_region.city | 否 | String |  |
| data[].info_remote_ip | 否 | String |  |
| data[].\* | 否 | Any | 其他键 |
| next | 是 | Integer / null | 下一页游标（默认排序下为序号，其他情况为行偏移量）；末页为 null |

<!-- /openapi -->

> 返回字段详细结构，请[参考数据 Schema](/api_v1/schemas/entry)。

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2026-05-26T02:00:00.000Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）。

### 状态码

<!-- openapi:status listFormViewEntries -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 数据列表 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views/$VIEW_TOKEN/entries

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'
view_token = 'YOUR_VIEW_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views/{view_token}/entries',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
