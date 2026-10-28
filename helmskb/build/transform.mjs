import MarkdownIt from 'markdown-it';
import { slugify } from '@mdit-vue/shared';
import { parseDocument, visit } from 'yaml';
import { brandProse } from '../branding/prose.mjs';

const md=new MarkdownIt({html:true});
export function normalizeRegistry(lock){
  const copy=structuredClone(lock);
  for(const entry of Object.values(copy.packages||{}))if(entry.resolved?.startsWith('https://mirrors.tencent.com/npm/'))entry.resolved='https://registry.npmjs.org/'+entry.resolved.slice('https://mirrors.tencent.com/npm/'.length);
  return copy;
}
export function transformMarkdown(raw,brand){
  const lines=raw.split('\n');const protectedLines=new Set();const mermaidLines=new Set();
  for(const token of md.parse(raw,{})){
    if(['fence','code_block'].includes(token.type)&&token.map){
      for(let i=token.map[0];i<token.map[1];i++)(token.type==='fence'&&token.info.trim()==='mermaid'?mermaidLines:protectedLines).add(i);
    }
  }
  const seen=new Map();
  return lines.map((line,i)=>{
    if(protectedLines.has(i))return line;
    if(mermaidLines.has(i))return line.replace(/"[^"\n]*"|\[[^\]\n]*\]/g,text=>brandProse(text,brand));
    const heading=/^(#{1,6})\s+(.+?)\s*$/.exec(line);
    const explicit=heading&&/\s*\{#([^}\s]+)\}$/.exec(heading[2]);
    let anchor;
    if(heading&&!explicit){
      const children=md.parseInline(heading[2],{})[0]?.children||[];
      const label=children.filter(t=>['text','code_inline','image'].includes(t.type)).map(t=>t.content).join('');
      const base=slugify(label);const n=seen.get(base)||0;seen.set(base,n+1);anchor=n?`${base}-${n}`:base;
    }
    // Preserve link destinations, inline code and source attribution. Caption
    // attributes are display text, unlike src/href and component identifiers.
    const protectedParts=[];const keep=x=>`\uE100${protectedParts.push(x)-1}\uE101`;
    let changed=line.replace(/\]\([^\n)]*\)|`+[^`\n]*`+/g,keep);
    changed=brandProse(changed,brand);
    changed=changed.replace(/\uE100(\d+)\uE101/g,(_,n)=>protectedParts[Number(n)]);
    if(changed!==line&&anchor)changed+=` {#${anchor}}`;
    return changed;
  }).join('\n');
}

export function executableFences(raw){return md.parse(raw,{}).filter(t=>['fence','code_block'].includes(t.type)&&t.info.trim()!=='mermaid').map(t=>({language:t.info,content:t.content}));}

export function transformYaml(raw,brand){
  const doc=parseDocument(raw);if(doc.errors.length)throw Error(doc.errors.map(e=>e.message).join(';'));
  const before=doc.toJS();const scrub=value=>{
    if(Array.isArray(value))return value.map(scrub);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!['name','description','content'].includes(key)).map(([key,v])=>[key,scrub(v)]));
    return value;
  };
  visit(doc,{Pair(_,pair){const key=pair.key?.value;const node=pair.value;
    if(['name','description','content'].includes(key)&&typeof node?.value==='string'){
      node.value=brandProse(node.value,brand);
      if(key==='content')node.value=node.value.replace(/You are WeKnora, an assistant developed by Tencent/g,`You are ${brand.name}, an enterprise knowledge assistant based on WeKnora`);
    }
  }});
  if(JSON.stringify(scrub(before))!==JSON.stringify(scrub(doc.toJS())))throw Error('YAML compatibility fields changed');
  return String(doc);
}

export function replaceExact(source,before,after,count=1){
  const found=source.split(before).length-1;if(found!==count)throw Error(`Unknown bridge shape: expected ${count}, found ${found}: ${before.slice(0,100)}`);
  return source.split(before).join(after);
}
