// @vitest-environment node
// Independent oracle: baseline literals are read from the immutable Git reader;
// all floors are recalculated from those bytes, never from feature output.
import { createContext, Script } from 'node:vm';
import { expect, test } from 'vitest';
import { readBaselineSource } from '../../scripts/baseline-source.js';
import { asset } from './tracer-world.js';

const context = createContext({});
for (const path of ['zhroma-colour.js', 'zhroma-themes.js', 'zhroma-settings.js']) new Script(asset(path)).runInContext(context);
const { colour, themes, settings } = context.Zhroma;
const states = ['normal', 'hover', 'selected'];
const inputs = { light: { pane: [255, 255, 255], text: [41, 50, 57], native: [31, 115, 183] },
  dark: { pane: [21, 26, 30], text: [216, 220, 222], native: [102, 160, 205] } };
const blend = (rgb, alpha, base) => rgb.map((channel, index) => alpha * channel + (1 - alpha) * base[index]);
const decode = (channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
const lab = (rgb) => {
  const [r, g, b] = rgb.map(channel => decode(channel / 255));
  const l = Math.cbrt(.4122214708*r + .5363325363*g + .0514459929*b);
  const m = Math.cbrt(.2119034982*r + .6806995451*g + .1073969566*b);
  const s = Math.cbrt(.0883024619*r + .2817188376*g + .6299787005*b);
  return [.2104542553*l + .793617785*m - .0040720468*s, 1.9779984951*l - 2.428592205*m + .4505937099*s,
    .0259040371*l + .7827717662*m - .808675766*s];
};
const delta = (a,b) => 100 * Math.hypot(...lab(a).map((x,i) => x-lab(b)[i]));
const luminance = rgb => rgb.map(x => decode(x/255)).reduce((sum,x,i) => sum+x*[.2126,.7152,.0722][i],0);
const ratio = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const native = (mode,state) => blend(inputs[mode].native, states.indexOf(state)*.08, inputs[mode].pane);
const render = (tint,mode,state) => blend(tint.rgb,tint.alpha,native(mode,state));
const baseline = [...readBaselineSource().files['zhroma.css'].toString().matchAll(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/g)]
  .map(([,r,g,b,a]) => ({rgb:[+r,+g,+b],alpha:+a}));
expect(baseline).toHaveLength(4);

function failures(variant,mode,classicLight = false) {
  const tints = themes.priorityOrder.map(priority => variant.slots[variant.priorities[priority]]);
  const errors = [];
  for(const state of states) {
    const colors = tints.map(tint => render(tint,mode,state));
    const old = baseline.map(tint => render(tint,'light',state));
    colors.forEach((color,i) => {
      if(ratio(color,inputs[mode].text) < 4.5) errors.push(`${state}:contrast:${i}`);
      const floor = classicLight ? delta(old[i],native('light',state)) : 2;
      if(delta(color,native(mode,state)) + (classicLight?1e-6:0) < floor) errors.push(`${state}:untinted:${i}`);
      for(let j=i+1;j<4;j++) {
        const pairFloor = classicLight ? delta(old[i],old[j]) : 3;
        if(delta(color,colors[j]) + (classicLight?1e-6:0) < pairFloor) errors.push(`${state}:pair:${i}:${j}`);
      }
    });
  }
  for(const tint of tints) for(let i=0;i<2;i++) {
    if(delta(render(tint,mode,states[i]),render(tint,mode,states[i+1])) < 2) errors.push('native-transition');
  }
  return errors;
}

test('independent fixed source-over, WCAG and original Oklab vectors', () => {
  expect(colour.composite([0,0,0],0,[255,255,255])).toEqual([255,255,255]);
  expect(colour.composite([0,0,0],1,[255,255,255])).toEqual([0,0,0]);
  colour.composite([220,38,38],.14,[255,255,255]).forEach((value,index) => expect(value).toBeCloseTo([250.1,224.62,224.62][index],10));
  expect(colour.contrast([0,0,0],[255,255,255])).toBe(21);
  const red = [0.6279553606,0.2248630611,0.1258462985];
  colour.oklab([255,0,0]).forEach((value,index) => expect(value).toBeCloseTo(red[index],9));
  expect(colour.preview({rgb:[220,38,38],alpha:.14},'light','hover')).toEqual(render(baseline[0],'light','hover'));
  expect(colour.preview({rgb:[220,38,38],alpha:.14},'light','hover'))
    .not.toEqual(blend(inputs.light.native,.08,blend([220,38,38],.14,inputs.light.pane)));
});

test.each([NaN,Infinity,-Infinity,-.01,1.01,'0.5',null])('rejects invalid alpha %s before CSS emission', alpha => {
  expect(() => colour.emitRgba([1,2,3],alpha)).toThrow();
  expect(() => colour.composite([1,2,3],alpha,[1,2,3])).toThrow();
});
test.each([[1,2], [1,2,3,4], [NaN,2,3], [256,2,3], [-1,2,3], ['1',2,3], Array(3), null, 'red'])
  ('rejects invalid RGB %j', rgb => expect(() => colour.emitRgba(rgb,.1)).toThrow());

test('Classic light literals and every pinned pair/state and tint/untinted floor remain exact', () => {
  const variant = themes.resolve('zhroma-classic','light');
  expect(themes.priorityOrder.map(priority => variant.slots[variant.priorities[priority]])).toEqual(baseline);
  expect(failures(variant,'light',true)).toEqual([]);
});
for(const record of themes.records) for(const mode of ['light','dark']) {
  test(`${record.label} ${mode} meets every text, pair, untinted and native-transition gate`, () => {
    const variant = record.variants[mode];
    expect(failures(variant,mode,record.id === 'zhroma-classic' && mode === 'light')).toEqual([]);
    for(const tint of Object.values(variant.slots)) for(const state of states) {
      colour.preview(tint,mode,state).forEach((value,index) => expect(value).toBeCloseTo(render(tint,mode,state)[index],10));
    }
  });
}
test('duplicate priorities fail the new-palette gate', () => {
  const original = themes.resolve('zhroma-catppuccin','light');
  expect(failures({...original,priorities:{Urgent:'red',High:'red',Normal:'red',Low:'red'}},'light'))
    .toContain('normal:pair:0:1');
});
test('registry is recursively frozen, has eight exact slots and accepted storage IDs only', () => {
  function frozen(value) { if(value && typeof value === 'object') { expect(Object.isFrozen(value)).toBe(true); Object.values(value).forEach(frozen); } }
  frozen(themes); frozen(colour.surfaces);
  expect(themes.IDs).toEqual(settings.THEME_IDS);
  expect(themes.IDs).toEqual(['zhroma-classic','zhroma-catppuccin']);
  for(const record of themes.records) for(const variant of Object.values(record.variants)) {
    expect(Object.keys(variant.slots)).toEqual(['red','orange','yellow','green','cyan','blue','purple','magenta']);
    expect(Object.keys(variant.priorities)).toEqual(['Urgent','High','Normal','Low']);
    for(const slot of Object.values(variant.priorities)) expect(variant.slots[slot]).toBeDefined();
  }
  expect(themes.resolve('arbitrary css','dark')).toBe(themes.records[0].variants.dark);
  expect(themes.resolve('zhroma-catppuccin','unknown')).toBe(themes.records[1].variants.light);
});
