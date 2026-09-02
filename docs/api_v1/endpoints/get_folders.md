---
sidebar_custom_props:
  method: GET
sidebar_label: 获取文件夹列表
---

# v1 API 获取文件夹列表

> API使用者，可以通过本接口，获取自己可管理的文件夹列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取文件夹列表 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，只会返回当前用户具有 __管理员角色__ 的文件夹。
* 企业全局 API，返回企业 owner 可管理的文件夹。
* 用返回的 `token` 可以用于[创建表单](/api_v1/endpoints/create_form)、[复制表单](/api_v1/endpoints/copy_form)或[移动表单](/api_v1/endpoints/update_form_folder)。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/folders
GET https://jinshuju.net/api/v1/folders?limit=20
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| limit | 否 | Number | 返回条数上限，默认 50，最多 100 |

### Response

```json
{
    "total": 3,
    "count": 3,
    "data": [
        { "token": "xY9aB2", "name": "客户反馈", "created_at": "2026-04-01T10:23:11.000Z" },
        { "token": "pQ3kL7", "name": "内部调研", "created_at": "2026-03-28T08:15:02.000Z" },
        { "token": "m7NfZ1", "name": "活动报名", "created_at": "2026-03-20T14:02:55.000Z" }
    ]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| total | 是 | Number | 当前账号可管理的文件夹总数 |
| count | 是 | Number | 本次请求返回的文件夹数量 |
| data | 是 | Array | 文件夹信息数组 |
| data[].token | 是 | String | 文件夹 token |
| data[].name | 是 | String | 文件夹名称 |
| data[].created_at | 是 | DateTime | 文件夹创建时间 |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/folders

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'

response = requests.get(
    'https://jinshuju.net/api/v1/folders',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI.parse('https://jinshuju.net/api/v1/folders')
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{access_token}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
