# 金数据 API v1 认证方式

> 金数据 API v1 使用 Access Token 认证，通过 HTTP 请求头 `Authorization: Bearer ACCESS_TOKEN` 传递

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 单账号认证 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| 企业全局认证 |  |  | ✔️ | ✔️ | ✔️ |

## 操作流程

* API 调用者，通过金数据系统后台，创建 Access Token
* Token 只在创建时完整显示一次，请立即复制并妥善保管
* 将 Token 拼接 `Bearer` 头（`"Bearer " + access_token`）
* 将最终字符串，放置在 HTTP 请求头的 `Authorization` 中
* 发送 HTTP 请求到 API 接口，完成 API 调用

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 获取 Access Token

### 个人 Access Token

任意账号都可以在「个人中心」中，[创建自己账号的 Access Token](https://next.jinshuju.net/profile/api) 。

1. PC 进入金数据后台系统
2. 右上角头像 -> 「个人中心」
3. 「API」
4. 在「个人 Access Token」中，点击「创建 Token」，填写名称
5. 复制并保存生成的 Token（关闭弹窗后无法再次查看）

__个人 Access Token，可以访问该账号创建的表单，以及被共享给该账号的表单，及其相应的数据（权限范围与该账号在后台看到的一致）__

### 企业 Access Token

企业版套餐，除了个人 Access Token 外，还可以使用「企业 Access Token」

1. 企业管理员，在 PC 进入金数据后台系统
2. 「系统设置」
3. [「企业 API」](https://next.jinshuju.net/system/api_licence)
4. 在「企业 Access Token」中，点击「创建 Token」，填写名称
5. 复制并保存生成的 Token（关闭弹窗后无法再次查看）

__企业 Access Token，可以访问整个企业所有的表单和数据__

> 适用于企业版套餐

## Token 的撤销

在创建 Token 的同一位置，可以撤销不再使用的 Token。撤销后该 Token 立即失效，正在使用它的集成会因此中断，且无法恢复。

## 示例代码

### 伪代码

```
access_token = "YOUR_ACCESS_TOKEN"

auth_header_payload = "Bearer " + access_token

headers = {"Authorization": auth_header_payload}

http.get("https://jinshuju.net/api/v1/forms", headers)
```

### HTTP

```http
GET https://jinshuju.net/api/v1/forms

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### curl

```bash
curl "https://jinshuju.net/api/v1/forms" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

### Postman

```
GET https://jinshuju.net/api/v1/forms

authorization 选择 `Bearer Token`

Token 输入 Access Token
```

### Java

```java
package net.jinshuju;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class JinshujuApiV1Demo {

    public void run() {

        String accessToken = "YOUR_ACCESS_TOKEN";

        String authHeaderPayload = "Bearer " + accessToken;

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

access_token = 'YOUR_ACCESS_TOKEN'

api_endpoint_url = 'https://jinshuju.net/api/v1/forms'

response = requests.get(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'})

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI.parse('https://jinshuju.net/api/v1/forms')
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{access_token}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```

## 旧版认证方式：API Key/Secret（HTTP Basic）

> 已不推荐使用，后续会下线。请新接入的集成使用上面的 Access Token；已有集成建议尽快迁移

已生成 _API Key_ 和 _API Secret_ 的账号，仍可继续使用 [HTTP 基本验证方式（HTTP Basic Authentication）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication#%E5%9F%BA%E6%9C%AC%E9%AA%8C%E8%AF%81%E6%96%B9%E6%A1%88) 调用 API v1：

* 将 _API Key_ 和 _API Secret_ 拼接成为字符串（ `api_key + ":" + api_secret`）
* 将字符串进行 Base64 编码
* 将编码后的字符串拼接 `Basic` 头（`"Basic " + encoded_string`）
* 将最终字符串，放置在 HTTP 请求头的 `Authorization` 中

```http
GET https://jinshuju.net/api/v1/forms

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS
```

尚未生成 Key/Secret 的账号，「个人 API」不再提供 API Key/Secret，请直接使用 Access Token。企业管理员可在 [「企业 API」](https://next.jinshuju.net/system/api_licence) 中查看企业已有的 Key/Secret。
