/** Serving is disabled pending a separately reviewed approval/consent/placement release. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const loader=/<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:googlesyndication\.com|doubleclick\.net)[^"']*["'][^>]*>/i;
function verify(file){const html=readFileSync(file,'utf8');assert.doesNotMatch(html,loader,file+': ad-serving script bypasses disabled inventory');assert.doesNotMatch(html,/<ins\b[^>]*class=["'][^"']*adsbygoogle/i,file+': unreviewed ad placement');}
verify('index.html');
assert.match(readFileSync('index.html','utf8'),/<meta name="google-adsense-account" content="ca-pub-4160578126993254"/,'Publisher ownership verification retained');
assert.match(readFileSync('public/ads.txt','utf8'),/google\.com, pub-4160578126993254, DIRECT/);
let checked=0;
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory())walk(file);else if(file.endsWith('.html')){verify(file);checked++;}}}
if(existsSync('dist'))walk('dist');
console.log('PASS disabled advertising bootstrap, retained publisher verification; compiled HTML checked: '+checked);
