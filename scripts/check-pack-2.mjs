// Verify every deliverable from the brief and create a 32px / 128px contact sheet.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const root=new URL('../',import.meta.url);
const brief=await readFile(new URL('assets/ILLUSTRATIONS_A_GENERER.md',root),'utf8');
const specs=JSON.parse(brief.match(/```json\s*([\s\S]*?)```/)[1]);
const manifest=JSON.parse(await readFile(new URL('public/assets/pack-cartoon/manifest.json',root),'utf8'));
const layers=[], report=[];
for(const [index,item] of specs.entries()) {
  const entry=manifest.find(x=>x.id===item.id);
  if(!entry) {report.push({id:item.id,exports:0,verified:false,status:'generation-pending'});continue;}
  const meta=await sharp(await readFile(new URL(`assets/source/pack-2/${item.id}.png`,root))).metadata();
  if(meta.width!==item.size[0]||meta.height!==item.size[1]) throw Error(`Source size: ${item.id}`);
  for(const file of Object.values(entry.files)) {
    const data=await sharp(await readFile(new URL('public'+file.url,root))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(data.info.width!==file.width||data.info.height!==file.height) throw Error(`Export size: ${file.url}`);
    let transparent=0, opaque=0;
    for(let p=3;p<data.data.length;p+=4){if(data.data[p]===0)transparent++;if(data.data[p]===255)opaque++;}
    if(item.background&&(!transparent||!opaque))throw Error(`Invalid alpha: ${file.url}`);
    if(!item.background&&transparent)throw Error(`Opaque asset has transparency: ${file.url}`);
  }
  const preview=entry.files.detail||Object.values(entry.files)[0];
  const input=await readFile(new URL('public'+preview.url,root));
  const x=(index%6)*210,y=Math.floor(index/6)*190;
  layers.push({input:await sharp(input).resize(128,128,{fit:'contain',background:'#00000000'}).png().toBuffer(),left:x+12,top:y+10});
  layers.push({input:await sharp(input).resize(32,32,{fit:'contain',background:'#00000000'}).png().toBuffer(),left:x+160,top:y+65});
  const label=item.id.replaceAll('-',' ');
  layers.push({input:Buffer.from(`<svg width="208" height="38"><text x="8" y="15" font-family="sans-serif" font-size="10" fill="#342d47">${label.slice(0,31)}</text><text x="8" y="29" font-family="sans-serif" font-size="10" fill="#342d47">${label.slice(31)}</text></svg>`),left:x,top:y+145});
  report.push({id:item.id,exports:Object.keys(entry.files).length,verified:true});
}
await sharp({create:{width:1260,height:Math.ceil(specs.length/6)*190,channels:4,background:'#fff4df'}}).composite(layers).png().toFile(new URL('assets/pack-2-contact.png',root).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
await writeFile(new URL('assets/pack-2-validation.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({illustrations:report.filter(x=>x.verified).length,pending:report.filter(x=>!x.verified).length,exports:report.reduce((n,x)=>n+x.exports,0)}));
