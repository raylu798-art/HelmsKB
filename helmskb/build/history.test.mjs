import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('a two-parent bridge preserves both histories and a subsequent whole merge imports a new module',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'helmskb-history-'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
 git('init','-b','upstream');git('config','user.email','test@helmskb.invalid');git('config','user.name','HelmsKB fixture');
 fs.writeFileSync(path.join(dir,'core.txt'),'original');git('add','.');git('commit','-m','upstream A');const a=git('rev-parse','HEAD');
 git('switch','-c','layer');fs.mkdirSync(path.join(dir,'helmskb'));fs.writeFileSync(path.join(dir,'helmskb','brand.json'),'{}');git('add','.');git('commit','-m','brand layer');const layer=git('rev-parse','HEAD');
 git('switch','--orphan','legacy');fs.writeFileSync(path.join(dir,'old.txt'),'legacy');git('add','.');git('commit','-m','legacy snapshot');const legacy=git('rev-parse','HEAD');
 git('merge','--allow-unrelated-histories','--no-ff','--no-commit',layer);git('read-tree','--reset','-u',layer);git('commit','-m','connect histories with candidate tree');
 assert.equal(git('rev-parse','HEAD^{tree}'),git('rev-parse',layer+'^{tree}'));assert.equal(git('rev-list','--parents','-1','HEAD').split(' ').length,3);
 git('merge-base','--is-ancestor',legacy,'HEAD');git('merge-base','--is-ancestor',a,'HEAD');const joined=git('rev-parse','HEAD');
 git('switch','upstream');fs.mkdirSync(path.join(dir,'new-module'));fs.writeFileSync(path.join(dir,'new-module','feature.txt'),'whole version feature');git('add','.');git('commit','-m','upstream B');const b=git('rev-parse','HEAD');
 git('switch','-c','sync-fixture',joined);git('merge','--no-ff',b,'-m','whole merge');assert.equal(fs.readFileSync(path.join(dir,'new-module','feature.txt'),'utf8'),'whole version feature');git('merge-base','--is-ancestor',b,'HEAD');assert.equal(git('diff',b,'--','core.txt','new-module'), '');
 }finally{if(!path.basename(dir).startsWith('helmskb-history-')||path.dirname(dir)!==os.tmpdir())throw Error('Fixture cleanup boundary');fs.rmSync(dir,{recursive:true,force:true})}
});
