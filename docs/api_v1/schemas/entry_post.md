# API V1 数据结构 Schema (POST)

通过 API 创建/修改表单数据时，提交的数据格式如下：

```json
{
    "field_1": "VALUE 1",
    "field_3": "VALUE 2",
    "field_3": "VALUE 3"
    // 其他字段
}

```

## 注意

> 通过 API 提交数据，表单设置的「字段规则」依然生效

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

### 单选类型选项选择

```json
{
    "field_1": "API_CODE",      // 选项的 API Code，可以通过 get form 获取 schema
    "field_1_extended_text": {  // 选项后输入框补充信息
      "API_CODE": "补充信息"   
    }
}
```

或者

```json
{
    "field_1": "选项 A",         // 选项的显示值，将自动匹配第一个
    "field_1_extended_text": {  // 选项后输入框补充信息
      "选项 A": "补充信息"   
    }
}
```

### 多项选择

```json
{
    "field_1": ["API_CODE1", "API_CODE2"],    // 选项的 API Code，可以通过 get form 获取 schema
    "field_1_extended_text": {                // 选项后输入框补充信息
      "API_CODE1": "补充信息",
      "API_CODE2": "补充信息"
    }
}
```

或者

```json
{
    "field_1": ["选项 A", "选项 B"],    // 选项的显示值，将自动匹配第一个
    "field_1_extended_text": {    // 选项后输入框补充信息
      "选项 A": "补充信息",
      "选项 B": "补充信息"
    }
}
```

### 图片单选

```json
{
    "field_1": "API_CODE"   // 选项的 API Code，可以通过 get form 获取 schema
}
```

> 仅支持 API Code

### 图片多选

```json
{
    "field_1": ["API_CODE", "API_CODE"]   // 选项的 API Code，可以通过 get form 获取 schema
}
```

> 仅支持 API Code

### 下拉框

```json
{
    "field_1": "API_CODE"   // 选项的 API Code，可以通过 get form 获取 schema
}
```

或者

```json
{
    "field_1": "选项 A"    // 选项的显示值，将自动匹配第一个
}
```

### 多级下拉框

```json
{
    "field_1": {
      "level_1": "API_CODE",
      "level_2": "API_CODE"   // 选项的 API Code，可以通过 get form 获取 schema
    }
}
```

或者

```json
{
    "field_1": {
      "level_1": "一级选项 A",
      "level_2": "二级选项 B"   // 选项的显示值，将自动匹配第一个
    }
}
```

### 数字

```json
{
    "field_1": 1215
}
```

### 上传文件

「上传文件」字段需要分两步提交：

1. 调用[上传附件](/api_v1/endpoints/create_entry_attachment)接口上传文件，拿到附件的 `id`；
2. 在提交数据时，将一个或多个 `id` 以数组形式填入该字段。

```json
{
    "field_1": ["5f3a1b2c4d5e6f7a8b9c0d1e", "5f3a1b2c4d5e6f7a8b9c0d2f"]
}
```

> 附件数量受字段「数量上限」（最多 15 个）限制，文件大小受字段「大小上限」限制。

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

### 时间

```json
{
    "field_1": {
        "hour": "12",
        "minute": "15"
    }
}
```

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

> API 不支持手机号码短信验证码校验

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

### 网址

```json
{
    "field_1": "https://jinshuju.net"
}
```

### 地理位置

```json
{
    "field_1": {
        "latitude": 108.8725926,    // 经度
        "longitude": 34.1927644,    // 纬度
        "address": "陕西省西安市雁塔区高新五路4号汇诚国际大厦"    // 详细地址
    }
}
```

### 商品字段（无图商品、配图商品）

```json
{
    "field_1": [    // 数组。支持一次选择多个商品类型
        {
            "value": "API Code",    // 商品的 API Code，可以通过 get form 获取 schema
            "number": 100    // 数量
        },
        {
            "value": "API Code",
            "number": 10
        }
    ]
}
```

### 矩阵填空

```json
{
    "field_1": {
        "Statement 1 API Code": {    // 题目的 API Code，可以通过 get form 获取 schema
            "field_1": "$VALUE$",    // 项目的值。具体值的 schema 可以直接参考本文档字段详解
            "field_2": "$VALUE$"
        },
        "Statement 2 API Code": {
            "field_1": "$VALUE$",
            "field_2": "$VALUE$"
        }
    }
}
```

### 矩阵单选

```json
{
    "field_1": {
        "Statement 1 API Code": "Choice API Code",    // 题目的 API Code，可以通过 get form 获取 schema
        "Statement 2 API Code": "Choice API Code"     // 选项的 API Code，可以通过 get form 获取 schema
    }

}
```

### 表格字段

```json
{
    "field_1": [    // 数组。表格中的每一行，是数组中的一个元素
        {
            "field_1": "$VALUE$",    // 项目的值。具体值的 schema 可以直接参考本文档字段详解
            "field_2": "$VALUE$"
        },
        {
            "field_1": "$VALUE$",
            "field_2": "$VALUE$"
        }
    ]
}
```

### 矩阵量表

```json
{
    "field_1": {
        "Statement 1 API Code": {    // 题目的 API Code，可以通过 get form 获取 schema
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
        "field_1": "第一个空格答案",    // 横向填空是由多个文本字段组成
        "field_2": "第一个空格答案"
    }
}
```

### 表单关联

```json
{
  "field_1": "Entry Token"	//数据的 token 可由 get entry获取
}
```

或者

```json
{
  "field_1": "字符串"  //该字符串为关联表单中的数据
  
  "field_2": ["字符串1", "字符串2"] //当一个关联字段中设置了多个关联键，可通过数组来联合传入
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
    "field_1": [            // 有序数组
        "Choice API Code",    // 选项的 API Code，可以通过 get form 获取 schema
        "Choice API Code",
        "Choice API Code"
    ]
}
```

### 签名字段

> 金数据 API 提交数据，暂不支持「签名字段」


### 计算字段

> 「计算字段」的值，由金数据服务端自动计算得出，无需向金数据提交


### 预约字段

```json
{
  "field_1":[
    { //按天预约项目
      "api_code":"fOwM",    //「fOwM」为项目的value
      "scheduled_at": "2021-04-26",    //按天预约
      "number": 1    //预约名额数量
    },
    {//按时间段预约项目
      "api_code": "jofm",    // 预约项目
      "scheduled_at": "2021-04-18T00:00:00+08:00",    //开始时间
      "end_at": "2021-04-18T15:00:00+08:00",    //结束时间段
      "number": 2    //预约名额数量
    }
}
```
