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
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |

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
| notice_after_filling_mode | 否 | String | 提交后展示：`reports` = 显示测评报告；`customize` = 自定义样式；`none` = 不显示。当前套餐不支持时该值恒为 `none` |
| show_report_score | 否 | Boolean | 报告中是否显示测评得分 |
| show_report_radar | 否 | Boolean | 报告中是否显示维度雷达图（需配置维度） |
| show_indicator_comments | 否 | Boolean | 报告中是否显示各维度的结果分析与建议 |
| show_comments | 否 | Boolean | 是否开启测评评语 |
| need_attention | 否 | String | 测评须知内容 |
| evaluation_comments | 否 | Array([EvaluationComment](#evaluationcomment)) | 总分区间评语；未开启时不返回该字段。按条件编写的评语以 `id` + `conditions` 代替区间 |
| indicator_setting | 否 | Object | 维度设置；未配置任何维度时不返回该字段 |
| indicator_setting.indicators_scoring_mode | 否 | String | 维度得分算法：`summation` = 求和；`average` = 平均；`customization` = 自定义公式 |
| indicator_setting.indicators | 否 | Array(Object) | 维度列表 |
| indicator_setting.indicators[].api_code | 否 | String | 维度 `api_code`；**修改维度时必须回传**以保持身份 |
| indicator_setting.indicators[].name | 否 | String | 维度名称 |
| indicator_setting.indicators[].field_api_codes | 否 | Array(String) | 该维度绑定的计分题 `api_code` 列表 |
| indicator_setting.indicators[].standard_score | 否 | Number | 维度标准分（雷达图参考值） |
| indicator_setting.indicators[].indicator_comments | 否 | Array([IntervalComment](#intervalcomment)) | 该维度的分数区间评语，无则返回空数组 |

<!-- /openapi -->

### 状态码

<!-- openapi:status getEvaluationSetting -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 400 | 该表单不是测评场景的表单 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单不存在或无权访问 |

<!-- /openapi -->

## 数据类型

<!-- openapi:types -->

### EvaluationComment

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| start_point | 否 | Number | 分数区间左端（含） |
| end_point | 否 | Number | 分数区间右端（含） |
| comment | 否 | String | 评语内容（富文本） |
| retry | 否 | Boolean | 是否允许再答一次 |
| id | 否 | String | 按条件编写的评语 id，更新时须原样传回 |
| conditions | 否 | Array(Object) | 按条件编写的评语的判定条件 |
| conditions[].trigger | 否 | String | 条件字段的 `api_code` |
| conditions[].operator | 否 | String | 比较运算符 |
| conditions[].value | 否 | Any | 条件值 |
| conditions[].group_index | 否 | Integer | 条件分组序号 |

### IntervalComment

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| start_point | 否 | Number | 分数区间左端（含） |
| end_point | 否 | Number | 分数区间右端（含） |
| comment | 否 | String | 该区间展示的评语 |
| retry | 否 | Boolean | 该区间是否允许再答一次 |

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
