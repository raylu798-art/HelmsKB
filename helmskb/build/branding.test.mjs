import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { brandProse,brandMessages } from '../branding/prose.mjs';
import { transformMarkdown,executableFences,transformYaml,replaceExact } from './transform.mjs';
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
test('all raw upstream business files remain outside the downstream change set',()=>assert.deepEqual(checkBoundary().unapprovedFiles,[]));
