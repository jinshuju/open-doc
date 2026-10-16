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
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| primary_color | 否 | String | 主色（hex） |
| secondary_color | 否 | String | 次色（hex） |
| wallpaper | 否 | Object | 页面背景设置 |
| wallpaper.background_color | 否 | String | 页面背景色（hex） |
| wallpaper.background_image_url | 否 | String | 背景图 URL，由服务端抓取 |
| wallpaper.background_image_upload_token | 否 | String | 「上传表单图片」的 `form_image_token`（用途 wallpaper），优先级最高 |
| wallpaper.background_image_attachment_id | 否 | String / null | 「上传表单图片」返回的 `attachment_id`；传 `""` 移除背景图，优先级最低 |
| header | 否 | Object | 顶部 banner 设置 |
| header.type | 否 | String | banner 展示类型：`none` / `text` / `image` / `carousel` |
| header.text | 否 | String | banner 文字（`type=text` 时生效） |
| header.background_color | 否 | String | banner 背景色（hex） |
| header.text_style | 否 | Object | banner 文字样式 |
| header.text_style.\* | 否 | String | 键为样式名（下划线命名，如 `font_size`），值为样式值 |
| header.header_image_url | 否 | String | 外链图片 URL，服务端会下载为附件 |
| header.header_image_base64 | 否 | String | Base64 编码的图片，不建议使用（可能被截断） |
| header.header_image_upload_token | 否 | String | 「上传表单图片」的 `form_image_token`（用途 header），优先级最高 |
| header.carousel_images | 否 | Array(Object) | 轮播图，1 ~ 5 张，整体替换；每项三种来源选其一 |
| header.carousel_images[].image_upload_token | 否 | String | 「上传表单图片」的 `form_image_token`（用途 carousel） |
| header.carousel_images[].image_url | 否 | String | 轮播图 URL，由服务端抓取 |
| header.carousel_images[].attachment_id | 否 | String | 该表单已有轮播图的 `attachment_id`，用于保留该图 |
| header.header_image_attachment_id | 否 | String / null | 「上传表单图片」返回的 `attachment_id`；传 `""` 移除头图，优先级最低 |
| typography | 否 | Object | 字体样式，与现有样式合并 |
| typography.form_header | 否 | Object | 表单标题文字样式 |
| typography.form_header.\* | 否 | String | 键为样式名（下划线命名，如 `font_size`），值为样式值 |
| typography.field_label | 否 | Object | 字段 label 样式 |
| typography.field_label.\* | 否 | String | 键为样式名（下划线命名，如 `font_size`），值为样式值 |
| typography.choice_style | 否 | Object | 选项文字样式 |
| typography.choice_style.\* | 否 | String | 键为样式名（下划线命名，如 `font_size`），值为样式值 |
| form_container | 否 | Object | 表单容器样式 |
| form_container.background_color | 否 | String | 表单容器背景色（hex） |
| form_container.border_color | 否 | String | 表单容器边框颜色，如 `#E5E7EB` |
| form_container.border_width | 否 | String | 表单容器边框宽度，如 `1px` |
| submit_button | 否 | Object | 提交按钮样式 |
| submit_button.background_color | 否 | String | 提交按钮背景色（hex） |
| submit_button.color | 否 | String | 提交按钮文字颜色（hex） |
| submit_button.font_size | 否 | String | 提交按钮字号 |
| generate_header_image | 否 | Object | 启用 AI 生成 header 图 |
| generate_header_image.prompt | 否 | String | 自定义图片提示词；不传则基于表单内容自动生成 |

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
| form_token | 是 | String | 表单 Token |
| primary_color | 是 | String / null | 当前主色 |
| secondary_color | 是 | String / null | 当前次色 |
| wallpaper | 是 | Object | 页面背景当前状态 |
| wallpaper.background_color | 否 | String / null | 页面背景色（hex） |
| wallpaper.has_background_image | 否 | Boolean | 是否有背景图 |
| wallpaper.background_image_url | 否 | String / null | 背景图 URL；无背景图时为 null |
| header | 是 | Object | banner 当前状态，含是否有 header 图 |
| header.type | 否 | String / null | banner 展示类型：`none` / `text` / `image` / `carousel` |
| header.text | 否 | String / null | banner 文字（`type=text` 时生效） |
| header.text_style | 否 | Object / null | banner 文字样式，键为 CSS 连字符命名（如 `font-size`） |
| header.background_color | 否 | String / null | banner 背景色（hex） |
| header.has_header_image | 否 | Boolean | 是否有头图 |
| header.header_image_url | 否 | String / null | 头图 URL；无头图时为 null |
| header.carousel_images | 否 | Array(Object) | 轮播图，按展示顺序排列 |
| header.carousel_images[].attachment_id | 是 | String | 轮播图的 `attachment_id`，更新时传回可保留该图 |
| header.carousel_images[].image_url | 是 | String | 轮播图 URL |
| typography | 是 | Object | 表单排版当前状态，样式以 CSS 命名（font-size / font-weight / color / text-align） |
| typography.form_header | 否 | Object / null | 表单标题文字样式 |
| typography.field_label | 否 | Object / null | 字段 label 样式 |
| typography.choice_style | 否 | Object / null | 选项文字样式 |
| typography.field_space | 否 | String / null | 字段间距 |
| form_container | 是 | Object | 表单容器当前状态 |
| form_container.background_color | 否 | String / null | 表单容器背景色（hex） |
| form_container.max_width | 否 | String / null | 表单容器最大宽度 |
| form_container.border_color | 否 | String / null | 表单容器边框颜色，如 `#E5E7EB` |
| form_container.border_width | 否 | String / null | 表单容器边框宽度，如 `1px` |
| form_container.shadow | 否 | Boolean | 表单容器是否显示阴影 |
| form_container.indent_on_large_phone | 否 | Boolean | 大屏手机上表单容器是否缩进 |
| submit_button | 是 | Object | 提交按钮当前状态 |
| submit_button.background_color | 否 | String / null | 提交按钮背景色（hex） |
| submit_button.color | 否 | String / null | 提交按钮文字颜色（hex） |
| submit_button.font_size | 否 | String / null | 提交按钮字号 |
| submit_button.shadow | 否 | Boolean | 提交按钮是否显示阴影 |
| submit_button.hidden | 否 | Boolean | 是否隐藏提交按钮 |

<!-- /openapi -->

### 状态码

<!-- openapi:status updateFormTheme -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功 |
| 400 | 未指定任何主题操作；主题保存校验失败 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API；或者 AI 点数不足 |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单不存在或无权访问 |

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
