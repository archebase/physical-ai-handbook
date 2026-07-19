import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const docsRoot = path.join(root, 'docs');
const source = 'T7dLdyp0RolnUgxQCqTcXyZZnbc';
const cliEnv = {...process.env, LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1', LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1'};

function fetchDoc(token) {
  const raw = execFileSync('lark-cli', ['docs', '+fetch', '--doc', token, '--detail', 'simple', '--doc-format', 'markdown'], {cwd: root, env: cliEnv, encoding: 'utf8'});
  const envelope = JSON.parse(raw);
  if (!envelope.ok) throw new Error(`Failed to fetch ${token}`);
  return {token, content: envelope.data.document.content, revision: envelope.data.document.revision_id};
}

function slug(value) {
  return value.toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 70) || 'chapter';
}

function links(text) {
  return [...text.matchAll(/https:\/\/archebase\.feishu\.cn\/docx\/([A-Za-z0-9]+)/g)].map((m) => m[1]);
}

function clean(text, tokenToRoute, mediaRoutes = new Map()) {
  let out = text.replace(/^<fragment[^>]*>\s*/i, '').replace(/\s*<\/fragment>\s*$/i, '');
  let title = (out.match(/^<title>([\s\S]*?)<\/title>/i) || [])[1];
  out = out.replace(/^<title>[\s\S]*?<\/title>\s*/i, '');
  out = out.replace(/<callout(?:\s+emoji="([^"]*)")?\s*>/gi, (_, emoji = '💡') => `::: tip ${emoji}`);
  out = out.replace(/<\/callout>/gi, ':::');
  out = out.replace(/<source[^>]*name="([^"]*)"[^>]*>/gi, '附件：$1');
  out = out.replace(/<img[^>]*?(?:url="([^"]+)"|src="([^"]+)")[^>]*\/?\s*>/gi, (_, a, b) => `\n![课程图片](${a || b})\n`);
  out = out.replace(/<whiteboard\s+token="([^"]+)"\s*><\/whiteboard>/gi, (_, token) => mediaRoutes.has(token) ? `\n![课程画板](${mediaRoutes.get(token)})\n` : `\n> 画板素材暂未同步：${token}\n`);
  out = out.replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, diagram) => {
    const encoded = Buffer.from(diagram.trim(), 'utf8').toString('base64');
    return `<MermaidDiagram encoded="${encoded}" />`;
  });
  out = out.replace(/https:\/\/archebase\.feishu\.cn\/docx\/([A-Za-z0-9]+)/g, (_, t) => tokenToRoute.get(t) || `https://archebase.feishu.cn/docx/${t}`);
  // Markdown-it can treat bold text ending in punctuation as an ambiguous
  // delimiter when CJK body text follows immediately. Keep a visible boundary
  // so `**适合读者：** 正文` and `**结论。** 正文` render as strong text.
  out = out.replace(/(\*\*[^*\n]+\p{P}\*\*)(?=\S)/gu, '$1 ');
  out = out.replace(/\n{3,}/g, '\n\n');
  return {title: title || (out.match(/^#\s+(.+)$/m) || [])[1] || tokenToRoute.get(token)?.split('/').at(-1) || '课程', body: out.trim()};
}

fs.mkdirSync(docsRoot, {recursive: true});
const catalog = fetchDoc(source);
const catalogLinks = links(catalog.content);
const unique = [...new Set(catalogLinks)];
const groups = [];
let currentGroup = {id: 'guide', title: '课程目录', docs: []};
for (const line of catalog.content.split('\n')) {
  const heading = line.match(/^#\s+(.+)/);
  if (heading && /路线|公共地基/.test(heading[1])) {
    const id = heading[1].startsWith('00') ? 'foundation' : `route-${(heading[1].match(/路线\s+([A-G])/u) || [,'misc'])[1].toLowerCase()}`;
    currentGroup = {id, title: heading[1], docs: []};
    groups.push(currentGroup);
  }
  for (const token of links(line)) if (!currentGroup.docs.includes(token)) currentGroup.docs.push(token);
}
const groupByToken = new Map();
for (const group of groups) for (const token of group.docs) groupByToken.set(token, group);
const fallback = groups[0] || currentGroup;
for (const token of unique) if (!groupByToken.has(token)) { fallback.docs.push(token); groupByToken.set(token, fallback); }

const records = [];
const fetched = new Set();
for (let cursor = 0; cursor < unique.length; cursor += 1) {
  const token = unique[cursor];
  if (fetched.has(token)) continue;
  const doc = fetchDoc(token);
  fetched.add(token);
  const title = (doc.content.match(/^<title>([\s\S]*?)<\/title>/i) || [])[1] || (doc.content.match(/^#\s+(.+)$/m) || [])[1] || token;
  const group = groupByToken.get(token) || fallback;
  const order = String(group.docs.indexOf(token) + 1).padStart(2, '0');
  const file = `${order}-${slug(title)}.md`;
  records.push({token, title, revision: doc.revision, group: group.id, file, raw: doc.content});
  for (const child of links(doc.content)) {
    if (child === source || groupByToken.has(child)) continue;
    group.docs.push(child);
    groupByToken.set(child, group);
    unique.push(child);
  }
}
const tokenToRoute = new Map(records.map((r) => [r.token, `/${r.group}/${r.file.replace(/\.md$/, '')}`]));
const whiteboards = [...new Set(records.flatMap((record) => [...record.raw.matchAll(/<whiteboard\s+token="([^"]+)"/gi)].map((m) => m[1])))];
const mediaRoutes = new Map();
const mediaDir = path.join(docsRoot, 'public/media');
fs.mkdirSync(mediaDir, {recursive: true});
for (const token of whiteboards) {
  const existing = fs.readdirSync(mediaDir).find((name) => name.startsWith(`${token}.`));
  if (!existing) {
    const relativeOutput = `docs/public/media/${token}`;
    execFileSync('lark-cli', ['docs', '+media-download', '--type', 'whiteboard', '--token', token, '--output', relativeOutput], {cwd: root, env: cliEnv, encoding: 'utf8'});
  }
  const downloaded = fs.readdirSync(mediaDir).find((name) => name.startsWith(`${token}.`));
  if (downloaded) mediaRoutes.set(token, `/media/${downloaded}`);
}
const nav = [];
for (const group of groups) {
  const groupRecords = records.filter((r) => r.group === group.id);
  if (!groupRecords.length) continue;
  const dir = path.join(docsRoot, group.id); fs.mkdirSync(dir, {recursive: true});
  for (const record of groupRecords) {
    const converted = clean(record.raw, tokenToRoute, mediaRoutes);
    fs.writeFileSync(path.join(dir, record.file), `---\ntitle: ${JSON.stringify(converted.title)}\nsourceToken: ${record.token}\nsourceRevision: ${record.revision}\nlicense: Apache-2.0\n---\n\n> [飞书原文](https://archebase.feishu.cn/docx/${record.token}) · 源修订 ${record.revision}\n\n${converted.body}\n`, 'utf8');
  }
  nav.push({text: group.title, items: groupRecords.map((r) => ({text: r.title, link: tokenToRoute.get(r.token)}))});
}
const catalogConverted = clean(catalog.content, tokenToRoute, mediaRoutes);
fs.mkdirSync(path.join(docsRoot, 'guide'), {recursive: true});
fs.writeFileSync(path.join(docsRoot, 'guide/catalog.md'), `---\ntitle: 课程目录\nsourceToken: ${source}\nsourceRevision: ${catalog.revision}\nlicense: Apache-2.0\n---\n\n> [飞书源目录](https://archebase.feishu.cn/docx/${source}) · 源修订 ${catalog.revision}\n\n${catalogConverted.body}\n`, 'utf8');
fs.mkdirSync(path.join(docsRoot, '.vitepress'), {recursive: true});
fs.writeFileSync(path.join(docsRoot, '.vitepress/generated-nav.json'), JSON.stringify(nav, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(docsRoot, 'guide/sync-manifest.json'), JSON.stringify({source, revision: catalog.revision, syncedAt: new Date().toISOString(), documents: records.map(({raw, ...record}) => record)}, null, 2) + '\n', 'utf8');
console.log(`Synced ${records.length} linked documents from catalog revision ${catalog.revision}.`);
