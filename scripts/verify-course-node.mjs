import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import ts from "typescript";

// Exercise the deployed ESM format with native Node, without the tsx loader.
const temporary = mkdtempSync(join(tmpdir(), "tradehq-course-node-"));
try {
  const config = JSON.parse(readFileSync("tsconfig.json", "utf8"));
  const options = ts.convertCompilerOptionsFromJson(config.compilerOptions, process.cwd()).options;
  const modules = ["api/course.ts", "api/course-sitemap.ts", "src/lib/courseHtml.ts", "src/lib/courseEditorialCorrections.ts", "supabase/functions/_shared/courseDocument.ts"];
  for (const file of modules) {
    const output = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: options, fileName: file }).outputText;
    const target = join(temporary, file.replace(/\.ts$/, ".js"));
    mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, output);
  }
  writeFileSync(join(temporary, "package.json"), '{"type":"module"}');
  writeFileSync(join(temporary, "verify.mjs"), `
    import assert from 'node:assert/strict';
    import course from './api/course.js';
    import sitemap from './api/course-sitemap.js';
    const doc = {slug:'native-node-course',title:'Native Node Course',tagline:'Practice safely',description:'Course description',hero:'/og-image.png',level:'Beginner',badge:{name:'Completion',description:'Complete the lessons'},outcomes:['Read quotes','Measure risk','Check assumptions'],prerequisites:'Basic arithmetic',progression:'Build from quotes to portfolios',notFor:'Educational practice only',lessons:Array.from({length:3},(_,i)=>({slug:'lesson-'+(i+1),title:'Lesson '+(i+1),summary:'Lesson summary',readingMinutes:6,body:[Array(600).fill('example').join(' ')],keyTakeaways:['One','Two','Three'],sources:[{label:'Investor.gov',url:'https://www.investor.gov/'},{label:'FINRA',url:'https://www.finra.org/'}],quiz:Array.from({length:3},()=>({question:'Which answer?',options:['A','B'],correctAnswer:0,explanation:'A is correct'}))}))};
    globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes('get_published_course_catalog') ? [doc] : String(url).includes('native-node-course') ? [{document:doc}] : []),{headers:{'Content-Type':'application/json'}});
    const response = () => ({status:0,headers:{},body:'',writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=body;}});
    let r=response(); await course({query:{track:'options-trading-fundamentals'}},r); assert.equal(r.status,200); assert.ok(r.body.includes('Options Trading Fundamentals'));
    r=response(); await course({query:{track:'native-node-course',lesson:'lesson-1'}},r); assert.equal(r.status,200); assert.ok(r.body.includes('approved-course-bootstrap')); assert.ok(r.body.includes('LearningResource'));
    r=response(); await course({query:{track:'does-not-exist-verification'}},r); assert.equal(r.status,404);
    r=response(); await sitemap({},r); assert.equal(r.status,200); assert.ok(r.body.includes('<urlset')); assert.ok(r.body.includes('/courses/native-node-course/lesson-3'));
    console.log('PASS native Node ESM: existing courses, approved lesson HTML, real 404 and dynamic XML sitemap.');
  `);
  const result = execFileSync(process.execPath, [join(temporary, "verify.mjs")], { encoding: "utf8", cwd: process.cwd() });
  assert.ok(result.includes("PASS")); process.stdout.write(result);
} finally { rmSync(temporary, { recursive: true, force: true }); }
