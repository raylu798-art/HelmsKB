import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { parse } from 'yaml';
import { brandProse,brandMessages } from '../branding/prose.mjs';
import { transformMarkdown,executableFences,transformYaml,replaceExact,normalizeRegistry } from './transform.mjs';
import { checkBoundary } from './boundary.mjs';
const brand=JSON.parse(fs.readFileSync(new URL('../branding/brand.json',import.meta.url)));

test('only product display text changes; vendors, URLs, code, attribution and identifiers retain identity',()=>{
 const input='WeKnora 助手 / WeKnora Cloud / WeKnora CLI / WeKnoraEmbed / https://github.com/Tencent/WeKnora / `WeKnora`';
 assert.equal(brandProse(input,brand),'HelmsKB 助手 / WeKnora Cloud / WeKnora CLI / WeKnoraEmbed / https://github.com/Tencent/WeKnora / `WeKnora`');
 assert.equal(brandProse('腾讯开源 WeKnora',brand),'腾讯开源 WeKnora');
 assert.equal(brandProse('签名 X-WeKnora-Signature',brand),'签名 X-WeKnora-Signature');
 assert.equal(brandMessages({assistant:{title:'WeKnora 助手'}},brand).assistant.title,'HelmsKB 助手');
});
test('documentation retains executable fences, original anchors, link targets and inline commands',()=>{
 const before='# WeKnora 产品介绍\n\nWeKnora 文档 [说明](./WeKnora.md) `WeKnora`\n\n```bash\nWeKnora --help\n```\n';
 const after=transformMarkdown(before,brand);
 assert.match(after,/# HelmsKB 产品介绍 \{#weknora-产品介绍\}/);
 assert.ok(after.includes('[说明](./WeKnora.md) `WeKnora`'));
 assert.deepEqual(executableFences(after),executableFences(before));
});
test('structured YAML branding leaves IDs, tools, model settings and selection rules untouched',()=>{
 const before='builtin_agents:\n  - id: builtin-weknora-assistant\n    name: WeKnora Assistant\n    config:\n      system_prompt_id: weknora_assistant\n      max_iterations: 30\n      allowed_tools: [read_weknora_doc]\n';
 const after=transformYaml(before,brand);
 assert.match(after,/name: HelmsKB Assistant/);assert.match(after,/id: builtin-weknora-assistant/);assert.match(after,/read_weknora_doc/);
});
test('a changed upstream bridge fails closed instead of silently missing branding',()=>assert.throws(()=>replaceExact('new shape','old shape','replacement'),/Unknown bridge shape/));
test('registry delivery changes preserve pinned versions, integrity and non-registry archives',()=>{
 const lock={packages:{a:{version:'1',resolved:'https://mirrors.tencent.com/npm/a/-/a-1.tgz',integrity:'sha512-pinned'},sheet:{resolved:'https://cdn.sheetjs.com/a.tgz'}}};
 const after=normalizeRegistry(lock);assert.equal(after.packages.a.resolved,'https://registry.npmjs.org/a/-/a-1.tgz');assert.equal(after.packages.a.integrity,lock.packages.a.integrity);assert.deepEqual(after.packages.sheet,lock.packages.sheet);assert.equal(lock.packages.a.resolved,'https://mirrors.tencent.com/npm/a/-/a-1.tgz');
});
test('all raw upstream business files remain outside the downstream change set',()=>assert.deepEqual(checkBoundary().unapprovedFiles,[]));
test('assistant citations are bound to local docs without changing prompt IDs or tools',()=>{
 const source='templates:\n  - id: weknora_assistant\n    content: You are the WeKnora Assistant.\n';
 const result=parse(transformYaml(source,brand,{requireAssistantPolicy:true})).templates[0];
 assert.match(result.content,/You are the HelmsKB Assistant/);assert.match(result.content,/relative \/docs\/ links/);assert.equal(result.id,'weknora_assistant');assert.match(result.content,/`WeKnora`/);
 assert.throws(()=>transformYaml('templates: []',brand,{requireAssistantPolicy:true}),/Unknown assistant/);
});
