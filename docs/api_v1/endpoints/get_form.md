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
| FORM_TOKEN | 是 | String | 表单Token |
| include_analytics | 否 | Boolean | 为 `true` 时，可统计的字段返回 `analytics` |
| include_theme | 否 | Boolean | 为 `true` 时返回 `theme`（表单主题） |
| include_field_rules | 否 | Boolean | 为 `true` 时返回 `field_rules`（字段显示规则） |
| include_extended_attributes | 否 | Boolean | 为 `true` 时返回 `extended_attributes`（数据来源链接） |
| include_transactions | 否 | Boolean | 为 `true` 时，绑定了收款账户的表单返回 `transactions` |

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
| name | 是 | String | 表单标题 |
| token | 是 | String | 表单 Token |
| url | 是 | String | 表单的公开填写链接，不能用 token 自行拼接 |
| description | 是 | String / null | 表单描述 |
| fields | 是 | Array([FieldMap](#fieldmap)) | 表单字段数据 |
| setting | 是 | [FormSetting](/api_v1/schemas/form_setting) | 表单设置对象；字段列表与含义见[表单设置 Schema](/api_v1/schemas/form_setting)。未启用的嵌套规则（如 `by_time_range_close_rule`）以 `null` 返回。 |
| theme | 否 | Object | 表单主题；仅 `include_theme=true` 时返回 |
| field_rules | 否 | Array([FieldRule](#fieldrule)) | 字段显示规则；仅 `include_field_rules=true` 时返回 |
| extended_attributes | 否 | Array([ExtendedAttribute](#extendedattribute)) | 数据来源链接；仅 `include_extended_attributes=true` 时返回 |
| transactions | 否 | [FormTransactions](#formtransactions) | 收款统计；仅 `include_transactions=true` 且表单绑定了收款账户时返回 |

<!-- /openapi -->

> 字段详细数据，请[参考文档](/api_v1/schemas/field)
>
> **提示**：[创建表单](/api_v1/endpoints/create_form) / [编辑表单](/api_v1/endpoints/update_form) 成功时返回的响应体结构与本接口一致，因此写入后可以直接从响应中读到最新的 `setting`。如果只想单独读取表单设置，也可以调用 `GET /api/v1/forms/FORM_TOKEN/setting`。

### 状态码

<!-- openapi:status getForm -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单不存在或无权访问 |
| 429 | 超过请求速率限制 |

<!-- /openapi -->

## 数据类型

<!-- openapi:types -->

### FieldMap

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| \* | 否 | [FieldDefinition](/api_v1/schemas/field) | 键为字段的 `api_code`，值为字段定义 |
| \*.label | 是 | String | 字段标题 |
| \*.type | 是 | String | 字段类型 |
| \*.notes | 是 | String / null | 字段提示 |
| \*.private | 是 | Boolean | 字段隐藏 |
| \*.validation | 是 | [FieldValidation](#fieldvalidation) | 字段校验信息 |

### FieldRule

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| index | 是 | Integer | 规则的 0 起序号；[编辑表单](/api_v1/endpoints/update_form)按此值定位要更新/删除的规则 |
| targets | 是 | Array(String) | 条件满足时显示的字段 `api_code`；`abort` 时固定为 `["DYNAMIC_TARGETS"]` |
| targets_display_mode | 是 | String | `show` = 条件满足时显示 `targets` 中的字段；`abort` = 条件满足时终止填写（隐藏后续所有字段） |
| operator | 是 | String | 多个条件之间的关系：`and` = 全部满足；`or` = 任一满足 |
| conditions | 是 | Array(Object) | 触发条件数组 |
| conditions[].trigger | 是 | String | 触发字段的 `api_code` |
| conditions[].comparator | 是 | String | 比较符，取值取决于触发字段类型，见[比较符对照表](/api_v1/endpoints/get_form_field_rules#comparators) |
| conditions[].value | 是 | Any | 比较值，形态取决于 `comparator` |

### ExtendedAttribute

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| value | 是 | String | 扩展属性值 |
| url | 是 | String | 带有该属性值的填写链接 |
| cname | 是 | Boolean | 链接是否使用自定义域名 |
| created_at | 是 | DateTime / null | 创建时间 |

### FormTransactions

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| paid | 是 | Object | 已支付和退款中的数据统计，金额不扣除退款 |
| paid.amount | 是 | Number | 订单总额之和，单位：元 |
| paid.count | 是 | Integer | 数据条数 |

### FieldValidation

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| required | 否 | Boolean | 是否必填 |
| unique | 否 | Boolean | 是否不能与已有数据重复 |
| white_list_limit | 否 | Boolean | 是否开启白名单限制 |
| access_control_list_limit | 否 | Boolean | 是否开启「白名单」「黑名单」限制 |
| access_control_type | 否 | String | 名单类型：`white` / `black` |
| white_list_values | 否 | Array(String) | 白名单取值（单行文字 / 手机） |
| acl_values | 否 | Array(String) | 名单取值（单行文字 / 手机） |
| min_selected | 否 | Integer | 最少选几项（多选 / 图片多选 / 排序） |
| max_selected | 否 | Integer | 最多选几项（多选 / 图片多选 / 排序） |
| minimum_length | 否 | Integer | 最少多少字（文本类字段） |
| maximum_length | 否 | Integer | 最多多少字（文本类字段） |
| min | 否 | Number | 最小值（数字字段） |
| max | 否 | Number | 最大值（数字字段） |
| start | 否 | String | 最早日期（日期字段） |
| end | 否 | String | 最晚日期（日期字段） |
| \* | 否 | Any | 其他字段类型特有的校验规则，见[字段结构](/api_v1/schemas/field) |

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
