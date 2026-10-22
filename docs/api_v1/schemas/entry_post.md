# API V1 数据结构 Schema (POST)

通过 API [新增单条数据](/api_v1/endpoints/create_form_entry)、[批量新增数据](/api_v1/endpoints/create_form_entries)或[修改数据](/api_v1/endpoints/update_form_entry)时，提交的数据是一个以字段 `api_code` 为键的对象：

```json
{
    "field_1": "VALUE 1",
    "field_2": "VALUE 2",
    "field_3": "VALUE 3"
    // 其他字段
}
```

## 通用规则

* 键是字段的 `api_code`（设置了别名的字段也可以用 `api_code_alias`），可以通过[获取表单结构](/api_v1/endpoints/get_form)接口查到。
* 接口不认识的键会被忽略，不报错。只有当请求里**没有任何**能写入的键时才返回 `400`，`error_description` 会指出是哪个键有问题，例如 `Entry attributes cannot be empty: field_99 is not a field of this form.`
* 「电子签名」「计算字段」不能通过 API 写入，传了会被忽略。
* 表单设置的「字段规则」「必填」「不能重复」「选项配额」等校验依然生效。校验失败返回 `400`，`error_description` 是 `{"field_1": ["错误原因"]}` 这样的 JSON 字符串。
* 选项类字段的值可以传选项的 `api_code`，也可以传选项的显示值；同名选项取第一个。单选、多选、下拉框的值两者都对不上时返回 `400`：`Invalid value or code for field_1`；多级下拉框对不上的层级会被置空。
* 「其他」选项填写框里的内容和「选项补充文字」是两个不同的功能，用不同的键传入，见[单项选择](#单项选择)。

## 字段详解

### 单行文字

```json
{
    "field_1": "字符串"
}
```

### 多行文字

```json
{
    "field_1": "第一行\n第二行"    // `\n` 为换行符
}
```

### 单项选择

```json
{
    "field_1": "API_CODE"    // 选项的 api_code，可以通过 get form 获取
}
```

或者

```json
{
    "field_1": "选项 A"    // 选项的显示值，同名选项取第一个
}
```

#### 「其他」选项

选中「其他」选项（字段结构里 `is_other: true` 的选项）时，填写框里的内容通过 `字段 api_code` 加 `_other` 后缀传入：

```json
{
    "field_1": "其他",                   // 「其他」选项的显示值或 api_code
    "field_1_other": "填写框里的内容"    // 最长 300 字
}
```

> `field_1_other` 只在 `field_1` 选中了「其他」选项时才会保存，否则被忽略。\
> 读取数据时，这一项返回为「其他: 填写框里的内容」。

#### 选项补充文字

某个选项在编辑器里开启了「允许填写补充文字」（字段结构里 `allow_extended_text: true` 的选项）时，补充文字通过 `字段 api_code` 加 `_extended_text` 后缀传入，是一个以选项为键的对象：

```json
{
    "field_1": "API_CODE",
    "field_1_extended_text": {
      "API_CODE": "补充文字"    // 键为选项的 api_code
    }
}
```

> 只有表单里至少有一个选项开启了补充文字，接口才认识 `field_1_extended_text`；否则这个键会被忽略。「其他」选项的填写框不是补充文字，要用 `field_1_other`。\
> 只会保存已选中、且开启了补充文字的选项的补充文字，其余键被忽略。\
> 键请用选项的 `api_code`：新增单条数据、修改数据接口也接受用选项显示值作键，但批量接口不做转换，用显示值作键的补充文字读不出来。\
> 读取数据时，这一项返回为「选项 A: 补充文字」。

### 多项选择

```json
{
    "field_1": ["API_CODE1", "API_CODE2"]    // 选项的 api_code，可以通过 get form 获取
}
```

或者

```json
{
    "field_1": ["选项 A", "选项 B"]    // 选项的显示值，同名选项取第一个
}
```

「其他」选项的填写内容和选项补充文字的写法同[单项选择](#单项选择)，只是 `field_1` 是数组：

```json
{
    "field_1": ["API_CODE1", "其他"],
    "field_1_other": "「其他」填写框里的内容",
    "field_1_extended_text": {
      "API_CODE1": "选项 1 的补充文字"    // 仅限开启了补充文字的选项
    }
}
```

### 图片单选

```json
{
    "field_1": "API_CODE"    // 选项的 api_code，可以通过 get form 获取
}
```

> 仅支持 API Code

### 图片多选

```json
{
    "field_1": ["API_CODE", "API_CODE"]    // 选项的 api_code，可以通过 get form 获取
}
```

> 仅支持 API Code

### 下拉框

```json
{
    "field_1": "API_CODE"    // 选项的 api_code，可以通过 get form 获取
}
```

或者

```json
{
    "field_1": "选项 A"    // 选项的显示值，同名选项取第一个
}
```

下拉框也可以有「其他」选项，填写内容的写法同[单项选择](#单项选择)。

### 多级下拉框

```json
{
    "field_1": {
      "level_1": "API_CODE",
      "level_2": "API_CODE"    // 选项的 api_code，可以通过 get form 获取
    }
}
```

或者

```json
{
    "field_1": {
      "level_1": "一级选项 A",
      "level_2": "二级选项 B"    // 选项的显示值，同名选项取第一个
    }
}
```

> 有几级就传几个 `level_N`。值必须是对象，传「一级-二级」这样的字符串会返回 `400`。

### 数字

```json
{
    "field_1": 1215
}
```

> 也接受数字字符串，如 `"1215"`、`"1,215.5"`。

### 上传文件

「上传文件」字段的值是一个数组，每一项可以是下面任意一种：

1. 调用[上传附件](/api_v1/endpoints/create_entry_attachment)接口得到的附件 `id`；
2. 本表单里已有附件的下载地址（即读取数据时返回的 URL），用于修改数据时保留已有文件；
3. 直接内嵌文件内容：`{"base64": "...", "file_name": "a.png", "content_type": "image/png"}`，文件不超过 5MB，`base64` 也可以是 data URI。

```json
{
    "field_1": [
        "5f3a1b2c4d5e6f7a8b9c0d1e",
        "https://gd-pri.jinshujufiles.com/.../test.jpg?TOKEN",
        { "base64": "iVBORw0KGgo...", "file_name": "photo.png", "content_type": "image/png" }
    ]
}
```

> 附件数量受字段「数量上限」（最多 15 个）限制，文件大小受字段「大小上限」限制。\
> 修改数据时附件字段是整组覆盖：要保留已有文件，把它们的地址或附件 id 一并传回。既不是附件 id、也不是本表单已有附件地址的字符串会返回 `400`。\
> 批量修改数据接口不能写入新文件，只能传回已有附件。

### 日期

```json
{
    "field_1": "2012-12-25"    // 所有时间为北京时间，不支持时区
}
```

格式包含时分秒：

```json
{
    "field_1": "2012-12-25 12:13:15"    // 所有时间为北京时间，不支持时区
}
```

> 按字段的「精度」保存：精度为「日」的字段，传 `"2012-12-25 12:13:15"` 保存为 `2012-12-25`；精度为「分」的字段，传 `"2012-12-25"` 保存为 `2012-12-25 00:00`。\
> 年份须写满 4 位。`"2012/12/25"` 也可以；带时区的 ISO 8601 时间（如 `"2012-12-25T04:13:15Z"`）会换算成北京时间再保存。

### 时间

```json
{
    "field_1": {
        "hour": "12",
        "minute": "15"
    }
}
```

> 必须传对象，`hour` 和 `minute` 同时给出（数字或字符串都可以）；开启了「秒」的字段再加 `second`。\
> 读取数据时返回的是 `"12:15"` 这样的字符串，但写入时不能传这种字符串，会返回 `400`。

### 姓名

```json
{
    "field_1": "金数据"
}
```

### 手机

```json
{
    "field_1": "13888888888"
}
```

> API 不支持手机号码短信验证码校验。

字段开启了「国际手机号」时，号码带国家码，并用两个附加键说明国家：

```json
{
    "field_1": "+8613888888888",
    "field_1_intl_mobile_no_country_id": "CN",     // 国家 / 地区代码（ISO 3166-1 alpha-2）
    "field_1_intl_mobile_no_country_code": "86"    // 国际电话区号；省略时按 country_id 推算
}
```

### 邮箱

```json
{
    "field_1": "api@jinshuju.net"
}
```

### 电话

```json
{
    "field_1": "029-88888888"
}
```

### 身份证

```json
{
    "field_1": "610113199001011234"
}
```

### 网址

```json
{
    "field_1": "https://jinshuju.net"
}
```

### 地址

```json
{
    "field_1": {
        "province": "陕西省",
        "city": "西安市",
        "district": "雁塔区",
        "street": "高新五路4号汇诚国际大厦"
    }
}
```

> 字段设置里固定住的层级（不可更改）不用传，传了也以字段设置为准。

### 地理位置

```json
{
    "field_1": {
        "longitude": 108.8725926,    // 经度
        "latitude": 34.1927644,      // 纬度
        "address": "陕西省西安市雁塔区高新五路4号汇诚国际大厦"    // 详细地址
    }
}
```

### 商品字段（无图商品、配图商品）

```json
{
    "field_1": [    // 数组。支持一次选择多个商品
        {
            "value": "API Code",    // 商品的 api_code，可以通过 get form 获取；也可以写作 "api_code"
            "number": 100           // 数量，须大于 0
        },
        {
            "value": "API Code",
            "number": 10,
            "specification": {      // 有规格的商品必须传，键为规格维度的 api_code，值为规格选项的 api_code
                "DIMENSION_API_CODE": "OPTION_API_CODE"
            }
        }
    ]
}
```

> `number` 为 0 或省略的商品会被忽略。商品的 `api_code` 对不上、或有规格的商品没有传正确的 `specification`，会返回 `400`。

### 矩阵填空

```json
{
    "field_1": {
        "Statement 1 API Code": {    // 题目的 api_code，可以通过 get form 获取
            "field_1": "$VALUE$",    // 项目的 api_code 和值。具体值的 schema 可以直接参考本文档字段详解
            "field_2": "$VALUE$"
        },
        "Statement 2 API Code": {
            "field_1": "$VALUE$",
            "field_2": "$VALUE$"
        }
    }
}
```

> 题目的 api_code 对不上会被忽略；项目的 api_code 对不上会返回 `400`。

### 矩阵单选

```json
{
    "field_1": {
        "Statement 1 API Code": "Choice API Code",    // 题目的 api_code，可以通过 get form 获取
        "Statement 2 API Code": "Choice API Code"     // 选项的 api_code，可以通过 get form 获取
    }
}
```

> 允许多选的矩阵单选，每个题目的值传数组 `["Choice API Code", "Choice API Code"]`。

### 表格字段

```json
{
    "field_1": [    // 数组。表格中的每一行，是数组中的一个元素
        {
            "field_1": "$VALUE$",    // 列的 api_code 和值。具体值的 schema 可以直接参考本文档字段详解
            "field_2": "$VALUE$"
        },
        {
            "field_1": "$VALUE$",
            "field_2": "$VALUE$"
        }
    ]
}
```

> 最多 100 行，全空的行会被丢弃。附件列的写法同[上传文件](#上传文件)。

### 矩阵量表

```json
{
    "field_1": {
        "Statement 1 API Code": {    // 题目的 api_code，可以通过 get form 获取
            "field_1": 4    // 量表项目固定为一个 `field_1` 的评分字段
        },
        "Statement 2 API Code": {
            "field_1": 3
        }
    }
}
```

### 横向填空

```json
{
    "field_1": {
        "field_1": "第一个空格答案",    // 横向填空是由多个文本字段组成，键为每个空格的 api_code
        "field_2": "第二个空格答案"
    }
}
```

### 表单关联

```json
{
  "field_1": "Entry Token"    // 关联数据的 token，可由 get entry 获取
}
```

或者

```json
{
  "field_1": "字符串"    // 该字符串为关联表单中关联键字段的值

  "field_2": ["字符串1", "字符串2"]    // 当一个关联字段中设置了多个关联键，可通过数组来联合传入
}
```

> 文本输入仅支持单/多行文字、数字、日期、网址、姓名、手机、邮箱、电话字段。

> 若匹配到多条数据，会默认选用第一条。\
> 当传入显示的值，没有搜到记录时，会认为提交为空，如果需要「必填」，则可以通过开启「必填」校验实现。

### 评分

```json
{
    "field_1": 8
}
```

### NPS 字段

```json
{
    "field_1": 8
}
```

### 排序字段

```json
{
    "field_1": [            // 有序数组，第一项排第 1
        "Choice API Code",    // 选项的 api_code，可以通过 get form 获取
        "Choice API Code",
        "Choice API Code"
    ]
}
```

> 仅支持 API Code，传选项的显示值会被忽略。

### 签名字段

> 金数据 API 提交数据，暂不支持「签名字段」，传了会被忽略。

### 计算字段

> 「计算字段」的值，由金数据服务端自动计算得出，无需向金数据提交，传了会被忽略。

### 预约字段

```json
{
  "field_1": [
    {    // 按天预约的项目
      "api_code": "fOwM",            // 预约项目的 api_code
      "scheduled_at": "2021-04-26",  // 预约日期
      "number": 1                    // 预约名额数量
    },
    {    // 按时间段预约的项目
      "api_code": "jofm",                            // 预约项目的 api_code
      "scheduled_at": "2021-04-18T00:00:00+08:00",   // 开始时间
      "end_at": "2021-04-18T15:00:00+08:00",         // 结束时间
      "number": 2                                    // 预约名额数量
    }
  ]
}
```

> 未开启「可预约多个名额」时 `number` 只能是 1，省略即为 1；开启后 `number` 必填且大于 0。\
> 是否可以同时预约多个项目、同一项目是否可以预约多个时段，以及时段是否可约，都按字段设置校验，不符合返回 `400`。

### 颜色标记

数据的颜色标记不是表单字段，键固定为 `color_mark`，值为颜色的 api_code 或名称：

```json
{
    "color_mark": "color_1"    // 或 "浅黄色"
}
```

| api_code | 名称 | api_code | 名称 |
| ------ | ------ | ------ | ------ |
| color_1 | 浅黄色 | color_6 | 深黄色 |
| color_2 | 浅绿色 | color_7 | 深绿色 |
| color_3 | 浅粉色 | color_8 | 深粉色 |
| color_4 | 浅米色 | color_9 | 深米色 |
| color_5 | 浅紫色 | color_10 | 深紫色 |

> 对不上任何颜色时该键被忽略。

### 是 / 否（表格的列）

```json
{
    "field_1": true
}
```

> 仅表格支持这种列。也接受 `"true"` / `"false"`、`1` / `0`；其他值会被当作空。

### 关联记录（表格的列）

表格的「关联记录」列的值是被关联表格里数据的序号：

```json
{
    "field_1": [1, 2]    // 整体替换为这些记录
}
```

或者增量修改：

```json
{
    "field_1": { "add": [3], "remove": [1] }
}
```

> 传 `null` 解除全部关联。序号在被关联表格里不存在时返回 `400`；无权读取被关联的表格时返回 `403`。
