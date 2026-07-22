import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const docsRoot = path.join(root, 'docs');
const englishRoot = path.join(docsRoot, 'en');
const manifestPath = path.join(englishRoot, 'translation-manifest.json');

function listMarkdownFiles(directory, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === '.vitepress' || entry.name === 'public' || entry.name === 'en') continue;
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(absolute, relative));
    else if (entry.name.endsWith('.md')) files.push(relative);
  }
  return files.sort();
}

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const files = listMarkdownFiles(docsRoot);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const errors = [];
for (const relative of files) {
  const source = fs.readFileSync(path.join(docsRoot, relative), 'utf8');
  const englishPath = path.join(englishRoot, relative);
  if (!fs.existsSync(englishPath)) {
    errors.push(`${relative}: missing English counterpart`);
    continue;
  }
  const english = fs.readFileSync(englishPath, 'utf8');
  if (manifest.files[relative]?.sourceHash !== hash(source)) errors.push(`${relative}: English translation is stale`);
  const sourceHasFrontmatter = /^---\n[\s\S]*?\n---/.test(source);
  if (sourceHasFrontmatter && !/^---\n[\s\S]*?\n---/.test(english)) errors.push(`${relative}: missing frontmatter`);
  if (/^title:\s*.+$/m.test(source) && !/^title:\s*.+$/m.test(english)) errors.push(`${relative}: missing title`);
  const visibleEnglish = english
    .replace(/^translationSource:.*$/gm, '')
    .replace(/<MermaidDiagram\s+encoded="[^"]+"\s*\/>/g, '')
    .replace(/\]\([^)]+\)/g, ']()')
    .replace(/https?:\/\/[^\s"')>]+/g, '');
  const han = (visibleEnglish.match(/[\p{Script=Han}]/gu) || []).length;
  if (han > 0) errors.push(`${relative}: contains ${han} visible Han characters`);
  for (const match of english.matchAll(/\]\((\/(?!en\/|media\/|brand\/|downloads\/)[^)#?]+)[^)]*\)/g)) {
    errors.push(`${relative}: unprefixed internal link ${match[1]}`);
  }
  for (const match of english.matchAll(/\]\(\/en\/([^)#?]+)[^)]*\)/g)) {
    const target = match[1].replace(/\/$/, '') || 'index';
    const targetPath = path.join(englishRoot, `${target}.md`);
    if (!fs.existsSync(targetPath)) errors.push(`${relative}: broken English link /en/${match[1]}`);
  }
}

const extras = listMarkdownFiles(englishRoot).filter((file) => !files.includes(file));
for (const extra of extras) errors.push(`${extra}: English page has no Chinese source`);
if (errors.length) throw new Error(`i18n validation failed:\n- ${errors.join('\n- ')}`);
console.log(`Validated ${files.length} Chinese/English page pairs.`);
