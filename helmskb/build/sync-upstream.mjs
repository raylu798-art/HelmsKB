// Manual whole-version merge. No live environment or main is changed.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root,git,lock,ownership} from './boundary.mjs';
const args=process.argv.slice(2), target=args.find(x=>!x.startsWith('--'));
if(!target||!/^[a-f0-9]{40}$/.test(target))throw Error('Usage: node sync-upstream.mjs <full-upstream-SHA> [--push]');
if(target===lock.commit)throw Error('This upstream commit is already locked');
if(git(['status','--porcelain']).length)throw Error('A clean checkout is required');
const remote=git(['remote','get-url','upstream']).toString().trim();
if(!/^https:\/\/github.com\/Tencent\/WeKnora(?:\.git)?$/.test(remote))throw Error('Unexpected upstream remote');
git(['fetch','--tags','upstream','main']);
git(['merge-base','--is-ancestor',target,'upstream/main']);
git(['merge-base','--is-ancestor',lock.commit,target]);
const branch='sync/weknora-'+target.slice(0,12);
git(['switch','-c',branch]);
// Workflows are archived byte-for-byte; all other conflicts require review.
const merge=(()=>{try{git(['merge','--no-ff','--no-commit',target]);return true}catch{return false}})();
const conflicts=git(['diff','--name-only','--diff-filter=U','-z']).toString().split('\0').filter(Boolean);
const unsafe=conflicts.filter(f=>!f.startsWith('.github/workflows/')&&!f.startsWith('.github/upstream-workflows/'));
if(unsafe.length)throw Error('Merge requires review on '+branch+': '+unsafe.join(', '));
for(const file of git(['ls-tree','-r','--name-only',target,'.github/workflows/']).toString().trim().split('\n').filter(Boolean)){
 if(ownership.ownedFiles.includes(file))throw Error('Upstream workflow collides with a HelmsKB workflow: '+file);
 const destination=path.join(root,'.github/upstream-workflows',file.slice('.github/workflows/'.length));
 fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,git(['show',target+':'+file]));
 git(['rm','-f','--ignore-unmatch',file]);
}
if(!merge&&!conflicts.length)throw Error('Merge failed before a resolvable workflow conflict; inspect Git state');
const deleted=git(['diff','--name-only','--diff-filter=D',lock.commit,target,'--','.github/workflows/']).toString().trim().split('\n').filter(Boolean);
for(const file of deleted){const archive=path.join(root,'.github/upstream-workflows',file.slice('.github/workflows/'.length));if(fs.existsSync(archive))fs.unlinkSync(archive)}
const migrations=git(['ls-tree','-r','--name-only',target,'migrations/versioned/']).toString().match(/\b\d+(?=_[^\n]+\.up\.sql)/g)||[];
const newLock={...lock,commit:target,upstreamVersion:git(['describe','--tags','--abbrev=0',target]).toString().trim(),postgresMigration:Math.max(...migrations.map(Number))};
if(!Number.isFinite(newLock.postgresMigration))throw Error('Unknown migration layout');
fs.writeFileSync(path.join(root,'helmskb/build/upstream.lock.json'),JSON.stringify(newLock,null,2)+'\n');
const report={from:lock.commit,to:target,branch,files:git(['diff','--stat',lock.commit,target]).toString(),newModules:git(['diff','--name-only','--diff-filter=A',lock.commit,target]).toString().trim().split('\n').filter(Boolean),dependencyAndConfigChanges:git(['diff','--name-only',lock.commit,target,'--','go.mod','go.sum','docreader/uv.lock','frontend/package-lock.json','third_party/anydoc-go/Cargo.lock','config/','.env.example']).toString().trim().split('\n').filter(Boolean),migrations:newLock.postgresMigration};
fs.mkdirSync(path.join(root,'.helmskb'),{recursive:true});fs.writeFileSync(path.join(root,'.helmskb/sync-report.json'),JSON.stringify(report,null,2));
// boundary.mjs was loaded before updating lock; verify in a fresh process.
execFileSync(process.execPath,['helmskb/build/boundary.mjs'],{cwd:root,stdio:'inherit'});
git(['add','--all']);
git(['commit','-m','sync: merge complete WeKnora '+target.slice(0,12)]);
execFileSync(process.execPath,['helmskb/build/prepare.mjs'],{cwd:root,stdio:'inherit'});
if(args.includes('--push'))git(['push','-u','origin',branch]);
console.log(JSON.stringify(report,null,2));
