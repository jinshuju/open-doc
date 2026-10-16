---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单单条数据
---

# v1 API 获取表单单条数据

> API使用者，可以通过本接口，获取自己单个表单的单条数据

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单单条数据 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

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

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
```

<!-- openapi:params getEntry -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| SERIAL_NUMBER | 是 | Integer | 数据序号 |
| fields | 否 | String | 只返回指定字段。JSON 数组、逗号分隔字符串或重复参数均可，值为字段 api_code；序号始终返回。含未知 api_code 时返回 400 并列出可用字段。 |
| include_labels | 否 | Boolean | 为 true 时，每条数据中表单字段的值改为 `{"label": "<字段标题>", "value": <原值>}`，免去再读一次表单结构。 系统键（如 `serial_number`、`creator_id`、`token`）与考试 / 测评的 `<api_code>_extra_value` 保持原样。缺省为 false。<br />默认值：`false` |

<!-- /openapi -->

### Response

```json
{
    "form": "TOKEN",
    "form_name": "表单标题",
    "entry": {
        "serial_number": 1,
        "field_1": "张三",
        "field_2": "13000000000",
        "info_filling_duration": 28,
        "creator_name": "",
        "created_at": "2020-08-28T08:00:00.000Z",
        "updated_at": "2020-08-28T08:00:00.000Z"
    }
}
```

<!-- openapi:response getEntry -->

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

> 数据详细结构，请[参考文档](/api_v1/schemas/entry)

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2021-09-28T02:59:42.539Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）

### 状态码

<!-- openapi:status getEntry -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 单条数据 |
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

serial_number = 1

http.get("https://jinshuju.net/api/v1/forms/${form_token}/entries/${serial_number}", headers)
```

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/SERIAL_NUMBER

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Postman

```
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$SERIAL_NUMBER

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

    public void run(String accessToken, String formToken, int entrySerialNumber) throws IOException {
        String authHeaderPayload = "Bearer " + accessToken;

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms/" + formToken + "/entries/" + entrySerialNumber);
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
entry_serial_number = 1

api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries/' + entry_serial_number

response = requests.get(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'})

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

form_token = 'YOUR_FORM_TOKEN'
entry_serial_number = 1

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries/#{entry_serial_number}")
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{access_token}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
