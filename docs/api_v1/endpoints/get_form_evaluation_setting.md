---
sidebar_custom_props:
  method: GET
sidebar_label: 获取测评设置
---

# v1 API 获取测评设置

> API 使用者，可以通过本接口，获取测评场景表单的测评专属设置（报告展示、维度、总分区间评语）

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取测评设置 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| 提交后展示测评报告 | ❌ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 本接口只适用于**测评场景**的表单（创建时 `scene` 为 `evaluation`）。非测评场景的表单会返回 400。
* 维度（`indicator_setting.indicators`）每一项都带 `api_code`。**修改已有维度时必须回传这个 `api_code`**，否则会被当作新建维度，已提交数据的维度得分将失效 —— 所以改维度前先用本接口读出来。
* 表单尚未产生测评设置记录时返回空对象 `{}`。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/evaluation_setting
```

<!-- openapi:params getEvaluationSetting -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |

<!-- /openapi -->

### Response

```json
{
    "notice_after_filling_mode": "reports",
    "show_report_score": true,
    "show_report_radar": true,
    "show_indicator_comments": true,
    "show_comments": true,
    "need_attention": "请如实作答",
    "evaluation_comments": [
        { "start_point": 0.0, "end_point": 3.0, "comment": "待提升", "retry": false },
        { "start_point": 4.0, "end_point": 6.0, "comment": "良好", "retry": false }
    ],
    "indicator_setting": {
        "indicators_scoring_mode": "summation",
        "indicators": [
            {
                "api_code": "FqwV",
                "name": "沟通能力",
                "field_api_codes": ["field_1"],
                "standard_score": 3.0,
                "indicator_comments": []
            }
        ]
    }
}
```

<!-- openapi:response getEvaluationSetting -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| notice_after_filling_mode | 否 | String | 提交后展示内容<br />可选值：`reports`、`customize`、`none` |
| show_report_score | 否 | Boolean | 报告中显示总分 |
| show_report_radar | 否 | Boolean | 报告中显示雷达图 |
| show_indicator_comments | 否 | Boolean | 报告中显示维度评语 |
| show_comments | 否 | Boolean | 报告中显示总分评语 |
| need_attention | 否 | String | 测评须知 |
| evaluation_comments | 否 | Array(Object) | 总分区间评语；仅在已开启时返回 |
| evaluation_comments[].start_point | 否 | Number |  |
| evaluation_comments[].end_point | 否 | Number |  |
| evaluation_comments[].comment | 否 | String |  |
| evaluation_comments[].retry | 否 | Boolean |  |
| evaluation_comments[].id | 否 | String | 按条件编写的评语的 id；更新时按此 id 传回 |
| evaluation_comments[].conditions | 否 | Array(Object) | 按条件编写的评语的判定条件 |
| evaluation_comments[].conditions[].trigger | 否 | String | 条件字段 api_code |
| evaluation_comments[].conditions[].operator | 否 | String | 比较操作符 |
| evaluation_comments[].conditions[].value | 否 | Any | 条件值 |
| evaluation_comments[].conditions[].group_index | 否 | Integer |  |
| indicator_setting | 否 | Object | 维度设置；仅在存在维度时返回 |
| indicator_setting.indicators_scoring_mode | 否 | String | 维度计分方式<br />可选值：`summation`、`average`、`customization` |
| indicator_setting.indicators | 否 | Array(Object) |  |
| indicator_setting.indicators[].api_code | 否 | String | 维度标识，数据中的维度得分存于 indicator_&lt;api_code> |
| indicator_setting.indicators[].name | 否 | String |  |
| indicator_setting.indicators[].field_api_codes | 否 | Array(String) |  |
| indicator_setting.indicators[].standard_score | 否 | Number | 标准分；为 null 时省略 |
| indicator_setting.indicators[].indicator_comments | 否 | Array(Object) | 一条分数区间评语；值为 null 的键会被省略 |
| indicator_setting.indicators[].indicator_comments[].start_point | 否 | Number | 区间起点（含） |
| indicator_setting.indicators[].indicator_comments[].end_point | 否 | Number | 区间终点（含），不小于 start_point |
| indicator_setting.indicators[].indicator_comments[].comment | 否 | String | 评语内容（富文本） |
| indicator_setting.indicators[].indicator_comments[].retry | 否 | Boolean | 是否允许重新作答 |

<!-- /openapi -->

### 状态码

<!-- openapi:status getEvaluationSetting -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 测评设置（可能为空对象） |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/evaluation_setting

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
    f'https://jinshuju.net/api/v1/forms/{form_token}/evaluation_setting',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
