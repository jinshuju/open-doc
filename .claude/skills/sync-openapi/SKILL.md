---
name: sync-openapi
description: 按线上 openapi.yaml 更新 API v1 文档。流程包括：拉取 spec，重新生成接口页里的参数 / 响应 / 状态码表格，补齐 spec/openapi.zh-Hans.yaml 里缺的中文，处理新增、删除或改名的接口，并核对手写的示例与说明。用户说「同步 openapi」「更新 API 文档」「openapi.yaml 变了」「文档跟上 API」「给新接口写文档页」，或 `npm run generate` 报缺中文、报检查失败时使用。
---

# 按 openapi.yaml 更新 API 文档

## 背景

- `spec/openapi.yaml` 是线上 <https://jinshuju.net/api/v1/openapi.yaml> 的原样副本。它是英文的，不要手改。
- `docs/api_v1/endpoints/*.md` 里，`<!-- openapi:params|response|status <operationId> -->` 与 `<!-- /openapi -->` 之间的表格由 `npm run generate` 生成。标记之外的内容都是手写的：简介、套餐表、接口说明、JSON 示例、代码示例。
- 中文来自 `spec/openapi.zh-Hans.yaml`。它是 `{en, zh}` 列表，以英文原文为键。spec 新增或改写了一句描述，`npm run generate` 就会在原来的位置补一条 `zh: ""`。补齐之前，页面显示英文，检查不通过。
- 这件事需要判断：怎么翻译、新接口要不要建页、手写示例还对不对。所以由 AI 按本流程做，不交给 CI。

生成规则、标记写法见 `CONTRIBUTING.md` 的「Tables generated from openapi.yaml」一节。脚本在 `scripts/`：`generate.mjs`、`spec.mjs`、`spec-diff.mjs`、`fetch-spec.mjs`。

## 流程

### 1. 拉取 spec，留一份旧的做对比

```bash
cp spec/openapi.yaml <scratchpad>/openapi.before.yaml
node scripts/fetch-spec.mjs
git diff --quiet -- spec/openapi.yaml && echo "spec 没变"
```

spec 没变就告诉用户，到此为止。只有用户另有要求时才继续。

### 2. 看变了什么

```bash
node scripts/spec-diff.mjs <scratchpad>/openapi.before.yaml spec/openapi.yaml
npm run generate
git diff --stat
```

`spec-diff` 列出三类：

- **新增的接口**：没有页面。见第 6 步，不要自动建页。
- **删除的接口**：会列出仍然引用它的页面。见第 4 步。
- **有页面的接口里，请求或响应结构变了的**（参数、属性、类型、枚举、必填、状态码）：表格会重新生成，但这些页面的手写部分要重读。见第 5 步。

只改了措辞的描述不算结构变化，它会表现为下一步的待翻译条目。

### 3. 补中文

在 `spec/openapi.zh-Hans.yaml` 里找出所有 `zh: ""`，按下面的「翻译规则」逐条写中文：

```bash
grep -n 'zh: ""' spec/openapi.zh-Hans.yaml
```

被改写的句子会替换旧条目，而且在同一位置。`git diff spec/openapi.zh-Hans.yaml` 里，被删掉的旧 `{en, zh}` 就紧挨着新条目，可以沿用旧译文的措辞，只改有变化的部分。

写完后再跑一次 `npm run generate`，直到不再报「have no Chinese yet」。

### 4. 处理 `npm run generate` 报的其他问题

- **`openapi:… names X, which openapi.yaml does not have`**：接口被删了或改了名。
  - `spec-diff` 里同一个方法 + 路径一边删除、一边新增，就是改名：把页面标记里的 operationId 换成新的。
  - 确实删除了：问用户要不要删这个页面。删的话，还要同时清理 `sidebars.ts`、`docs/api_v1/all.md` 和其他页面里指向它的链接。
- **`the request line under ### Request should be …` / `is not an operation`**：路径或方法变了。改 `### Request` 代码块里的请求行，再把「示例代码」各语言里的 URL 一并改掉。
- **`sidebar_custom_props.method is …`**：改 front matter 里的 `method`。
- **`the body example under ### Request: …`**：在线调试面板会把这段 JSON 当作默认请求体发出去。按请求 schema 改示例：去掉不再接受的键、补上必填键、改正枚举值。可以用 `node -e` 读 `spec/openapi.yaml` 查 schema。

### 5. 核对手写部分

对第 2 步列出的「结构变了的接口」所在页面，逐个对照新生成的表格，读一遍：

- **`### Response` 里的 JSON 示例**：这部分不会自动校验。看有没有键改了名或被删了，新增的必有键要补上，枚举值要更新。
- **「接口说明」的要点和 `> 注意` 之类的提示**：对照 spec 里该 operation 的 `description`，看有没有和 API 现在的行为相矛盾的地方。
- **Schema 页**：`docs/api_v1/schemas/*.md` 是全手写的。`FieldDefinition` / `FieldInput` / `FieldUpdateInput`、`FormSetting` / `FormSettingWriteInput`、`EntryData` / `EntryInput` 变了，就要更新 `field.md`、`form_setting.md`、`entry.md`、`entry_post.md`。前四个 schema 在生成的表格里不展开，只链接到对应的 schema 页，映射见 `scripts/generate.mjs` 的 `SCHEMA_PAGES`。

### 6. 新增的接口

先把新增接口列给用户看，问哪些要建页。建页属于产品决定，spec 里有不等于要公开文档。用户确认要建的，再按「新建接口页」去做。

### 7. 验证

```bash
npm run generate:check   # 生成内容与 spec、翻译表一致，没有缺中文，手写请求示例都合法
npm run build            # 新文字要能通过 MDX 编译
npm run generate -- --gaps
```

`--gaps` 列出 spec 没写描述、所以表格里留空的行。不要在文档里替 spec 补这些描述，把数量和清单报告给用户，由他们在 openapi.yaml 上游修。spec 里的英文描述明显写错或被截断时，也照此报告。

### 8. 提交

- 提交信息形如 `docs(api_v1): follow openapi.yaml …`，正文写清楚哪些接口变了、改了哪些手写部分。
- **这是公开仓库**：提交信息、PR、代码里都不要出现公司内部信息，比如内部任务系统的链接和卡片号、内部仓库或系统的名字。
- 只有用户要求时才提交或开 PR。

## 翻译规则

- `zh` 与 `en` 一样写 Markdown。代码段、`api_code`、键名、枚举值、JSON、URL、路径一律原样保留。段落、列表、表格的分行结构跟 `en` 保持一致。
- 只译 `en` 说了的内容，不增不减。`en` 有错时照实翻译，然后告诉用户；不要在译文里替 spec 改正。
- 同一句英文全站共用一个中文（表是以英文为键的）。措辞要在每处都说得通：先 `grep` 生成的页面，看看它出现在哪些地方。
- 中文用全角标点（，；：（）「」），代码段里面除外。中文与英文单词、数字之间加空格，如「表单 token」「最大 1000」。
- 先 `grep` 翻译表里已有的说法再动笔，保持术语一致。常用的：

| 英文 | 中文 |
| --- | --- |
| form / table / entry / view | 表单 / 表格 / 数据 / 视图 |
| public query | 对外查询 |
| field / field label / choice label | 字段 / 字段标题 / 选项显示值 |
| serial number | 序号 |
| token / api_code / id | token / api_code / id（不译） |
| cooperator | 协作者 |
| account / organization plan / plan | 企业账户（账号）/ 企业套餐 / 套餐 |
| filters / sort / operator / comparator | 筛选条件 / 排序 / 运算符 / 比较符 |
| fill page / form view | 填写页 / 表单视图 |
| replaced as a whole | 整体替换 |
| defaults to / when omitted | 缺省为 / 省略时 |
| Returns 400 | 返回 400 |
| Beijing time (UTC+8) | 北京时间 |
| "Upload a form image" | 「上传表单图片」 |
| rich text | 富文本 |

## 新建接口页

1. 文件名：`docs/api_v1/endpoints/<get|create|update|delete>_<资源>.md`。复制同类的现有页面做模板：GET 用 `get_form_view.md`，POST 用 `create_folder.md`，PATCH 用 `update_form_view.md`，DELETE 用 `delete_form_view.md`。
2. front matter 写 `sidebar_custom_props.method` 和 `sidebar_label`。标题写成 `# v1 API <中文名>`。
3. 套餐表：spec 里没有各套餐是否可用的信息，要问用户，不要猜。
4. 「接口说明」：根据 spec 里该 operation 的 `description` 改写成中文要点，权限和 OAuth scope 也写进去。
5. `### Request`：代码块第一行是请求行，形如 `METHOD https://jinshuju.net/api/v1/...`，路径参数写成大写占位符，如 `FORM_TOKEN`。POST / PUT / PATCH 还要接一段 JSON 请求示例。紧接代码块放一对空标记 `<!-- openapi:params <operationId> -->` / `<!-- /openapi -->`。
6. `### Response`：先放 JSON 示例，再放空的 `openapi:response` 标记。然后是 `### 状态码`，下面放空的 `openapi:status` 标记。
7. 「示例代码」：至少写 HTTP 和 Python 两种。
8. 跑 `npm run generate`，把标记之间的内容填上。
9. 在 `sidebars.ts` 对应的分类、以及 `docs/api_v1/all.md` 里加上这一页。
10. 如果新增了 schema 页，并且希望生成表格时链接到它而不是展开，就在 `scripts/generate.mjs` 的 `SCHEMA_PAGES` 里登记。

## 不要做

- 不要手改标记之间的内容。下次 `npm run generate` 会把它覆盖掉。
- 不要手改 `spec/openapi.yaml`。
- 不要为了让检查通过而删掉标记，也不要把中文留空。
