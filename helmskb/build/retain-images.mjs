import { execFileSync } from 'node:child_process';

// Run before replacing a release tag. Containerd may discard an untagged
// manifest even while its content layers remain in the build cache.
const project=process.argv[2] || 'p006-helmskb-test';
if(!/^p\d{3,}-helmskb-(local|test|production)$/.test(project))throw Error('Use an explicit HelmsKB project/environment prefix');
const inspect=(kind,ref)=>JSON.parse(execFileSync('docker',[kind,'inspect',ref],{encoding:'utf8'}))[0];
const components=[];
for(const component of ['app','frontend','docreader']){
  const name=project+'-'+component,container=inspect('container',name),image=inspect('image',container.Config.Image);
  const labels=image.Config.Labels||{},source=labels['org.opencontainers.image.revision'];
  if(!/^[a-f0-9]{40}$/.test(source||'')||labels['org.opencontainers.image.title']!=='HelmsKB')throw Error('Unrecognized image identity: '+name);
  const retained=name+':retained-'+source.slice(0,12)+'-'+image.Id.replace('sha256:','').slice(0,12);
  execFileSync('docker',['image','tag',image.Id,retained]);
  if(inspect('image',retained).Id!==image.Id)throw Error('Retained image mismatch');
  components.push({component,id:image.Id,retained,source,upstream:labels['io.helmskb.upstream-revision']});
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),project,components},null,2));
