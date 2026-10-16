/**
 * Keeps the parameter, response and status-code tables of the API pages in
 * step with openapi.yaml, so they follow the API instead of drifting from it.
 *
 * A page marks each such table with a pair of comments naming what it lists and
 * for which operation:
 *
 *   <!-- openapi:params getFormView -->     path, query and body parameters
 *   <!-- openapi:response getFormView -->   fields of the 2xx response body
 *   <!-- openapi:status getFormView -->     status codes
 *   | … |
 *   <!-- /openapi -->
 *
 * The spec decides the rows (which parameters, fields and status codes there
 * are, in its order) and the 是否必须 and 类型 columns. The 说明 column is the
 * page's own: these pages are read by people, and a short line written for them
 * reads better than the spec's description. A row keeps its 说明 by name from
 * one run to the next; a row the spec adds comes in with an empty one, and the
 * run fails until somebody writes it (the report quotes the spec's description
 * to write it from). A row the spec drops goes, with its 说明.
 *
 * Everything outside the markers is the page's own too: the introduction, plan
 * table, notes, the JSON examples and the code samples. Which operations get a
 * page at all is decided here, not by the spec.
 *
 * Besides that, it holds the hand-written parts that the runner panel sends to
 * the spec: the request line under `### Request` must name an operation that
 * exists, the sidebar badge must be that operation's method, and the JSON body
 * example must be one the operation takes.
 *
 * Usage:
 *   node scripts/generate.mjs                 rewrite the tables
 *   node scripts/generate.mjs --check         change nothing; fail when anything is out of date
 *   node scripts/generate.mjs --rows <page>   change nothing; list the page's rows, each 说明
 *                                             next to what openapi.yaml says of the row
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const PAGES = join(ROOT, 'docs', 'api_v1');

/**
 * Schemas that have a page of their own (docs/api_v1/schemas/). A field of one
 * of these types is not spelled out property by property: they are long, and
 * their pages group and explain them better than one flat table would. Only the
 * properties the page itself chooses to list under it stay, for as long as the
 * spec still has them (in some variant, for a oneOf).
 */
const SCHEMA_PAGES = {
  FieldDefinition: 'api_v1/schemas/field',
  FieldInput: 'api_v1/schemas/field',
  FieldUpdateInput: 'api_v1/schemas/field',
  FormSetting: 'api_v1/schemas/form_setting',
  FormSettingWriteInput: 'api_v1/schemas/form_setting',
};

const REGION = /<!-- openapi:(\w+) (\w+) -->\n([\s\S]*?)<!-- \/openapi -->/g;
const KINDS = ['params', 'response', 'status'];

// ---- Table cells -------------------------------------------------------------

/** `|` ends a cell, `{` opens a JSX expression and `<` a JSX tag in an MDX page. */
function escapeCell(text) {
  return text.replace(/\|/g, '\\|').replace(/[{}]/g, (c) => '\\' + c).replace(/</g, '&lt;');
}

const escapeName = (name) => name.replace(/\*/g, '\\*');

/** The 说明 of each row of a table already on the page, by the row's name. */
function descriptions(table) {
  const out = new Map();
  for (const line of table.split('\n')) {
    if (!/^\|.*\|\s*$/.test(line.trim()) || /^\|[\s|:-]+\|$/.test(line.trim())) continue;
    const cells = line.trim().slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim());
    const name = cells[0].replace(/\\\*/g, '*').replace(/`/g, '');
    if (name === '参数名称' || name === '状态码') continue;
    out.set(name, cells[cells.length - 1]);
  }
  return out;
}

// ---- What a schema says ------------------------------------------------------

const TYPE_NAMES = { string: 'String', integer: 'Integer', number: 'Number', boolean: 'Boolean', object: 'Object', null: 'null' };

/**
 * The shapes a oneOf / anyOf lets a value take. A member that only constrains
 * (`anyOf: [{required: [value]}, {required: [name]}]`) is not a shape of its own.
 */
function shapesOf(s) {
  const members = s?.oneOf ?? s?.anyOf ?? [];
  return members.filter((m) => ['$ref', 'type', 'properties', 'items', 'enum', 'const', 'oneOf', 'anyOf', 'allOf'].some((key) => m[key] !== undefined));
}

function typeName(spec, node) {
  const s = flat(spec, node);
  if (!s) return 'Any';
  const shapes = shapesOf(s);
  if (shapes.length) return [...new Set(shapes.map((v) => typeName(spec, v)))].join(' / ');
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

/** What the spec says of a field, quoted when its 说明 is still to be written. */
function specText(spec, node) {
  const s = flat(spec, node);
  return node?.description ?? s?.description ?? (s?.items ? flat(spec, s.items)?.description : undefined) ?? '';
}

/** The values an enum (or an array of one) allows, for --rows. */
function choicesOf(spec, node) {
  const s = flat(spec, node);
  return s?.enum ?? flat(spec, s?.items)?.enum;
}

const hasPage = (node) => Boolean(SCHEMA_PAGES[schemaName(node)] ?? SCHEMA_PAGES[schemaName(node?.items)]);

// ---- Rows --------------------------------------------------------------------

/**
 * The properties of an object schema as rows, nested ones spelled `a.b`, items
 * of an array of objects `a[].b`, and the values of a map `a.*`. A schema with
 * a page of its own, or one already being spelled out above (a cycle), is not
 * gone into.
 */
function schemaRows(spec, node, prefix, side, written, seen = new Set()) {
  const s = flat(spec, node);
  if (!s) return [];
  const required = s.required ?? [];
  const rows = [];
  const add = (name, child, isRequired) => {
    const c = flat(spec, child);
    if ((side === 'request' && c?.readOnly) || (side === 'response' && c?.writeOnly)) return;
    rows.push({ name: prefix + name, required: isRequired, type: typeName(spec, child), spec: specText(spec, child), choices: choicesOf(spec, child) });
    rows.push(...childRows(spec, child, prefix + name, side, written, seen));
  };
  for (const [name, child] of Object.entries(s.properties ?? {})) add(name, child, required.includes(name));
  const extra = s.additionalProperties;
  if (extra && extra !== false) {
    // A body that is all map (an entry's field values) says what its keys are
    // in its own description, which no other row carries.
    const values = extra === true ? { description: prefix === '' && !s.properties ? s.description : undefined } : extra;
    add('*', values, false);
  }
  return rows;
}

function childRows(spec, node, path, side, written, seen) {
  const s = flat(spec, node);
  if (!s) return [];
  const isArray = s.items && (s.type === 'array' || (Array.isArray(s.type) && s.type.includes('array')) || !s.type);
  const inner = isArray ? s.items : node;
  const prefix = path + (isArray ? '[].' : '.');
  if (hasPage(node) || hasPage(inner)) return listedRows(spec, inner, prefix, written);
  const name = schemaName(inner);
  if (name && seen.has(name)) return [];
  const t = flat(spec, inner);
  if (!t?.properties && !(t?.additionalProperties && t.additionalProperties !== true)) return [];
  const next = name ? new Set(seen).add(name) : seen;
  return schemaRows(spec, inner, prefix, side, written, next);
}

// Rows a page lists under a schema with a page of its own whose property the
// spec no longer has, as `<page> <operation> <region>: <name>`; they are dropped.
const dropped = [];

/** The rows the page lists under `prefix`, in its order, each as the spec now has it. */
function listedRows(spec, node, prefix, written) {
  const rows = [];
  for (const name of written.keys()) {
    if (!name.startsWith(prefix)) continue;
    const found = resolve(spec, node, name.slice(prefix.length));
    if (found) rows.push({ name, required: found.required, type: typeName(spec, found.node), spec: specText(spec, found.node), choices: choicesOf(spec, found.node) });
    else dropped.push(`${rendering}: ${name}`);
  }
  return rows;
}

/** The variants a value may take: the shapes of its oneOf / anyOf, then itself. */
function variants(spec, node) {
  const s = flat(spec, node);
  return [...shapesOf(s).map((v) => flat(spec, v)), s].filter(Boolean);
}

/**
 * A row name below a schema (`choices[].value`, `*.label`) followed into it:
 * the node it names, and whether it is required. Every variant of a oneOf is
 * tried, so the name resolves if any variant has that path.
 */
function resolve(spec, node, rest, required = false) {
  if (rest === '') return { node, required };
  const [segment, ...more] = rest.split('.');
  const isArray = segment.endsWith('[]');
  const key = isArray ? segment.slice(0, -2) : segment;
  for (const v of variants(spec, node)) {
    const extra = v.additionalProperties;
    let child = key === '*' ? (extra && extra !== true ? extra : extra === true ? {} : undefined) : v.properties?.[key];
    if (child === undefined) continue;
    if (isArray) child = flat(spec, child)?.items;
    if (child === undefined) continue;
    const found = resolve(spec, child, more.join('.'), key !== '*' && (v.required ?? []).includes(key));
    if (found) return found;
  }
  return undefined;
}

let rendering = '';

const ROWS = {
  params(spec, op, written) {
    const rows = [];
    for (const p of op.parameters) {
      if (p.in !== 'path' && p.in !== 'query') continue;
      rows.push({
        name: p.in === 'path' ? p.name.toUpperCase() : p.name,
        required: p.in === 'path' || Boolean(p.required),
        type: typeName(spec, p.schema),
        spec: p.description ?? specText(spec, p.schema),
        choices: choicesOf(spec, p.schema),
      });
    }
    const body = requestSchema(spec, op);
    if (body) rows.push(...schemaRows(spec, body, '', 'request', written));
    return rows;
  },

  response(spec, op, written) {
    const ok = successResponse(spec, op);
    if (!ok?.schema) return [];
    const s = flat(spec, ok.schema);
    const isArray = s?.items && (s.type === 'array' || !s.properties);
    return isArray ? schemaRows(spec, s.items, '[].', 'response', written) : schemaRows(spec, ok.schema, '', 'response', written);
  },

  status(spec, op) {
    return Object.keys(op.op.responses ?? {})
      .sort()
      .map((code) => ({ name: code, spec: deref(spec, op.op.responses[code])?.description ?? '' }));
  },
};

const EMPTY = { params: '本接口没有参数。', response: '响应体为空。' };

// Every row rendered, with its 说明 and what the spec says of it, for --rows.
const listing = [];

/** A region's table: rows from the spec, 说明 from the page. Rows still without a 说明 go to `unwritten`. */
function table(kind, rows, written, unwritten) {
  if (rows.length === 0) return EMPTY[kind];
  const lines =
    kind === 'status'
      ? ['| 状态码 | 说明 |', '| ------ | ------ |']
      : ['| 参数名称 | 是否必须 | 类型 | 说明 |', '| ------ | ------ | ------ | ------ |'];
  for (const row of rows) {
    const text = written.get(row.name) ?? '';
    listing.push({ where: rendering, ...row, text });
    if (!text) unwritten.push(row);
    lines.push(
      kind === 'status'
        ? `| ${row.name} | ${text} |`
        : `| ${escapeName(row.name)} | ${row.required ? '是' : '否'} | ${escapeCell(row.type)} | ${text} |`
    );
  }
  return lines.join('\n');
}

// ---- Pages -------------------------------------------------------------------

function pagesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? pagesUnder(join(dir, entry.name)) : entry.name.endsWith('.md') ? [join(dir, entry.name)] : []))
    .sort();
}

/** The page with every region rewritten, and the regions it has. */
function render(spec, ops, source, problems, page) {
  const regions = [];
  const out = source.replace(REGION, (whole, kind, id, current) => {
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
    rendering = `${page} ${id} ${kind}`;
    const written = descriptions(current);
    const unwritten = [];
    const body = table(kind, ROWS[kind](spec, op, written), written, unwritten);
    for (const row of unwritten) {
      const said = row.spec.replace(/\s+/g, ' ').trim();
      problems.push(`${page}: ${id} ${kind} \`${row.name}\` has no 说明${said ? ` (openapi.yaml: "${said.length > 160 ? said.slice(0, 160) + '…' : said}")` : ''}`);
    }
    return `<!-- openapi:${kind} ${id} -->\n\n${body}\n\n<!-- /openapi -->`;
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

// ---- Main --------------------------------------------------------------------

const rowsOf = process.argv.includes('--rows') ? process.argv[process.argv.indexOf('--rows') + 1] : undefined;
const check = process.argv.includes('--check') || rowsOf !== undefined;
const spec = loadSpec();
const ops = operations(spec);
const problems = [];
const stale = [];
const documented = new Set();

if (rowsOf !== undefined) {
  const page = relative(ROOT, join(ROOT, rowsOf));
  render(spec, ops, readFileSync(join(ROOT, page), 'utf8'), [], page);
  for (const row of listing) {
    const said = row.spec.replace(/\s+/g, ' ').trim();
    console.log(`${row.where.slice(page.length + 1)} | ${row.name} | ${row.type ?? ''}${row.type ? (row.required ? ' | 是' : ' | 否') : ''} | 说明: ${row.text || '（空）'}\n    openapi.yaml: ${said || '（无）'}${row.choices ? `\n    enum: ${row.choices.map(String).join(' / ')}` : ''}`);
  }
  process.exit(0);
}

for (const file of pagesUnder(PAGES)) {
  const page = relative(ROOT, file);
  const source = readFileSync(file, 'utf8');
  const { out, regions } = render(spec, ops, source, problems, page);
  regions.forEach((r) => documented.add(r.op.id));
  checkPage(spec, ops, page, out, regions, problems).forEach((id) => documented.add(id));
  if (out === source) continue;
  stale.push(page);
  if (check) problems.push(`${page}: out of date with openapi.yaml; run \`npm run generate\``);
  else {
    writeFileSync(file, out);
    console.log(`updated ${page}`);
  }
}

for (const row of dropped) console.log(`dropped ${row}: openapi.yaml no longer has it`);
console.log(`${documented.size} of ${ops.size} operations have a page; ${ops.size - documented.size} do not.`);
if (problems.length) {
  console.error('\n' + problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
