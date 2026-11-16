// Rejects commit messages that break project policy.
import { readFileSync } from 'node:fs';

const message = readFileSync(process.argv[2], 'utf8');
const subject = message.split('\n')[0].trim();

if (/co-authored-by:|generated (with|by) \[?claude|claude-session:|noreply@anthropic\.com/i.test(message)) {
  console.error('Commit rejected: AI attribution or co-author trailer found.');
  process.exit(1);
}

const conventional =
  /^(feat|fix|perf|refactor|test|docs|build|ci|chore|revert|security)(\([a-z0-9-]+\))?!?: \S.{0,70}$/;
if (!/^(Merge|Revert) /.test(subject) && !conventional.test(subject)) {
  console.error('Commit rejected: use Conventional Commits, e.g. "feat(orders): add size-ratio split".');
  process.exit(1);
}
