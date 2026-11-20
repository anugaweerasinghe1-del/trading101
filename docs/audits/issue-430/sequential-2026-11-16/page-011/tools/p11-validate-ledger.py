"""Validate a declared reviewed subset; this does not supply editorial judgments."""
import argparse, hashlib, json
from pathlib import Path

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()

def validate(root, ledger=None):
    root = Path(root)
    index = json.loads((root / 'REVIEW-INDEX.json').read_text())
    rows = ledger if ledger is not None else json.loads((root / 'block-ledger.json').read_text())
    bank = json.loads((root / 'published-bank.json').read_text())
    quick = json.loads((root / 'quick-and-bonus.json').read_text())
    errors = []
    ids = [r['id'] for r in rows]
    if len(ids) != len(set(ids)):
        errors.append('Duplicate block ID')
    if set(ids) != set(index['expectedBlockIds']):
        errors.append('Reviewed subset differs from the declared index')
    if digest(bank) != index['publishedBankCanonicalSHA256']:
        errors.append('Published bank version changed')
    cases = set()
    questions = 0
    for r in rows:
        if digest(r['content']) != r['sha256']:
            errors.append(r['id'] + ': content hash mismatch')
        for phase in ['pass1', 'pass2']:
            result = r.get(phase, {})
            if result.get('status') != 'REVIEWED' or not result.get('reason') or not result.get('reviewer'):
                errors.append(r['id'] + ': incomplete ' + phase)
        references = [value.strip() for value in r.get('contentReference', '').split(';')]
        reference = references[0]
        for extra in references[1:]:
            if not (root / extra.split('#')[0]).is_file():
                errors.append(r['id'] + ': missing secondary evidence reference')
        if reference.startswith('published-bank.json#/exercises/'):
            try:
                ix = int(reference.split('/')[-1])
                exercise = bank['exercises'][ix]
                suffix = r['id'].split('DEEP-' + exercise['id'] + '-')[1]
                target = {'brief': exercise['scenario'], 'visual': exercise['visual'], 'takeaway': exercise['reflectionGuide'], 'sources': exercise['sources'], 'unused-reflection': exercise['reflection']}
                expected = exercise['questions'][int(suffix[1:]) - 1] if suffix.startswith('q') else target[suffix]
                if r['content'] != expected:
                    errors.append(r['id'] + ': bank source reconciliation mismatch')
                cases.add(exercise['id'])
                questions += int(suffix.startswith('q'))
            except (ValueError, KeyError, IndexError):
                errors.append(r['id'] + ': invalid bank reference')
        elif reference.startswith('quick-and-bonus.json#/'):
            try:
                value = quick
                for part in reference.split('#/')[1].split('/'):
                    value = value[int(part)] if isinstance(value, list) else value[part]
                if value != r['content']:
                    errors.append(r['id'] + ': quick/bonus source mismatch')
            except (ValueError, KeyError, IndexError):
                errors.append(r['id'] + ': invalid quick/bonus reference')
        elif not (root / reference.split('#')[0]).is_file():
            errors.append(r['id'] + ': missing evidence reference')
    if questions != index['deepQuestionsReviewed'] or sorted(cases) != sorted(index['deepCasesReviewed']):
        errors.append('Deep-case declared coverage mismatch')
    result = dict(recordedGroups=len(rows), firstPass=sum(r.get('pass1', {}).get('status') == 'REVIEWED' for r in rows), secondPass=sum(r.get('pass2', {}).get('status') == 'REVIEWED' for r in rows), deepCases=len(cases), deepQuestions=questions, errors=errors, strictPageClosure=False, scope='Validation of the explicitly declared reviewed subset only. This is not an editorial reread, full-page eligibility reconciliation or page closure.')
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root')
    parser.add_argument('--require-closed', action='store_true')
    args = parser.parse_args()
    result = validate(args.root)
    print(json.dumps(result, indent=2))
    raise SystemExit(bool(result['errors']) or (args.require_closed and not result['strictPageClosure']))
