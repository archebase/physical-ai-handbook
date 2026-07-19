import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sample = path.join(root, 'docs/public/downloads/sample-episodes.jsonl');
const lines = fs.readFileSync(sample, 'utf8').trim().split(/\n+/);
for (const [index, line] of lines.entries()) {
  const item = JSON.parse(line);
  if (!item.episode_id || !item.task || !Array.isArray(item.steps)) throw new Error(`Invalid episode at line ${index + 1}`);
  if (item.steps.some((step) => !Number.isInteger(step.t) || !Array.isArray(step.action))) throw new Error(`Invalid step at line ${index + 1}`);
}
console.log(`Validated ${lines.length} synthetic episode(s).`);
