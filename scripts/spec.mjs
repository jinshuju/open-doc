/**
 * Reading spec/openapi.yaml: its operations, and the schemas they take and
 * answer with, followed through `$ref` and `allOf` so the generator sees one
 * plain object per level.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
export const SPEC_FILE = new URL('../spec/openapi.yaml', import.meta.url);

export function loadSpec(file = SPEC_FILE) {
  return parse(readFileSync(file, 'utf8'));
}

export function lookup(spec, ref) {
  return ref
    .slice(2)
    .split('/')
    .reduce((node, part) => node?.[part.replace(/~1/g, '/').replace(/~0/g, '~')], spec);
}

/** A node with its `$ref` followed, as often as it takes. */
export function deref(spec, node) {
  for (let seen = 0; node?.$ref; seen++) {
    if (seen > 20) throw new Error(`${node.$ref}: a $ref that never ends`);
    node = lookup(spec, node.$ref);
  }
  return node;
}

/** Every operation, keyed by operationId: its method, path, parameters and the operation object. */
export function operations(spec) {
  const out = new Map();
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op?.operationId) continue;
      const parameters = [...(item.parameters ?? []), ...(op.parameters ?? [])].map((p) => deref(spec, p));
      out.set(op.operationId, { id: op.operationId, method: method.toUpperCase(), path, parameters, op });
    }
  }
  return out;
}

/** The request line a page writes for a path: `/forms/{form_token}` → `/forms/FORM_TOKEN`. */
export function placeholderPath(path) {
  return path.replace(/\{([^}]+)\}/g, (_, name) => name.toUpperCase());
}

/** The operation a method and a page's path (placeholders or not) are sent to; a literal segment beats a parameter. */
export function operationAt(ops, method, path) {
  const matches = [...ops.values()].filter((op) => {
    if (op.method !== method) return false;
    const pattern = op.path.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^}]+\}/g, '[^/]+');
    return new RegExp(`^${pattern}$`).test(path);
  });
  const literal = (op) => op.path.replace(/\{[^}]+\}/g, '').length;
  return matches.sort((a, b) => literal(b) - literal(a))[0];
}

/** The name a schema goes by, when it is a `$ref` to one (or an `allOf` of exactly one). */
export function schemaName(node) {
  if (typeof node?.$ref === 'string') return node.$ref.split('/').pop();
  if (Array.isArray(node?.allOf) && node.allOf.length === 1) return schemaName(node.allOf[0]);
  return undefined;
}

/**
 * A schema as one object: `$ref` followed, the members of `allOf` merged in
 * (their properties and required lists; a member with neither, such as an
 * if/then constraint, adds nothing). `oneOf` / `anyOf` stay as they are.
 */
export function flat(spec, node) {
  const s = deref(spec, node);
  if (!s || !Array.isArray(s.allOf)) return s;
  const { allOf, ...own } = s;
  const out = { ...own };
  let properties;
  for (const member of allOf.map((m) => flat(spec, m))) {
    if (!member) continue;
    if (member.properties) properties = { ...properties, ...member.properties };
    if (member.required) out.required = [...new Set([...(out.required ?? []), ...member.required])];
    for (const key of ['type', 'items', 'additionalProperties', 'oneOf', 'anyOf', 'enum', 'format']) {
      if (out[key] === undefined && member[key] !== undefined) out[key] = member[key];
    }
    if (out.description === undefined && member.description !== undefined) out.description = member.description;
  }
  // In the order the members list them, the schema's own last.
  if (properties || own.properties) out.properties = { ...properties, ...own.properties };
  return out;
}

/** The JSON request body schema of an operation, or of its multipart form when that is all it takes. */
export function requestSchema(spec, op) {
  const content = deref(spec, op.op.requestBody)?.content;
  if (!content) return undefined;
  return (content['application/json'] ?? content['multipart/form-data'] ?? Object.values(content)[0])?.schema;
}

/** The first 2xx response of an operation: its status code and body schema (none for an empty body). */
export function successResponse(spec, op) {
  const entry = Object.entries(op.op.responses ?? {}).find(([code]) => code.startsWith('2'));
  if (!entry) return undefined;
  const response = deref(spec, entry[1]);
  const content = response?.content;
  const schema = content && (content['application/json'] ?? Object.values(content)[0])?.schema;
  return { code: entry[0], schema };
}
