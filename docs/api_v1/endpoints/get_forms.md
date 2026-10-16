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
| q | 否 | String | 按名称模糊匹配（不区分大小写，同时匹配对外名称与站内名称）。可传多个值（`q[]=A&q[]=B`），匹配名称包含其中任一的表单。等价于 `filters=[{"field":"form_name","operator":"like","value":...}]`。 |
| filters | 否 | String | 筛选条件，JSON 数组，多个条件为「且」关系。可筛选字段与操作符：<br />field · 类型 · 操作符<br />`form_name` · 文本 · `eq` `ne` `any_in` `none_in` `like` `not_like`<br />`created_at` · 时间 · `eq` `ne` `gte` `gt` `lte` `lt` `within_last`<br />`last_entry_created_at` · 时间 · 同上（从未收到数据的表单没有该值）<br />`entries_count` · 整数 · `eq` `ne` `gte` `gt` `lte` `lt`<br />`within_last` 的值形如 `{"unit":"day","n":30}`（unit 可为 minute / day / week / month），表示从现在起往前的窗口。 示例：`[{"field":"last_entry_created_at","operator":"within_last","value":{"unit":"day","n":7}}]` |
| sort | 否 | String | 排序规则，JSON 数组，每项 `{"field": "<字段>", "order": "asc"\|"desc"}`（order 缺省 asc），按顺序生效。 可排序字段：`created_at`、`last_entry_created_at`、`entries_count`；其他字段、非法 order 或无法解析的 JSON 返回 400。 传 `sort` 后 `next` 变为 `row:<偏移量>` 形式的游标，只能用于同样 `sort` 的请求；值相同的行在翻页间可能出现顺序变化。 |
| next | 否 | String | 上一页响应中的 `next`，原样回传以取下一页。不能与 `skip` 同时传。 |
| skip | 否 | Integer | 起始行偏移（0 起，最大 10000），用于并行切片读取；返回的 `next` 仍可继续翻页。不能与 `next` 同时传。<br />取值范围：0 ~ 10000 |
| limit | 否 | Integer | 每页条数，缺省 50，最大 1000（超过按 1000 处理）。传 0 时只返回 `total`，`data` 为空。<br />默认值：`50` |
| include_transactions | 否 | Boolean | 为 `true` 时，已绑定收款账户（商户号 / 微信支付 / 支付宝）的表单附带 `transactions` 收款统计；未绑定的表单没有该键。缺省不附带。<br />默认值：`false` |

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
| total | 是 | Integer | 满足条件的表单总数 |
| count | 是 | Integer | 本页条数 |
| data | 是 | Array(Object) |  |
| data[].name | 是 | String | 表单名称（对外名称） |
| data[].token | 是 | String |  |
| data[].tags | 是 | Array(String) | 当前身份为该表单打的标签（企业令牌为所有成员的标签合集） |
| data[].created_at | 是 | DateTime |  |
| data[].entries_count | 是 | Integer | 表单数据量 |
| data[].last_entry_created_at | 是 | DateTime / null | 最近一次收到数据的时间（UTC）；从未收到数据时为 null |
| data[].creator | 是 | Object |  |
| data[].creator.name | 否 | String / null | 创建者姓名（无姓名时为昵称） |
| data[].transactions | 否 | Object | 收款统计，按交易状态分组（`include_transactions=true` 且表单绑定了收款账户时出现）。目前只有 `paid` 一组： 交易状态为已支付或退款中的数据，按订单总额累计（不扣除退款）；已退款与部分退款的数据不计入。这不是净收入报表。 金额为 0 不代表不是收款表单。 |
| data[].transactions.paid | 是 | Object |  |
| data[].transactions.paid.amount | 是 | Number | 该组数据的订单总额之和（元） |
| data[].transactions.paid.count | 是 | Integer | 该组数据的条数 |
| next | 是 | String / null | 下一页游标：默认排序下为表单 id，传 `sort` 时为 `row:<偏移量>`；末页为 null |

<!-- /openapi -->

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2021-09-28T02:59:42.539Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）

### 状态码

<!-- openapi:status listForms -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 表单列表 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 429 | 超过速率限制 |

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
