---
sidebar_custom_props:
  method: PATCH
sidebar_label: 修改单条数据
---

# v1 API 修改单条数据

> API使用者，可以通过本接口，修改一条数据

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 修改单条数据 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，只可以操作 __自己创建__ 的表单数据。无法操作共享的表单。
* 企业全局 API，可以操作整个企业所有表单数据。

## 合并式修改（Merge）与 覆盖式修改（Replace All）

注意，本接口支持三种 HTTP 请求（ __PATCH__ / __POST__ 和 __PUT__ ）

### 合并式修改（Merge）

> 使用 PATCH 或者 POST，则本次修改数据为合并式修改（Merge）

使用这种方式，API调用者只需要传入自己期望修改的字段和值。

对于请求未传入的字段，系统会保留修改前的值。

### 覆盖式修改（Replace All）

> 使用 PUT ，则本次修改数据为覆盖式修改（Replace All）

使用这种方式，API调用者需要传入所有修改后的字段和值

对于请求未传入的字段，系统会清除修改前的值。

## 接口描述

### Request

```
PATCH/POST/PUT https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER

{
    "field_1": "张三",
    "field_2": "13000000000"
}
```

<!-- openapi:params updateEntry -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单Token |
| SERIAL_NUMBER | 是 | Integer | 数据序号 |
| \* | 否 | Any | 对应字段的值 |

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

<!-- openapi:response updateEntry -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form | 是 | String | 表单Token（标识符） |
| form_name | 是 | String | 表单标题 |
| entry | 是 | Object | 本次请求修改后的数据 |
| entry.token | 是 | String | 数据唯一标识 |
| entry.serial_number | 是 | Integer | 数据序号（标识符） |
| entry.created_at | 否 | DateTime | 数据提交时间 |
| entry.updated_at | 否 | DateTime | 数据最后一次变更时间 |
| entry.creator_name | 否 | String | 本条数据的填写者 |
| entry.color_mark | 否 | String | 颜色标记 |
| entry.info_filling_duration | 否 | Number | 填写时长（秒）；Excel 导入、API 提交的数据为空 |
| entry.info_platform | 否 | String | 填写设备 |
| entry.info_os | 否 | String | 操作系统 |
| entry.info_browser | 否 | String | 浏览器 |
| entry.info_region | 否 | Object | 填写地区 |
| entry.info_region.country | 否 | String | 国家 |
| entry.info_region.province | 否 | String | 省份 |
| entry.info_region.city | 否 | String | 城市 |
| entry.info_remote_ip | 否 | String | 填写者 IP 地址 |
| entry.\* | 否 | Any | 对应字段的值 |
| url | 否 | String | 在金数据中查看该条数据的链接 |

<!-- /openapi -->

### 状态码

<!-- openapi:status updateEntry -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功 |
| 400 | 数据校验失败或参数不合法 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单或数据不存在，或无权访问 |
| 429 | 超过请求速率限制 |

<!-- /openapi -->

## 示例代码：合并式修改（Merge）

### 伪代码

```
access_token = "YOUR_ACCESS_TOKEN"

auth_header_payload = "Bearer " + access_token

headers = {"Authorization": auth_header_payload}

form_token = "YOUR_FORM_TOKEN"
entry_serial_number = 79

entry_json = "{\"field_1\": \"New value\"}"

http.post("https://jinshuju.net/api/v1/forms/${form_token}/entries/${entry_serial_number}", headers, entry_json)
```

### HTTP

```http
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"field_1": "value"}
```

### Postman

```
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

authorization 选择 `Bearer Token`

Token 输入 Access Token

Body:
{"field_1": "value"}
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class UpdateFormEntryWithMergeService {

    public void run(String accessToken, String formToken, int entrySerialNumber) throws IOException {
        String authHeaderPayload = "Bearer " + accessToken;

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms/" + formToken + "/entries/" + entrySerialNumber);
            HttpURLConnection urlConnection = (HttpURLConnection) apiEndpointUrl.openConnection();
            urlConnection.setRequestMethod("POST");
            urlConnection.addRequestProperty("Authorization", authHeaderPayload);
            urlConnection.setRequestProperty("Content-Type", "application/json; utf-8");
            urlConnection.setDoOutput(true);

            String entryJsonString = "{\"field_1\": \"New Value\"}";

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
entry_serial_number = 79
entry_json = {"field_1": "a new value"}


api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries/' + str(entry_serial_number)

response = requests.post(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'}, json = entry_json)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'
entry_serial_number = 79

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries/#{entry_serial_number}")
access_token = 'YOUR_ACCESS_TOKEN'

entry_json = {field_1: 'Some New Value'}

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = entry_json.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```

## 示例代码：覆盖式修改（Replace All）

### 伪代码

```
access_token = "YOUR_ACCESS_TOKEN"

auth_header_payload = "Bearer " + access_token

headers = {"Authorization": auth_header_payload}

form_token = "YOUR_FORM_TOKEN"
entry_serial_number = 79

entry_json = "{\"field_1\": \"New value\", \"field_2\": \"Another new value\"}"

http.put("https://jinshuju.net/api/v1/forms/${form_token}/entries/${entry_serial_number}", headers, entry_json)
```

### HTTP

```http
PUT https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

Authorization: Bearer YOUR_ACCESS_TOKEN

{"field_1": "new value", "field_2": "another new value"}
```

### Postman

```
PUT https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

authorization 选择 `Bearer Token`

Token 输入 Access Token

Body:
{"field_1": "new value", "field_2": "another new value"}
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class UpdateFormEntryWithReplaceAllService {

    public void run(String accessToken, String formToken, int entrySerialNumber) throws IOException {
        String authHeaderPayload = "Bearer " + accessToken;

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms/" + formToken + "/entries/" + entrySerialNumber);
            HttpURLConnection urlConnection = (HttpURLConnection) apiEndpointUrl.openConnection();
            urlConnection.setRequestMethod("PUT");
            urlConnection.addRequestProperty("Authorization", authHeaderPayload);
            urlConnection.setRequestProperty("Content-Type", "application/json; utf-8");
            urlConnection.setDoOutput(true);

            String entryJsonString = "{\"field_1\": \"New Value\"}";

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
entry_serial_number = 79
entry_json = {"field_1": "a new value"}


api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries/' + str(entry_serial_number)

response = requests.put(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'}, json = entry_json)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'
entry_serial_number = 79

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries/#{entry_serial_number}")
access_token = 'YOUR_ACCESS_TOKEN'

entry_json = {field_1: 'Some New Value'}

request = Net::HTTP::Put.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = entry_json.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
