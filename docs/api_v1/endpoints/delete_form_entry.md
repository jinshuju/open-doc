---
sidebar_custom_props:
  method: DELETE
sidebar_label: 删除单条数据
---

# v1 API 删除单条数据

> API使用者，可以通过本接口，向自己创建的表单中删除一条数据

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 删除单条数据 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，只可以向 __自己创建__ 的表单中删除数据。无法操作共享的表单。
* 企业全局 API，可以操作整个企业所有表单数据。

## 接口描述

### Request

```
DELETE https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
```

<!-- openapi:params deleteEntry -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| SERIAL_NUMBER | 是 | Integer | 数据序号 |

<!-- /openapi -->

### Response

```json
{
    "serial_number": 33
}
```

<!-- openapi:response deleteEntry -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| serial_number | 是 | Integer |  |

<!-- /openapi -->

### 状态码

<!-- openapi:status deleteEntry -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 删除成功 |
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
entry_serial_number = 79

http.delete("https://jinshuju.net/api/v1/forms/${form_token}/entries/${entry_serial_number}", headers)
```

### HTTP

```http
DELETE https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Postman

```
DELETE https://jinshuju.net/api/v1/forms/$FORM_TOKEN/entries/$ENTRY_SERIAL_NUMBER

authorization 选择 `Bearer Token`

Token 输入 Access Token
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class DeleteFormEntryService {

    public void run(String accessToken, String formToken, int entrySerialNumber) throws IOException {
        String authHeaderPayload = "Bearer " + accessToken;

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
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

form_token = 'YOUR_FORM_TOKEN'
entry_serial_number = 79

api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token + '/entries/' + str(entry_serial_number)

response = requests.delete(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'})

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

request = Net::HTTP::Delete.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
