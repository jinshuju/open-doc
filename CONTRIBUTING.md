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
   the rest become body fields.

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
available. It is duplicated from the request line in the body, so if the two ever disagree
the badge is wrong — the panel itself always reads the body, so it stays correct.
