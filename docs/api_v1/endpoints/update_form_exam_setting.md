---
sidebar_custom_props:
  method: PATCH
sidebar_label: 编辑考试设置
---

# v1 API 编辑考试设置

> API 使用者，可以通过本接口，修改考试场景表单的考试专属设置

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 编辑考试设置 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
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
* **只有传入的 key 会被更新**，未传的 key 保持原值。
* `interval_comments` 例外，它是 **REPLACE 语义**：传该字段会用新数组整体替换当前的分数区间评语列表，因此每次都要传完整列表。
* 分数区间之间**不允许有交叉**，否则返回 400。
* `show_timeout` 与考试题目字段的 `required` 互斥：开启限时答题后，考试题目字段不能设为必填（考生信息字段不受影响）。
* `notice_after_filling_mode` 受套餐限制：当前套餐不支持「交卷后展示成绩」时，无论传什么值都会被强制存为 `none`，请求仍返回 200 —— 响应体里是**实际存下来的值**，可据此判断是否被降级。
* 也接受 `PUT` 方法，语义与 `PATCH` 相同。

## 接口描述

### Request

```
PATCH https://jinshuju.net/api/v1/forms/FORM_TOKEN/exam_setting

{
    "notice_after_filling_mode": "explaination",
    "show_timeout": true,
    "limited_time": 45,
    "need_attention": "闭卷，禁止查阅资料",
    "interval_comments": [
        { "start_point": 0, "end_point": 9, "comment": "需要补课", "retry": true },
        { "start_point": 10, "end_point": 20, "comment": "合格" }
    ]
}
```

<!-- openapi:params updateExamSetting -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| notice_after_filling_mode | 否 | String | 套餐不支持显示成绩时会被强制写为 none<br />可选值：`appreciation`、`grade`、`explaination`、`none`、`answer` |
| show_timeout | 否 | Boolean | 开启限时答题。与考试题目字段的 required 互斥：表单已有必填题目时传 true 返回 400；开启后题目字段不能再设必填（考生信息字段的必填不受影响） |
| limited_time | 否 | Integer | 限时分钟数<br />取值范围：1 ~ 9999 |
| need_attention | 否 | String |  |
| success_message_rich_text | 否 | String | 交卷后提示富文本；仅套餐支持显示成绩时写入 |
| interval_comments | 否 | Array(Object) | 整体替换区间评语；需互不重叠。仅 notice_after_filling_mode 为 grade / explaination / answer 时生效，空数组被忽略 |
| interval_comments[].start_point | 否 | Number |  |
| interval_comments[].end_point | 否 | Number | 不小于 start_point |
| interval_comments[].comment | 否 | String |  |
| interval_comments[].retry | 否 | Boolean |  |

<!-- /openapi -->

### Response

返回更新后的完整考试设置，结构同[获取考试设置](/api_v1/endpoints/get_form_exam_setting)。

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

<!-- openapi:response updateExamSetting -->

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

<!-- openapi:status updateExamSetting -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 保存后的考试设置 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
PATCH https://jinshuju.net/api/v1/forms/$FORM_TOKEN/exam_setting

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"notice_after_filling_mode": "grade", "show_timeout": true, "limited_time": 60}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

response = requests.patch(
    f'https://jinshuju.net/api/v1/forms/{form_token}/exam_setting',
    headers={'Authorization': f'Bearer {access_token}'},
    json={
        'notice_after_filling_mode': 'grade',
        'show_timeout': True,
        'limited_time': 60,
        'interval_comments': [
            {'start_point': 0, 'end_point': 59, 'comment': '不及格', 'retry': True},
            {'start_point': 60, 'end_point': 100, 'comment': '及格'}
        ]
    }
)

print(response.text)
```
