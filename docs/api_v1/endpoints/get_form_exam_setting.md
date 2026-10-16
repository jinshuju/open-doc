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

<!-- openapi:params getExamSetting -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |

<!-- /openapi -->

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

<!-- openapi:response getExamSetting -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| notice_after_filling_mode | 否 | String | 交卷后展示内容<br />可选值：`appreciation`、`grade`、`explaination`、`none`、`answer` |
| show_timeout | 否 | Boolean | 是否限时答题 |
| limited_time | 否 | Integer | 限时分钟数 |
| need_attention | 否 | String | 考前须知 |
| interval_comments | 否 | Array(Object) | 分数区间评语；仅在已开启区间评语时返回 |
| interval_comments[].start_point | 否 | Number | 区间起点（含） |
| interval_comments[].end_point | 否 | Number | 区间终点（含），不小于 start_point |
| interval_comments[].comment | 否 | String | 评语内容（富文本） |
| interval_comments[].retry | 否 | Boolean | 是否允许重新作答 |

<!-- /openapi -->

### 状态码

<!-- openapi:status getExamSetting -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 考试设置（可能为空对象） |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

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
