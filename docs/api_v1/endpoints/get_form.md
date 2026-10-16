---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单详细结构
---

# v1 API 获取表单详细结构

> API使用者，可以通过本接口，获取单个表单的详细接口（字段 Schema）

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单详细结构 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

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

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN
```

<!-- openapi:params getForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| include_analytics | 否 | Boolean | 是否在每个可分析字段上附带 `analytics`（可用的聚合函数、能否分组、数据概况形态），缺省为 false。<br />默认值：`false` |
| include_theme | 否 | Boolean | 为 `true` 时附带 `theme`（表单主题）。<br />默认值：`false` |
| include_field_rules | 否 | Boolean | 为 `true` 时附带 `field_rules`（字段显示规则，同 `GET /forms/{form_token}/field_rules` 的 `data`）。<br />默认值：`false` |
| include_extended_attributes | 否 | Boolean | 为 `true` 时附带 `extended_attributes`（数据来源链接，同 `GET /forms/{form_token}/extended_attributes` 的 `data`）。<br />默认值：`false` |
| include_transactions | 否 | Boolean | 为 `true` 时，已绑定收款账户（商户号 / 微信支付 / 支付宝）的表单附带 `transactions` 收款统计；未绑定的表单没有该键。缺省不附带。<br />默认值：`false` |

<!-- /openapi -->

### Response

```json
{
    "name": "产品需求调研表",
    "description": "感谢您能抽出几分钟时间填写以下内容，现在我们马上开始吧！",
    "fields": [
        {
            "field_1": {
                "label": "姓名",
                "type": "single_line_text",
                "notes": "",
                "private": false,
                "validation": {}
            },
        },
        {
            "field_2": {
                "label": "手机",
                "type": "mobile",
                "notes": "",
                "private": false,
                "validation": {}
            }
        }
    ],
    "setting": {
        "entry_submit_mode": "show_message",
        "success_message": "感谢您的反馈！",
        "success_redirect_url": "",
        "success_redirect_fields": [],
        "show_entry_on_success": false,
        "manually_close_rule": { "closed": false },
        "by_time_range_close_rule": null,
        "by_entries_close_rule": null,
        "show_close_count_down": false,
        "show_form_before_open": false,
        "fill_frequency": {
            "fill_type": "unlimited",
            "condition": "",
            "cycle_period": "every_day",
            "cycles_per_period": 1,
            "limited_time": 1,
            "limited_field_api_codes": []
        },
        "password_required": false,
        "access_password": null,
        "allowed_audience": "public",
        "entry_post_url": null,
        "post_new_entry": true,
        "post_updated_entry": false
    }
}
```

<!-- openapi:response getForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String |  |
| token | 是 | String |  |
| url | 是 | String | 表单对外填写地址（按企业账户的自定义域名 / 子域名生成，不能由 token 推算） |
| description | 是 | String / null | 表单描述（可能是 HTML 富文本） |
| fields | 是 | Array(Object) | 字段列表，按表单中的顺序排列；每个元素是以字段 api_code 为唯一键的对象 |
| fields[].\* | 否 | Object | 字段定义。所有字段都有 `label` / `api_code_alias` / `type` / `notes` / `private` / `validation`，其余属性按 `type` 出现。<br />`type` 取值与字段的对应关系：<br />type：字段<br />`single_line_text`：单行文字<br />`paragraph_text`：多行文字<br />`name` / `id_card` / `mobile` / `email` / `phone` / `link` / `address` / `geo_location`：姓名 / 身份证 / 手机 / 邮箱 / 电话 / 网址 / 地址 / 地理位置<br />`single_choice` / `multiple_choice` / `drop_down` / `cascade_drop_down`：单选 / 多选 / 下拉 / 多级下拉（颜色标记也是 `drop_down`）<br />`image_radio_button` / `image_check_box`：图片单选 / 图片多选<br />`number` / `formula` / `rating` / `nps` / `boolean`：数字 / 计算 / 评分 / NPS / 是否<br />`date_time` / `date` / `time`：日期 / 日期（旧）/ 时间<br />`attachment` / `audio` / `e_signature`：上传文件 / 语音 / 电子签名<br />`likert` / `matrix` / `matrix_scale` / `table` / `multiple_blanks` / `sort`：矩阵单选 / 矩阵填空 / 矩阵量表 / 表格 / 横向填空 / 排序<br />`goods` / `reservation`：商品 / 预约<br />`form_association` / `reversed_association`：表单关联 / 反向关联<br />详见[API V1 字段结构 Schema](/api_v1/schemas/field) |
| setting | 是 | Object | 表单设置；表单尚无设置时为空对象<br />详见[API V1 表单设置 Schema](/api_v1/schemas/form_setting) |
| theme | 否 | Object | 表单主题（`include_theme=true` 时出现）；结构同 `FormTheme`，但不含 `form_token`。表单没有主题时为空对象 |
| field_rules | 否 | Array(Object) | 字段显示规则（`include_field_rules=true` 时出现），同 `GET /forms/{form_token}/field_rules` 的 `data` |
| field_rules[].index | 是 | Integer | 0 起始位置，用于 PATCH /forms/\{form_token\} 更新或删除规则 |
| field_rules[].targets | 是 | Array(String) | 受控字段的 api_code；targets_display_mode 为 abort 时固定为 ["DYNAMIC_TARGETS"] |
| field_rules[].targets_display_mode | 是 | String | show 满足条件时显示目标字段；abort 满足条件时终止填写<br />可选值：`show`、`abort` |
| field_rules[].operator | 是 | String | 多个条件之间的逻辑关系<br />可选值：`or`、`and` |
| field_rules[].conditions | 是 | Array(Object) |  |
| field_rules[].conditions[].trigger | 是 | String | 触发字段 api_code |
| field_rules[].conditions[].comparator | 是 | String | equal 表示"包含任一"（历史原因）<br />可选值：`equal`、`none_in`、`between`、`like`、`not_like` |
| field_rules[].conditions[].value | 是 | Any | 条件值：选项 api_code 数组、数值范围 [min, max] 或文本，取决于触发字段类型 |
| extended_attributes | 否 | Array(Object) | 数据来源链接（`include_extended_attributes=true` 时出现），同 `GET /forms/{form_token}/extended_attributes` 的 `data` |
| extended_attributes[].value | 是 | String | 扩展属性值 |
| extended_attributes[].url | 是 | String | 携带该值的填写链接 |
| extended_attributes[].cname | 是 | Boolean | 链接是否使用自定义域名 |
| extended_attributes[].created_at | 是 | DateTime / null |  |
| transactions | 否 | Object | 收款统计，按交易状态分组（`include_transactions=true` 且表单绑定了收款账户时出现）。目前只有 `paid` 一组： 交易状态为已支付或退款中的数据，按订单总额累计（不扣除退款）；已退款与部分退款的数据不计入。这不是净收入报表。 金额为 0 不代表不是收款表单。 |
| transactions.paid | 是 | Object |  |
| transactions.paid.amount | 是 | Number | 该组数据的订单总额之和（元） |
| transactions.paid.count | 是 | Integer | 该组数据的条数 |

<!-- /openapi -->

> 字段详细数据，请[参考文档](/api_v1/schemas/field)
>
> **提示**：[创建表单](/api_v1/endpoints/create_form) / [编辑表单](/api_v1/endpoints/update_form) 成功时返回的响应体结构与本接口一致，因此写入后可以直接从响应中读到最新的 `setting`。如果只想单独读取表单设置，也可以调用 `GET /api/v1/forms/FORM_TOKEN/setting`。

### 状态码

<!-- openapi:status getForm -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 表单结构 |
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

http.get("https://jinshuju.net/api/v1/forms/${form_token}", headers)
```

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Postman

```
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN

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

public class GetFormService {

    public void run(String accessToken, String formToken) throws IOException {
        String authHeaderPayload = "Bearer " + accessToken;

        BufferedReader httpResponseReader = null;
        try {
            URL apiEndpointUrl = new URL("https://jinshuju.net/api/v1/forms/" + formToken);
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

api_endpoint_url = 'https://jinshuju.net/api/v1/forms/' + form_token

response = requests.get(api_endpoint_url, headers = {'Authorization': f'Bearer {access_token}'})

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

form_token = 'YOUR_FORM_TOKEN'

uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}")
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{access_token}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
