# Contributing

Thanks for your interest in Jinshuju Open Platform documentation.

This repository contains the official documentation for Jinshuju Open Platform. We welcome fixes and suggestions that improve clarity, accuracy, examples, and developer experience.

## How to contribute

- For documentation fixes, open a pull request.
- For unclear content or missing examples, open an issue.
- For product support or account-specific questions, contact support@jinshuju.net.

## Before submitting

Please make sure your contribution:

- Is focused on documentation or developer experience
- Does not include private account data, API keys, secrets, access tokens, or customer data
- Uses clear and concise language
- Keeps links and examples accurate

## Local preview

```bash
npm install
npm run start
```

Then visit `http://localhost:3000`.

## API endpoint pages and the online runner

Pages under `docs/api_v1/endpoints/` get an **online runner** panel — readers fill in
credentials and parameters, send a real request, and copy ready-to-run snippets in eight
languages. Nothing is generated at build time: the panel reads the *rendered page* in the
browser, so editing the Markdown is enough — there is no second copy of the endpoint
metadata to keep in sync.

For that to work, an endpoint page needs to follow the existing shape:

1. A `### Request` heading.
2. Immediately after it, a code block containing the request line, e.g.
   `POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/entries`.
   Several methods on one line (`PATCH/POST/PUT https://…`) are understood, and so is a
   `Content-Type: multipart/form-data` line — those pages are marked as not runnable
   rather than pretending a browser upload works.
   For `POST` / `PUT` / `PATCH`, the first balanced JSON object in that block becomes the
   request body shown in the editor.
3. Optionally, a parameter table right after the code block, with a `参数名称` column plus
   any of `是否必须` / `类型` / `说明`. Uppercase placeholders in the URL (`FORM_TOKEN`)
   become path parameters, names appearing in a query string become query parameters, and
   the rest become body fields. On the existing pages this table is generated (see
   [Tables generated from openapi.yaml](#tables-generated-from-openapiyaml)).

**If a page does not match this shape, the panel simply does not appear** and the page
renders exactly as it would without the runner. Nothing breaks — so an unusual page is
safe, it just does not get the extra tooling.

### Optional front matter

Two fields are read from front matter. Both are optional:

```yaml
---
sidebar_custom_props:
  method: PATCH        # colored GET / POST / PATCH / DELETE badge in the sidebar
sidebar_label: 编辑表单  # shorter label than the page title
---
```

`method` is the one piece of information the runner cannot derive at runtime: the sidebar
shows badges for pages the reader has not opened yet, and only the current page's DOM is
available. It is duplicated from the request line in the body; on a page with generated
tables, `npm run generate` fails when the two disagree.

## Tables generated from openapi.yaml

The parameter, response and status-code tables of the API v1 pages are generated from
[openapi.yaml](https://jinshuju.net/api/v1/openapi.yaml), the spec the API itself validates
requests against. `spec/openapi.yaml` is a verbatim copy of it. A page marks each generated
table with a pair of comments that name the operation (its `operationId` in the spec):

```markdown
<!-- openapi:params getFormView -->     path, query and body parameters
<!-- openapi:response getFormView -->   fields of the 2xx response body
<!-- openapi:status getFormView -->     status codes
…
<!-- /openapi -->
```

Everything between a pair is rewritten by `npm run generate`, so **do not edit it by
hand**: a wrong or missing description is fixed in openapi.yaml, where the API is defined.
Everything outside the markers is the page's own: the introduction, the plan table, notes,
the JSON examples and the code samples. Which endpoints have a page at all is decided here,
not by the spec.

openapi.yaml is in English and this site is in Chinese, so every description goes through
`spec/openapi.zh-Hans.yaml`, a list of `{en, zh}` pairs keyed by the English text. When the
spec adds or rewords a description, `npm run generate` adds it there with an empty `zh` and
the page shows the English until someone writes the Chinese.

`npm run generate` also holds the hand-written parts the runner sends to the spec: the
request line under `### Request` must be an operation that exists, the sidebar `method`
must match it, and the JSON body example must be one the operation accepts.

```bash
npm run generate            # rewrite the generated tables and spec/openapi.zh-Hans.yaml
npm run generate:check      # change nothing; fail when anything is out of date
npm run generate -- --gaps  # also list the generated rows openapi.yaml gives no description
npm run spec:update         # fetch the published openapi.yaml, then generate
node scripts/spec-diff.mjs <old openapi.yaml> spec/openapi.yaml  # operations added, removed, or changed on a page
```

Bringing the docs up to date with a new openapi.yaml takes judgement (writing the Chinese,
deciding whether a new endpoint gets a page, rereading the hand-written examples), so it is
done with an AI agent rather than unattended. The steps are in the project skill
[`.claude/skills/sync-openapi/SKILL.md`](.claude/skills/sync-openapi/SKILL.md); in Claude
Code, run `/sync-openapi`.
