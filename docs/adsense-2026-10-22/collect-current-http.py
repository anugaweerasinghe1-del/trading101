"""Read-only public GETs with normal TLS verification; no accounts or mutations."""
import concurrent.futures, datetime, html, json, pathlib, re, subprocess, tempfile

root = pathlib.Path(__file__).resolve().parent
rows = [r for r in json.loads((root / 'PAGE-AUDIT.json').read_text())['rows'] if r['publicScope']]

def collect(row):
    with tempfile.TemporaryDirectory(prefix='tradehq-audit-http-') as tmp:
        body = pathlib.Path(tmp) / 'body'
        headers = pathlib.Path(tmp) / 'headers'
        result = subprocess.run([
            'curl', '--silent', '--show-error', '--location', '--max-redirs', '5',
            '--max-time', '35', '--proto', '=https', '--proto-redir', '=https',
            '--compressed', '--output', str(body), '--dump-header', str(headers),
            '--write-out', '%{http_code}\n%{url_effective}\n%{num_redirects}', row['url']
        ], capture_output=True, text=True)
        fields = result.stdout.splitlines()
        raw = body.read_text(errors='replace') if body.exists() else ''
        head = headers.read_text(errors='replace') if headers.exists() else ''
        canonical = re.search(r'<link\b[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', raw, re.I)
        robots = re.search(r'<meta\b[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)', raw, re.I)
        return {
            'path': row['path'], 'url': row['url'],
            'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'status': int(fields[0]) if fields and fields[0].isdigit() else None,
            'finalUrl': fields[1] if len(fields) > 1 else None,
            'redirectCount': int(fields[2]) if len(fields) > 2 else None,
            'curlExit': result.returncode,
            'initialHTMLCanonical': html.unescape(canonical[1]) if canonical else None,
            'initialHTMLRobots': html.unescape(robots[1]) if robots else None,
            'robotsHeaders': re.findall(r'^x-robots-tag:\s*(.+)$', head, re.I | re.M),
            'error': result.stderr[:300] if result.returncode else None,
            'scope': 'Public initial response; hydrated metadata and editorial quality assessed separately.'
        }

results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for result in pool.map(collect, rows):
        results.append(result)
        if len(results) % 50 == 0:
            print('Collected', len(results), 'public HTTP responses', flush=True)
out = {'scope': 'Fresh individual public GETs; normal TLS, four concurrent requests, no authentication/writes. Status is observation, not editorial approval.', 'count': len(results), 'results': results}
(root / 'evidence/CURRENT-PUBLIC-HTTP.json').write_text(json.dumps(out, indent=2))
print(json.dumps({'collected': len(results), 'non200': [{'path': r['path'], 'status': r['status'], 'curlExit': r['curlExit']} for r in results if r['status'] != 200 or r['curlExit']]}))
