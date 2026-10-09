// Developer-only oracle. Fixed equations: original Ottosson Oklab (2021),
// W3C sRGB transfer/WCAG luminance, Machado author severity-1 supplement.
import { createContext, Script } from 'node:vm';
import { readFileSync } from 'node:fs';
import { readBaselineSource } from '../../scripts/baseline-source.js';

const context = createContext({});
new Script(readFileSync(new URL('../../extension/zhroma-colour.js', import.meta.url),'utf8')).runInContext(context);
const colour = context.Zhroma.colour;
export const slots = Object.freeze(['red','orange','yellow','green','cyan','blue','purple','magenta']);
export const priorities = Object.freeze(['Urgent','High','Normal','Low']);
export const states = Object.freeze(['normal','hover','selected']);
export const matrices = Object.freeze({
  protanopia: Object.freeze([[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]].map(Object.freeze)),
  deuteranopia: Object.freeze([[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]].map(Object.freeze)),
});
const decode = c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4;
const encode = x => x <= .0031308 ? 12.92*x : 1.055*x**(1/2.4)-.055;
const validRgb = rgb => Array.isArray(rgb) && rgb.length===3 && [0,1,2].every(i => Object.hasOwn(rgb,i) && Number.isFinite(rgb[i]) && rgb[i]>=0 && rgb[i]<=255);
export function simulateCvd(rgb, kind='normal', severity=1) {
  if (!validRgb(rgb) || !['normal',...Object.keys(matrices)].includes(kind) || ![0,1].includes(severity)) throw new TypeError('Invalid simulation');
  if(kind==='normal' || severity===0) return [...rgb];
  const linear = rgb.map(c => decode(c/255));
  return matrices[kind].map(row => 255*encode(Math.min(1,Math.max(0,row.reduce((sum,c,i)=>sum+c*linear[i],0)))));
}
export function lab(rgb) {
  const [r,g,b]=rgb.map(c=>decode(c/255));
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
  const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
  const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
export const distance=(a,b)=>100*Math.hypot(...lab(a).map((v,i)=>v-lab(b)[i]));
const luminance=rgb=>rgb.map(c=>decode(c/255)).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
export const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
export const atLeast=(value,floor)=>Number.isFinite(value) && value>=floor;
const exactKeys=(value,keys)=>value && typeof value==='object' && Object.keys(value).length===keys.length && keys.every((key,i)=>Object.keys(value)[i]===key);
export const baseline = Object.freeze([...readBaselineSource().files['zhroma.css'].toString().matchAll(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/g)]
  .map(([,r,g,b,a])=>Object.freeze({rgb:Object.freeze([+r,+g,+b]),alpha:+a})));
if(baseline.length!==4) throw new Error('Invalid pinned baseline');
const untinted=(mode,state)=>colour.preview({rgb:[0,0,0],alpha:0},mode,state);
export const classicFloors=Object.freeze(Object.fromEntries(states.map(state=>{
  const rgb=baseline.map(t=>colour.preview(t,'light',state));
  return [state,Object.freeze({pairs:Object.freeze(rgb.flatMap((a,i)=>rgb.slice(i+1).map(b=>distance(a,b)))),
    untinted:Object.freeze(rgb.map(a=>distance(a,untinted('light',state))))})];
})));

// Full precision is returned for evidence; callers may format only for display.
export function validatePalette(record) {
  const errors=[]; const checks=[];
  if(!record || typeof record.id!=='string' || !record.id || typeof record.label!=='string' || !record.label
    || !record.source || !Object.keys(record.source).length || Object.values(record.source).some(v=>typeof v!=='string'||!v.trim())
    || !exactKeys(record.variants,['light','dark'])) return {pass:false,errors:['record-schema'],checks};
  for(const mode of ['light','dark']) {
    const variant=record.variants[mode];
    if(!variant || !exactKeys(variant.slots,slots) || !exactKeys(variant.priorities,priorities)
      || Object.values(variant.priorities).some(v=>!slots.includes(v))
      || Object.values(variant.slots).some(t=>!t || !exactKeys(t,['rgb','alpha']) || !validRgb(t.rgb) || !Number.isFinite(t.alpha) || t.alpha<0 || t.alpha>1)) {
      errors.push(`${mode}:variant-schema`); continue;
    }
    const tints=priorities.map(p=>variant.slots[variant.priorities[p]]);
    const classic=record.id==='zhroma-classic' && mode==='light';
    if(classic && tints.some((t,i)=>t.alpha!==baseline[i].alpha || t.rgb.some((v,j)=>v!==baseline[i].rgb[j]))) errors.push('classic-literal-identity');
    const cvd=record.id==='zhroma-colourblind-safe';
    for(const simulation of cvd?['normal','protanopia','deuteranopia']:['normal']) {
      const rendered=states.map(state=>tints.map(t=>colour.preview(t,mode,state)));
      const simulated=rendered.map(colors=>colors.map(rgb=>simulateCvd(rgb,simulation)));
      states.forEach((state,k)=>{
        const colors=simulated[k];
        const pairs=colors.flatMap((a,i)=>colors.slice(i+1).map(b=>distance(a,b)));
        const base=simulateCvd(untinted(mode,state),simulation);
        const differences=colors.map(a=>distance(a,base));
        const contrasts=rendered[k].map(a=>contrast(a,colour.surfaces[mode].text));
        const lightness=colors.map(rgb=>lab(rgb)[0]);
        pairs.forEach((v,i)=>{if(!atLeast(v+(classic?1e-6:0),classic?classicFloors[state].pairs[i]:3)) errors.push(`${mode}:${simulation}:${state}:pair:${i}`);});
        differences.forEach((v,i)=>{if(!atLeast(v+(classic?1e-6:0),classic?classicFloors[state].untinted[i]:2)) errors.push(`${mode}:${simulation}:${state}:untinted:${i}`);});
        contrasts.forEach((v,i)=>{if(!atLeast(v,4.5)) errors.push(`${mode}:${simulation}:${state}:contrast:${i}`);});
        if(cvd && lightness.some((v,i)=>i && (mode==='light'?v<=lightness[i-1]:v>=lightness[i-1]))) errors.push(`${mode}:${simulation}:${state}:lightness-order`);
        checks.push({mode,simulation,state,pairs,untinted:differences,contrast:contrasts,lightness});
      });
      for(let k=0;k<2;k++) {
        const transitions=simulated[k].map((rgb,i)=>distance(rgb,simulated[k+1][i]));
        transitions.forEach((v,i)=>{if(!atLeast(v,2)) errors.push(`${mode}:${simulation}:${states[k]}:native-transition:${i}`);});
        checks.push({mode,simulation,transition:`${states[k]}→${states[k+1]}`,transitions});
      }
    }
  }
  return {pass:errors.length===0,errors,checks};
}
