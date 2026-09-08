---
sidebar_custom_props:
  method: GET
sidebar_label: 获取考试设置
---

# v1 API 获取考试设置

> API 使用者，可以通过本接口，获取考试场景表单的考试专属设置

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取考试设置 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| 交卷后展示成绩/答案解析 | ❌ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 本接口只适用于**考试场景**的表单（创建时 `scene` 为 `exam`）。非考试场景的表单会返回 400。
* 考试设置与[表单设置](/api_v1/schemas/form_setting)是两组独立的设置：本接口只返回考试专属的那部分（交卷后展示、限时答题、考前须知、分数区间评语）。
* 表单尚未产生考试设置记录时返回空对象 `{}`。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/exam_setting
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |

### Response

```json
{
    "notice_after_filling_mode": "explaination",
    "show_timeout": true,
    "limited_time": 45,
    "need_attention": "闭卷，禁止查阅资料",
    "interval_comments": [
        { "start_point": 0.0, "end_point": 9.0, "comment": "需要补课", "retry": true },
        { "start_point": 10.0, "end_point": 20.0, "comment": "合格", "retry": false }
    ]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| notice_after_filling_mode | 是 | String | 交卷后展示：`grade` = 显示成绩；`explaination` = 成绩 + 答案解析；`answer` = 仅展示对错；`none` = 不显示。当前套餐不支持时该值恒为 `none` |
| show_timeout | 否 | Bool | 是否开启限时答题 |
| limited_time | 否 | Number | 考试限时（分钟），配合 `show_timeout` 生效 |
| need_attention | 否 | String | 考前须知内容 |
| interval_comments | 否 | Array | 分数区间评语；未开启区间评语时不返回该字段 |
| interval_comments[].start_point | 是 | Number | 分数区间左端（含） |
| interval_comments[].end_point | 是 | Number | 分数区间右端（含） |
| interval_comments[].comment | 是 | String | 该区间展示的评语 |
| interval_comments[].retry | 否 | Bool | 该区间是否允许再答一次 |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 400 | 该表单不是考试场景的表单 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 表单不存在或无权访问 |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/exam_setting

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/exam_setting',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
