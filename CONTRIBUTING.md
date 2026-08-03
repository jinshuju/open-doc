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

Requires Node >= 22. The site has no runtime dependencies, so there is nothing to install.

```bash
npm run start
```

Then visit `http://localhost:3000`.

Documentation lives in `docs/`; the rendering layer lives in `site/`. To add a page, write
the `.md` under `docs/` and reference it from `sidebars.ts` — no changes under `site/` needed.

Before opening a pull request:

```bash
npm run build && npm test
```
