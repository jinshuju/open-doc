---
sidebar_custom_props:
  method: DELETE
sidebar_label: 删除单条数据
---

# v1 API 删除单条数据

> API使用者，可以通过本接口，向自己创建的表单中删除一条数据

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 删除单条数据 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

## 接口说明

* 个人版用户/企业子账号用户，只可以向 __自己创建__ 的表单中删除数据。无法操作共享的表单。
* 企业全局 API，可以操作整个企业所有表单数据。

## 接口描述

### Request

```
DELETE https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单Token |
| SERIAL_NUMBER | 是 | Number | 数据序号 |

### Response

```json
{
    "serial_number": 33
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| serial_number | 是 | Number | 数据序号（标识符） |

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
entry_serial_number = 79

http.delete("https://jinshuju.net/api/v1/forms/${form_token}/entries/${entry_serial_number}", headers)
```

### HTTP

```http
DELETE https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS
```

### Postman

```
DELETE https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

authorization 选择 `Basic Auth`

Username 输入 API Key
Password 输入 API Secret
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;

public class DeleteFormEntryService {

    public void run(String apiKey, String apiSecret, String formToken, int entrySerialNumber) throws IOException {
        String authHeaderPayload = getAuthHeaderPayload(apiKey, apiSecret);

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms/" + formToken + "/entries/" + entrySerialNumber);
            HttpURLConnection urlConnection = (HttpURLConnection) apiEndpointUrl.openConnection();
            urlConnection.setRequestMethod("DELETE");
            urlConnection.addRequestProperty("Authorization", authHeaderPayload);
            urlConnection.setRequestProperty("Content-Type", "application/json; utf-8");

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
entry_serial_number = 79

api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries/' + str(entry_serial_number)

response = requests.delete(api_endpoint_url, auth = (api_key, api_secret))

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
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

request = Net::HTTP::Delete.new(uri, 'Content-Type' => 'application/json')
request.basic_auth(api_key, api_secret)

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
