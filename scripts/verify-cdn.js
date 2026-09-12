import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const template = await readFile('template.tpl', 'utf8');
const match = template.match(/https:\/\/cdn\.jsdelivr\.net\/gh\/GallardoCode\/gtm-consent-aware-youtube-tracker@([a-f0-9]{40})\/companion\/youtube-tracker\.js/);
if (!match) throw new Error('No full-SHA companion URL found in template.tpl');
const committed = execFileSync('git', ['show', `${match[1]}:companion/youtube-tracker.js`]);
const local = await readFile('companion/youtube-tracker.js');
if (!committed.equals(local)) throw new Error('Local companion differs from the pinned commit; commit and repin it first');
const response = await fetch(match[0], { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`CDN returned HTTP ${response.status}`);
const delivered = Buffer.from(await response.arrayBuffer());
if (!delivered.equals(committed)) throw new Error('CDN bytes differ from the pinned commit');
console.log(JSON.stringify({ url: match[0], sha256: createHash('sha256').update(delivered).digest('hex'),
  bytes: delivered.length, verifiedAt: new Date().toISOString() }, null, 2));
