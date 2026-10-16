/**
 * What changed between two copies of openapi.yaml, for the spec-sync pull
 * request: the operations that came and went, and whether a page documents
 * them. What moved inside an operation a page documents shows in the diff of
 * that page; this says what the diff cannot, an operation no page names yet.
 *
 * Usage: node scripts/spec-diff.mjs <old openapi.yaml> <new openapi.yaml>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec, operations } from './spec.mjs';

const [before, after] = process.argv.slice(2);
if (!before || !after) {
  console.error('usage: node scripts/spec-diff.mjs <old openapi.yaml> <new openapi.yaml>');
  process.exit(1);
}
const oldOps = operations(loadSpec(before));
const newOps = operations(loadSpec(after));

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

const pages = pagesByOperation();
const describe = (ops, id) => `\`${ops.get(id).method} ${ops.get(id).path}\` (\`${id}\`)`;
const added = [...newOps.keys()].filter((id) => !oldOps.has(id)).sort();
const removed = [...oldOps.keys()].filter((id) => !newOps.has(id)).sort();

const lines = [];
if (added.length) {
  lines.push('Operations added to openapi.yaml. A page for one is a decision for this repository, not something the sync makes:');
  for (const id of added) lines.push(`- ${describe(newOps, id)}`);
}
if (removed.length) {
  if (lines.length) lines.push('');
  lines.push('Operations removed from openapi.yaml:');
  for (const id of removed) {
    const on = pages.get(id);
    lines.push(`- ${describe(oldOps, id)}${on ? ` — still documented on ${on.map((p) => `\`${p}\``).join(', ')}` : ''}`);
  }
}
console.log(lines.length ? lines.join('\n') : 'No operation was added or removed.');
