---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单列表
---

# v1 API 获取表单列表

> API使用者，可以通过本接口，获取自己所创建的表单列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单列表 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

## 接口说明

* 个人版用户/企业子账号用户，只可以获取 __自己创建__ 的表单。无法获取共享的表单。
* 企业全局 API，可以获取整个企业所有的表单。
* 表单过多时，接口会返回分页数据。每页 50 个。接口会返回下一页的标记。
* 根据返回的 表单Token，可以继续获取表单详细结构和数据列表。

## 接口描述

### Request

```
# 第一页
GET https://jinshuju.net/api/v1/forms

# 按表单名称关键词搜索
GET https://jinshuju.net/api/v1/forms?q=报名

# 如果表单过多，请求后续的表单
GET https://jinshuju.net/api/v1/forms?next=60cc514761936ced06123456
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| q | 否 | String | 关键词模糊匹配表单名称（不区分大小写）。匹配范围包含表单名称（`name`）和子标题（`subname`）。`total` 返回的是匹配后的总数。 |
| next | 否 | String | 分页参数。返回本次ID记录之后的表单 |

### Response

```json
{
    "total": 828,
    "count": 50,
    "data": [
        {
            "name": "需求调研表",
            "token": "a1B2C3",
            "tags": ["产品管理"],
            "created_at": "2021-10-23T09:18:35.799Z",
            "creator": {
                "name": "张三"
            }
        },
        {
            "name": "用户反馈表",
            "token": "a1B2C4",
            "tags": [],
            "created_at": "2021-10-23T02:18:35.799Z",
            "creator": {
                "name": "李四"
            }
        }
    ],
    "next": "60cc514761936ced06123456"
}
```

| 参数名称 | 是否必须 | 类型 | 说明                        |
| ------ | ------ | ------ |---------------------------|
| total | 是 | Number | API使用者在对应账户下创建的所有表单总数     |
| count | 是 | Number | 本次请求返回的表单数量               |
| data | 是 | Array | 表单信息数组                    |
| data[].name | 是 | String | 表单名称                      |
| data[].token | 是 | String | 表单Token                   |
| data[].tags | 否 | Array(String) | 表单对应的标签                   |
| data[].created_at |是| DateTime | 表单创建时间                    |
| data[].creator.name | 否 | String | 表单创建者的name/nickname       | 
| next | 否 | String | 分页参数。本次请求分页ID。可用于请求下一页数据。"next": null表示后续无新分页 |

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2021-09-28T02:59:42.539Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）

## 示例代码

### 伪代码

```
api_key = "YOUR_API_KEY"
api_secret = "YOUR_API_SECRET"

credentials = api_key + ":" + api_secret

encoded_creadentials = base64_encode(credentials)

auth_header_payload = "Basic " + encoded_creadentials

headers = {"Authorization": auth_header_payload}

http.get("https://jinshuju.net/api/v1/forms", headers)
```

### HTTP

```http
GET https://jinshuju.net/api/v1/forms

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS
```

### Postman

```
GET https://jinshuju.net/api/v1/forms

authorization 选择 `Basic Auth`

Username 输入 API Key
Password 输入 API Secret
```

### Java

```java
package net.jinshuju.v1api.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;

public class GetFormsService {

    public void run(String apiKey, String apiSecret) throws IOException {
        String authHeaderPayload = getAuthHeaderPayload(apiKey, apiSecret);

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms");
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

api_endpoint_url = 'https://jinshuju.net/api/v1/forms'

response = requests.get(api_endpoint_url, auth = (api_key, api_secret))

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI.parse('https://jinshuju.net/api/v1/forms')
api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'

request = Net::HTTP::Get.new(uri)
request.basic_auth(api_key, api_secret)

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
