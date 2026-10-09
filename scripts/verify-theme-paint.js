// Developer only. PNG filters: https://www.w3.org/TR/png/#9Filter-types
// Screenshot API: https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, constants } from 'node:fs';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir, platform, release, arch } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, Script } from 'node:vm';
import { inflateSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import { readReleaseSource, compareReleaseSources } from './release-source.js';
import { validateFixtureManifest } from './fixture-contract.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const phase = '.planning/phases/08-themes-that-follow-dark-mode/';
const need = (ok, message) => { if (!ok) throw new Error(message); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const modes = ['light','dark'], states = ['normal','hover','selected'], priorities = ['Urgent','High','Normal','Low'];
// Independent transcription of SELECTORS.md measured paint, not production
// colour.surfaces or colour.preview. Rounding is ONLY a raster allowance.
const surfaces = {light:{pane:[255,255,255],text:[41,50,57],native:[31,115,183]},dark:{pane:[21,26,30],text:[216,220,222],native:[102,160,205]}};
export function expectedPixel(tint, mode, state) {
  need(modes.includes(mode) && states.includes(state), 'Invalid model scope');
  const s = surfaces[mode], a = {normal:0,hover:.08,selected:.16}[state];
  return s.pane.map((v,i)=>tint.rgb[i]*tint.alpha+(s.native[i]*a+v*(1-a))*(1-tint.alpha));
}
export function comparePixel(measured, expected, tolerance = 1) {
  need(Number.isFinite(tolerance) && tolerance >= 0 && tolerance <= 1, 'Invalid raster tolerance');
  for (const rgb of [measured,expected]) need(Array.isArray(rgb) && rgb.length===3 && rgb.every(v=>Number.isFinite(v)&&v>=0&&v<=255), 'Invalid pixel');
  const maxError = Math.max(...measured.map((v,i)=>Math.abs(v-Math.round(expected[i]))));
  need(maxError<=tolerance, `Pixel mismatch: measured ${measured}, expected ${expected}, error ${maxError}`);
  return {maxError, rasterMargin:tolerance-maxError};
}
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for(let bit=0;bit<8;bit++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
  return (crc^0xffffffff)>>>0;
}
export function decodePng(bytes) {
  need(Buffer.isBuffer(bytes)&&bytes.length>=45&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')), 'Invalid PNG signature');
  let width, height, channels, ended=false; const compressed=[];
  for(let off=8;off<bytes.length;) {
    need(off+12<=bytes.length,'Truncated PNG'); const len=bytes.readUInt32BE(off), end=off+12+len;
    need(end<=bytes.length,'Truncated PNG chunk'); const name=bytes.toString('ascii',off+4,off+8), data=bytes.subarray(off+8,off+8+len);
    need(crc32(bytes.subarray(off+4,off+8+len))===bytes.readUInt32BE(off+8+len),'PNG CRC mismatch');
    if(name==='IHDR') {
      need(off===8&&len===13,'Invalid PNG header'); width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      channels={2:3,6:4}[data[9]];
      need(width>0&&height>0&&width*height<=16000000&&data[8]===8&&channels&&data[10]===0&&data[11]===0&&data[12]===0,'Unsupported PNG format');
    } else if(name==='IDAT') { need(channels,'Missing PNG header');compressed.push(data); }
    else if(name==='IEND') { need(len===0&&end===bytes.length,'Invalid PNG end');ended=true; }
    else need(name[0]===name[0].toLowerCase(),'Unsupported critical PNG chunk');
    off=end;
  }
  need(ended&&compressed.length>0,'Incomplete PNG'); const stride=width*channels;
  const raw=inflateSync(Buffer.concat(compressed),{maxOutputLength:(stride+1)*height});
  need(raw.length===(stride+1)*height,'Invalid PNG raster size'); const pixels=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++) {
    const filter=raw[y*(stride+1)];need(filter<=4,'Invalid PNG filter');
    for(let x=0;x<stride;x++) {
      const i=y*stride+x, a=x<channels?0:pixels[i-channels], b=y?pixels[i-stride]:0, c=y&&x>=channels?pixels[i-stride-channels]:0;
      const p=a+b-c, pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
      const predictor=[0,a,b,Math.floor((a+b)/2),pa<=pb&&pa<=pc?a:pb<=pc?b:c][filter];
      pixels[i]=(raw[y*(stride+1)+x+1]+predictor)&255;
    }
  }
  return {width,height,pixel(x,y) {
    need(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<width&&y<height,'Pixel out of bounds');
    const i=y*stride+x*channels;need(channels===3||pixels[i+3]===255,'Nonopaque screenshot sample');
    return [...pixels.subarray(i,i+3)];
  }};
}
export function readIdentity() {
  const source=readReleaseSource(join(root,'extension')),context=createContext({});
  for (const name of ['zhroma-colour.js','zhroma-themes.js']) new Script(readFileSync(join(root,'extension',name),'utf8')).runInContext(context);
  const records=JSON.parse(JSON.stringify(context.Zhroma.themes.records));
  need(records.length>0&&new Set(records.map(r=>r.id)).size===records.length&&['zhroma-classic','zhroma-colourblind-safe'].every(id=>records.some(r=>r.id===id)),'Incomplete accepted catalog');
  const identity={sourceDigest:source.digest,assets:source.assets,dataDigest:hash(JSON.stringify(records.map(r=>({id:r.id,variants:r.variants})))),
    methodDigest:hash(readFileSync(join(root,phase,'08-COLOUR-METHOD.md'))),admissionDigest:hash(readFileSync(join(root,phase,'08-PRESET-REPORT.md'))),
    selectorsDigest:hash(readFileSync(join(root,'SELECTORS.md'))),fixtureDigest:hash(readFileSync(join(root,'test/fixtures/zendesk-rules-dark-table.html'))),
    harnessDigest:hash(readFileSync(fileURLToPath(import.meta.url))),testDigest:hash(readFileSync(join(root,'test/extension/theme-browser-oracle.test.js')))};
  const admission=readFileSync(join(root,phase,'08-PRESET-REPORT.md'),'utf8').match(/<!-- admission-manifest -->\s*```json\n([\s\S]*?)\n```/);
  need(admission,'Missing admission identity');const admitted=JSON.parse(admission[1]);
  need(admitted.dataDigest===identity.dataDigest&&JSON.stringify(admitted.candidates.filter(c=>c.verdict==='pass').map(c=>c.id))===JSON.stringify(records.map(r=>r.id)),'Stale admission identity');
  return {identity,source,records};
}
export function caseKeys(records) {
  return records.flatMap(r=>modes.flatMap(mode=>[...states.flatMap(state=>priorities.map(p=>`${r.id}/${mode}/${state}/${p}/cell`)),
    ...priorities.map(p=>`${r.id}/${mode}/normal/${p}/preview`),...states.map(state=>`${r.id}/${mode}/${state}/untinted/control`)]));
}
export function requireCompleteReport(report,identity,records) {
  need(report.status==='passed','Nonpassing browser report');
  need(JSON.stringify(report.identity)===JSON.stringify(identity),'Stale report identity');
  need(report.measurement==='CDP PNG screenshot'&&report.tolerance===1,'Actual pixels required');
  const keys=caseKeys(records);need(report.cases.length===keys.length&&new Set(report.cases.map(c=>c.key)).size===keys.length,'Incomplete/duplicate sample matrix');
  const got=new Set(report.cases.map(c=>c.key));need(keys.every(key=>got.has(key)),'Missing required case');
  for(const c of report.cases) { const result=comparePixel(c.measured,c.expected);need(result.maxError===c.maxError,'False pixel success'); }
  return true;
}
// No private profile, persistence or runtime service. This shim supplies only
// finite synthetic settings/status events to the exact production modules.
const shim = `window.paintListeners=[];window.paintStored={enabled:true};window.chrome={storage:{local:{get:(keys,callback)=>callback(Array.isArray(keys)?paintStored:{enabled:true})},onChanged:{addListener:f=>paintListeners.push(f)}},runtime:{id:'synthetic',onMessage:{addListener:()=>{}},sendMessage:(message,callback)=>callback?.(message.type==='get-theme'?{type:'get-theme',requestId:message.requestId,confirmed:true,value:'zhroma-classic',status:'default'}:{enabled:true,status:'working',reason:null})},tabs:{query:(query,callback)=>callback([{id:1}])}};`;
const hostStyle=`body{margin:0}svg{display:none}table{color:inherit;border-collapse:collapse;table-layout:fixed;width:1800px}td,th{box-sizing:border-box;width:100px;height:40px;overflow:hidden;white-space:nowrap;font:10px sans-serif;text-align:left;vertical-align:middle;padding:0 4px}thead{display:none}[data-garden-id="pane"]{background:rgb(255 255 255);color:rgb(41 50 57)}html[data-theme="dark"] [data-garden-id="pane"]{background:rgb(21 26 30);color:rgb(216 220 222)}tr[data-garden-id="tables.row"]:hover{background:rgb(31 115 183 / .08)}tr[data-garden-id="tables.row"][aria-selected="true"]{background:rgb(31 115 183 / .16)}html[data-theme="dark"] tr[data-garden-id="tables.row"]:hover{background:rgb(102 160 205 / .08)}html[data-theme="dark"] tr[data-garden-id="tables.row"][aria-selected="true"]{background:rgb(102 160 205 / .16)}`;
async function connectCdp(url) {
  const ws=new WebSocket(url),pending=new Map();let sequence=0;
  await new Promise((done,fail)=>{const timer=setTimeout(()=>fail(new Error('CDP open timeout')),2000);ws.addEventListener('open',()=>{clearTimeout(timer);done();},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);fail(new Error('CDP open error'));},{once:true});});
  ws.addEventListener('message',({data})=>{const msg=JSON.parse(data),wait=pending.get(msg.id);if(!wait)return;pending.delete(msg.id);clearTimeout(wait.timer);if(msg.error)wait.fail(new Error(msg.error.message));else wait.done(msg.result);});
  ws.addEventListener('close',()=>{for(const wait of pending.values()){clearTimeout(wait.timer);wait.fail(new Error('CDP closed'));}pending.clear();});
  return {send(method,params={},sessionId) {return new Promise((done,fail)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);fail(new Error(`${method} timeout`));},2000);pending.set(id,{done,fail,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});},close:()=>ws.close()};
}
export async function runPaint() {
  const start=Date.now(); need(typeof WebSocket==='function','Installed Node WebSocket required');
  const bin=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';await access(bin,constants.X_OK);
  const {identity,source,records}=readIdentity();
  await validateFixtureManifest(join(root,'test/fixtures/manifest.json'),{requireCompleteScenarioMatrix:true});
  const routes=new Map();for(const a of source.assets){const bytes=readFileSync(join(source.directory,a.name));need(hash(bytes)===a.sha256,'Served bytes changed');routes.set('/extension/'+a.name,bytes);}
  const fixture=readFileSync(join(root,'test/fixtures/zendesk-rules-dark-table.html'),'utf8');
  const manifest=JSON.parse(routes.get('/extension/manifest.json'));
  routes.set('/host',Buffer.from(`<html lang="en" data-theme="light"><head><style id="measured-host">${hostStyle}</style><link rel="stylesheet" href="/extension/zhroma.css"></head><body><div data-garden-id="pane">${fixture}</div>${manifest.content_scripts[0].js.map(name=>`<script src="/extension/${name}"></script>`).join('')}</body></html>`));
  const served=new Set();const server=createServer((req,res)=>{const path=new URL(req.url,'http://127.0.0.1').pathname,bytes=routes.get(path);if(req.method!=='GET'||!bytes){res.writeHead(404);res.end();return;}served.add(path);res.writeHead(200,{'Content-Type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'"});res.end(bytes);});
  let child,profile,cdp,timer,browser;let expired=false;const cases=[];
  // Work must finish by 50s; cleanup has the remaining <=5s. SIGKILL also
  // interrupts any hung browser command. No race continues work after cleanup.
  try {
    await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
    profile=await mkdtemp(join(tmpdir(),'zhroma-paint-'));
    timer=setTimeout(()=>{expired=true;child?.kill('SIGKILL');cdp?.close();server.closeAllConnections();},Math.max(1,50000-(Date.now()-start)));
    child=spawn(bin,[`--user-data-dir=${profile}`,'--remote-debugging-port=0','--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--force-color-profile=srgb','about:blank'],{stdio:'ignore'});
    let spawnError;child.on('error',e=>spawnError=e);let ports;
    for(let i=0;i<150;i++){if(spawnError)throw spawnError;need(child.exitCode===null&&child.signalCode===null,'Chrome startup failed');try{ports=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).trim().split('\n');break;}catch{await delay(30);}}
    need(ports&&/^\d+$/.test(ports[0])&&ports[1].startsWith('/devtools/browser/'),'Chrome startup timeout');
    cdp=await connectCdp(`ws://127.0.0.1:${ports[0]}${ports[1]}`);browser=await cdp.send('Browser.getVersion');
    const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}),{sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
    const send=(m,p)=>cdp.send(m,p,sessionId);
    const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});need(!result.exceptionDetails,'Browser evaluation failed: '+JSON.stringify(result.exceptionDetails));return result.result.value;};
    await send('Page.enable');await send('Page.bringToFront');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setTouchEmulationEnabled',{enabled:false});await send('Emulation.setEmitTouchEventsForMouse',{enabled:false,configuration:'desktop'});await send('Page.addScriptToEvaluateOnNewDocument',{source:shim});
    await send('Emulation.setDeviceMetricsOverride',{width:1900,height:1400,deviceScaleFactor:1,mobile:false});
    const origin=`http://127.0.0.1:${server.address().port}`;
    await send('Page.navigate',{url:origin+'/host'});
    for(let i=0;i<100;i++){if(await evaluate('Boolean(window.Zhroma?.themes && document.querySelector("[data-zhroma-priority]"))'))break;need(i<99,'Runtime/fixture not ready');await delay(20);}
    // Retain admitted topology; substitute only finite Priority values so the
    // full catalog matrix does not depend on the live capture's ticket mix.
    await evaluate(`window.paintIndex=[...document.querySelectorAll('th[data-garden-id="tables.header_cell"]')].findIndex(c=>c.textContent==='Priority');if(paintIndex<0)throw Error('Missing Priority header');window.lastPaintPointer=null;document.addEventListener('mousemove',e=>window.lastPaintPointer={x:e.clientX,y:e.clientY,tag:e.target.tagName,row:e.target.closest('tr')?.rowIndex,trust:e.isTrusted,hover:e.target.matches(":hover"),rowHover:e.target.closest("tr")?.matches(":hover")});window.paintRows=[...document.querySelectorAll('tr[data-garden-id="tables.row"]')].slice(0,4);if(paintRows.length!==4)throw Error('Missing rows');paintRows.forEach((r,i)=>{r.children[paintIndex].textContent=${JSON.stringify(priorities)}[i]});`);
    await delay(60);
    await evaluate(`if(paintRows.some((r,i)=>r.getAttribute('data-zhroma-priority')!==${JSON.stringify(priorities)}[i]))throw Error('Runtime did not stamp matrix');const control=paintRows[0].cloneNode(true);control.removeAttribute('data-zhroma-priority');control.children[paintIndex].textContent='';control.setAttribute('aria-selected','false');paintRows[0].parentNode.append(control);window.paintControl=control;`);
    const sample=async(key,expected,rowIndex)=>{
      const facts=await evaluate(`(()=>{const r=${rowIndex===4?'paintControl':`paintRows[${rowIndex}]`},c=r.children[paintIndex],b=c.getBoundingClientRect(),s=getComputedStyle(c);return {x:Math.floor(b.right-8),y:Math.floor(b.bottom-6),text:s.color,textPresent:!!c.textContent,hover:r.matches(':hover'),selected:r.getAttribute('aria-selected'),marker:r.getAttribute('data-zhroma-priority'),cell:s.backgroundColor,row:getComputedStyle(r).backgroundColor,owners:[...document.styleSheets].flatMap(sheet=>[...sheet.cssRules].filter(rule=>rule.selectorText&&c.matches(rule.selectorText)&&rule.style.getPropertyValue('background-color')).map(rule=>({href:sheet.href??'measured-host',selector:rule.selectorText,value:rule.style.getPropertyValue('background-color'),important:rule.style.getPropertyPriority('background-color')}))),textOwners:[...document.styleSheets].flatMap(sheet=>[...sheet.cssRules].filter(rule=>rule.selectorText&&c.closest(rule.selectorText)&&rule.style.color).map(rule=>({href:sheet.href??'measured-host',selector:rule.selectorText,value:rule.style.color})))}})()`);
      const [,mode,state,priority]=key.split('/');need(facts.hover===(state==='hover')&&facts.selected===(state==='selected'?'true':'false'),'Wrong native state: '+JSON.stringify({key,hover:facts.hover,selected:facts.selected,pointer:await evaluate('({last:lastPaintPointer,hover:[...document.querySelectorAll(":hover")].map(e=>e.tagName),row0:paintRows[0].isConnected})')}));
      need(facts.text===`rgb(${surfaces[mode].text.join(', ')})`&&facts.textOwners.length>0,'Missing/incorrect text style: '+JSON.stringify({text:facts.text,owners:facts.textOwners,mode}));
      if(rowIndex!==4) need(facts.textPresent&&facts.marker===priority&&facts.owners.some(o=>o.href===origin+'/extension/zhroma.css'&&o.important==='important'),'Production CSS/text not owning sample');
      else need(!facts.marker&&facts.cell==='rgba(0, 0, 0, 0)','Untinted control is tinted');
      const shot=await send('Page.captureScreenshot',{format:'png'}),image=decodePng(Buffer.from(shot.data,'base64'));
      const measured=image.pixel(facts.x,facts.y),agreement=comparePixel(measured,expected);for(let y=0;y<3;y++)for(let x=0;x<3;x++)comparePixel(image.pixel(facts.x+x-1,facts.y+y-1),expected);
      cases.push({key,expected,measured,...agreement,styles:facts});
    };
    for(const record of records) for(const mode of modes) {
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1890,y:1390});
      await evaluate(`document.documentElement.setAttribute('data-theme',${JSON.stringify(mode)});paintListeners.forEach(f=>f({theme:{newValue:{v:1,id:${JSON.stringify(record.id)}}}},'local'));[...paintRows,paintControl].forEach(r=>r.setAttribute('aria-selected','false'));`);
      for(const state of states) {
        await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1890,y:1390});
        await evaluate(`[...paintRows,paintControl].forEach(r=>r.setAttribute('aria-selected',${JSON.stringify(state==='selected'?'true':'false')}));`);
        for(let i=0;i<5;i++) {
          if(state==='hover'){const p=await evaluate(`(()=>{const b=${i===4?'paintControl':`paintRows[${i}]`}.getBoundingClientRect();return {x:b.left+20,y:b.top+10}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'none',buttons:0,pointerType:'mouse',...p});await evaluate('new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))');}
          const tint=i===4?{rgb:[0,0,0],alpha:0}:record.variants[mode].slots[record.variants[mode].priorities[priorities[i]]];
          await sample(`${record.id}/${mode}/${state}/${i===4?'untinted/control':priorities[i]+'/cell'}`,expectedPixel(tint,mode,state),i);
        }
      }
    }
    await send('Page.navigate',{url:origin+'/extension/popup.html'});
    for(let i=0;i<100;i++){if(await evaluate(`document.querySelectorAll('.theme-choice').length===${records.length}`))break;need(i<99,'Popup previews not ready');await delay(20);}
    for(let k=0;k<records.length;k++) {
      const points=await evaluate(`(()=>{const label=document.querySelectorAll('.theme-choice')[${k}];label.scrollIntoView({block:'center'});return [...label.querySelectorAll('.theme-swatch')].map(e=>{const b=e.getBoundingClientRect();return {x:Math.floor(b.x+b.width/2),y:Math.floor(b.y+b.height/2),width:b.width,height:b.height,css:getComputedStyle(e).backgroundColor}})})()`);
      need(points.length===8&&points.every(p=>p.width>6&&p.height>6&&p.x>=0&&p.y>=0&&p.y<1400),'Missing/hidden preview');
      const shot=await send('Page.captureScreenshot',{format:'png'}),image=decodePng(Buffer.from(shot.data,'base64'));
      for(let i=0;i<8;i++){const mode=modes[Math.floor(i/4)],priority=priorities[i%4],tint=records[k].variants[mode].slots[records[k].variants[mode].priorities[priority]],expected=expectedPixel(tint,mode,'normal'),measured=image.pixel(points[i].x,points[i].y);cases.push({key:`${records[k].id}/${mode}/normal/${priority}/preview`,expected,measured,...comparePixel(measured,expected),computedStyle:points[i].css});}
    }
    need(manifest.content_scripts[0].js.every(n=>served.has('/extension/'+n))&&['zhroma.css','popup.html','popup.js'].every(n=>served.has('/extension/'+n)),'Missing production asset request');
    compareReleaseSources(source,readReleaseSource(source.directory));
    const report={schema_version:1,status:'passed',identity,measurement:'CDP PNG screenshot',tolerance:1,scope:'Reconstructed admitted host; not live Zendesk or Chrome106 execution',browser,environment:`${platform()} ${release()} ${arch()}`,servedAssets:[...served].filter(p=>p.startsWith('/extension/')).sort(),timestamp:new Date().toISOString(),cases,counts:{cells:records.length*24,previews:records.length*8,untinted:records.length*6,total:cases.length}};
    requireCompleteReport(report,readIdentity().identity,records);need(!expired,'Total run timeout');return report;
  } catch(error) {
    error.paintReport={schema_version:1,status:'block',identity,measurement:'CDP PNG screenshot',tolerance:1,scope:'Incomplete reconstructed-host evidence; not live Zendesk or Chrome106 execution',browser:browser??null,environment:`${platform()} ${release()} ${arch()}`,timestamp:new Date().toISOString(),failure:error.message,cases,counts:{total:cases.length,required:caseKeys(records).length},elapsedMs:Date.now()-start};
    throw error;
  } finally {
    clearTimeout(timer);if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await Promise.race([new Promise(done=>child.once('exit',done)),delay(1000)]);}
    cdp?.close();server.closeAllConnections();if(server.listening)await new Promise(done=>server.close(done));
    if(profile)await rm(profile,{recursive:true,force:true,maxRetries:2,retryDelay:100});
    need(Date.now()-start<=55000,'Total run and cleanup exceeded 55s');
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {need(process.argv.length===4&&process.argv[2]==='--output'&&process.argv[3],'Usage: verify-theme-paint.js --output <report.json>');const report=await runPaint();await writeFile(resolve(process.argv[3]),JSON.stringify(report,null,2)+'\n');console.log(`THEME_PAINT_OK cells=${report.counts.cells} previews=${report.counts.previews} untinted=${report.counts.untinted} total=${report.counts.total} source=${report.identity.sourceDigest}`);}
  catch(error){if(error.paintReport&&process.argv.length===4&&process.argv[2]==='--output')await writeFile(resolve(process.argv[3]),JSON.stringify(error.paintReport,null,2)+'\n');console.error('THEME_PAINT_ERROR: '+error.message);process.exitCode=1;}
}
