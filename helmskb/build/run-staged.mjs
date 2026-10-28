import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {root} from './boundary.mjs';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'.helmskb/source-manifest.json')));
if(!manifest.stage.startsWith(path.join(root,'.helmskb')+path.sep)||!fs.existsSync(path.join(manifest.stage,'helmskb-generated-source.json')))throw Error('Unknown source stage');
const [command,...args]=process.argv.slice(2);if(!command)throw Error('A staged command is required');
const result=spawnSync(command,args,{cwd:manifest.stage,stdio:'inherit',shell:false});if(result.error)throw result.error;process.exit(result.status??1);
