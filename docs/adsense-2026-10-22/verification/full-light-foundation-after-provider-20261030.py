from pathlib import Path
import time,subprocess
receipt=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence/PR268-PRODUCTION-PROVIDERS.json')
deadline=time.monotonic()+1200
print('Waiting for authenticated exact-production receipt before six-route collection.',flush=True)
while not receipt.exists():
 if time.monotonic()>deadline:raise RuntimeError('Provider-proof wait expired; no collection credited')
 time.sleep(5)
subprocess.run(['python','/workspace/scratch/tradehq-audit/full-light-foundation-run-20261030.py'],check=True)
