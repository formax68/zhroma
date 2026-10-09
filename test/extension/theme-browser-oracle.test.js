// @vitest-environment node
import { expect, test } from 'vitest';
import { deflateSync } from 'node:zlib';
import { decodePng, comparePixel, crc32, expectedPixel, requireCompleteReport, readIdentity, caseKeys } from '../../scripts/verify-theme-paint.js';

function png(rows, channels = 3, filters = rows.map(() => 0)) {
  const chunk = (name, bytes) => {
    const type = Buffer.from(name); const size = Buffer.alloc(4); size.writeUInt32BE(bytes.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([type, bytes])));
    return Buffer.concat([size, type, bytes, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(rows[0].length / channels); ihdr.writeUInt32BE(rows.length, 4);
  ihdr[8] = 8; ihdr[9] = channels === 3 ? 2 : 6;
  const raw = rows.flatMap((row, y) => {
    const prev = rows[y - 1] ?? row.map(() => 0);
    const filtered = row.map((v, i) => {
      const a = i < channels ? 0 : row[i - channels], b = prev[i], c = i < channels ? 0 : prev[i - channels];
      const p = a + b - c, pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c);
      const predictor = [0, a, b, Math.floor((a+b)/2), pa<=pb&&pa<=pc?a:pb<=pc?b:c][filters[y]];
      return (v-predictor+256)%256;
    });
    return [filters[y], ...filtered];
  });
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from(raw))),chunk('IEND',Buffer.alloc(0))]);
}
test.each([0,1,2,3,4])('PNG filter %i reconstructs independently authored RGB golden rows', filter => {
  const rows = [[12,33,250,108,5,199],[99,64,202,3,127,55]];
  const image = decodePng(png(rows,3,[filter,filter]));
  expect(image.pixel(0,0)).toEqual([12,33,250]); expect(image.pixel(1,1)).toEqual([3,127,55]);
});
// Fixed PNG binaries generated with Python stdlib zlib.compress/crc32 from
// hand-calculated filtered bytes for the two RGB golden rows above. No JS
// predictor or this decoder's CRC implementation produces these input bytes.
const fixedPngs = [
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGPgUfyVw3qcIdnhFHO9OQAfiQSGnHyXewAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGPkUfyV8OQsY7LDqQX2uQAougX0ouvE/wAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGPiUfyVw3qcKVz+wvSqAgAgyQUrpV7OsQAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGPmUfyV9tWLOdbAd05sPgAjawUVHRV0ugAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGPhUfyV8OQsS7j8helxBQAoSgXsz6DIHwAAAABJRU5ErkJggg==',
];
test.each(fixedPngs.map((bytes,filter)=>[filter,bytes]))('external fixed binary filter %i and all RGB channels', (_filter,bytes) => {
  const image=decodePng(Buffer.from(bytes,'base64'));
  expect(image.pixel(0,0)).toEqual([12,33,250]);expect(image.pixel(1,0)).toEqual([108,5,199]);
  expect(image.pixel(0,1)).toEqual([99,64,202]);expect(image.pixel(1,1)).toEqual([3,127,55]);
});
test('standard independent CRC32 check vector',()=>expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926));
test('RGBA decoding refuses transparent samples and malformed images', () => {
  expect(decodePng(png([[1,2,3,255]],4)).pixel(0,0)).toEqual([1,2,3]);
  expect(() => decodePng(png([[1,2,3,0]],4)).pixel(0,0)).toThrow();
  const bad = png([[1,2,3]]); bad[45] ^= 1;
  expect(() => decodePng(bad)).toThrow();
  expect(() => decodePng(Buffer.from('not an image'))).toThrow();
  expect(() => decodePng(png([[1,2,3]])).pixel(1,0)).toThrow();
});
test('clean lossless image passes; known wrong pixel and invalid tolerance fail', () => {
  const image = decodePng(png([[21,26,30,90,80,70]]));
  expect(comparePixel(image.pixel(0,0),[21,26,30]).maxError).toBe(0);
  expect(comparePixel([22,26,30],[21,26,30]).maxError).toBe(1);
  expect(() => comparePixel(image.pixel(1,0),[21,26,30])).toThrow();
  expect(() => comparePixel([23,26,30],[21,26,30])).toThrow();
  expect(() => comparePixel([21,26,30],[21,26,30],2)).toThrow();
  expect(() => comparePixel([100,0,0],[101.49,0,0])).toThrow();
  expect(comparePixel([100,0,0],[101,0,0]).maxError).toBe(1);
  expect(()=>comparePixel([100,0,0],[101.00001,0,0])).toThrow();
});
test('independent source-over golden rejects inverted layers and wrong alpha', () => {
  const tint = {rgb:[220,38,38],alpha:.14};
  expectedPixel(tint,'light','normal').forEach((v,i)=>expect(v).toBeCloseTo([250.1,224.62,224.62][i],10));
  const correct = expectedPixel(tint,'dark','selected');
  const inverse = expectedPixel(tint,'dark','normal').map((v,i)=>[102,160,205][i]*.16+v*.84);
  expect(() => comparePixel(inverse.map(Math.round),correct)).toThrow();
  expect(() => comparePixel(expectedPixel({...tint,alpha:.4},'dark','selected').map(Math.round),correct)).toThrow();
});
test('complete report rejects empty, missing, duplicate, stale identity and forged pixel success', () => {
  const {identity,records} = readIdentity();
  const cases = caseKeys(records).map(key=>{
    const [id,mode,state,priority,kind]=key.split('/'),record=records.find(r=>r.id===id);
    const tint=kind==='control'?{rgb:[0,0,0],alpha:0}:record.variants[mode].slots[record.variants[mode].priorities[priority]];
    const expected=expectedPixel(tint,mode,state),measured=expected.map(Math.round),text=`rgb(${(mode==='light'?[41,50,57]:[216,220,222]).join(', ')})`;
    const styles={hover:state==='hover',selected:state==='selected'?'true':'false',text,textOwners:[{href:'measured-host',value:text}],textPresent:true,
      marker:kind==='control'?null:priority,cell:kind==='control'?'rgba(0, 0, 0, 0)':'unused',
      owners:[{href:'http://127.0.0.1:12345/extension/zhroma.css',important:'important',selector:`[data-zhroma-priority="${priority}"]`,
        value:`var(--zhroma-priority-${priority.toLowerCase()}, rgb(${({Urgent:'220 38 38 / 0.14',High:'234 88 12 / 0.12',Normal:'202 138 4 / 0.09',Low:'22 163 74 / 0.08'})[priority]}))`}]};
    return {key,expected,measured,...comparePixel(measured,expected),...(kind==='preview'?{computedStyle:`rgb(${expected.join(' ')})`}:{styles})};
  });
  const report = {status:'passed',identity,cases,measurement:'CDP PNG screenshot',tolerance:1,browser:{product:'Chrome/154.0.8037.98',revision:'test-only-scaffold',protocolVersion:'1.3'},
    servedAssets:['content.js','zhroma-settings.js','zhroma-colour.js','zhroma-themes.js','zhroma.css','popup.html','popup.js'].map(n=>'/extension/'+n).sort(),
    counts:{cells:records.length*24,previews:records.length*8,untinted:records.length*6,total:cases.length}};
  expect(requireCompleteReport(report,identity,records)).toBe(true);
  for (const changed of [[],cases.slice(1),[...cases,cases[0]],cases.map((c,i)=>i?c:{...c,measured:[80,80,80]})])
    expect(()=>requireCompleteReport({...report,cases:changed},identity,records)).toThrow();
  expect(()=>requireCompleteReport({...report,identity:{...identity,sourceDigest:'0'.repeat(64)}},identity,records)).toThrow();
  expect(()=>requireCompleteReport({...report,measurement:'computed RGBA'},identity,records)).toThrow();
  expect(()=>requireCompleteReport({...report,status:'block'},identity,records)).toThrow();
  expect(()=>requireCompleteReport({...report,cases:cases.map(c=>({...c,expected:[21,26,30],measured:[21,26,30],maxError:0,rasterMargin:1}))},identity,records)).toThrow();
  for(const field of ['browser','servedAssets','counts']) {const bad=structuredClone(report);delete bad[field];expect(()=>requireCompleteReport(bad,identity,records)).toThrow();}
  expect(()=>requireCompleteReport({...report,counts:{...report.counts,previews:0}},identity,records)).toThrow();
  for(const [kind,field] of [['cell','styles'],['preview','computedStyle']]) {const bad=structuredClone(report);delete bad.cases.find(c=>c.key.endsWith('/'+kind))[field];expect(()=>requireCompleteReport(bad,identity,records)).toThrow();}
  for(const field of ['hover','selected','text','textOwners','marker','textPresent','owners']) {const bad=structuredClone(report);delete bad.cases[0].styles[field];expect(()=>requireCompleteReport(bad,identity,records)).toThrow();}
  const wrongOwner=structuredClone(report);wrongOwner.cases[0].styles.owners[0].href='http://127.0.0.1:12345/host.css';expect(()=>requireCompleteReport(wrongOwner,identity,records)).toThrow();
  const tintedControl=structuredClone(report);tintedControl.cases.find(c=>c.key.endsWith('/control')).styles.marker='Urgent';expect(()=>requireCompleteReport(tintedControl,identity,records)).toThrow();
});
