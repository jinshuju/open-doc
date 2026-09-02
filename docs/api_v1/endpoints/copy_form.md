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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 源表单 Token（URL 路径参数） |
| name | 否 | String | 新表单的标题，默认在原标题前加 `[新]`，例如 `[新]问卷调查表` |
| folder_token | 否 | String | 目标文件夹 token；设置后新表单会放入该文件夹 |

### Response

成功时返回新建表单的完整结构（同[获取单个表单结构](/api_v1/endpoints/get_form)）。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 复制成功 |
| 400 | 复制过程中发生错误 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 源表单已被冻结，或其创建者已被冻结 |
| 404 | 源表单不存在；或用户无权复制；或指定的文件夹不存在/无权管理 |

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
