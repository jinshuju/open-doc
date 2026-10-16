---
sidebar_custom_props:
  method: PATCH
sidebar_label: 编辑表单主题
---

# v1 API 编辑表单主题

> API使用者，可以通过本接口，修改表单的视觉主题（颜色、壁纸、header、字体、表单容器、提交按钮），或通过 AI 生成 header 图

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 编辑表单主题 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 个人版用户/企业子账号用户，只可以编辑 __自己创建__ 的表单主题。
* 企业全局 API，可以编辑整个企业所有的表单主题。
* `typography` / `form_container` / `submit_button` 的样式是**合并**而非覆盖，只传你要改的字段即可。
* 传入 `generate_header_image` 可自动调用 AI 生成头图并应用，需消耗 AI 点数。
* 至少要传一个主题操作，否则返回 400。

## 接口描述

### Request

```
PATCH https://jinshuju.net/api/v1/forms/FORM_TOKEN/theme

{
    "primary_color": "#FBBF24",
    "secondary_color": "#FDE68A",
    "wallpaper": { "background_color": "#FFFBEB" },
    "header": {
        "type": "text",
        "text": "2026 Q2 客户满意度调研",
        "text_style": {
            "font_size": "24px",
            "font_weight": "bold",
            "color": "#111827",
            "text_align": "center"
        },
        "background_color": "#FEF3C7"
    },
    "typography": {
        "form_header":  { "font_size": "32px", "color": "#B45309", "text_align": "center" },
        "field_label":  { "font_size": "14px", "color": "#92400E" },
        "choice_style": { "color": "#78350F" }
    },
    "form_container": { "background_color": "#FFFFFF" },
    "submit_button": {
        "background_color": "#F59E0B",
        "color": "#FFFFFF",
        "font_size": "16px"
    },
    "generate_header_image": { "prompt": "温暖的秋季山景，扁平插画风" }
}
```

<!-- openapi:params updateFormTheme -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| primary_color | 否 | String | 主色，如 "#FBBF24" |
| secondary_color | 否 | String | 辅色 |
| wallpaper | 否 | Object | 页面背景 |
| wallpaper.background_color | 否 | String |  |
| wallpaper.background_image_url | 否 | String | 服务端抓取该 URL 作为背景图 |
| wallpaper.background_image_upload_token | 否 | String | 「上传表单图片」使用的 `form_image_token`，图片用途须为 wallpaper；优先于 background_image_url |
| wallpaper.background_image_attachment_id | 否 | String / null | 「上传表单图片」（image_type=wallpaper）返回的 attachment_id；传空字符串移除当前背景图。优先级低于 background_image_upload_token / background_image_url |
| header | 否 | Object | 表头 |
| header.type | 否 | String | 可选值：`none`、`text`、`image`、`carousel` |
| header.text | 否 | String | 表头文字 |
| header.background_color | 否 | String |  |
| header.text_style | 否 | Object | 文字样式，键使用下划线（如 font_size、text_align），与现有样式合并 |
| header.text_style.\* | 否 | String | 其他键 |
| header.header_image_url | 否 | String | 服务端抓取该 URL 作为头图 |
| header.header_image_base64 | 否 | String | base64 编码的头图；优先于 header_image_url |
| header.header_image_upload_token | 否 | String | 「上传表单图片」使用的 `form_image_token`，图片用途须为 header；优先级最高 |
| header.carousel_images | 否 | Array(Object) | 轮播图，整体替换，按数组顺序展示<br />数量：1 ~ 5 项 |
| header.carousel_images[].image_upload_token | 否 | String | 「上传表单图片」使用的 `form_image_token`，图片用途须为 carousel |
| header.carousel_images[].image_url | 否 | String |  |
| header.carousel_images[].attachment_id | 否 | String | 保留该表单已有的轮播图 |
| header.header_image_attachment_id | 否 | String / null | 「上传表单图片」（image_type=header）返回的 attachment_id；传空字符串移除当前头图。优先级最低；未指定 header.type 时自动设为 image |
| typography | 否 | Object | 字体样式；各项键使用下划线并与现有样式合并 |
| typography.form_header | 否 | Object |  |
| typography.form_header.\* | 否 | String | 其他键 |
| typography.field_label | 否 | Object |  |
| typography.field_label.\* | 否 | String | 其他键 |
| typography.choice_style | 否 | Object |  |
| typography.choice_style.\* | 否 | String | 其他键 |
| form_container | 否 | Object |  |
| form_container.background_color | 否 | String |  |
| form_container.border_color | 否 | String | 表单容器边框颜色，如 "#E5E7EB" |
| form_container.border_width | 否 | String | 表单容器边框宽度，如 "1px" |
| submit_button | 否 | Object |  |
| submit_button.background_color | 否 | String |  |
| submit_button.color | 否 | String |  |
| submit_button.font_size | 否 | String | 如 "16px" |
| generate_header_image | 否 | Object | 调用 AI 生成头图并设置为 header 图片；消耗 AI 点数 |
| generate_header_image.prompt | 否 | String | 生成提示词；省略时由 AI 根据表单内容生成 |

<!-- /openapi -->

### Response

```json
{
    "form_token": "a1B2c3",
    "primary_color": "#FBBF24",
    "secondary_color": "#FDE68A",
    "wallpaper": {
        "background_color": "#FFFBEB",
        "has_background_image": false,
        "background_image_url": null
    },
    "header": {
        "type": "image",
        "text": null,
        "text_style": {},
        "background_color": "#FEF3C7",
        "has_header_image": true,
        "header_image_url": "https://..."
    },
    "typography": { "form_header": {}, "field_label": {}, "choice_style": {}, "field_space": null },
    "form_container": { "background_color": "#FFFFFF", "max_width": null, "border_color": null, "border_width": null, "shadow": null, "indent_on_large_phone": false },
    "submit_button": { "background_color": "#F59E0B", "color": "#FFFFFF", "font_size": "16px", "shadow": null, "hidden": false }
}
```

<!-- openapi:response updateFormTheme -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form_token | 是 | String |  |
| primary_color | 是 | String / null |  |
| secondary_color | 是 | String / null |  |
| wallpaper | 是 | Object |  |
| wallpaper.background_color | 否 | String / null |  |
| wallpaper.has_background_image | 否 | Boolean |  |
| wallpaper.background_image_url | 否 | String / null |  |
| header | 是 | Object |  |
| header.type | 否 | String / null | 可选值：`none`、`text`、`image`、`carousel` |
| header.text | 否 | String / null |  |
| header.text_style | 否 | Object / null | CSS 连字符键 |
| header.background_color | 否 | String / null |  |
| header.has_header_image | 否 | Boolean |  |
| header.header_image_url | 否 | String / null |  |
| header.carousel_images | 否 | Array(Object) |  |
| header.carousel_images[].attachment_id | 是 | String |  |
| header.carousel_images[].image_url | 是 | String |  |
| typography | 是 | Object |  |
| typography.form_header | 否 | Object / null |  |
| typography.field_label | 否 | Object / null |  |
| typography.choice_style | 否 | Object / null |  |
| typography.field_space | 否 | String / null |  |
| form_container | 是 | Object |  |
| form_container.background_color | 否 | String / null |  |
| form_container.max_width | 否 | String / null |  |
| form_container.border_color | 否 | String / null |  |
| form_container.border_width | 否 | String / null |  |
| form_container.shadow | 否 | Boolean |  |
| form_container.indent_on_large_phone | 否 | Boolean |  |
| submit_button | 是 | Object |  |
| submit_button.background_color | 否 | String / null |  |
| submit_button.color | 否 | String / null |  |
| submit_button.font_size | 否 | String / null |  |
| submit_button.shadow | 否 | Boolean |  |
| submit_button.hidden | 否 | Boolean |  |

<!-- /openapi -->

### 状态码

<!-- openapi:status updateFormTheme -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 保存后的主题 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
PATCH https://jinshuju.net/api/v1/forms/$FORM_TOKEN/theme

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "primary_color": "#FBBF24",
  "wallpaper": { "background_color": "#FFFBEB" }
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

response = requests.patch(
    f'https://jinshuju.net/api/v1/forms/{form_token}/theme',
    headers={'Authorization': f'Bearer {access_token}'},
    json={
        "primary_color": "#FBBF24",
        "wallpaper": {"background_color": "#FFFBEB"}
    }
)

print(response.text)
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

form_token = 'YOUR_FORM_TOKEN'
uri = URI.parse("https://jinshuju.net/api/v1/forms/#{form_token}/theme")
access_token = 'YOUR_ACCESS_TOKEN'

request = Net::HTTP::Patch.new(uri, 'Content-Type' => 'application/json')
request['Authorization'] = "Bearer #{access_token}"
request.body = {
  primary_color: '#FBBF24',
  wallpaper: { background_color: '#FFFBEB' }
}.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts(response.body)
```
