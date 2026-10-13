/** Produces a review artifact only. No DB connection, migration runner or network access. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function body(sql,guardMessage) {
  const start=sql.indexOf('BEGIN;\nDO $$ BEGIN\n');
  const end=sql.indexOf('END $$;\n',start)+ 'END $$;\n'.length;
  assert.ok(start>=0 && end>start && sql.slice(start,end).includes(guardMessage)
    && sql.trimEnd().endsWith('COMMIT;'),'Reviewed offline SQL envelope changed');
  return sql.slice(end).trimEnd().slice(0,-'COMMIT;'.length).trim();
}
export function generateStoppedControlInstallation(ownerId) {
  assert.ok(uuid.test(ownerId||''),'Explicit verified account UUID required; email is not authority');
  const core=body(readFileSync('docs/proposals/repair-control-prototype.sql','utf8'),'Offline prototype requires an explicit local test context');
  const receipts=body(readFileSync('docs/proposals/repair-approval-receipts.sql','utf8'),'Offline receipt extension requires an explicit local test context');
  const access=readFileSync('docs/proposals/repair-control-owner-access.sql','utf8');
  return `-- Review artifact: stopped installation, no runner activation or grants to repair actions.\nBEGIN;\nDO $$ BEGIN\n IF current_setting('tradehq.repair_control_install',true) IS DISTINCT FROM 'owner-approved-stopped-v1' THEN\n  RAISE EXCEPTION 'Explicit approved stopped-control installation context required';\n END IF;\nEND $$;\nSET LOCAL tradehq.repair_owner_id='${ownerId}';\n${core}\n${receipts}\n${access}\nCOMMIT;\n`;
}
