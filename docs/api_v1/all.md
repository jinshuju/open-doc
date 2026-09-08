# 金数据 API v1 接口

## 表单

### 获取表单列表

```
GET /api/v1/forms
```

[查看详情](/api_v1/endpoints/get_forms)

### 获取单个表单结构

```
GET /api/v1/forms/FORM_TOKEN
```

[查看详情](/api_v1/endpoints/get_form)

### 创建表单

```
POST /api/v1/forms
```

[查看详情](/api_v1/endpoints/create_form)

### 编辑表单

```
PATCH /api/v1/forms/FORM_TOKEN
```

[查看详情](/api_v1/endpoints/update_form)

### 复制表单

```
POST /api/v1/forms/FORM_TOKEN/copy
```

[查看详情](/api_v1/endpoints/copy_form)

### 编辑表单主题

```
PATCH /api/v1/forms/FORM_TOKEN/theme
```

[查看详情](/api_v1/endpoints/update_form_theme)

### 移动表单到/移出文件夹

```
PATCH /api/v1/forms/FORM_TOKEN/folder
```

[查看详情](/api_v1/endpoints/update_form_folder)

### 获取表单字段规则

```
GET /api/v1/forms/FORM_TOKEN/field_rules
```

[查看详情](/api_v1/endpoints/get_form_field_rules)

### 获取表单协作者

```
GET /api/v1/forms/FORM_TOKEN/cooperators
```

[查看详情](/api_v1/endpoints/get_form_cooperators)

### 获取考试设置

```
GET /api/v1/forms/FORM_TOKEN/exam_setting
```

[查看详情](/api_v1/endpoints/get_form_exam_setting)

### 编辑考试设置

```
PATCH /api/v1/forms/FORM_TOKEN/exam_setting
```

[查看详情](/api_v1/endpoints/update_form_exam_setting)

### 获取测评设置

```
GET /api/v1/forms/FORM_TOKEN/evaluation_setting
```

[查看详情](/api_v1/endpoints/get_form_evaluation_setting)

### 编辑测评设置

```
PATCH /api/v1/forms/FORM_TOKEN/evaluation_setting
```

[查看详情](/api_v1/endpoints/update_form_evaluation_setting)

## 文件夹

### 获取文件夹列表

```
GET /api/v1/folders
```

[查看详情](/api_v1/endpoints/get_folders)

### 创建文件夹

```
POST /api/v1/folders
```

[查看详情](/api_v1/endpoints/create_folder)

## 数据

### 获取表单数据列表

```
GET /api/v1/forms/FORM_TOKEN/entries
```

[查看详情](/api_v1/endpoints/get_form_entries)

### 新增数据

```
POST /api/v1/forms/FORM_TOKEN/entries
```

[查看详情](/api_v1/endpoints/create_form_entry)

### 批量新增数据

```
POST /api/v1/forms/FORM_TOKEN/entries/batch
```

[查看详情](/api_v1/endpoints/create_form_entries)

### 上传附件

```
POST /api/v1/forms/FORM_TOKEN/entry_attachments
```

[查看详情](/api_v1/endpoints/create_entry_attachment)

### 获取表单单条数据

```
GET /api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
```

[查看详情](/api_v1/endpoints/get_form_entry)

### 更新数据

```
PUT /api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
PATCH /api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
POST /api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
```

[查看详情](/api_v1/endpoints/update_form_entry)

### 删除数据

```
DELETE /api/v1/forms/FORM_TOKEN/entries/SERIAL_NUMBER
```

[查看详情](/api_v1/endpoints/delete_form_entry)

## 对外查询

### 获取对外查询列表

```
GET /api/v1/opensearch/queries
```

[查看详情](/api_v1/endpoints/get_opensearch_queries)

### 获取单个对外查询

```
GET /api/v1/opensearch/queries/QUERY_TOKEN
```

[查看详情](/api_v1/endpoints/get_opensearch_query)

### 创建对外查询

```
POST /api/v1/opensearch/queries
```

[查看详情](/api_v1/endpoints/create_opensearch_query)

### 编辑对外查询

```
PATCH /api/v1/opensearch/queries/QUERY_TOKEN
```

[查看详情](/api_v1/endpoints/update_opensearch_query)

### 获取对外查询可用字段

```
GET /api/v1/opensearch/query_suggestions
```

[查看详情](/api_v1/endpoints/get_opensearch_query_suggestions)

## 账户

### 获取当前用户信息

```
GET /api/v1/me
```

[查看详情](/api_v1/endpoints/get_me)

### 获取当前企业账户信息

```
GET /api/v1/billing_account
```

[查看详情](/api_v1/endpoints/get_billing_account)

### 获取企业账户成员列表

```
GET /api/v1/billing_account/users
```

[查看详情](/api_v1/endpoints/get_billing_account_users)
