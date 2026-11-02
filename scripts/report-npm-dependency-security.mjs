/**
 * Read-only npm registry audit. Never prints environment variables or tokens.
 * Exit non-zero only if advisory data is unavailable/invalid; vulnerable
 * packages are reported as findings for human-scoped remediation, not hidden.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const manifest=JSON.parse(readFileSync("package.json","utf8"));
function audit(args,label) {
  let stdout="";
  try {
    stdout=execFileSync("npm",["audit","--json",...args],{
      encoding:"utf8",maxBuffer:16_000_000,timeout:120000,
      env:{...process.env, npm_config_update_notifier:"false"},
    });
  } catch (error) {
    stdout=String(error.stdout||"");
    if (!stdout.trim()) throw Error(label+": npm audit produced no JSON: "+String(error.message).slice(0,200));
  }
  let report;
  try{report=JSON.parse(stdout);}catch{throw Error(label+": npm audit returned invalid JSON");}
  if(report.error || !report.metadata?.vulnerabilities || !report.vulnerabilities)
    throw Error(label+": registry/advisory metadata unavailable");
  const vulnerable=Object.entries(report.vulnerabilities).map(([name,v])=>({
    name,severity:v.severity,isDirect:v.isDirect,range:v.range,
    installedPaths:v.nodes?.length??0,fixAvailable:v.fixAvailable,
    via:(v.via??[]).filter(x=>typeof x==="object").map(x=>({
      title:String(x.title??"").slice(0,120),
      url:String(x.url??"").slice(0,180),
      range:x.range,
    })).slice(0,7),
  }));
  const priority={critical:0,high:1,moderate:2,low:3,info:4};
  vulnerable.sort((a,b)=>(priority[a.severity]??10)-(priority[b.severity]??10)||a.name.localeCompare(b.name));
  console.log("SECURITY_AUDIT "+label+" "+JSON.stringify({
    counts:report.metadata.vulnerabilities,
    directRuntime: Object.keys(manifest.dependencies??{}),
    findings:vulnerable,
  }));
  return {counts:report.metadata.vulnerabilities,vulnerable};
}
const all=audit([],"FULL");
const prod=audit(["--omit=dev"],"PRODUCTION");
console.log("SECURITY_AUDIT_SUMMARY "+JSON.stringify({
  all:all.counts,production:prod.counts,
  productionVulnerablePackages:prod.vulnerable.map(x=>x.name),
  fullVulnerablePackages:all.vulnerable.map(x=>x.name),
}));
