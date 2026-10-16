---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单列表
---

# v1 API 获取表单列表

> API使用者，可以通过本接口，获取自己所创建的表单列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单列表 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

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

<!-- openapi:params listForms -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| q | 否 | String | 关键词模糊匹配表单名称（不区分大小写）。匹配范围包含表单名称（`name`）和子标题（`subname`）。`total` 返回的是匹配后的总数。 |
| filters | 否 | String | 筛选条件，JSON 数组，多个条件为 AND，如 `[{"field":"entries_count","operator":"gte","value":1}]`；可筛选 `form_name` / `created_at` / `last_entry_created_at` / `entries_count` |
| sort | 否 | String | 排序规则，JSON 数组，如 `[{"field":"created_at","order":"desc"}]`；可排序 `created_at` / `last_entry_created_at` / `entries_count`。翻页时须带相同的 `sort` |
| next | 否 | String | 分页参数。原样传回上一页响应中的 `next`，不可与 `skip` 同用 |
| skip | 否 | Integer | 起始行偏移，从 0 起，最大 10000；不可与 `next` 同用 |
| limit | 否 | Integer | 每页数量，默认 50，最大 1000；传 0 时只返回 `total` |
| include_transactions | 否 | Boolean | 为 `true` 时，绑定了收款账户的表单返回 `transactions` |

<!-- /openapi -->

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

<!-- openapi:response listForms -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| total | 是 | Integer | 符合条件的表单总数（含共享的表单） |
| count | 是 | Integer | 本次请求返回的表单数量 |
| data | 是 | Array([FormSummary](#formsummary)) | 表单信息数组 |
| next | 是 | String / null | 分页参数。原样传回即可请求下一页数据；null 表示没有下一页 |

<!-- /openapi -->

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2021-09-28T02:59:42.539Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）

### 状态码

<!-- openapi:status listForms -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 400 | 参数不合法，如 `filters` / `sort` 格式错误 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 429 | 超过请求速率限制 |

<!-- /openapi -->

## 数据类型

<!-- openapi:types -->

### FormSummary

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String | 表单名称 |
| token | 是 | String | 表单Token |
| tags | 是 | Array(String) | 表单对应的标签 |
| created_at | 是 | DateTime | 表单创建时间 |
| entries_count | 是 | Integer | 表单的数据条数 |
| last_entry_created_at | 是 | DateTime / null | 最近一条数据的提交时间；从未收到数据时为 null |
| creator | 是 | [Creator](#creator) | 表单创建者 |
| transactions | 否 | [FormTransactions](#formtransactions) | 收款统计；仅 `include_transactions=true` 且表单绑定了收款账户时返回 |

### Creator

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 否 | String / null | 表单创建者的name/nickname |

### FormTransactions

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| paid | 是 | Object | 已支付和退款中的数据统计，金额不扣除退款 |
| paid.amount | 是 | Number | 订单总额之和，单位：元 |
| paid.count | 是 | Integer | 数据条数 |

<!-- /openapi -->

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

### Postman

```
GET https://jinshuju.net/api/v1/forms

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

public class GetFormsService {

    public void run(String accessToken) throws IOException {
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
