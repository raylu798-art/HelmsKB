import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { root,lock,ownership,git,checkBoundary } from './boundary.mjs';
import { transformMarkdown,executableFences,transformYaml,replaceExact,normalizeRegistry } from './transform.mjs';

export const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const brand=JSON.parse(fs.readFileSync(path.join(root,'helmskb/branding/brand.json'),'utf8'));
async function eachBounded(items,action){for(let i=0;i<items.length;i+=24)await Promise.all(items.slice(i,i+24).map(action))}
export async function prepare({allowDirty=false}={}){
  checkBoundary();
  if(!allowDirty&&git(['status','--porcelain']).toString().trim())throw Error('Release preparation requires a clean source commit');
  const head=git(['rev-parse','HEAD']).toString().trim();
  const parent=path.join(root,'.helmskb');
  fs.mkdirSync(path.join(parent,'stages'),{recursive:true});
  // Never clear an active stage: containers and editors can still hold it.
  const stage=fs.mkdtempSync(path.join(parent,'stages',head.slice(0,12)+'-'));
  const files=git(['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
  const report=[];
  await eachBounded(files,async file=>{
    if(file.includes('..')||path.isAbsolute(file))throw Error('Invalid source path');
    const from=path.join(root,file);let stat;try{stat=await fs.promises.lstat(from)}catch(error){if(error.code==='ENOENT')return;throw error}
    if(!stat.isFile())throw Error('Source symlinks/directories are not allowed: '+file);
    const to=path.join(stage,file);await fs.promises.mkdir(path.dirname(to),{recursive:true});await fs.promises.copyFile(from,to);
  });
  fs.writeFileSync(path.join(stage,'helmskb-generated-source.json'),JSON.stringify({source:root,head,generated:true}));
  function edit(file,change){
    const target=path.join(stage,file);const before=fs.readFileSync(target,'utf8');const after=change(before);
    if(before===after)throw Error('Bridge produced no change: '+file);
    fs.writeFileSync(target,after);report.push({path:file,before:hash(before),after:hash(after)});
  }
  edit('frontend/src/i18n/index.ts',s=>replaceExact(replaceExact(s,"import { createI18n } from 'vue-i18n'","import { createI18n } from 'vue-i18n'\nimport { applyBrandMessages } from '../../../helmskb/branding/runtime'"),'  messages\n','  messages: applyBrandMessages(messages)\n'));
  edit('frontend/src/views/auth/Login.vue',s=>{
    s=replaceExact(s,'<img src="@/assets/img/weknora.png" alt="WeKnora" class="logo-image" />','<BrandLogo tagline class="logo-image" style="--brand-logo-font-size:36px" />');
    s=replaceExact(s,'<script setup lang="ts">','<script setup lang="ts">\nimport BrandLogo from \'../../../../helmskb/branding/BrandLogo.vue\'');
    s=replaceExact(s,'https://github.com/Tencent/WeKnora',brand.repository,2);
    return replaceExact(s,'https://weknora.weixin.qq.com',brand.docsBase);
  });
  edit('frontend/src/components/menu.vue',s=>replaceExact(replaceExact(s,'<img class="logo" src="@/assets/img/weknora.png" alt="">','<BrandLogo style="--brand-logo-font-size:19px" />'),'<script setup lang="ts">','<script setup lang="ts">\nimport BrandLogo from \'../../../helmskb/branding/BrandLogo.vue\''));
  edit('frontend/src/components/UserMenu.vue',s=>replaceExact(s,'https://github.com/Tencent/WeKnora',brand.repository));
  edit('frontend/src/views/settings/SystemInfo.vue',s=>replaceExact(s,'https://github.com/Tencent/WeKnora/issues/new',brand.repository+'/issues/new'));
  edit('frontend/src/utils/docsUrl.ts',s=>replaceExact(s,"'https://weknora.weixin.qq.com/docs/'",JSON.stringify(brand.docsBase)));
  for(const file of ['frontend/index.html','frontend/embed.html'])edit(file,s=>s.replace(/<title>([^<]+)<\/title>/,(_,title)=>`<title>${title.replace('WeKnora',brand.name)}</title>`).replace(/(<meta name="description" content=")([^"]*)"/,(_,prefix,text)=>prefix+text.replace('WeKnora',brand.name)+'"'));
  edit('frontend/vite.config.ts',s=>replaceExact(s,'export default defineConfig({','export default defineConfig({\n  css: { preprocessorMaxWorkers: 0 },'));
  edit('frontend/nginx.conf',s=>replaceExact(s,'    # Static widget loader for third-party sites','    location ^~ /docs/ {\n        root /usr/share/nginx/html;\n        try_files $uri $uri.html $uri/ =404;\n    }\n\n    # Static widget loader for third-party sites'));
  for(const file of ['frontend/package.json','frontend/package-lock.json'])edit(file,s=>{const j=normalizeRegistry(JSON.parse(s));j.version=lock.distributionVersion;if(j.packages?.[''])j.packages[''].version=lock.distributionVersion;return JSON.stringify(j,null,2)+'\n'});
  edit('website-docs/package-lock.json',s=>JSON.stringify(normalizeRegistry(JSON.parse(s)),null,2)+'\n');
  edit('website-docs/.vitepress/config.mts',s=>{
    s=replaceExact(s,"const repo = 'https://github.com/Tencent/WeKnora'",`const repo = '${brand.repository}'`);
    s=replaceExact(s,"title: 'WeKnora'",`title: '${brand.name}'`);
    s=replaceExact(s,"titleTemplate: ':title · WeKnora 文档'",`titleTemplate: ':title · ${brand.name} 文档'`);
    s=replaceExact(s,"siteTitle: 'WeKnora'",`siteTitle: '${brand.name}'`);
    s=replaceExact(s,"content: 'WeKnora 文档'",`content: '${brand.name} 文档'`);
    s=replaceExact(s,"description: 'WeKnora（维娜拉）官方文档：部署、配置、功能说明、API 参考与二次开发'",`description: '${brand.sourceNotice}'`);
    s=replaceExact(s,'lastUpdated: true','lastUpdated: false');
    return replaceExact(s,"const heading = raw.match(/^#\\s+(.+)$/m)?.[1] ?? file.replace(/\\.md$/, '')","const heading = (raw.match(/^#\\s+(.+)$/m)?.[1] ?? file.replace(/\\.md$/, '')).replace(/\\s*\\{#[^}]+\\}\\s*$/, '')");
  });
  edit('website-docs/.vitepress/theme/SiteHeader.vue',s=>{
    s=replaceExact(s,'aria-label="WeKnora 首页"',`aria-label="${brand.name} 首页"`);
    return replaceExact(s,'<img :src="`${homeAssets}/brand/weknora-original.png`" alt="WeKnora" width="945" height="650">',`<img :src="'/docs/brand/helmskb-logo.svg'" alt="${brand.name}" style="width:190px;height:auto;object-fit:contain">`);
  });
  edit('website-docs/shared/header.ts',s=>replaceExact(s,'https://github.com/Tencent/WeKnora',brand.repository));
  edit('internal/productdocs/markdown.go',s=>replaceExact(s,'const PublicBaseURL = "https://weknora.weixin.qq.com/docs/"',`const PublicBaseURL = "${brand.docsBase}"`));
  edit('internal/productdocs/library.go',s=>replaceExact(s,'ref = strings.TrimPrefix(ref, "http://"+strings.TrimPrefix(PublicBaseURL, "https://"))','ref = strings.TrimPrefix(ref, "https://weknora.weixin.qq.com/docs/")\n\tref = strings.TrimPrefix(ref, "http://weknora.weixin.qq.com/docs/")'));
  edit('internal/agent/tools/operations.go',s=>replaceExact(s,'const operationApprovalService = "WeKnora"',`const operationApprovalService = "${brand.name}"`));
  edit('internal/agent/tools/product_docs.go',s=>s.replaceAll('WeKnora documentation',brand.name+' documentation').replaceAll('about WeKnora itself','about '+brand.name+' itself'));
  for(const file of ['config/builtin_agents.yaml','config/prompt_templates/agent_system_prompt.yaml'])edit(file,s=>transformYaml(s,brand));
  const docs=files.filter(f=>/^website-docs\/(?:0[1-7]-[^/]+|sample-data)\/.*\.md$/.test(f));
  for(const file of docs){const before=fs.readFileSync(path.join(stage,file),'utf8');let after=transformMarkdown(before,brand);
    if(file==='website-docs/01-getting-started/01-introduction.md')after=after.replace(/^(# .+\n)/,`$1\n> ${brand.sourceNotice}\n`);
    if(JSON.stringify(executableFences(before))!==JSON.stringify(executableFences(after)))throw Error('Executable documentation changed: '+file);
    if(after!==before){fs.writeFileSync(path.join(stage,file),after);report.push({path:file,before:hash(before),after:hash(after),executableFencesPreserved:true})}
  }
  for(const directory of ['frontend/public','website-docs/public']){
    fs.mkdirSync(path.join(stage,directory,'brand'),{recursive:true});
    for(const file of fs.readdirSync(path.join(root,'helmskb/branding/assets'))){
      const target=path.join(stage,directory,file==='favicon.ico'?file:'brand/'+file);fs.copyFileSync(path.join(root,'helmskb/branding/assets',file),target);
    }
  }
  const brandHash=hash(fs.readFileSync(path.join(root,'helmskb/branding/brand.json')));
  const approved=new Set(report.map(entry=>entry.path));
  await eachBounded(files,async file=>{
    if(approved.has(file)||ownership.stagedGeneratedFiles.includes(file)||ownership.stagedGeneratedPrefixes.some(p=>file.startsWith(p)))return;
    const original=path.join(root,file),generated=path.join(stage,file);
    if(!fs.existsSync(original))return;
    const [a,b]=await Promise.all([fs.promises.readFile(original),fs.promises.readFile(generated)]);if(!a.equals(b))throw Error('Unapproved staging mutation: '+file);
  });
  const manifest={schemaVersion:1,distributionVersion:lock.distributionVersion,sourceCommit:head,upstreamCommit:lock.commit,upstreamVersion:lock.upstreamVersion,brandProfileVersion:brand.profileVersion,brandProfileSha256:brandHash,postgresMigration:lock.postgresMigration,dirty:allowDirty,stage,bridges:report};
  const {stage:privatePath,bridges,...publicManifest}=manifest;
  fs.writeFileSync(path.join(stage,'frontend/public/helmskb-build.json'),JSON.stringify(publicManifest,null,2));
  fs.writeFileSync(path.join(parent,'source-manifest.json'),JSON.stringify(manifest,null,2));
  for(const entry of report){if(!ownership.stagedBridgeFiles.includes(entry.path)&&!entry.path.startsWith(ownership.stagedMarkdownPrefix))throw Error('Unapproved generated bridge: '+entry.path)}
  console.log(JSON.stringify({stage,sourceCommit:head,upstreamCommit:lock.commit,transformedFiles:report.length,rawBusinessSource:'unchanged'},null,2));
  return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await prepare({allowDirty:process.argv.includes('--allow-dirty')});
