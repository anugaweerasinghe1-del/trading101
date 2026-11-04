import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

const pages = ["src/pages/AdminDashboard.tsx", "src/pages/AdminAIAssistant.tsx", "src/pages/AdminReviews.tsx", "src/pages/AdminValidator.tsx"];
for (const file of pages) {
  const source = fs.readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(ast.parseDiagnostics.length, 0, file + ": TSX parse errors: " +
    ast.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, " ")).join("; "));
  if (file.endsWith("AdminDashboard.tsx")) {
    // A broken optional desk must not lock the owner out of the rest of the dashboard.
    assert.ok(source.indexOf('adminCall("settings")') >= 0 && source.includes("Promise.allSettled"),
      "Dashboard must verify the administrator first, then load independent desks separately.");
    assert.ok(source.includes("tradehq-code-agent.yml") && source.includes("tradehq-agents.yml"),
      "Dashboard must expose live monitor and code-proposal history.");
    assert.ok(source.includes("agentError") && source.includes("deskWarnings"),
      "Dashboard must disclose incomplete reporting rather than invent success or zero counts.");
  }
  if (file.endsWith("AdminReviews.tsx")) {
    assert.ok(source.includes("hasUnsaved") && source.includes("beforeunload") &&
      source.includes("Discard unsaved moderation changes and public replies?") &&
      source.includes("onClick={lockAdmin}"),
      "Review moderation must warn before navigation or lock discards unsaved changes.");
  }
  if (file.endsWith("AdminValidator.tsx")) {
    assert.ok(!source.includes("BUILD STABLE") && source.includes("Deployed URLs, HTTP responses and build stability have not been checked."),
      "Local route checks must never claim that production URLs or builds are healthy.");
  }
  const known = new Set();
  function bindNames(binding) {
    if (ts.isIdentifier(binding)) known.add(binding.text);
    else if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding)) {
      binding.elements.forEach(element => { if (ts.isBindingElement(element)) bindNames(element.name); });
    }
  }
  for (const statement of ast.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.name) known.add(clause.name.text);
      const named = clause?.namedBindings;
      if (named && ts.isNamespaceImport(named)) known.add(named.name.text);
      if (named && ts.isNamedImports(named)) named.elements.forEach(name => known.add(name.name.text));
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) known.add(statement.name.text);
    if (ts.isClassDeclaration(statement) && statement.name) known.add(statement.name.text);
    if (ts.isVariableStatement(statement)) statement.declarationList.declarations.forEach(decl => bindNames(decl.name));
  }
  const missing = new Set();
  function walk(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const tag = node.tagName.text;
      if (/^[A-Z]/.test(tag) && !known.has(tag)) missing.add(tag);
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  assert.equal(missing.size, 0, file + " uses JSX components without imports/declarations: " + [...missing].join(", "));
  console.log(file + ": all JSX components are imported or declared.");
}
