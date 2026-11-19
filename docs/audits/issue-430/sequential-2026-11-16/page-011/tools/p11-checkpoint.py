"""Checkpoint completed, explicitly scoped reads without granting page closure."""
import argparse, csv, datetime, importlib.util, json, os, re
from pathlib import Path
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
import sys
sys.dont_write_bytecode = True
parser = argparse.ArgumentParser()
parser.add_argument('page_root')
args = parser.parse_args()
p = Path(args.page_root)
root = p.parent
rows = json.loads((p / 'block-ledger.json').read_text())
bank = json.loads((p / 'published-bank.json').read_text())
spec = importlib.util.spec_from_file_location('p11_validator', p / 'tools/p11-validate-ledger.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)
assert all(r.get(phase, {}).get('status') == 'REVIEWED' for r in rows for phase in ['pass1', 'pass2']), 'Pending substantive reads must be completed before this checkpoint'
by_case = {}
for row in rows:
    match = re.search(r'-DEEP-(practice-\d+)-(.*)$', row['id'])
    if match:
        by_case.setdefault(match[1], set()).add(match[2])
expected = {'brief', 'visual', 'takeaway', 'sources', 'unused-reflection'} | {f'q{i:02}' for i in range(1, 11)}
assert all(groups == expected for groups in by_case.values()), 'A case is missing reviewed groups'
case_ids = sorted(by_case)
remaining = [i for i, case in enumerate(bank['exercises']) if case['id'] not in by_case]
assert remaining, 'Full bank reading alone still requires separate framework/state closure; revise the exact pointer before continuing'
next_index = remaining[0]
next_id = bank['exercises'][next_index]['id']
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
next_action = f'Continue P11 at published-bank.json#/exercises/{next_index}: {next_id}, briefing/visual then questions 1–10. Remaining {len(remaining)} cases/{10 * len(remaining)} questions plus publisher/framework, control/date/source/citation/media reconciliation and strict closure gates remain unfinished.'
index = dict(asOfUTC=now, expectedBlockIds=[r['id'] for r in rows], deepCasesReviewed=case_ids, deepQuestionsReviewed=10 * len(case_ids), publishedBankCanonicalSHA256=v.digest(bank), strictPageClosure=False, scope='Declared reviewed subset only. This does not prove all eligible P11 content or states were reviewed.')
(p / 'REVIEW-INDEX.json').write_text(json.dumps(index, indent=2) + '\n')
result = v.validate(p)
assert not result['errors'], result
(p / 'LEDGER-VALIDATION.json').write_text(json.dumps(result, indent=2) + '\n')
coverage = json.loads((p / 'COVERAGE.json').read_text())
coverage.update(firstPass=len(rows), secondPass=len(rows), deepQuestionGroupsReviewed=10 * len(case_ids), deepQuestionGroupsSecondRead=10 * len(case_ids), deepExercisesSubstantivelyRead=len(case_ids), pendingDeepExercises=len(remaining), nextAction=next_action)
(p / 'COVERAGE.json').write_text(json.dumps(coverage, indent=2) + '\n')
state = json.loads((root / 'RUN-STATE.json').read_text())
state.update(updatedAtUTC=now, nextStep=next_action)
state['activeAssignment']['nextExactContentState'] = next_action
state['currentScoreboard'].update(asOfUTC=now, currentBlock=next_action)
state['currentDailyCoverage'].update(firstPassRecords=len(rows), secondPassRecords=len(rows), deepQuestionsReviewed=10 * len(case_ids), deepCasesSubstantivelyRead=len(case_ids), pendingDeepCases=len(remaining))
(root / 'RUN-STATE.json').write_text(json.dumps(state, indent=2) + '\n')
queue_path = root / 'page-queue.csv'
with queue_path.open(newline='') as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    queue = list(reader)
for row in queue:
    if row['page_id'] == 'STRICT-0011':
        for key in ['extracted_blocks', 'pass1_reviewed_blocks', 'pass2_reviewed_blocks']:
            row[key] = str(len(rows))
        row['closure_reason'] = f'{len(rows)} overlapping content/version/state groups read twice. {len(case_ids)}/50 deep cases and {10 * len(case_ids)}/500 questions reviewed. ' + next_action + ' No page closure credit.'
with queue_path.open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(queue)
print(json.dumps(dict(validation=result, nextAction=next_action), indent=2))
