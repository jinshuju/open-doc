---
sidebar_custom_props:
  method: PATCH
sidebar_label: 编辑测评设置
---

# v1 API 编辑测评设置

> API 使用者，可以通过本接口，修改测评场景表单的报告展示、维度与总分区间评语

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 编辑测评设置 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
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
* **只有传入的 key 会被更新**，未传的 key 保持原值。
* `evaluation_comments` 和 `indicator_setting.indicators` 都是 **REPLACE 语义**：传该字段会用新数组整体替换当前列表，因此每次都要传完整列表。
* **改维度务必先读**：更新已存在的维度时必须为每个维度回传它的 `api_code`（从[获取测评设置](/api_v1/endpoints/get_form_evaluation_setting)读出），否则会被当成新建维度，已提交数据的维度得分将失效。新增维度则不传 `api_code`。
* 维度绑定计分题有两种写法：`field_api_codes` 传已存在字段的 `api_code`；`field_cids` 传本次请求中新建字段的 `cid`（由服务端解析成 `api_code`）。引用不存在的 `cid` 返回 400 并指出是哪一个。
* `notice_after_filling_mode` 受套餐限制：当前套餐不支持测评报告时，无论传什么值都会被强制存为 `none`，请求仍返回 200 —— 响应体里是**实际存下来的值**。
* 也接受 `PUT` 方法，语义与 `PATCH` 相同。

## 接口描述

### Request

```
PATCH https://jinshuju.net/api/v1/forms/FORM_TOKEN/evaluation_setting

{
    "notice_after_filling_mode": "reports",
    "show_report_score": true,
    "show_report_radar": true,
    "need_attention": "请如实作答",
    "evaluation_comments": [
        { "start_point": 0, "end_point": 3, "comment": "待提升" },
        { "start_point": 4, "end_point": 6, "comment": "良好" }
    ],
    "indicator_setting": {
        "indicators_scoring_mode": "summation",
        "indicators": [
            {
                "api_code": "FqwV",
                "name": "沟通能力",
                "field_api_codes": ["field_1", "field_2"],
                "standard_score": 3,
                "indicator_comments": [
                    { "start_point": 0, "end_point": 3, "comment": "该维度偏弱" }
                ]
            }
        ]
    }
}
```

<!-- openapi:params updateEvaluationSetting -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| notice_after_filling_mode | 否 | String | 套餐不支持测评报告时会被强制写为 none<br />可选值：`reports`、`customize`、`none` |
| show_report_score | 否 | Boolean |  |
| show_report_radar | 否 | Boolean |  |
| show_indicator_comments | 否 | Boolean |  |
| show_comments | 否 | Boolean |  |
| need_attention | 否 | String |  |
| success_message_rich_text | 否 | String |  |
| evaluation_comments | 否 | Array(Object) | 整体替换总分区间评语；空数组关闭区间评语。区间评语需互不重叠 |
| evaluation_comments[].id | 否 | String | 按条件编写的评语的 id |
| evaluation_comments[].conditions | 否 | Array(Object) | 可原样传回，不可改动 |
| evaluation_comments[].conditions[].trigger | 否 | String |  |
| evaluation_comments[].conditions[].operator | 否 | String |  |
| evaluation_comments[].conditions[].value | 否 | Any | 条件值 |
| evaluation_comments[].conditions[].group_index | 否 | Integer |  |
| evaluation_comments[].start_point | 否 | Number |  |
| evaluation_comments[].end_point | 否 | Number |  |
| evaluation_comments[].comment | 否 | String |  |
| evaluation_comments[].retry | 否 | Boolean |  |
| indicator_setting | 否 | Object | 维度设置；indicators 整体替换 |
| indicator_setting.enabled | 否 | Boolean | 默认值：`true` |
| indicator_setting.indicators_scoring_mode | 否 | String | 可选值：`summation`、`average`、`customization`；默认值：`summation` |
| indicator_setting.indicators | 否 | Array(Object) | 数量：≤ 200 项 |
| indicator_setting.indicators[].api_code | 否 | String | 传回已有维度的 api_code 以保留其身份；新维度可省略 |
| indicator_setting.indicators[].name | 是 | String | 长度：≤ 20 个字符 |
| indicator_setting.indicators[].standard_score | 否 | Number |  |
| indicator_setting.indicators[].field_api_codes | 否 | Array(String) | 绑定的题目 api_code，必须是表单上可见的可计分题目 |
| indicator_setting.indicators[].field_cids | 否 | Array(String / Integer) | 也可用题目 cid 引用（可为数字或字符串） |
| indicator_setting.indicators[].indicator_comments | 否 | Array(Object) | 维度区间评语（不支持 retry）<br />数量：≤ 20 项 |
| indicator_setting.indicators[].indicator_comments[].start_point | 否 | Number |  |
| indicator_setting.indicators[].indicator_comments[].end_point | 否 | Number |  |
| indicator_setting.indicators[].indicator_comments[].comment | 否 | String |  |

<!-- /openapi -->

### Response

返回更新后的完整测评设置，结构同[获取测评设置](/api_v1/endpoints/get_form_evaluation_setting)。新增的维度会带上服务端生成的 `api_code`。

<!-- openapi:response updateEvaluationSetting -->

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

<!-- openapi:status updateEvaluationSetting -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 保存后的测评设置 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
PATCH https://jinshuju.net/api/v1/forms/$FORM_TOKEN/evaluation_setting

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"notice_after_filling_mode": "reports", "show_report_score": true}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

# 改维度前先读出当前的 api_code，回传以保持维度身份
current = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/evaluation_setting',
    headers={'Authorization': f'Bearer {access_token}'}
).json()
indicators = current.get('indicator_setting', {}).get('indicators', [])

response = requests.patch(
    f'https://jinshuju.net/api/v1/forms/{form_token}/evaluation_setting',
    headers={'Authorization': f'Bearer {access_token}'},
    json={
        'notice_after_filling_mode': 'reports',
        'show_report_score': True,
        'indicator_setting': {
            'indicators_scoring_mode': 'summation',
            'indicators': [
                {
                    'api_code': i['api_code'],
                    'name': i['name'],
                    'field_api_codes': i['field_api_codes'],
                    'standard_score': i.get('standard_score')
                }
                for i in indicators
            ]
        }
    }
)

print(response.text)
```
