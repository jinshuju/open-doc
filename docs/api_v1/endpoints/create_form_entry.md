---
sidebar_custom_props:
  method: POST
sidebar_label: 新增单条数据
---

# v1 API 新增单条数据

> API使用者，可以通过本接口，向自己创建的表单中新增一条数据

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 新增单条数据 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，只可以向 __自己创建__ 的表单中新增数据。无法操作共享的表单。
* 企业全局 API，可以操作整个企业所有表单。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries

{
    "field_1": "张三",
    "field_2": "13000000000"
}
```

<!-- openapi:params createEntry -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| \* | 否 | Any | 写入数据时的字段值，键为字段 api_code 或 api_code_alias。未知键与不可写字段（签名、计算）被忽略。 选项类字段可传选项 api_code 或显示值，多级下拉与选项补充文本见下表；数字字段接受数字或数字字符串。<br />字段：写法<br />单行 / 多行文字、姓名、手机、邮箱、电话、网址、身份证：字符串<br />单选、下拉：`"选项 api_code"` 或 `"选项显示值"`；补充文本用 `"<api_code>_extended_text": {"<选项>": "补充"}`，「其他」文本用 `"<api_code>_other": "..."`<br />多选：数组，元素同上<br />图片单选 / 图片多选：选项 api_code（字符串 / 数组）<br />多级下拉：`{"level_1": "...", "level_2": "..."}`（api_code 或显示值）<br />数字、评分、NPS：数字<br />是否：布尔<br />日期：`"2012-12-25"` 或 `"2012-12-25 12:13:15"`（北京时间）<br />时间：`{"hour": "12", "minute": "15"}`<br />地址：`{"province","city","district","street"}`<br />地理位置：`{"longitude","latitude","address"}`<br />上传文件（可多个）：数组，元素可为：已上传附件的 id；本表单已有附件的下载地址（用于保留）；`{"base64": "...", "file_name": "a.png", "content_type": "image/png"}`（≤ 5MB，`base64` 也可为 data URI）；`{"attachment_token": "..."}`（预上传令牌）<br />商品：`[{"value": "商品 api_code", "number": 2, "specification": {"规格维度": "选项"}?}]`<br />矩阵填空 / 矩阵量表：`{"<题目 api_code>": {"<列 api_code>": 值}}`<br />矩阵单选：`{"<题目 api_code>": "选项 api_code"}`<br />表格：`[{"<列 api_code>": 值}, ...]`，附件列写法同上传文件<br />横向填空：`{"<子字段 api_code>": "..."}`<br />排序：有序数组 `["选项 api_code", ...]`<br />表单关联：关联数据的 token / id，或用关联键匹配的显示值（多个关联键传数组）<br />预约：`[{"api_code": "项目", "scheduled_at": "2021-04-26", "end_at"?: "...", "number": 1}]`<br />颜色标记：`"color_mark": "<颜色 api_code 或名称>"`<br />国际手机号：另传 `"<api_code>_country_id"` / `"<api_code>_country_code"` |

<!-- /openapi -->

### Response

```json
{
    "form": "a1B2c3",
    "form_name": "产品需求调研表",
    "entry": {
        "serial_number": 28,
        "field_1": "张三",
        "field_2": "13000000000",
        "x_field_1": "",
        "creator_name": "API调用者",
        "created_at": "2020-08-28T08:00:00.000Z",
        "updated_at": "2020-08-28T08:00:00.000Z"
    }
}
```

<!-- openapi:response createEntry -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form | 是 | String | 表单 token |
| form_name | 是 | String |  |
| entry | 是 | Object | 一条数据。键为字段 api_code（配置了 api_code_alias 的字段以别名为键），另有以下系统键： `token`、`serial_number`、`created_at`、`updated_at`、`creator_name`（提交人姓名）、`color_mark`（颜色标记）、 `info_filling_duration`（填写时长，秒）、`info_platform`、`info_os`、`info_browser`、`info_region`（`{country, province, city}`）、`info_remote_ip`， 以及按表单能力出现的 `gen_code`（确认码）、`total_price` / `preferential_price`（有商品时）、`x_field_weixin_*`（微信信息）、`referral_link` 等。 考试 / 测评题目还会多出 `<api_code>_extra_value: { correct_answer, score }`；反向关联字段多出 `<api_code>_entries`，关联字段多出 `<api_code>_related_entries`。<br />各类型字段值的形态：<br />字段：值<br />单行 / 多行文字、姓名、手机、邮箱、电话、网址、身份证：字符串<br />单选、下拉、图片单选：选项显示值（字符串）<br />多选、图片多选：选项显示值数组<br />多级下拉：`{"level_1": "...", "level_2": "..."}`<br />数字、评分、NPS、计算：数字（评分可能为字符串）<br />是否：布尔<br />日期：按精度格式化的北京时间字符串，如 `2021-09-23`<br />时间：`HH:MM` 或 `HH:MM:SS`<br />上传文件：下载地址数组（带签名，10 年有效）<br />电子签名：下载地址字符串<br />语音：`{"url": "...", "audio_text": "..."}`<br />地址：`{"province","city","district","street"}`<br />地理位置：`{"longitude","latitude","address"}`<br />商品：`[{"name","number","price","original_price","inventory","layout","spec"?}]`<br />矩阵填空 / 矩阵量表：`[{"statement": "题目", "dimensions": {"列名": 值}}]`<br />矩阵单选：`[{"statement": "题目", "choice": "选项"}]`（多选样式为 `choices` 数组）<br />表格：`[{"列名": 值}]`（每行一个对象，空值省略）<br />横向填空：`{"<子字段 api_code>": "..."}`<br />排序：`[{"rank": 1, "choice": "选项"}]`<br />预约：`[{"item_name","scheduled_label","number", ...}]`<br />表单关联：关联数据的显示值字符串<br />关联（表格）：关联表格中被关联数据的序号数组，如 `[1, 3]`；另附 `<api_code>_related_entries`：`[{"serial_number": 1, "value": "..."}]`，value 为该数据第一列的值<br />请求带 `include_labels=true` 时，表单字段的值包装为 `{label, value}`。 |
| entry.token | 是 | String | 数据唯一标识 |
| entry.serial_number | 是 | Integer |  |
| entry.created_at | 否 | DateTime |  |
| entry.updated_at | 否 | DateTime |  |
| entry.creator_name | 否 | String |  |
| entry.color_mark | 否 | String |  |
| entry.info_filling_duration | 否 | Number |  |
| entry.info_platform | 否 | String |  |
| entry.info_os | 否 | String |  |
| entry.info_browser | 否 | String |  |
| entry.info_region | 否 | Object |  |
| entry.info_region.country | 否 | String |  |
| entry.info_region.province | 否 | String |  |
| entry.info_region.city | 否 | String |  |
| entry.info_remote_ip | 否 | String |  |
| entry.\* | 否 | Any | 其他键 |
| url | 否 | String | 该条数据在金数据数据页中的打开地址（表单为数据页、表格为表格页，定位到该条序号），给用户核对用。只在获取、新增、更新单条数据的响应中出现；列表与批量接口不返回；快捷收款表单的数据没有该键。 |

<!-- /openapi -->

### 状态码

<!-- openapi:status createEntry -->

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功，返回该条数据 |
| 400 | 数据校验失败或参数不合法。字段校验失败时 `error_description` 是 `{ "<api_code>": ["错误信息"] }` 序列化后的 JSON 字符串 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 表单数据量已达上限（`Form has reached entries limit`），或 OAuth scope 不足 |
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

entry_json = "{\"field_1\": \"value\", \"field_2\": \"another value\"}"

http.post("https://jinshuju.net/api/v1/forms/${form_token}/entries", headers, entry_json)
```

### HTTP

```http
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"field_1": "value", "field_2": "another value"}
```

### Postman

```
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries

authorization 选择 `Bearer Token`

Token 输入 Access Token

Body:
{"field_1": "value", "field_2": "another value"}
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class CreateFormEntryService {

    public void run(String accessToken, String formToken) throws IOException {
        String authHeaderPayload = "Bearer " + accessToken;

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms/" + formToken + "/entries");
            HttpURLConnection urlConnection = (HttpURLConnection) apiEndpointUrl.openConnection();
            urlConnection.setRequestMethod("POST");
            urlConnection.addRequestProperty("Authorization", authHeaderPayload);
            urlConnection.setRequestProperty("Content-Type", "application/json; utf-8");
            urlConnection.setDoOutput(true);

            String entryJsonString = "{\"field_1\": \"Value\", \"field_2\": \"Another Value\"}";

            OutputStream os = urlConnection.getOutputStream();
            OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
            osw.write(entryJsonString);
            osw.flush();
            osw.close();
            os.close();
            urlConnection.connect();

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

entry_json = {"field_1": "value", "field_2": "another value"}

api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries'

response = requests.post(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'}, json = entry_json)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries")
access_token = 'YOUR_ACCESS_TOKEN'

entry_json = {field_1: 'Value', field_2: 'Another value'}

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = entry_json.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
