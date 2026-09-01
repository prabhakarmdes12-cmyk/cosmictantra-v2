/**
 * PRISMA SCHEMA INVARIANTS.
 *
 * `npx prisma validate` and `prisma format` both need an engine binary from
 * binaries.prisma.sh, which is unreachable here — the same TLS block that
 * makes `prisma generate` fail in postinstall. That means a schema edit can
 * currently reach a branch with nobody having checked it parses, which is how
 * a broken relation ships.
 *
 * This is not a reimplementation of Prisma's validator. It checks the class of
 * mistake that is actually easy to make by hand — a relation with no opposite
 * side, a named relation with the wrong number of ends, a reference to a model
 * that does not exist — plus the identity invariants that V42 depends on and
 * that a well-meaning future edit could quietly undo.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

test.describe.configure({ mode: 'parallel' });

const SCHEMA = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');

interface Field {
  name: string;
  type: string;
  isList: boolean;
  attrs: string;
}
interface Model {
  name: string;
  body: string;
  fields: Field[];
}

function parseModels(src: string): Model[] {
  const models: Model[] = [];
  // Comments can contain braces, so strip them before brace matching.
  const clean = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const re = /^model\s+(\w+)\s*\{/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < clean.length && depth > 0) {
      if (clean[i] === '{') depth += 1;
      else if (clean[i] === '}') depth -= 1;
      i += 1;
    }
    const body = clean.slice(re.lastIndex, i - 1);
    const fields: Field[] = [];
    for (const line of body.split('\n')) {
      const f = /^\s*(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/.exec(line);
      if (!f) continue;
      if (['@@index', '@@unique', '@@id', '@@map'].some((a) => line.trim().startsWith(a))) continue;
      fields.push({ name: f[1], type: f[2], isList: f[3] === '[]', attrs: f[5] ?? '' });
    }
    models.push({ name: m[1], body, fields });
  }
  return models;
}

const MODELS = parseModels(SCHEMA);
const BY_NAME = new Map(MODELS.map((m) => [m.name, m]));
const MODEL_NAMES = new Set(MODELS.map((m) => m.name));
const ENUM_NAMES = new Set([...SCHEMA.matchAll(/^enum\s+(\w+)\s*\{/gm)].map((m) => m[1]));
const SCALARS = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt']);

test('PS-01: the schema parses into models with fields', () => {
  expect(MODELS.length).toBeGreaterThan(10);
  for (const m of MODELS) expect(m.fields.length, `${m.name} has no fields`).toBeGreaterThan(0);
});

test('PS-02: every field type is a scalar, an enum or a declared model', () => {
  const unknown: string[] = [];
  for (const m of MODELS) {
    for (const f of m.fields) {
      if (SCALARS.has(f.type) || ENUM_NAMES.has(f.type) || MODEL_NAMES.has(f.type)) continue;
      unknown.push(`${m.name}.${f.name}: ${f.type}`);
    }
  }
  expect(unknown).toEqual([]);
});

test('PS-03: every relation has an opposite side', () => {
  // Prisma requires both ends. A missing back-relation is the single most
  // common hand-edit error and it fails at generate time, i.e. not here.
  const missing: string[] = [];
  for (const m of MODELS) {
    for (const f of m.fields) {
      if (!MODEL_NAMES.has(f.type)) continue;
      const other = BY_NAME.get(f.type)!;
      const back = other.fields.filter((g) => g.type === m.name);
      if (back.length === 0) missing.push(`${m.name}.${f.name} -> ${f.type} has no opposite field`);
    }
  }
  expect(missing).toEqual([]);
});

test('PS-04: named relations pair up exactly two ends', () => {
  const counts = new Map<string, string[]>();
  for (const m of MODELS) {
    for (const f of m.fields) {
      const named = /@relation\(\s*"([^"]+)"/.exec(f.attrs);
      if (!named) continue;
      const key = `${[m.name, f.type].sort().join('~')}::${named[1]}`;
      counts.set(key, [...(counts.get(key) ?? []), `${m.name}.${f.name}`]);
    }
  }
  const wrong = [...counts.entries()].filter(([, ends]) => ends.length !== 2);
  expect(wrong.map(([k, ends]) => `${k}: ${ends.join(', ')}`)).toEqual([]);
});

test('PS-05: every @relation(fields:) names real scalar fields on the same model', () => {
  const bad: string[] = [];
  for (const m of MODELS) {
    for (const f of m.fields) {
      const rel = /@relation\([^)]*fields:\s*\[([^\]]+)\]/.exec(f.attrs);
      if (!rel) continue;
      for (const raw of rel[1].split(',')) {
        const name = raw.trim();
        if (!m.fields.some((g) => g.name === name)) bad.push(`${m.name}.${f.name} references missing field ${name}`);
      }
    }
  }
  expect(bad).toEqual([]);
});

/* ══════════ V42 identity invariants ══════════ */

test('PS-06: credentials do NOT live on the account', () => {
  // This is the bug the V42 identity work exists to remove. Putting
  // authChannel/authSubject back on PjosAccount recreates "one human, two
  // accounts, no way back".
  const account = BY_NAME.get('PjosAccount');
  expect(account, 'PjosAccount must exist').toBeTruthy();
  const names = account!.fields.map((f) => f.name);
  expect(names).not.toContain('authChannel');
  expect(names).not.toContain('authSubject');
  expect(account!.body).not.toContain('@@unique([authChannel, authSubject])');
});

test('PS-07: a credential is globally unique, so a fork is detectable', () => {
  const identity = BY_NAME.get('PjosAuthIdentity');
  expect(identity, 'PjosAuthIdentity must exist').toBeTruthy();
  // Without this, two accounts can hold the same phone number and the merge
  // path never fires.
  expect(identity!.body.replace(/\s+/g, ' ')).toContain('@@unique([channel, subject])');
  expect(identity!.fields.map((f) => f.name)).toContain('accountId');
});

test('PS-08: an account can be merged away without being deleted', () => {
  const account = BY_NAME.get('PjosAccount')!;
  expect(account.fields.map((f) => f.name)).toContain('mergedIntoId');
  // Consent rows and audit rows point at absorbed accounts; deleting one
  // would destroy the DPDP record it is holding up.
  const merged = account.fields.find((f) => f.name === 'mergedInto');
  expect(merged?.attrs ?? '').toContain('onDelete: SetNull');
});

test('PS-09: the merge audit is one row per absorbed account', () => {
  const merge = BY_NAME.get('PjosAccountMerge');
  expect(merge, 'PjosAccountMerge must exist').toBeTruthy();
  // An account can only be absorbed once; a second row would mean the chain
  // forked.
  expect(merge!.body.replace(/\s+/g, ' ')).toContain('@@unique([absorbedAccountId])');
});

test('PS-10: an anonymous session stores a hash, never a raw token', () => {
  const session = BY_NAME.get('PjosAnonymousSession');
  expect(session, 'PjosAnonymousSession must exist').toBeTruthy();
  const names = session!.fields.map((f) => f.name);
  expect(names).toContain('tokenHash');
  expect(names, 'a raw token field would make a database leak hand out live sessions')
    .not.toContain('token');
  expect(session!.body.replace(/\s+/g, ' ')).toContain('tokenHash String @unique');
});

test('PS-11: losing a session or an account never cascades into deleting a Person', () => {
  // A Person is the user's chart. It must outlive the plumbing that points at
  // it, or an expired session cleanup silently destroys their data.
  const session = BY_NAME.get('PjosAnonymousSession')!;
  const personLink = session.fields.find((f) => f.name === 'person');
  expect(personLink?.attrs ?? '').toContain('onDelete: SetNull');
  const accountLink = session.fields.find((f) => f.name === 'claimedBy');
  expect(accountLink?.attrs ?? '').toContain('onDelete: SetNull');
});

test('PS-12: consent stays append-only', () => {
  const consent = BY_NAME.get('PjosConsentRecord');
  expect(consent, 'PjosConsentRecord must exist').toBeTruthy();
  // No updatedAt: a row that can be updated is not an append-only record, and
  // the merge path depends on consent being immutable history.
  expect(consent!.fields.map((f) => f.name)).not.toContain('updatedAt');
});
