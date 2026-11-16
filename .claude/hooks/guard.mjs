#!/usr/bin/env node
// Project guard for every Bash call Claude Code makes.
// Exit code 2 blocks the command and shows Claude the reason.
import { readFileSync } from 'node:fs';

let cmd = '';
try {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  cmd = String(input?.tool_input?.command ?? '');
} catch {
  process.stderr.write('Guard could not read the command; blocking to be safe.\n');
  process.exit(2);
}

const rules = [
  [/co-authored-by/i, 'Commits must not contain Co-Authored-By trailers. The owner is the only author.'],
  [/generated (with|by) \[?claude|claude-session:|noreply@anthropic\.com/i, 'No AI attribution in commits, PRs or files.'],
  [/--no-verify\b/, 'Git hooks must never be skipped.'],
  [/\bgit(\s+-C\s+\S+)?\s+config\b/, 'Git configuration and identity must not be changed.'],
  [/\bgit\s+-c\s+user\./i, 'Git identity must not be overridden.'],
  [/\bGIT_(AUTHOR|COMMITTER)_(NAME|EMAIL|DATE)\b/, 'Git identity must not be overridden.'],
  [/\bgit\s+commit\b[^\n]*\s--author\b/, "Commits must use the owner's configured identity."],
  [/\bgit\s+push\b[^\n]*(\s--force(-with-lease)?\b|\s-f\b|\s\+\S)/, 'Force push is not allowed.'],
  [/\bgit\s+push\b[^\n]*[\s:](main|master)(\s|$)/, 'Never push to main. Push a feature branch and open a PR.'],
  [/\bgit\s+(reset\s+--hard|clean\s+-\w*f)/, 'Destructive git command blocked. Ask the owner.'],
  [/\brm\s+(-\w*r\w*f\w*|-\w*f\w*r\w*|--recursive\s+--force|--force\s+--recursive)\b/, 'Recursive force delete is blocked.'],
  [/\b(cat|less|more|head|tail|type)\s+[^\n]*\.env(\s|$)/, 'Secret files must not be printed.'],
];

for (const [pattern, reason] of rules) {
  if (pattern.test(cmd)) {
    process.stderr.write(`Blocked by project guard: ${reason}\n`);
    process.exit(2);
  }
}
process.exit(0);
