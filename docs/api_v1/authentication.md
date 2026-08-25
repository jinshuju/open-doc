# 金数据 API v1 认证方式

> 金数据 API v1 使用 [HTTP 基本验证方式（HTTP Basic Authentication）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication#%E5%9F%BA%E6%9C%AC%E9%AA%8C%E8%AF%81%E6%96%B9%E6%A1%88)

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 单账号认证 | | | ✔️ | ✔️ | ✔️ |
| 企业全局认证 | | | ✔️ | ✔️ | ✔️ |

## 操作流程

* API 调用者，通过金数据系统后台，生成 _API Key_ 和 _API Secret_
* 将 _API Key_ 和 _API Secret_ 拼接成为字符串（ `api_key + ":" + api_secret`）
* 将字符串进行 Base64 编码
* 将编码后的字符串拼接 `Basic` 头（`"Basic " + encoded_string`）
* 将最终字符串，放置在 HTTP 请求头的 `Authorization` 中
* 发送 HTTP 请求到 API 接口，完成 API 调用

注：大多数编程语言的类库中，对 HTTP Basic 认证都有直接的支持，可以直接使用相应的类库完成

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的CODE`

## 获取 Key/Secret

### 开启子账号级别 API v1

企业版套餐中的子账号，可以在「个人中心」中，[获取自己账号的 API Key 和 API Secret](https://next.jinshuju.net/profile/api) 。

1. PC 进入金数据后台系统
2. 右上角头像 -> 「个人中心」
3. 「API」
4. 如果是第一次访问，点击 「开启 API 访问」

__单账号级别的 API，可以访问该账号创建的表单，以及被共享给该账号的表单，及其相应的数据（权限范围与该账号在后台看到的一致）__

> 适用于企业版套餐

### 开启企业级别 API v1

金数据企业版套餐，除了个人 API 外，还可以使用「企业级别 API」

1. 企业管理员，在 PC 进入金数据后台系统
2. 「系统设置」
3. [「企业 API」](https://next.jinshuju.net/system/api_licence)
4. 如果是第一次访问，点击 「开启 API 访问」

__企业级别 API，可以访问整个企业所有的表单和数据__

> 适用于企业版套餐

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
package net.jinshuju;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;

public class JinshujuApiV1Demo {

    public void run() {

        String apiKey = "YOUR_API_KEY";
        String apiSecret = "YOUR_API_SECRET";

        String credentials = apiKey + ":" + apiSecret;

        String base64EncodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeaderPayload = "Basic " + base64EncodedCredentials;

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
        } catch (IOException ioe) {
            ioe.printStackTrace();
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
