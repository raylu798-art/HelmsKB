import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const lock=JSON.parse(fs.readFileSync(path.join(root,'helmskb/build/upstream.lock.json'),'utf8'));
export const ownership=JSON.parse(fs.readFileSync(path.join(root,'helmskb/build/ownership.json'),'utf8'));
export function git(args,cwd=root){return execFileSync('git',args,{cwd,maxBuffer:64*1024*1024})}
export function owned(file){return ownership.ownedFiles.includes(file)||ownership.ownedPrefixes.some(p=>file.startsWith(p))}
export function checkBoundary(){
  const changed=[...new Set([...git(['diff','--name-only','-z',lock.commit]).toString().split('\0'),...git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0')].filter(Boolean))];
  const forbidden=[];
  for(const file of changed){
    if(owned(file))continue;
    if(file.startsWith(ownership.removedUpstreamPrefix)){
      const archive=path.join(root,'.github/upstream-workflows',file.slice(ownership.removedUpstreamPrefix.length));
      if(!fs.existsSync(path.join(root,file))&&fs.existsSync(archive)&&git(['show',`${lock.commit}:${file}`]).equals(fs.readFileSync(archive)))continue;
    }
    forbidden.push(file);
  }
  if(forbidden.length)throw Error('Unapproved upstream source changes: '+forbidden.join(', '));
  return {upstreamCommit:lock.commit,changedFiles:changed.length,unapprovedFiles:forbidden};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(checkBoundary(),null,2));
