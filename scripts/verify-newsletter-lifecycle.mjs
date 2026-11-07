/** Execute the real Edge handler with isolated storage and a non-network email sink. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';

const sentinel = 'ISOLATED_NEWSLETTER_PROVIDER_CREDENTIAL';
function fixture() {
  const contacts = [], emails = [];
  let limited = false, unavailable = false, delivery = true, dbCalls = 0, writes = 0;
  class Query {
    constructor(table) { assert.equal(table, 'newsletter_contacts'); this.filters = []; this.operation = 'select'; }
    select(_columns, options = {}) { this.options = options; return this; }
    update(patch) { this.operation = 'update'; this.patch = patch; return this; }
    insert(record) { this.operation = 'insert'; this.record = record; return this; }
    eq(key, value) { this.filters.push(row => row[key] === value); return this; }
    in(key, values) { this.filters.push(row => values.includes(row[key])); return this; }
    gt(key, value) { this.filters.push(row => row[key] > value); return this; }
    gte(key, value) { this.filters.push(row => row[key] >= value); return this; }
    maybeSingle() { this.single = true; return this; }
    then(resolve, reject) { return Promise.resolve().then(() => this.execute()).then(resolve, reject); }
    execute() {
      dbCalls++;
      if (unavailable) return { data: null, count: null, error: { message: 'PRIVATE_DB_SENTINEL' } };
      if (this.operation === 'insert') {
        if (contacts.some(row => row.email === this.record.email)) return { error: { code: '23505' } };
        contacts.push({ id: 'fixture-' + contacts.length, unsubscribe_token: String(contacts.length + 1).padStart(64, 'a'), ...this.record });
        writes++; return { data: null, error: null };
      }
      const selected = contacts.filter(row => this.filters.every(test => test(row)));
      if (this.operation === 'update') for (const row of selected) { Object.assign(row, this.patch); writes++; }
      return { data: this.single ? (selected[0] ? structuredClone(selected[0]) : null) : structuredClone(selected),
        count: this.options?.count === 'exact' ? selected.length : null, error: null };
    }
  }
  const source = readFileSync('supabase/functions/newsletter-public/index.ts', 'utf8');
  const imports = source.match(/^import .*;$/gm);
  assert.equal(imports?.length, 2, 'Review added runtime dependencies before using this isolated loader');
  const code = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  let handler;
  const environment = { SUPABASE_URL: 'https://fixture.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-only',
    RESEND_API_KEY: sentinel, NEWSLETTER_FROM_EMAIL: 'newsletter@example.invalid' };
  new Function('createClient', 'allow', 'clientIp', 'Deno', 'fetch', 'crypto', code)(
    () => ({ from: table => new Query(table) }), async () => !limited, () => 'fixture-pseudonymous-subject',
    { env: { get: name => environment[name] }, serve: callback => { handler = callback; } },
    async (url, init) => {
      assert.equal(url, 'https://api.resend.com/emails', 'Unexpected network destination');
      assert.equal(init.method, 'POST');
      assert.equal(init.headers.Authorization, 'Bearer ' + sentinel);
      assert.deepEqual(Object.keys(init.headers).sort(), ['Authorization', 'Content-Type', 'Idempotency-Key'].sort(), 'Visitor credentials/IP/cookies must not reach provider');
      const message = JSON.parse(init.body);
      assert.ok(message.to.every(address => address.endsWith('@example.invalid')), 'Only synthetic recipients permitted');
      emails.push(message);
      return Response.json(delivery ? { id: 'fixture-provider-receipt' } : { error: 'PRIVATE_PROVIDER_SENTINEL' }, { status: delivery ? 200 : 503 });
    }, webcrypto,
  );
  assert.equal(typeof handler, 'function');
  const request = (body, { method = 'POST', url = 'https://fixture.invalid/newsletter-public', form = false } = {}) => handler(new Request(url, {
    method, headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json',
      Cookie: 'visitor-private-cookie', Authorization: 'Bearer visitor-private-token', 'X-Forwarded-For': '192.0.2.1' },
    ...(['GET', 'OPTIONS'].includes(method) ? {} : { body: form ? body : JSON.stringify(body) }),
  }));
  return { contacts, emails, request, environment,
    set limited(value) { limited = value; }, set unavailable(value) { unavailable = value; }, set delivery(value) { delivery = value; },
    get dbCalls() { return dbCalls; }, get writes() { return writes; } };
}
const realFetch = globalThis.fetch;
let unexpectedNetworkCalls = 0;
globalThis.fetch = async () => { unexpectedNetworkCalls++; throw Error('Real network forbidden in newsletter fixture'); };
try {
const input = email => ({ action: 'subscribe', email, consent: true, honeypot: '' });
const lab = fixture();
assert.equal((await lab.request(null, { method: 'OPTIONS' })).status, 204);
assert.equal((await lab.request(null, { method: 'GET' })).status, 405);
assert.equal(lab.dbCalls, 0);
for (const body of [input('bad-email'), { ...input('reader@example.invalid'), consent: false }, { ...input('reader@example.invalid'), honeypot: 'bot' }])
  assert.equal((await lab.request(body)).status, 400);
assert.equal(lab.writes, 0); assert.equal(lab.emails.length, 0);
const accepted = await (await lab.request(input(' READER@example.invalid '))).json();
assert.match(accepted.message, /If the address is eligible/);
assert.equal(lab.contacts[0].email, 'reader@example.invalid');
assert.equal(lab.contacts[0].status, 'pending', 'Sending confirmation cannot activate consent');
assert.equal(lab.emails.length, 1);
const token = /#token=([a-f0-9]{64})/.exec(lab.emails[0].text)?.[1];assert.ok(token);
assert.notEqual(lab.contacts[0].confirmation_token_hash, token, 'Confirmation token stored only as digest');
assert.doesNotMatch(JSON.stringify(accepted), new RegExp(token + '|' + sentinel));
assert.deepEqual(await (await lab.request(input('reader@example.invalid'))).json(), accepted);
assert.equal(lab.emails.length, 1, 'Cooldown cannot resend');
assert.equal((await lab.request({ action: 'confirm', token: 'bad' })).status, 400);
lab.contacts[0].confirmation_expires_at = new Date(Date.now() - 60_000).toISOString();
assert.equal((await (await lab.request({ action: 'confirm', token })).json()).confirmed, false);
assert.equal(lab.contacts[0].status, 'pending', 'Expired token cannot activate a contact');
lab.contacts[0].confirmation_expires_at = new Date(Date.now() + 60_000).toISOString();
const raced = await Promise.all(Array.from({ length: 8 }, async () => (await lab.request({ action: 'confirm', token })).json()));
assert.equal(raced.filter(result => result.confirmed).length, 1, 'Confirmation token consumed atomically');
assert.equal(lab.contacts[0].status, 'confirmed');assert.equal(lab.contacts[0].confirmation_token_hash, null);
assert.equal(lab.emails.length, 1, 'Confirmation sends no newsletter');
assert.deepEqual(await (await lab.request(input('reader@example.invalid'))).json(), accepted);
assert.equal(lab.emails.length, 1, 'Confirmed address cannot be resent confirmation');
const unsubscribeToken = lab.contacts[0].unsubscribe_token;
assert.equal((await lab.request(null, { method: 'GET', url: 'https://fixture.invalid/newsletter-public?token=' + unsubscribeToken })).status, 405);
assert.equal(lab.contacts[0].status, 'confirmed', 'GET/link scanners cannot unsubscribe');
assert.equal((await lab.request('invalid=body', { form: true, url: 'https://fixture.invalid/newsletter-public?token=' + unsubscribeToken })).status, 400);
assert.equal(lab.contacts[0].status, 'confirmed');
assert.equal((await lab.request('List-Unsubscribe=One-Click', { form: true, url: 'https://fixture.invalid/newsletter-public?token=' + unsubscribeToken })).status, 200);
assert.equal(lab.contacts[0].status, 'unsubscribed');
assert.equal((await (await lab.request({ action: 'confirm', token })).json()).confirmed, false, 'Old token cannot restore unsubscribed contact');
assert.deepEqual(await (await lab.request(input('reader@example.invalid'))).json(), accepted);
assert.equal(lab.contacts[0].status, 'unsubscribed');assert.equal(lab.emails.length, 1, 'No involuntary resubscription or resend');
assert.equal((await (await lab.request({ action: 'unsubscribe', token: unsubscribeToken })).json()).unsubscribed, true, 'Repeat unsubscribe is idempotent');
assert.equal((await (await lab.request({ action: 'unsubscribe', token: 'a'.repeat(64) })).json()).unsubscribed, false);
const failed = fixture();failed.delivery = false;
const failure = await failed.request(input('failed@example.invalid'));
assert.equal(failure.status, 503);assert.doesNotMatch(await failure.text(), /PRIVATE_PROVIDER|ISOLATED_/);
assert.equal(failed.contacts[0].status, 'pending', 'Provider rejection never confirms a contact');
const missing = fixture();delete missing.environment.RESEND_API_KEY;
assert.equal((await missing.request(input('missing@example.invalid'))).status, 503);assert.equal(missing.emails.length, 0);
const down = fixture();down.unavailable = true;
assert.equal((await down.request(input('unavailable@example.invalid'))).status, 503);assert.equal(down.emails.length, 0);
const denied = fixture();denied.limited = true;
assert.equal((await denied.request(input('denied@example.invalid'))).status, 429);assert.equal(denied.dbCalls, 0);assert.equal(denied.emails.length, 0);
const full = fixture();
for (let i = 0; i < 30; i++) full.contacts.push({ id: 'quota-' + i, email: i + '@example.invalid', confirmation_sent_at: new Date().toISOString() });
assert.equal((await full.request(input('over-budget@example.invalid'))).status, 429);assert.equal(full.emails.length, 0);assert.equal(full.writes, 0);
assert.equal(unexpectedNetworkCalls, 0, 'No global network request is permitted');
console.log('PASS actual newsletter HTTP lifecycle: consent, hash/expiry/single-use confirmation, no GET mutation, one-click/idempotent unsubscribe, no resubscribe, provider/config/database/quota failures, private headers excluded; synthetic storage and non-network email sink only.');

// Exact-count failures must never become authoritative zero-subscriber totals.
const dispatchSource = readFileSync('supabase/functions/newsletter-dispatch/index.ts', 'utf8');
assert.equal(dispatchSource.match(/^import .*;$/gm)?.length, 3);
const dispatchCode = ts.transpileModule(dispatchSource.replace(/^import .*;\r?\n/gm, ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
function statusFixture(failedStatus, failure) {
  let handler, requests = 0, providerCalls = 0;
  class StatusQuery {
    constructor(table) { assert.ok(['newsletter_contacts', 'newsletter_deliveries'].includes(table)); }
    select(_columns, options = {}) { this.head = options.head; return this; }
    eq(_key, status) { this.status = status; return this; }
    order() { return this; } limit() { return this; }
    then(resolve, reject) {
      requests++;
      return Promise.resolve(this.head ? this.status === failedStatus ? failure
        : { count: this.status === 'confirmed' ? 3 : 0, error: null } : { data: [], error: null }).then(resolve, reject);
    }
  }
  new Function('createClient', 'allow', 'clientIp', 'verifyNewsletterDispatchOwner', 'Deno', 'fetch', dispatchCode)(
    () => ({ from: table => new StatusQuery(table) }), async () => true, () => 'synthetic',
    async () => { throw Error('Status cannot invoke a publishing-owner action'); },
    { env: { get: key => key === 'ADMIN_MASTER_KEY' ? sentinel : 'fixture' }, serve: value => { handler = value; } },
    async () => { providerCalls++; throw Error('Status must never send mail'); },
  );
  return { call: key => handler(new Request('https://fixture.invalid/newsletter-dispatch', {
    method: 'POST', headers: { 'x-admin-key': key ?? sentinel, 'Content-Type': 'application/json' }, body: '{"action":"status"}',
  })), get requests() { return requests; }, get providerCalls() { return providerCalls; } };
}
const healthyStatus = statusFixture();
const totals = await (await healthyStatus.call()).json();
assert.deepEqual(totals.data.counts, { confirmed: 3, unsubscribed: 0, pending: 0, bounced: 0 }, 'Known zeros remain real zeros');
for (const state of ['confirmed', 'unsubscribed', 'pending', 'bounced']) for (const fault of [
  { count: null, error: { message: 'PRIVATE_COUNT_DETAIL' } }, { count: null, error: null },
  { count: -1, error: null }, { count: 1.5, error: null },
]) {
  const failedCount = statusFixture(state, fault), response = await failedCount.call();
  assert.equal(response.status, 503, state + ' failed count must be unavailable, not zero');
  assert.doesNotMatch(await response.text(), /PRIVATE_COUNT_DETAIL/);
  assert.equal(failedCount.providerCalls, 0);
}
const deniedStatus = statusFixture();assert.equal((await deniedStatus.call('incorrect')).status, 401);
assert.equal(deniedStatus.requests, 0);assert.equal(deniedStatus.providerCalls, 0);
assert.equal(unexpectedNetworkCalls, 0, 'No global network request during status tests');
console.log('PASS actual newsletter status handler: exact counts, real zeros, count errors/null/invalid totals fail closed, denied key before reads, zero sends.');

} finally { globalThis.fetch = realFetch; }
