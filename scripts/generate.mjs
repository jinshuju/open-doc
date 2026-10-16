/**
 * Writes the parts of the API pages that openapi.yaml already says, so they
 * follow the API instead of drifting from it.
 *
 * A page marks each such part with a pair of comments naming what to write and
 * from which operation:
 *
 *   <!-- openapi:params getFormView -->     path, query and body parameters
 *   <!-- openapi:response getFormView -->   fields of the 2xx response body
 *   <!-- openapi:status getFormView -->     status codes
 *   ...                                     (rewritten on every run)
 *   <!-- /openapi -->
 *
 * Everything outside the markers is the page's own: the introduction, plan
 * table, notes, the JSON examples and the code samples. Which operations get a
 * page at all is decided here, not by the spec.
 *
 * openapi.yaml is in English and the site is in Chinese, so every description
 * goes through spec/openapi.zh-Hans.yaml, keyed by the English text. A string
 * the pages newly need is added there with an empty `zh` and rendered in English
 * meanwhile; one no page needs any more is dropped.
 *
 * Besides writing, it holds the hand-written parts that the runner panel sends
 * to the spec: the request line under `### Request` must name an operation that
 * exists, the sidebar badge must be that operation's method, and the JSON body
 * example must be one the operation takes.
 *
 * Usage:
 *   node scripts/generate.mjs           rewrite pages and the translation table
 *   node scripts/generate.mjs --check   change nothing; fail when anything is out of date
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  deref,
  flat,
  loadSpec,
  operationAt,
  operations,
  placeholderPath,
  requestSchema,
  schemaName,
  successResponse,
} from './spec.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOCS = join(ROOT, 'docs');
const PAGES = join(DOCS, 'api_v1');
const TRANSLATIONS = join(ROOT, 'spec', 'openapi.zh-Hans.yaml');

/**
 * Schemas that have a page of their own. A field of one of these types gets a
 * link to that page instead of its properties spelled out again: they are long,
 * and the pages group and explain them better than one flat table would.
 */
const SCHEMA_PAGES = {
  FieldDefinition: 'api_v1/schemas/field',
  FieldInput: 'api_v1/schemas/field',
  FieldUpdateInput: 'api_v1/schemas/field',
  FormSetting: 'api_v1/schemas/form_setting',
  FormSettingWriteInput: 'api_v1/schemas/form_setting',
};

const REGION = /<!-- openapi:(\w+) (\w+) -->\n[\s\S]*?<!-- \/openapi -->/g;
const KINDS = ['params', 'response', 'status'];
const HEAD = ['| 参数名称 | 是否必须 | 类型 | 说明 |', '| ------ | ------ | ------ | ------ |'];

// ---- Translations ----------------------------------------------------------

const TRANSLATIONS_HEADER = `# Chinese for the English text of openapi.yaml that the API pages show.
#
# Keyed by the English text itself, so a string the spec rewords comes back
# here with an empty \`zh\`. \`npm run generate\` adds what the pages newly need
# (in the order the pages use it) and drops what they no longer do; while a
# \`zh\` is empty the page shows the English and \`npm run generate -- --check\` fails.
# Write \`zh\` as Markdown, the way the spec writes \`en\`.
`;

class Translations {
  constructor(file) {
    this.file = file;
    this.text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    this.known = new Map((parse(this.text) ?? []).map(({ en, zh }) => [en, zh ?? '']));
    this.used = new Map();
  }

  /** The Chinese for a spec string, or the string itself until someone writes it. */
  zh(en) {
    if (!en || !en.trim()) return '';
    const zh = this.known.get(en) ?? '';
    this.used.set(en, zh);
    return zh || en;
  }

  get missing() {
    return [...this.used].filter(([, zh]) => !zh).map(([en]) => en);
  }

  serialize() {
    const list = [...this.used].map(([en, zh]) => ({ en, zh }));
    return TRANSLATIONS_HEADER + '\n' + stringify(list, { lineWidth: 0 });
  }
}

// ---- Markdown in a table cell ----------------------------------------------

/**
 * Escapes what a table cell of an MDX page cannot hold as is: `|` ends the
 * cell, `{` opens a JSX expression and `<` a JSX tag. Code spans keep their
 * braces and angle brackets, but not their pipes.
 */
function escapeCell(text) {
  return text
    .split(/(`+[^`]*`+)/)
    .map((part, i) =>
      i % 2 === 1
        ? part.replace(/(?<!\\)\|/g, '\\|')
        : part
            .replace(/(?<!\\)\|/g, '\\|')
            .replace(/[{}]/g, (c) => '\\' + c)
            .replace(/</g, '&lt;')
    )
    .join('');
}

/**
 * A Markdown description on one line, for a table cell: paragraphs, list items
 * and the rows of a table inside it each become a line of their own.
 */
function cell(markdown) {
  if (!markdown) return '';
  const lines = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) lines.push(paragraph.join(' '));
    paragraph = [];
  };
  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (/^\|.*\|$/.test(line)) {
      flush();
      if (/^\|[\s|:-]+\|$/.test(line)) continue;
      const cells = line
        .slice(1, -1)
        .split(/(?<!\\)\|/)
        .map((c) => c.trim());
      lines.push(cells.length === 2 ? `${cells[0]}：${cells[1]}` : cells.join(' · '));
    } else if (/^([-*+]|\d+\.)\s+/.test(line)) {
      flush();
      paragraph.push(line.replace(/^[-*+]\s+/, '• '));
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return lines.map(escapeCell).join('<br />');
}

// ---- What a schema says, in the page's words --------------------------------

const TYPE_NAMES = { string: 'String', integer: 'Integer', number: 'Number', boolean: 'Boolean', object: 'Object', null: 'null' };

function typeName(spec, node) {
  const s = flat(spec, node);
  if (!s) return 'Any';
  const variants = s.oneOf ?? s.anyOf;
  if (variants) return [...new Set(variants.map((v) => typeName(spec, v)))].join(' / ');
  let types = Array.isArray(s.type) ? s.type : s.type ? [s.type] : [];
  if (types.length === 0) {
    if (s.properties || s.additionalProperties) types = ['object'];
    else if (s.items) types = ['array'];
    else if (s.const !== undefined) types = [typeof s.const === 'number' ? 'number' : typeof s.const];
    else if (s.enum) types = [...new Set(s.enum.map((v) => (v === null ? 'null' : typeof v)))];
  }
  if (types.length === 0) return 'Any';
  return types
    .map((type) => {
      if (type === 'array') return s.items ? `Array(${typeName(spec, s.items)})` : 'Array';
      if (type === 'string' && s.format === 'date-time') return 'DateTime';
      if (type === 'string' && s.format === 'date') return 'Date';
      return TYPE_NAMES[type] ?? type;
    })
    .join(' / ');
}

const code = (value) => '`' + (typeof value === 'string' ? value : JSON.stringify(value)) + '`';

/** The constraints a schema states, in a few fixed Chinese phrases. */
function constraints(spec, node) {
  const s = flat(spec, node) ?? {};
  const out = [];
  const choices = s.enum ?? flat(spec, s.items)?.enum;
  if (choices) out.push('可选值：' + choices.filter((v) => v !== null).map(code).join('、'));
  if (s.const !== undefined) out.push('固定为 ' + code(s.const));
  if (s.default !== undefined) out.push('默认值：' + code(s.default));
  const range = (min, max, unit = '') =>
    min !== undefined && max !== undefined
      ? `${min} ~ ${max}${unit}`
      : min !== undefined
        ? `≥ ${min}${unit}`
        : max !== undefined
          ? `≤ ${max}${unit}`
          : undefined;
  const value = range(s.minimum, s.maximum);
  if (value) out.push('取值范围：' + value);
  const length = range(s.minLength, s.maxLength, ' 个字符');
  if (length) out.push('长度：' + length);
  const items = range(s.minItems, s.maxItems, ' 项');
  if (items) out.push('数量：' + items);
  return out;
}

const pageTitles = new Map();
function pageLink(page) {
  if (!pageTitles.has(page)) {
    const source = readFileSync(join(DOCS, page + '.md'), 'utf8');
    pageTitles.set(page, source.match(/^# (.+)$/m)?.[1].trim() ?? page);
  }
  return `详见[${pageTitles.get(page)}](/${page})`;
}

function linkedPage(node) {
  return SCHEMA_PAGES[schemaName(node)] ?? SCHEMA_PAGES[schemaName(node?.items)];
}

// ---- Rows ------------------------------------------------------------------

function describe(spec, tr, node, fallback = '') {
  const s = flat(spec, node);
  // An array that says nothing of itself is described by what it holds.
  const own = node?.description ?? s?.description ?? (s?.items ? flat(spec, s.items)?.description : undefined);
  const parts = [own === undefined ? escapeCell(fallback) : cell(tr.zh(own))];
  const rules = constraints(spec, node);
  if (rules.length) parts.push(escapeCell(rules.join('；')));
  const page = linkedPage(node) ?? linkedPage(s);
  if (page) parts.push(pageLink(page));
  if (s?.deprecated || node?.deprecated) parts.unshift('（已废弃）');
  return parts.filter(Boolean).join('<br />');
}

// Rows the spec gives no description for, as `<operation> <region>: <name>`:
// they are left empty here and are worth fixing in openapi.yaml.
const gaps = [];
let rendering = '';

function row(name, required, type, description) {
  if (!description) gaps.push(`${rendering}: ${name}`);
  return `| ${name.replace(/\*/g, '\\*')} | ${required ? '是' : '否'} | ${escapeCell(type)} | ${description} |`;
}

/**
 * The properties of an object schema as rows, nested ones spelled `a.b`, items
 * of an array of objects `a[].b`, and the values of a map `a.*`. A schema with
 * a page of its own, or one already being spelled out above (a cycle), is not
 * gone into.
 */
function schemaRows(spec, tr, node, prefix, side, seen = new Set()) {
  const s = flat(spec, node);
  if (!s) return [];
  const required = s.required ?? [];
  const rows = [];
  const add = (name, child, isRequired, fallback) => {
    const c = flat(spec, child);
    if ((side === 'request' && c?.readOnly) || (side === 'response' && c?.writeOnly)) return;
    rows.push(row(prefix + name, isRequired, typeName(spec, child), describe(spec, tr, child, fallback)));
    rows.push(...childRows(spec, tr, child, prefix + name, side, seen));
  };
  for (const [name, child] of Object.entries(s.properties ?? {})) add(name, child, required.includes(name));
  const extra = s.additionalProperties;
  if (extra && extra !== false) {
    // A body that is all map (an entry's field values) has no row of its own
    // to say what its keys are, so its `*` row says it.
    const owner = prefix === '' && !s.properties ? s.description : undefined;
    const values = extra === true ? (owner === undefined ? {} : { description: owner }) : extra;
    add('*', values, false, '其他键');
  }
  return rows;
}

function childRows(spec, tr, node, path, side, seen) {
  if (linkedPage(node)) return [];
  const s = flat(spec, node);
  if (!s) return [];
  const isArray = s.items && (s.type === 'array' || (Array.isArray(s.type) && s.type.includes('array')) || !s.type);
  const inner = isArray ? s.items : node;
  if (isArray && linkedPage(inner)) return [];
  const name = schemaName(inner);
  if (name && seen.has(name)) return [];
  const t = flat(spec, inner);
  if (!t?.properties && !(t?.additionalProperties && t.additionalProperties !== true)) return [];
  const next = name ? new Set(seen).add(name) : seen;
  return schemaRows(spec, tr, inner, path + (isArray ? '[].' : '.'), side, next);
}

function table(rows, empty) {
  return rows.length ? [...HEAD, ...rows].join('\n') : empty;
}

const RENDER = {
  params(spec, tr, op) {
    const rows = [];
    for (const p of op.parameters) {
      const name = p.in === 'path' ? p.name.toUpperCase() : p.name;
      if (p.in !== 'path' && p.in !== 'query') continue;
      rows.push(row(name, p.in === 'path' || p.required, typeName(spec, p.schema), describe(spec, tr, { ...p.schema, description: p.description ?? p.schema?.description })));
    }
    const body = requestSchema(spec, op);
    if (body) rows.push(...schemaRows(spec, tr, body, '', 'request'));
    return table(rows, '本接口没有参数。');
  },

  response(spec, tr, op) {
    const ok = successResponse(spec, op);
    if (!ok?.schema) return '响应体为空。';
    const s = flat(spec, ok.schema);
    const isArray = s?.items && (s.type === 'array' || !s.properties);
    const rows = isArray ? schemaRows(spec, tr, s.items, '[].', 'response') : schemaRows(spec, tr, ok.schema, '', 'response');
    return table(rows, '响应体为空。');
  },

  status(spec, tr, op) {
    const codes = Object.keys(op.op.responses ?? {}).sort();
    const rows = codes.map((status) => `| ${status} | ${cell(tr.zh(deref(spec, op.op.responses[status])?.description))} |`);
    return ['| 状态码 | 说明 |', '| ------ | ------ |', ...rows].join('\n');
  },
};

// ---- Pages -----------------------------------------------------------------

function pagesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? pagesUnder(join(dir, entry.name)) : entry.name.endsWith('.md') ? [join(dir, entry.name)] : []))
    .sort();
}

/** The page with every region rewritten, and the regions it has. */
function render(spec, ops, tr, source, problems, page) {
  const regions = [];
  const out = source.replace(REGION, (whole, kind, id) => {
    const op = ops.get(id);
    if (!KINDS.includes(kind)) {
      problems.push(`${page}: unknown region openapi:${kind} (known: ${KINDS.join(', ')})`);
      return whole;
    }
    if (!op) {
      problems.push(`${page}: openapi:${kind} names ${id}, which openapi.yaml does not have`);
      return whole;
    }
    regions.push({ kind, op });
    rendering = `${id} ${kind}`;
    return `<!-- openapi:${kind} ${id} -->\n\n${RENDER[kind](spec, tr, op)}\n\n<!-- /openapi -->`;
  });
  return { out, regions };
}

// The first balanced JSON object or array in a text, as the runner panel reads
// the body example (src/js/api-runner/parse.js).
function firstJson(text) {
  for (let i = 0; i < text.length; i++) {
    const open = text[i];
    if (open !== '{' && open !== '[') continue;
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') inString = true;
      else if (c === open) depth++;
      else if (c === close && --depth === 0) {
        try {
          return JSON.parse(text.slice(i, j + 1));
        } catch {
          break;
        }
      }
    }
  }
  return undefined;
}

const REQUEST_LINE = /^\s*((?:GET|POST|PUT|PATCH|DELETE)(?:\/(?:GET|POST|PUT|PATCH|DELETE))*)\s+https?:\/\/[^/\s]+\/api\/v1(\/[^\s?#]*)/;

/** The code block under `### Request`, which the runner panel reads. */
function requestBlock(source) {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => /^#{2,3}\s+Request\s*$/.test(line));
  if (start === -1) return undefined;
  const open = lines.findIndex((line, i) => i > start && /^```/.test(line));
  if (open === -1 || lines.slice(start + 1, open).some((line) => /^#/.test(line))) return undefined;
  const close = lines.findIndex((line, i) => i > open && /^```\s*$/.test(line));
  return lines.slice(open + 1, close === -1 ? undefined : close).join('\n');
}

let ajv;
function bodyIssues(spec, op, body) {
  const content = deref(spec, op.op.requestBody)?.content;
  const schema = content?.['application/json']?.schema;
  if (!schema) return [];
  ajv ??= new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
  const validate = ajv.compile({ ...schema, components: spec.components });
  if (validate(body)) return [];
  return validate.errors.slice(0, 5).map((e) => `${e.instancePath || '(body)'} ${e.message}${e.params?.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);
}

/**
 * Holds the hand-written parts of a page that the runner panel sends to the
 * spec. Returns the operations its request lines name.
 */
function checkPage(spec, ops, page, source, regions, problems) {
  const named = new Set();
  const params = regions.find((r) => r.kind === 'params')?.op;
  if (!params) return named;
  const block = requestBlock(source);
  if (block === undefined) {
    problems.push(`${page}: has openapi:params but no code block under \`### Request\` for the runner panel`);
    return named;
  }
  for (const line of block.split('\n')) {
    const m = line.match(REQUEST_LINE);
    if (!m) continue;
    const path = m[2].replace(/\/$/, '');
    for (const method of m[1].split('/')) {
      const op = operationAt(ops, method, path);
      if (op) named.add(op.id);
      else problems.push(`${page}: \`${method} ${path}\` under \`### Request\` is not an operation in openapi.yaml`);
    }
  }
  if (!named.has(params.id)) {
    problems.push(`${page}: the request line under \`### Request\` should be \`${params.method} https://jinshuju.net/api/v1${placeholderPath(params.path)}\` (${params.id})`);
  }
  const badge = source.match(/^---\n[\s\S]*?\n\s*method:\s*(\w+)[\s\S]*?\n---/)?.[1];
  if (badge && badge.toUpperCase() !== params.method) {
    problems.push(`${page}: sidebar_custom_props.method is ${badge}, but ${params.id} is ${params.method}`);
  }
  if (['POST', 'PUT', 'PATCH'].includes(params.method) && !/multipart\/form-data/i.test(block)) {
    const body = firstJson(block);
    if (body !== undefined) {
      for (const issue of bodyIssues(spec, params, body)) problems.push(`${page}: the body example under \`### Request\`: ${issue}`);
    }
  }
  return named;
}

// ---- Main ------------------------------------------------------------------

const check = process.argv.includes('--check');
const spec = loadSpec();
const ops = operations(spec);
const tr = new Translations(TRANSLATIONS);
const problems = [];
const stale = [];
const documented = new Set();

for (const file of pagesUnder(PAGES)) {
  const page = relative(ROOT, file);
  const source = readFileSync(file, 'utf8');
  const { out, regions } = render(spec, ops, tr, source, problems, page);
  regions.forEach((r) => documented.add(r.op.id));
  checkPage(spec, ops, page, out, regions, problems).forEach((id) => documented.add(id));
  if (out === source) continue;
  stale.push(page);
  if (!check) writeFileSync(file, out);
}

const translations = tr.serialize();
const tableStale = translations !== tr.text;
if (tableStale && !check) writeFileSync(TRANSLATIONS, translations);

const missing = tr.missing;
if (missing.length) {
  problems.push(
    `spec/openapi.zh-Hans.yaml: ${missing.length} string(s) have no Chinese yet, so the pages show them in English:\n` +
      missing.map((en) => `    - ${en.split('\n')[0].slice(0, 100)}`).join('\n')
  );
}
if (check) {
  for (const page of stale) problems.push(`${page}: out of date with openapi.yaml; run \`npm run generate\``);
  if (tableStale) problems.push('spec/openapi.zh-Hans.yaml: out of date with the pages; run `npm run generate`');
} else {
  for (const page of stale) console.log(`updated ${page}`);
  if (tableStale) console.log('updated spec/openapi.zh-Hans.yaml');
}

const undocumented = [...ops.keys()].filter((id) => !documented.has(id));
console.log(`${documented.size} of ${ops.size} operations have a page; ${undocumented.length} do not.`);
console.log(`${gaps.length} generated rows have no description in openapi.yaml${process.argv.includes('--gaps') ? ':' : ' (--gaps lists them).'}`);
if (process.argv.includes('--gaps')) console.log(gaps.map((gap) => `  ${gap}`).join('\n'));
if (problems.length) {
  console.error('\n' + problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
