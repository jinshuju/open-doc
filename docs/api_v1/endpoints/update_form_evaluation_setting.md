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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| notice_after_filling_mode | 否 | String | 提交后展示：`reports` / `customize` / `none`。传入其他值返回 400 |
| show_report_score | 否 | Bool | 报告中是否显示测评得分 |
| show_report_radar | 否 | Bool | 报告中是否显示维度雷达图 |
| show_indicator_comments | 否 | Bool | 报告中是否显示各维度的结果分析与建议 |
| show_comments | 否 | Bool | 是否开启测评评语 |
| need_attention | 否 | String | 测评须知内容 |
| evaluation_comments | 否 | Array | 总分区间评语，**REPLACE 语义**；区间不得交叉 |
| indicator_setting | 否 | Object | 维度设置 |
| indicator_setting.indicators_scoring_mode | 否 | String | 维度得分算法：`summation`（默认）/ `average` |
| indicator_setting.indicators | 否 | Array | 维度列表，**REPLACE 语义** |
| indicator_setting.indicators[].api_code | 否 | String | 已存在维度的 `api_code`；**更新已有维度时必传**，新增维度不传 |
| indicator_setting.indicators[].name | 是 | String | 维度名称 |
| indicator_setting.indicators[].field_api_codes | 否 | Array(String) | 绑定的计分题 `api_code` 列表 |
| indicator_setting.indicators[].field_cids | 否 | Array(String) | 绑定的计分题 `cid` 列表（用于本次请求中新建的字段） |
| indicator_setting.indicators[].standard_score | 否 | Number | 维度标准分 |
| indicator_setting.indicators[].indicator_comments | 否 | Array | 该维度的分数区间评语 |

### Response

返回更新后的完整测评设置，结构同[获取测评设置](/api_v1/endpoints/get_form_evaluation_setting)。新增的维度会带上服务端生成的 `api_code`。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功 |
| 400 | 该表单不是测评场景的表单；或参数不合法（枚举值不支持、区间交叉、`field_cids` 指向不存在的字段等），错误详情见 `error_description` |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 表单不存在或无权访问 |

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
