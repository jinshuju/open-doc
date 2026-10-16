---
name: sync-openapi
description: 按线上 openapi.yaml 更新 API v1 文档。流程包括：拉取 spec，按 spec 重新生成接口页里参数 / 响应 / 状态码表格的行、是否必须、类型，给新出现的行写简短的「说明」，处理新增、删除或改名的接口，并核对手写的示例与说明。用户说「同步 openapi」「更新 API 文档」「openapi.yaml 变了」「文档跟上 API」「给新接口写文档页」，或 `npm run generate` 报「has no 说明」、报检查失败时使用。
---

# 按 openapi.yaml 更新 API 文档

## 背景

- `spec/openapi.yaml` 是线上 <https://jinshuju.net/api/v1/openapi.yaml> 的原样副本。它是英文的，不要手改。
- `docs/api_v1/endpoints/*.md` 里，参数、响应、状态码三张表夹在 `<!-- openapi:params|response|status <operationId> -->` 与 `<!-- /openapi -->` 之间。
  - **行、参数名称、是否必须、类型**：由 `npm run generate` 按 spec 生成。
  - **说明**：手写，按行名保留。spec 新增一行，这一行的说明为空，检查不通过；spec 删掉一行，这一行连同说明一起去掉。
- 文档是给人看的，说明要简短，不要照搬 spec 里的长描述。
- spec 里有名字的对象类型（`components.schemas` 里的 object，如 `FormSummary`）不拍平成 `data[].name`。类型列写成 `Array(FormSummary)`，链接到页面「数据类型」一节；那一节的 `<!-- openapi:types -->` 区块由生成器填写，给页面用到的每个类型各一张表，类型表再引用的类型也会列出。
  - 同一个类型在各页的说明相同：某页的类型行还没有说明时，自动沿用别的页写好的；两页写得不一样，检查不通过。
  - spec 里没有名字的对象仍在所在表格里嵌套写（`paid.amount`、`conditions[].trigger`）。
- 字段定义、表单设置这类有独立 schema 页的字段不会逐个展开（映射见 `scripts/generate.mjs` 的 `SCHEMA_PAGES`）。它下面只保留页面自己列出的子行，如 `fields[].type`。spec 里没有了的子行会被去掉，输出里出现 `dropped …`。
- 标记之外的内容都是手写的：简介、套餐表、接口说明、JSON 示例、代码示例。
- 这件事需要判断：说明怎么写、新接口要不要建页、手写示例还对不对。所以由 AI 按本流程做，不交给 CI。

生成规则见 `CONTRIBUTING.md` 的「Tables generated from openapi.yaml」一节。脚本在 `scripts/`：`generate.mjs`、`spec.mjs`、`spec-diff.mjs`、`fetch-spec.mjs`。

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
- **有页面的接口里，请求或响应结构变了的**（参数、属性、类型、枚举、必填、状态码）：表格的行会跟着变，但说明和其他手写部分要重读。见第 5 步。

### 3. 给空的说明补上内容

`npm run generate` 会逐行报出 `… \`<行名>\` has no 说明 (openapi.yaml: "…")`，括号里是 spec 对这一行的英文描述。

1. 查看整页每一行的说明、spec 描述和枚举值（只读，不改文件）：

   ```bash
   node scripts/generate.mjs --rows docs/api_v1/endpoints/<page>.md
   ```

2. 直接在页面表格里填写说明这一列。说明列归页面所有，可以手改；按下面的「说明的写法」来写。
   - 报 `data type <类型> \`<行名>\` has no 说明 … (also on N more pages …)` 的是类型表的行：在任意一页的「数据类型」里写一次，下次 generate 会带到其他页。
3. 再跑 `npm run generate`，直到不再报 has no 说明。

### 4. 处理 `npm run generate` 报的其他问题

- **`openapi:… names X, which openapi.yaml does not have`**：接口被删了或改了名。
  - `spec-diff` 里同一个方法 + 路径一边删除、一边新增，就是改名：把页面标记里的 operationId 换成新的。
  - 确实删除了：问用户要不要删这个页面。删的话，还要同时清理 `sidebars.ts`、`docs/api_v1/all.md` 和其他页面里指向它的链接。
- **`the request line under ### Request should be …` / `is not an operation`**：路径或方法变了。改 `### Request` 代码块里的请求行，再把「示例代码」各语言里的 URL 一并改掉。
- **`sidebar_custom_props.method is …`**：改 front matter 里的 `method`。
- **`the body example under ### Request: …`**：在线调试面板会把这段 JSON 当作默认请求体发出去。按请求 schema 改示例：去掉不再接受的键、补上必填键、改正枚举值。
- **`refers to data types (…) but has no <!-- openapi:types --> region`**：页面的表格开始引用某个类型了。在「示例代码」之前加一节 `## 数据类型`，下面放一对空标记 `<!-- openapi:types -->` / `<!-- /openapi -->`，再跑 generate。
- **`has an openapi:types region, but no table on the page refers to a data type`**：页面不再引用任何类型，删掉整个「数据类型」一节。
- **`data type <类型> \`<行名>\` has a different 说明 on different pages`**：同一个类型在各页要读起来一样。合成一句通用的说明，写到报出的每一页；只有某个接口才需要的提示，写进那一页的「接口说明」。
- **`dropped …`**：页面列出的子行在 spec 里没有了，已经去掉。看看是不是改了名，是的话按新名字补一行（只填参数名称和说明，跑 generate 会补齐其余列）。

### 5. 核对手写部分

对第 2 步列出的「结构变了的接口」所在页面，逐个核对：

- **已有的说明**：用 `--rows` 对照 spec，看枚举值、含义、默认值、上限有没有变。说明写错了就改，写得对就不动。
- **`### Response` 里的 JSON 示例**：这部分不会自动校验。看有没有键改了名或被删了，新增的必有键要补上，枚举值要更新。
- **「接口说明」的要点和 `> 注意` 之类的提示**：对照 spec 里该 operation 的 `description`，看有没有和 API 现在的行为相矛盾的地方。
- **Schema 页**：`docs/api_v1/schemas/*.md` 是全手写的。`FieldDefinition` / `FieldInput` / `FieldUpdateInput`、`FormSetting` / `FormSettingWriteInput`、`EntryData` / `EntryInput` 变了，就要更新 `field.md`、`form_setting.md`、`entry.md`、`entry_post.md`。

### 6. 新增的接口

先把新增接口列给用户看，问哪些要建页。建页属于产品决定，spec 里有不等于要公开文档。用户确认要建的，再按「新建接口页」去做。

### 7. 验证

```bash
npm run generate:check   # 表格与 spec 一致，没有空说明，手写的请求示例都合法
npm run build            # 说明里的文字要能通过 MDX 编译
```

spec 里的英文描述明显写错、被截断或互相矛盾时，告诉用户由上游修。不要在文档里将错就错。

### 8. 提交

- 提交信息形如 `docs(api_v1): follow openapi.yaml …`，正文写清楚哪些接口变了、改了哪些手写部分。
- **这是公开仓库**：提交信息、PR、代码里都不要出现公司内部信息，比如内部任务系统的链接和卡片号、内部仓库或系统的名字。
- 只有用户要求时才提交或开 PR。

## 说明的写法

文档是给人看的，简洁比完整更重要。

- **长度**：一个短语，通常不超过 25 个汉字，例如「表单名称」「视图 Token」「本次返回的数量」「排序方向：`asc` / `desc`」「分页参数。原样传回上一页响应中的 `next`」。
- **附加短句**：只有调用方必须知道的才加，例如与谁互斥、什么情况下必填、上限多少、整体替换、什么时候为 null。
- **不要写**：不写成段落，不用 `<br />` 和列表，不重复类型，不写「可选 / 必填」（是否必须那一列已经说了）。
- **枚举**：不超过 6 个时，把取值写进说明，用反引号包起来、以「 / 」分隔，例如「可见性：`cooperators` / `personal`」。更多时只描述含义，或指向页面里的相关小节。
- **复杂参数**（如 `filters`、`sort`）：指向页面自己的小节，例如「见下方「filters 字段过滤」」，不要在格子里展开。
- **map 行**（`*`、`entry.*`、`data[].*`）：说明键是什么、值是什么，例如「对应字段的值，键为字段 `api_code`」。
- **状态码**：写成这个接口的原因，简短：
  - 200：获取成功 / 更新成功 / 删除成功
  - 201：创建成功
  - 400：参数不合法
  - 401：未认证
  - 402：当前套餐不支持 V1 API
  - 403：无权限（如 OAuth scope 不足）
  - 404：<资源>不存在，或无权访问
  - 429：超过请求速率限制
- **术语**：表单 / 表格 / 数据（entry）/ 视图 / 对外查询 / 字段 / 选项 / 序号（serial number）/ 协作者 / 套餐 / 企业账户 / 填写页 / 筛选条件 / 运算符 / 比较符。
  - `token`、`api_code` 和键名保留英文。Token 的大小写跟页面已有的写法一致。
  - 中文与英文、数字之间加空格，如「表单 Token」「最多 100」。
- **一致**：同一个字段在同类页面上（创建 / 更新 / 获取同一资源）用同一句说明。类型表的行在各页本来就必须相同，所以要写成请求、响应都适用的说法，例如「未设置（`null`）时用字段标题」。
- **表格语法**（MDX）：`|` 写成 `\|`；代码段之外，`{` `}` 写成 `\{` `\}`，`<` 写成 `&lt;`。JSON 和标识符尽量放进代码段。

## 新建接口页

1. 文件名：`docs/api_v1/endpoints/<get|create|update|delete>_<资源>.md`。复制同类的现有页面做模板：GET 用 `get_form_view.md`，POST 用 `create_folder.md`，PATCH 用 `update_form_view.md`，DELETE 用 `delete_form_view.md`。
2. front matter 写 `sidebar_custom_props.method` 和 `sidebar_label`。标题写成 `# v1 API <中文名>`。
3. 套餐表：spec 里没有各套餐是否可用的信息，要问用户，不要猜。
4. 「接口说明」：根据 spec 里该 operation 的 `description` 写几条简短的中文要点，权限和 OAuth scope 也写进去。
5. `### Request`：代码块第一行是请求行，形如 `METHOD https://jinshuju.net/api/v1/...`，路径参数写成大写占位符，如 `FORM_TOKEN`。POST / PUT / PATCH 还要接一段 JSON 请求示例。紧接代码块放一对空标记 `<!-- openapi:params <operationId> -->` / `<!-- /openapi -->`。
6. `### Response`：先放 JSON 示例，再放空的 `openapi:response` 标记。然后是 `### 状态码`，下面放空的 `openapi:status` 标记。
7. 「示例代码」：至少写 HTTP 和 Python 两种。
8. 跑 `npm run generate` 生成各行，再按第 3 步写说明。如果报缺少 `openapi:types` 区块，按第 4 步在「示例代码」前加「数据类型」一节。
9. 在 `sidebars.ts` 对应的分类、以及 `docs/api_v1/all.md` 里加上这一页。
10. 如果新增了 schema 页，并且希望不再逐个展开这个 schema 的属性，就在 `scripts/generate.mjs` 的 `SCHEMA_PAGES` 里登记。

## 不要做

- 不要手改标记之间的参数名称、是否必须、类型这三列，也不要手动增删行。下次 `npm run generate` 会按 spec 改回来。唯一的例外是 schema 页字段下面的子行（第 4 步）。
- 不要手改 `spec/openapi.yaml`。
- 不要为了让检查通过而删掉标记，也不要把说明留空或填一个占位词。
