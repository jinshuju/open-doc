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

# 如果数据过多，请求后续的数据
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries?next=
```

| 参数名称       | 是否必须 | 类型 | 说明                   |
|------------|------| ------ |----------------------|
| FORM_TOKEN | 是    | String | 表单Token              |
| created_at | 否    | String | 根据时间筛选数据，返回该时间点以后的数据 |
| filters    | 否    | JSON 数组（也可作为字符串传入） | 字段值过滤条件，多条件 AND 组合。详见下方「filters 字段过滤」 |
| next       | 否    | String | 分页参数。返回本次ID记录之后的数据   |

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

**排序行为**：当 `filters` 中包含 `created_at` 时，结果按 `created_at` 升序返回；否则按 `serial_number` 升序。`next` 仍然是 `serial_number` 游标。

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| total | 是 | Number | 表单数据总数 |
| count | 是 | Number | 本次请求返回的数据数量 |
| data | 是 | Array | 数据数组 |
| data[].serial_number | 是 | String | 数据序号（标识符） |
| data[].field_* | 是 | | 对应字段的值 |
| data[].info_filling_duration | 否 | Number | 本条数据的填写时长（Excel导入、API提交，此值为空） |
| data[].creator_name | 否 | String | 本条数据的填写者（仅对系统内录入数据有效） |
| data[].created_at | 是 | Date | 数据提交时间 |
| data[].updated_at | 是 | Date | 数据最后一次变更时间 |
| next | 否 | String | 分页参数。本次请求分页ID。可用于请求下一页数据 |

> 数据详细结构，请[参考文档](/api_v1/schemas/entry)

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2021-09-28T02:59:42.539Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）

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
