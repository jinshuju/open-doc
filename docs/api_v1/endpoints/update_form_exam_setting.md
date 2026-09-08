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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| notice_after_filling_mode | 否 | String | 交卷后展示：`grade` / `explaination` / `answer` / `none`。传入其他值返回 400 |
| show_timeout | 否 | Bool | 是否开启限时答题 |
| limited_time | 否 | Number | 考试限时（分钟），默认 30；配合 `show_timeout` 使用 |
| need_attention | 否 | String | 考前须知内容 |
| interval_comments | 否 | Array | 分数区间评语，**REPLACE 语义**；传该字段即开启区间评语 |
| interval_comments[].start_point | 是 | Number | 分数区间左端（含） |
| interval_comments[].end_point | 是 | Number | 分数区间右端（含），必须 >= `start_point`，且不得与其他区间交叉 |
| interval_comments[].comment | 是 | String | 该区间展示的评语 |
| interval_comments[].retry | 否 | Bool | 该区间是否允许再答一次，默认 `false` |

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

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功 |
| 400 | 该表单不是考试场景的表单；或参数不合法（枚举值不支持、分数区间交叉等），错误详情见 `error_description` |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 表单不存在或无权访问 |

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
