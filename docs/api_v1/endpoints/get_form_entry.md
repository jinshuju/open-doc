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
| FORM_TOKEN | 是 | String | 表单Token |
| SERIAL_NUMBER | 是 | Integer | 数据序号 |
| fields | 否 | String | 只返回指定字段，传字段 `api_code` 的 JSON 数组或逗号分隔列表 |
| include_labels | 否 | Boolean | 为 `true` 时，表单字段的值改为 `{label, value}` 形式 |

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
| form | 是 | String | 表单Token |
| form_name | 是 | String | 表单标题 |
| entry | 是 | [EntryData](#entrydata) | 本次请求获取的数据 |
| url | 否 | String | 在金数据中查看该条数据的链接 |

<!-- /openapi -->

> 数据详细结构，请[参考文档](/api_v1/schemas/entry)

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2021-09-28T02:59:42.539Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）

### 状态码

<!-- openapi:status getEntry -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 400 | 参数不合法（如 `fields` 含未知字段） |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单或数据不存在，或无权访问 |
| 429 | 超过请求速率限制 |

<!-- /openapi -->

## 数据类型

<!-- openapi:types -->

### EntryData

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 数据唯一标识 |
| serial_number | 是 | Integer | 数据序号（标识符） |
| created_at | 否 | DateTime | 数据提交时间 |
| updated_at | 否 | DateTime | 数据最后一次变更时间 |
| creator_name | 否 | String | 本条数据的填写者（仅对系统内录入数据有效） |
| color_mark | 否 | String | 颜色标记 |
| info_filling_duration | 否 | Number | 填写时长（秒）；Excel 导入、API 提交的数据为空 |
| info_platform | 否 | String | 填写设备 |
| info_os | 否 | String | 操作系统 |
| info_browser | 否 | String | 浏览器 |
| info_region | 否 | Object | 填写地区 |
| info_region.country | 否 | String | 国家 |
| info_region.province | 否 | String | 省份 |
| info_region.city | 否 | String | 城市 |
| info_remote_ip | 否 | String | 填写者 IP 地址 |
| \* | 否 | Any | 对应字段的值，键为字段 `api_code` |

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
