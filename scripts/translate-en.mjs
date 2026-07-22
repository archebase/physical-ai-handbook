import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const docsRoot = path.join(root, 'docs');
const englishRoot = path.join(docsRoot, 'en');
const manifestPath = path.join(englishRoot, 'translation-manifest.json');
const navSourcePath = path.join(docsRoot, '.vitepress/generated-nav.json');
const navOutputPath = path.join(docsRoot, '.vitepress/generated-nav.en.json');
const force = process.argv.includes('--force');
const repair = process.argv.includes('--repair');
const requestedFile = process.env.TRANSLATION_FILE;
const concurrency = Number(process.env.TRANSLATION_CONCURRENCY || 2);
const apiBase = (process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_MODEL || 'gpt-5-mini';

if (!apiKey) throw new Error('OPENAI_API_KEY is required to generate the English edition.');

const routeRoots = ['foundation', 'guide', 'route-a', 'route-b', 'route-c', 'route-d', 'route-e', 'route-f', 'route-g', 'data'];
const groupTitles = [
  '00 | Shared Foundations',
  'Route A | VLA and Direct Policy Learning',
  'Route B | World Models and Model-Based Planning',
  'Route C | Value, Reward, and Learning from Experience',
  'Route D | Hierarchical Planning, Skills, Reasoning, and Memory',
  'Route E | Perception, State, Data, and Cross-Embodiment Learning',
  'Route F | Dynamics, Control, and Physical Interaction',
  'Route G | Systems, Trustworthy Evaluation, and Data Engines'
];

function listMarkdownFiles(directory, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === '.vitepress' || entry.name === 'public' || entry.name === 'en') continue;
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(absolute, relative));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(relative);
  }
  return files.sort();
}

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) return {version: 1, model, files: {}};
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function saveJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

function decodeMermaid(content) {
  return content.replace(/<MermaidDiagram encoded="([^"]+)"\s*\/>/g, (_, encoded) => {
    const diagram = Buffer.from(encoded, 'base64').toString('utf8');
    return `\`\`\`mermaid\n${diagram}\n\`\`\``;
  });
}

function encodeMermaid(content) {
  return content.replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, diagram) => {
    const encoded = Buffer.from(diagram.trim(), 'utf8').toString('base64');
    return `<MermaidDiagram encoded="${encoded}" />`;
  });
}

function protect(content) {
  const values = [];
  const stash = (value) => {
    const token = `ABPROTECTED${String(values.length).padStart(6, '0')}TOKEN`;
    values.push(value);
    return token;
  };

  let output = content.replace(/```[\s\S]*?```/g, stash);
  output = decodeMermaid(output);
  output = output.replace(/\$\$[\s\S]*?\$\$/g, stash);
  output = output.replace(/(?<!\$)\$(?!\$)[^\n$]+?\$(?!\$)/g, stash);
  output = output.replace(/`[^`\n]+`/g, stash);
  output = output.replace(/^(sourceToken|sourceRevision|license|layout):.*$/gm, stash);
  output = output.replace(/(!?\[[^\]]*\]\()([^)\s]+)(\))/g, (_, open, target, close) => `${open}${stash(target)}${close}`);
  output = output.replace(/https?:\/\/[^\s)>]+/g, stash);
  output = output.replace(/<(?!\/?(?:fragment|title|callout|source|whiteboard)\b)[^>]+>/g, stash);
  return {output, values};
}

function restore(content, values, relativePath) {
  let output = content;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    const token = `ABPROTECTED${String(index).padStart(6, '0')}TOKEN`;
    const occurrences = output.split(token).length - 1;
    if (occurrences !== 1) throw new Error(`${relativePath}: protected token ${token} occurred ${occurrences} times`);
    output = output.replace(token, () => value);
  }
  return encodeMermaid(output);
}

function prefixInternalLinks(content) {
  const roots = routeRoots.join('|');
  const pattern = new RegExp(`(\\]\\()\\/(?!en\\/)((?:${roots})\\/[^)]+|license)(\\))`, 'g');
  const yamlPattern = new RegExp(`^(\\s*link:\\s*)\\/(?!en\\/)((?:${roots})\\/\\S+|license)\\s*$`, 'gm');
  return content.replace(pattern, '$1/en/$2$3').replace(yamlPattern, '$1/en/$2');
}

function addTranslationMetadata(content, relativePath, sourceHash) {
  if (!content.startsWith('---\n')) return content;
  const end = content.indexOf('\n---', 4);
  if (end === -1) return content;
  const metadata = `\ntranslationSource: ${JSON.stringify(relativePath)}\ntranslationSourceHash: ${sourceHash}`;
  return `${content.slice(0, end)}${metadata}${content.slice(end)}`;
}

function validateTranslation(source, translated, relativePath, mermaidCount) {
  if (!translated.trim()) throw new Error(`${relativePath}: empty translation`);
  if (source.startsWith('---\n') && !translated.startsWith('---\n')) throw new Error(`${relativePath}: frontmatter moved or removed`);
  if ((translated.match(/<MermaidDiagram\b/g) || []).length !== mermaidCount) {
    throw new Error(`${relativePath}: Mermaid diagram count changed`);
  }
  const sourceMath = (source.match(/\$\$/g) || []).length;
  const translatedMath = (translated.match(/\$\$/g) || []).length;
  if (sourceMath !== translatedMath) {
    throw new Error(`${relativePath}: display-math delimiter count changed (${sourceMath} -> ${translatedMath})`);
  }
  if ((source.match(/^```/gm) || []).length !== (translated.match(/^```/gm) || []).length) {
    throw new Error(`${relativePath}: fenced-code delimiter count changed`);
  }
  const sourceHeadings = (source.match(/^#{1,6}\s/gm) || []).length;
  const translatedHeadings = (translated.match(/^#{1,6}\s/gm) || []).length;
  if (sourceHeadings !== translatedHeadings) throw new Error(`${relativePath}: heading count changed (${sourceHeadings} -> ${translatedHeadings})`);
  if (translated.length < source.length * 0.65) throw new Error(`${relativePath}: translation is unexpectedly short`);
}

async function requestTranslation(content, context) {
  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: [
            'You are the senior English technical editor for the ArcheBase Physical AI Handbook.',
            'Translate the complete supplied Markdown document from Simplified Chinese into precise, natural technical English.',
            'Translate every natural-language sentence. Do not summarize, omit, reorder, add commentary, or wrap the result in an outer code fence.',
            'Preserve Markdown structure, YAML keys and indentation, headings, lists, tables, admonitions, citations, HTML, and all ABPROTECTED...TOKEN placeholders exactly.',
            'For Mermaid blocks, preserve graph syntax, node identifiers, arrows, and topology; translate only human-readable labels.',
            'Use standard robotics terminology. Preferred terms include latent space, latent dynamics, world model, model-based planning, whole-body control, embodiment, policy, rollout, and 4D World Action Model (4D-WAM).',
            'Keep product names, model names, paper titles when conventionally cited in English, mathematical symbols, and acronyms unchanged.',
            'Output only the translated Markdown.'
          ].join(' ')
        },
        {role: 'user', content}
      ]
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `HTTP ${response.status}`);
  let result = payload.choices?.[0]?.message?.content;
  if (!result) throw new Error('translation endpoint returned no content');
  if (/^```markdown\s*\n/i.test(result)) {
    result = result.replace(/^```markdown\s*\n/i, '').replace(/\n```\s*$/i, '');
  }
  const expectedTokens = content.match(/ABPROTECTED\d{6}TOKEN/g) || [];
  for (const token of expectedTokens) {
    if (result.split(token).length - 1 !== 1) throw new Error(`${context}: model changed ${token}`);
  }
  if ((content.match(/\$/g) || []).length !== (result.match(/\$/g) || []).length) {
    throw new Error(`${context}: model changed math delimiters`);
  }
  if ((content.match(/^```/gm) || []).length !== (result.match(/^```/gm) || []).length) {
    throw new Error(`${context}: model changed Mermaid fences`);
  }
  return result.trimEnd();
}

function splitForTranslation(content, limit = 8500) {
  const blocks = content.split(/(\n{2,})/);
  const chunks = [];
  let current = '';
  for (const block of blocks) {
    if (current && current.length + block.length > limit) {
      chunks.push(current);
      current = '';
    }
    current += block;
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateProtected(content, relativePath) {
  const chunks = splitForTranslation(content);
  const translated = [];
  for (const [index, chunk] of chunks.entries()) {
    let lastError;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        translated.push(await requestTranslation(chunk, `${relativePath} part ${index + 1}/${chunks.length}`));
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        console.error(`retry ${attempt}/4 ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    if (lastError) throw lastError;
  }
  return `${translated.join('\n\n').trimEnd()}\n`;
}

async function translateResidualText(content, relativePath) {
  const candidates = [];
  const add = (value) => {
    if (/\p{Script=Han}/u.test(value) && !candidates.includes(value)) candidates.push(value);
  };
  for (const match of content.matchAll(/\b(?:name|title)="([^"]*\p{Script=Han}[^"]*)"/gu)) add(match[1]);
  for (const match of content.matchAll(/\\text\{([^{}]*\p{Script=Han}[^{}]*)\}/gu)) add(match[1]);
  for (const match of content.matchAll(/```text\s*\n([\s\S]*?)```/g)) add(match[1].trim());
  if (!candidates.length) return content;

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'Translate each JSON array string from Simplified Chinese to concise technical English. Preserve symbols, arrows, acronyms, model names, and line breaks. Return only a valid JSON array with exactly the same number of strings in the same order.'
        },
        {role: 'user', content: JSON.stringify(candidates)}
      ]
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `HTTP ${response.status}`);
  let raw = payload.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error(`${relativePath}: residual translation returned no content`);
  raw = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const translations = JSON.parse(raw);
  if (!Array.isArray(translations) || translations.length !== candidates.length) {
    throw new Error(`${relativePath}: residual translation returned an invalid array`);
  }
  let output = content;
  for (const [index, source] of candidates.entries()) {
    const translation = translations[index];
    if (typeof translation !== 'string' || !translation.trim()) throw new Error(`${relativePath}: empty residual translation`);
    output = output.split(source).join(translation);
  }
  return output;
}

async function translateFile(relativePath, manifest) {
  const sourcePath = path.join(docsRoot, relativePath);
  const outputPath = path.join(englishRoot, relativePath);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const sourceHash = hash(source);
  const prior = manifest.files[relativePath];
  if (!force && prior?.sourceHash === sourceHash && fs.existsSync(outputPath)) {
    if (repair) {
      const existing = fs.readFileSync(outputPath, 'utf8');
      const repaired = prefixInternalLinks(await translateResidualText(existing, relativePath));
      if (repaired !== existing) {
        fs.writeFileSync(outputPath, repaired, 'utf8');
        manifest.files[relativePath].repairedAt = new Date().toISOString();
        saveJson(manifestPath, manifest);
        console.log(`repaired ${relativePath}`);
        return;
      }
    }
    console.log(`skip ${relativePath}`);
    return;
  }

  const mermaidCount = (source.match(/<MermaidDiagram\b/g) || []).length;
  const {output: protectedContent, values} = protect(source);
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const raw = await translateProtected(protectedContent, relativePath);
      let translated = restore(raw, values, relativePath);
      translated = await translateResidualText(translated, relativePath);
      translated = prefixInternalLinks(translated);
      translated = addTranslationMetadata(translated, relativePath, sourceHash);
      validateTranslation(source, translated, relativePath, mermaidCount);
      fs.mkdirSync(path.dirname(outputPath), {recursive: true});
      fs.writeFileSync(outputPath, translated, 'utf8');
      manifest.files[relativePath] = {sourceHash, translatedAt: new Date().toISOString(), model};
      manifest.model = model;
      saveJson(manifestPath, manifest);
      console.log(`translated ${relativePath}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`retry ${attempt}/4 ${relativePath}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

function titleFromMarkdown(file) {
  const content = fs.readFileSync(file, 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  const title = frontmatter?.[1].match(/^title:\s*(.+)$/m)?.[1];
  if (!title) return content.match(/^#\s+(.+)$/m)?.[1];
  try { return JSON.parse(title); } catch { return title.replace(/^['"]|['"]$/g, ''); }
}

function generateEnglishNav() {
  const sourceNav = JSON.parse(fs.readFileSync(navSourcePath, 'utf8'));
  const translatedNav = sourceNav.map((group, index) => ({
    text: groupTitles[index] || group.text,
    items: group.items.map((item) => {
      const relative = `${item.link.slice(1)}.md`;
      return {text: titleFromMarkdown(path.join(englishRoot, relative)), link: `/en${item.link}`};
    })
  }));
  saveJson(navOutputPath, translatedNav);
}

const files = listMarkdownFiles(docsRoot).filter((file) => !requestedFile || file === requestedFile);
if (requestedFile && files.length === 0) throw new Error(`Unknown TRANSLATION_FILE: ${requestedFile}`);
const manifest = loadManifest();
let cursor = 0;
const workers = Array.from({length: Math.max(1, concurrency)}, async () => {
  while (cursor < files.length) {
    const current = files[cursor];
    cursor += 1;
    await translateFile(current, manifest);
  }
});
await Promise.all(workers);
if (!requestedFile) generateEnglishNav();
console.log(`English edition is current for ${files.length} Markdown files.`);
