---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单数据列表
---

# v1 API 获取表单数据列表

> API使用者，可以通过本接口，获取自己单个表单的数据列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单数据列表 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |


## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，只可以获取 __自己创建__ 的表单数据。无法获取共享的表单。
* 企业全局 API，可以获取整个企业所有表单的数据。
* 数据过多时，接口会返回分页数据。每页 50 个。接口会返回下一页的标记。

## 接口描述

### Request

```
# 第一页
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries

# 按字段值过滤（filters 是一个 JSON 字符串）
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries?filters=[{"field":"field_3","operator":"gte","value":6}]

# 关键词全文搜索（一次搜遍表单的所有可搜字段）
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries?keyword=张三

# 如果数据过多，请求后续的数据
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries?next=
```

<!-- openapi:params listEntries -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| fields | 否 | String | 只返回指定字段。JSON 数组、逗号分隔字符串或重复参数均可，值为字段 api_code；序号始终返回。含未知 api_code 时返回 400 并列出可用字段。 |
| filters | 否 | String | 筛选条件，JSON 数组，每项为 `{"field": "<api_code>", "operator": "<op>", "value": ...}`（`field` 也可写作 `api_code` / `trigger`），多个条件为「且」关系。<br />• 操作符全集：`eq` `ne` `any_in` `none_in` `between` `not_between` `null` `not_null` `gte` `gt` `lte` `lt` `like` `not_like` `within_last`， 别名 `equal` / `not_equal` / `start`（=gte）/ `end`（=lte）。每种字段类型只接受其中一部分，不支持时返回 400 并列出可用操作符。<br />• 选项类字段（单选 / 多选 / 下拉 / 多级下拉）的 `value` 可以是选项 api_code 或选项显示值；多级下拉可用 `一级-二级` 路径。<br />• `between` / `not_between` 的 `value` 为二元数组 `[min, max]`；矩阵 / 表格字段需写成 `{"<列 api_code>": [min, max]}`。<br />• `within_last` 仅日期字段可用，`value` 形如 `{"unit":"day","n":30}`（unit 可为 minute / day / week / month）。<br />• `creator_id` 可作为特殊字段用 `eq` 筛选提交人（值为用户 id），且只能出现一次。<br />• `serial_number` 可作为特殊字段用 `eq` / `any_in` 按序号筛选，多个条件取交集。<br />• 关联字段（RelationField）的 `any_in` / `none_in` 的 `value` 为关联表格中的数据序号；序号不存在时返回 400。<br />• 含 `created_at` 条件时结果改为按创建时间排序。 |
| keyword | 否 | String | 全文关键字（最长 200 字符），在所有可搜索字段中模糊匹配。数据量超过 99999 条且未启用分析引擎的表单不支持全文搜索（返回 400），除非同时用 `creator_id` 限定提交人。<br />长度：≤ 200 个字符 |
| sort | 否 | String | 排序规则，JSON 数组，每项 `{"api_code": "<api_code>", "order": "asc"\|"desc"}`，按顺序生效，末尾自动追加按序号升序。 只有可排序字段可用，否则返回 400 并列出可排序字段。传 `sort` 后 `next` 变为行偏移量。 |
| created_at | 否 | String | 只返回在该时间及之后创建的数据（按北京时间解析，如 `2024-01-01` 或 `2024-01-01 08:00:00`），并改为按创建时间升序。格式无法解析时返回 400。与 `filters` / `keyword` 同时传时忽略。 |
| next | 否 | Integer / String | 上一页响应中的 `next`。默认排序下是序号游标（返回序号 ≥ 该值的数据）；条件查询 / 按创建时间 / 显式排序时是行偏移量。不能与 `skip` 同时传。也接受字符串：以整数开头时取该整数，否则视为 0，即从第一页开始。 |
| skip | 否 | Integer | 起始行偏移（0 起，最大 10000），用于并行切片读取。不能与 `next` 同时传。<br />取值范围：0 ~ 10000 |
| include_labels | 否 | Boolean | 为 true 时，每条数据中表单字段的值改为 `{"label": "<字段标题>", "value": <原值>}`，免去再读一次表单结构。 系统键（如 `serial_number`、`creator_id`、`token`）与考试 / 测评的 `<api_code>_extra_value` 保持原样。缺省为 false。<br />默认值：`false` |
| limit | 否 | Integer | 每页条数，缺省 50，最大 1000（超过按 1000 处理）。传 0 时只返回 `total`，`data` 为空。<br />默认值：`50` |

<!-- /openapi -->

### 注意

> `created_at` 目前接受两种格式的时间，所有时间均为北京时间，且不支持时区

```json
{
    "created_at": "2012-12-25",    // 年月日
    "created_at": "2012-12-25 12:13:15"    // 包含时分秒
}
```

### filters 字段过滤

`filters` 用于把字段值条件下推到数据库查询，避免拉全量再本地过滤。每个元素是 `{field, operator, value}` 三元组，多个条件之间是 **AND** 关系。

| 元素 | 类型 | 说明 |
| ---- | ---- | ---- |
| `field` | String | 字段的 `api_code`（如 `field_3`），或系统字段名 `created_at` |
| `operator` | String | 操作符，见下方表格 |
| `value` | 取决于 operator | 比较值；`null` / `not_null` 不需要传 |

**支持的 operator**：

| 类别 | operator | value 形式 | 示例 |
| ---- | -------- | ---------- | ---- |
| 等值 | `eq` / `ne` | 标量 | `{"field":"field_1","operator":"eq","value":"张三"}` |
| 比较 | `gt` / `gte` / `lt` / `lte` | 标量 | `{"field":"field_3","operator":"gte","value":6}` |
| 区间 | `between` / `not_between` | 2 元素数组 `[min, max]`（闭区间） | `{"field":"field_3","operator":"between","value":[80,100]}` |
| 集合 | `any_in` / `none_in` | 数组 | `{"field":"field_2","operator":"any_in","value":["北京","上海"]}` |
| 文本 | `like` / `not_like` | 子串（不带 SQL 通配符；服务端做不区分大小写的子串匹配） | `{"field":"field_2","operator":"like","value":"张"}` 匹配"张三""小张" |
| 是否为空 | `null` / `not_null` | 省略 | `{"field":"field_4","operator":"not_null"}` |

**operator 与字段类型的兼容性**：每种字段类型只接受其支持的 operator（例如 `NumberField` 接受 `gte`，`TextField` 不接受），不匹配会返回 400 并列出当前字段允许的 operator。

| 字段类型 | 可用 operator |
| -------- | ------------- |
| 文本类（TextField / NameField / EmailField / MobileField / TelephoneField / IdCardField / LinkField / TextArea） | `eq` `ne` `any_in` `none_in` `null` `not_null` `like` `not_like` |
| `NumberField` | `eq` `ne` `null` `not_null` `gte` `gt` `lte` `lt` `between` `not_between` |
| `DateTimeField` / `DateField` / 系统字段 `created_at` | `eq` `ne` `null` `not_null` `like` `gte` `gt` `lte` `lt` `between` `not_between` |
| `RatingField` / `NpsField` | `eq` `ne` `null` `not_null` `gte` `gt` `lte` `lt` |
| `RadioButton` / `CheckBox` / `DropDown` | `eq` `ne` `any_in` `none_in` `null` `not_null` `like` `not_like` |
| `FormAssociation` | `eq` `ne` `any_in` `none_in` `null` `not_null` |
| `AttachmentField` / `GeoField` / `TableField` | `null` `not_null` `like` |
| `ESignatureField` | `null` `not_null` |

> 选项类字段（RadioButton / CheckBox / DropDown）的 `value` 传**选项的 `api_code`**（不是中文 label），与 `create_entry` / `update_entry` 一致。

**排序与分页行为**：当 `filters` 中包含 `created_at`（或传了 `created_at` 参数）时，结果按 `created_at` 升序返回，此时 `next` 是**行偏移**；否则按 `serial_number` 升序，`next` 是 `serial_number` 游标。两种情况下客户端都只需把上一页返回的 `next` 原样传回，不要自行构造。

**400 错误响应示例**：

```json
// operator 不合法
{ "error_description": "Unsupported operator 'foobar'." }

// operator 与字段类型不匹配
{ "error_description": "Operator 'gte' not supported for field 'field_1' (NameField). Allowed operators: eq, ne, any_in, none_in, null, not_null, like, not_like." }

// between / not_between 必须传 2 元素数组
{ "error_description": "Operator 'between' requires a 2-element array value." }
```

> 提示：`filters` 也可以以 URL 参数传入（重复 `filters[]` 嵌套结构），但建议使用 JSON 字符串形式以避免歧义。`filters` 为空数组、`null` 或非法 JSON 时被静默忽略，等价于不传 `filters`。

### keyword 全文搜索

不知道值落在哪个字段时用 `keyword`，一次请求即可搜遍该表单的所有可搜字段——不需要先取字段列表再对每个字段发一条 `like` 过滤。

* 覆盖范围与数据页的搜索框一致，不限于文本字段：选项、数字、日期、地址、矩阵、表格子列都在内，按**子串**匹配存储值。
* 已知字段时优先用 `filters`：它把精确的、带类型的条件下推到单列。**同时传 `keyword` 和 `filters` 时是 AND 关系**——既命中关键词、又满足全部过滤条件的数据才会返回。
* `keyword` 长度上限 200 个字符，超出返回 400。
* 数据量超过 99999 条的表单，全文搜索依赖 ClickHouse；该表单不可用时返回 400，请改用 `filters` 按具体字段过滤。
* `keyword` 为空字符串时被静默忽略，等价于不传。

**400 错误响应示例**：

```json
// 关键词过长
{ "error_description": "Keyword is too long (201 characters, at most 200)." }

// 表单过大且全文搜索不可用
{ "error_description": "Full-text search is unavailable on this form: it holds more than 99999 entries. Filter on a specific field instead." }
```

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
            "info_filling_duration": 28,
            "creator_name": "",
            "created_at": "2020-08-28T08:00:00.000Z",
            "updated_at": "2020-08-28T08:00:00.000Z"
        },
        {
            "serial_number": 2,
            "field_1": "李四",
            "field_2": "13000000001",
            "info_filling_duration": 23,
            "creator_name": "子账号",
            "created_at": "2020-08-28T08:00:00.000Z",
            "updated_at": "2020-08-28T08:00:00.000Z"
        }
    ],
    "next": 51
}
```

<!-- openapi:response listEntries -->

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

> 数据详细结构，请[参考文档](/api_v1/schemas/entry)

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2021-09-28T02:59:42.539Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）

### 状态码

<!-- openapi:status listEntries -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 数据列表 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |
| 429 | 超过速率限制 |

<!-- /openapi -->

## 示例代码

### 伪代码

```
access_token = "YOUR_ACCESS_TOKEN"

auth_header_payload = "Bearer " + access_token

headers = {"Authorization": auth_header_payload}

form_token = "YOUR_FORM_TOKEN"

http.get("https://jinshuju.net/api/v1/forms/${form_token}/entries", headers)
```

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Postman

```
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries

authorization 选择 `Bearer Token`

Token 输入 Access Token
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class GetFormEntriesService {

    public void run(String accessToken, String formToken) throws IOException {
        String authHeaderPayload = "Bearer " + accessToken;

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms/" + formToken + "/entries");
            HttpURLConnection urlConnection = (HttpURLConnection) apiEndpointUrl.openConnection();
            urlConnection.setRequestMethod("GET");
            urlConnection.addRequestProperty("Authorization", authHeaderPayload);

            httpResponseReader = new BufferedReader(new InputStreamReader(urlConnection.getInputStream(), "UTF-8"));
            String lineRead;
            while ((lineRead = httpResponseReader.readLine()) != null) {
                System.out.println(lineRead);
            }
        } finally {
            if (httpResponseReader != null) {
                try {
                    httpResponseReader.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

}

```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

form_token = 'YOUR_FORM_TOKEN'

api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries

response = requests.get(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'})

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

form_token = 'YOUR_FORM_TOKEN'

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries")
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{access_token}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
