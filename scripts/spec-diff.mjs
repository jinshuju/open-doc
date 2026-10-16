/**
 * What changed between two copies of openapi.yaml, for whoever brings the docs
 * up to date with it:
 *
 * - operations added, which no page documents yet;
 * - operations removed, and the pages that still name them;
 * - operations a page documents whose request or response changed shape (a
 *   parameter, a property, a type, an enum, a required list, a status code).
 *   The tables of those pages are regenerated, but their hand-written parts
 *   (the JSON examples, the notes) are not, so they are the ones to read again.
 *
 * Prose (descriptions, summaries, examples) does not count as a change of
 * shape: a reworded description shows up as an untranslated string instead.
 *
 * Usage: node scripts/spec-diff.mjs <old openapi.yaml> <new openapi.yaml>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec, lookup, operations } from './spec.mjs';

const [before, after] = process.argv.slice(2);
if (!before || !after) {
  console.error('usage: node scripts/spec-diff.mjs <old openapi.yaml> <new openapi.yaml>');
  process.exit(1);
}
const oldSpec = loadSpec(before);
const newSpec = loadSpec(after);
const oldOps = operations(oldSpec);
const newOps = operations(newSpec);

/** operationId → the pages whose markers name it. */
function pagesByOperation() {
  const docs = fileURLToPath(new URL('../docs', import.meta.url));
  const out = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.md')) {
        for (const [, id] of readFileSync(file, 'utf8').matchAll(/<!-- openapi:\w+ (\w+) -->/g)) {
          const page = 'docs' + file.slice(docs.length);
          out.set(id, [...new Set([...(out.get(id) ?? []), page])]);
        }
      }
    }
  };
  walk(docs);
  return out;
}

const PROSE = new Set(['description', 'summary', 'title', 'example', 'examples', 'externalDocs']);
const SCHEMA_REF = '#/components/schemas/';

function withoutProse(node) {
  if (Array.isArray(node)) return node.map(withoutProse);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node).filter(([key]) => !PROSE.has(key)).map(([key, value]) => [key, withoutProse(value)]));
}

/** A node with references to parameters and responses followed; schemas stay named. */
function expanded(spec, node) {
  if (Array.isArray(node)) return node.map((item) => expanded(spec, item));
  if (!node || typeof node !== 'object') return node;
  if (typeof node.$ref === 'string' && !node.$ref.startsWith(SCHEMA_REF)) return expanded(spec, lookup(spec, node.$ref));
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, expanded(spec, value)]));
}

/** Every named schema a node refers to, and those refer to, and so on. */
function reach(spec, node, found = new Set()) {
  if (Array.isArray(node)) node.forEach((item) => reach(spec, item, found));
  else if (node && typeof node === 'object') {
    if (typeof node.$ref === 'string' && node.$ref.startsWith(SCHEMA_REF)) {
      const name = node.$ref.slice(SCHEMA_REF.length);
      if (!found.has(name)) {
        found.add(name);
        reach(spec, spec.components?.schemas?.[name], found);
      }
    }
    for (const value of Object.values(node)) reach(spec, value, found);
  }
  return found;
}

function shape(spec, op) {
  const node = expanded(spec, { parameters: op.parameters, body: op.op.requestBody, responses: op.op.responses });
  return { own: JSON.stringify(withoutProse(node)), schemas: reach(spec, node) };
}

const schemaText = (spec, name) => JSON.stringify(withoutProse(spec.components?.schemas?.[name]));
function changedShape(id) {
  const old = shape(oldSpec, oldOps.get(id));
  const now = shape(newSpec, newOps.get(id));
  return old.own !== now.own || [...now.schemas].some((name) => schemaText(oldSpec, name) !== schemaText(newSpec, name));
}

const pages = pagesByOperation();
const describe = (ops, id) => `\`${ops.get(id).method} ${ops.get(id).path}\` (\`${id}\`)`;
const onPages = (id) => pages.get(id).map((p) => `\`${p}\``).join(', ');
const added = [...newOps.keys()].filter((id) => !oldOps.has(id)).sort();
const removed = [...oldOps.keys()].filter((id) => !newOps.has(id)).sort();
const changed = [...newOps.keys()].filter((id) => oldOps.has(id) && pages.has(id) && changedShape(id)).sort();

const sections = [];
if (added.length) {
  sections.push(['Operations added; no page documents them, and whether one should is for a person to decide:', added.map((id) => `- ${describe(newOps, id)}`)]);
}
if (removed.length) {
  sections.push(['Operations removed:', removed.map((id) => `- ${describe(oldOps, id)}${pages.has(id) ? ` — still documented on ${onPages(id)}` : ''}`)]);
}
if (changed.length) {
  sections.push([
    'Documented operations whose request or response changed shape; read the hand-written examples and notes on their pages again:',
    changed.map((id) => `- ${describe(newOps, id)} — ${onPages(id)}`),
  ]);
}
console.log(sections.length ? sections.map(([head, lines]) => [head, ...lines].join('\n')).join('\n\n') : 'No operation was added or removed, and none a page documents changed shape.');
