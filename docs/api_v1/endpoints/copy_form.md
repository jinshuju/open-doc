---
sidebar_custom_props:
  method: POST
sidebar_label: 复制表单
---

# v1 API 复制表单

> API使用者，可以通过本接口，复制一个已有表单为新表单（继承样式、主题、字段）

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 复制表单 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 可以复制 __自己创建__ 的表单；或者复制开启了「允许公开复制」的他人表单。
* 可选地指定新表单的标题，以及放入某个文件夹。
* 仅复制表单结构和样式，不复制数据。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/copy

{
    "name": "产品需求调研表（副本）",
    "folder_token": "aZ9bQ3"
}
```

<!-- openapi:params copyForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| name | 否 | String | 新表单名称；省略时沿用服务端默认命名 |
| folder_token | 否 | String | 目标文件夹 token 或 id；省略则不放入文件夹 |

<!-- /openapi -->

### Response

成功时返回新建表单的完整结构（同[获取单个表单结构](/api_v1/endpoints/get_form)）。

<!-- openapi:response copyForm -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| name | 是 | String |  |
| token | 是 | String |  |
| url | 是 | String | 表单对外填写地址（按企业账户的自定义域名 / 子域名生成，不能由 token 推算） |
| description | 是 | String / null | 表单描述（可能是 HTML 富文本） |
| fields | 是 | Array(Object) | 字段列表，按表单中的顺序排列；每个元素是以字段 api_code 为唯一键的对象 |
| fields[].\* | 否 | Object | 字段定义。所有字段都有 `label` / `api_code_alias` / `type` / `notes` / `private` / `validation`，其余属性按 `type` 出现。<br />`type` 取值与字段的对应关系：<br />type：字段<br />`single_line_text`：单行文字<br />`paragraph_text`：多行文字<br />`name` / `id_card` / `mobile` / `email` / `phone` / `link` / `address` / `geo_location`：姓名 / 身份证 / 手机 / 邮箱 / 电话 / 网址 / 地址 / 地理位置<br />`single_choice` / `multiple_choice` / `drop_down` / `cascade_drop_down`：单选 / 多选 / 下拉 / 多级下拉（颜色标记也是 `drop_down`）<br />`image_radio_button` / `image_check_box`：图片单选 / 图片多选<br />`number` / `formula` / `rating` / `nps` / `boolean`：数字 / 计算 / 评分 / NPS / 是否<br />`date_time` / `date` / `time`：日期 / 日期（旧）/ 时间<br />`attachment` / `audio` / `e_signature`：上传文件 / 语音 / 电子签名<br />`likert` / `matrix` / `matrix_scale` / `table` / `multiple_blanks` / `sort`：矩阵单选 / 矩阵填空 / 矩阵量表 / 表格 / 横向填空 / 排序<br />`goods` / `reservation`：商品 / 预约<br />`form_association` / `reversed_association`：表单关联 / 反向关联<br />详见[API V1 字段结构 Schema](/api_v1/schemas/field) |
| setting | 是 | Object | 表单设置；表单尚无设置时为空对象<br />详见[API V1 表单设置 Schema](/api_v1/schemas/form_setting) |

<!-- /openapi -->

### 状态码

<!-- openapi:status copyForm -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 新建的表单 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | OAuth scope 不足（error_description 结构），或源表单/创建者被冻结（errors + status_code 结构） |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/copy

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "产品需求调研表（副本）",
  "folder_token": "aZ9bQ3"
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

response = requests.post(
    f'https://jinshuju.net/api/v1/forms/{form_token}/copy',
    headers={'Authorization': f'Bearer {access_token}'},
    json={"name": "产品需求调研表（副本）", "folder_token": "aZ9bQ3"}
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'
uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/copy")
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = { name: '产品需求调研表（副本）', folder_token: 'aZ9bQ3' }.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
