---
sidebar_custom_props:
  method: POST
sidebar_label: 新增单条数据
---

# v1 API 新增单条数据

> API使用者，可以通过本接口，向自己创建的表单中新增一条数据

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 新增单条数据 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单Token |
| field_* | 否 | | 对应字段的值 |

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form | 是 | String | 表单Token（标识符） |
| form_name | 是 | String | 表单标题 |
| entry | 是 | | 本次请求创建成功的数据 |
| entry.serial_number | 是 | Number | 数据序号（标识符） |
| entry.field_* | 是 | | 对应字段的值 |
| entry.creator_name | 否 | String | 本条数据的填写者 |
| entry.created_at | 是 | Date | 数据提交时间 |
| entry.updated_at | 是 | Date | 数据最后一次变更时间 |

## 示例代码

### 伪代码

```
api_key = "YOUR_API_KEY"
api_secret = "YOUR_API_SECRET"

credentials = api_key + ":" + api_secret

encoded_creadentials = base64_encode(credentials)

auth_header_payload = "Basic " + encoded_creadentials

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
Authorization: Basic BASE_64_ENCODED_CREDENTIALS

{"field_1": "value", "field_2": "another value"}
```

### Postman

```
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries

authorization 选择 `Basic Auth`

Username 输入 API Key
Password 输入 API Secret

Body:
{"field_1": "value", "field_2": "another value"}
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;

public class CreateFormEntryService {

    public void run(String apiKey, String apiSecret, String formToken) throws IOException {
        String authHeaderPayload = getAuthHeaderPayload(apiKey, apiSecret);

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

    private String getAuthHeaderPayload(String apiKey, String apiSecret) {
        String credentials = apiKey + ":" + apiSecret;

        String base64EncodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        return "Basic " + base64EncodedCredentials;
    }
}

```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

form_token = 'YOUR_FORM_TOKEN'

entry_json = {"field_1": "value", "field_2": "another value"}

api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries'

response = requests.post(api_endpoint_url, auth = (api_key, api_secret), json = entry_json)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/entries")
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

entry_json = {field_1: 'Value', field_2: 'Another value'}

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request.basic_auth(api_key, api_secret)
request.body = entry_json.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
