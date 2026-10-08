// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { EXTENSION_ID, POPUP_URL, bootAll, closeWindows, createWorld, loadContent, loadPopup, loadWorker, markers, optionsSender, settle, statusText } from './tracer-world.js';

afterEach(async () => { vi.useRealTimers(); await closeWindows(); });
const sender = {id:EXTENSION_ID,url:POPUP_URL};
const selected = popup => popup.document.querySelector('input[name="zhroma-theme"]:checked')?.value;
async function choose(popup,id) {
  const radio = popup.document.querySelector(`input[value="${id}"]`);
  radio.checked = true; radio.dispatchEvent(new popup.window.Event('change',{bubbles:true}));
  await settle(); await settle();
}

test('actual popup choice saves one branded envelope and recolours four admitted priorities', async () => {
  const { world, content, popup } = await bootAll();
  const radio = popup.document.querySelector('input[value="zhroma-catppuccin"]');
  expect(radio, 'the packaged popup exposes the accepted branded choice').not.toBeNull();
  radio.checked = true;
  radio.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle(); await settle();
  expect(world.getStored('theme')).toEqual({ v: 1, id: 'zhroma-catppuccin' });
  expect(world.writeLog).toEqual([{ theme: { v: 1, id: 'zhroma-catppuccin' } }]);
  for (const priority of ['urgent', 'high', 'normal', 'low']) {
    expect(content.document.documentElement.style.getPropertyValue(`--zhroma-priority-${priority}`)).not.toBe('');
  }
  expect(world.forbidden).toEqual([]);
});

for(const mode of ['light','dark']) test(`actual ${mode} cells and Light/Dark previews use the resolved palette, reopen confirmed`, async () => {
  const {world,content,popup} = await bootAll({dataTheme:mode});
  const original = markers(content.document);
  expect(original).toEqual(['Urgent','High','Normal','Low']);
  await choose(popup,'zhroma-catppuccin');
  const {colour,themes} = content.context.Zhroma;
  const variant = themes.resolve('zhroma-catppuccin',mode);
  for(const priority of themes.priorityOrder) {
    const row = content.document.querySelector(`[data-zhroma-priority="${priority}"]`);
    const tint = variant.slots[variant.priorities[priority]];
    const expected = colour.emitRgba(tint.rgb,tint.alpha);
    expect(content.document.documentElement.style.getPropertyValue(`--zhroma-priority-${priority.toLowerCase()}`)).toBe(expected);
    for(const cell of row.children) {
      // happy-dom resolves CSS tokens, not flattened browser pixels.
      const scratch = content.document.createElement('span'); scratch.style.backgroundColor = expected;
      expect(content.window.getComputedStyle(cell).backgroundColor).toBe(scratch.style.backgroundColor);
    }
  }
  expect(markers(content.document)).toEqual(original);
  const label = popup.document.querySelector('input[value="zhroma-catppuccin"]').closest('label');
  const previews = [...label.querySelectorAll('.theme-preview')];
  expect(previews).toHaveLength(2);
  for(const [i,previewMode] of ['light','dark'].entries()) {
    const previewVariant = themes.resolve('zhroma-catppuccin',previewMode);
    const swatches = [...previews[i].querySelectorAll('[aria-hidden="true"]')];
    expect(swatches).toHaveLength(4);
    swatches.forEach((swatch,j) => {
      const tint = previewVariant.slots[previewVariant.priorities[themes.priorityOrder[j]]];
      const scratch = popup.document.createElement('span'); scratch.style.backgroundColor = colour.emitRgba(colour.preview(tint,previewMode),1);
      expect(swatch.style.backgroundColor).toBe(scratch.style.backgroundColor);
    });
  }
  const reopened = loadPopup(world); await settle(); await settle();
  expect(selected(reopened)).toBe('zhroma-catppuccin');
  expect(world.writeLog).toHaveLength(1);
  expect(popup.document.getElementById('zhroma-theme-status').textContent).toBe('Theme saved');
  expect(world.forbidden).toEqual([]);
});

test('marker-only mode switch and theme-only save read no table values or restamp rows', async () => {
  const {world,content,popup} = await bootAll();
  let reads = 0;
  for(const cell of content.document.querySelectorAll('td,th')) {
    let proto = cell;
    while(!Object.getOwnPropertyDescriptor(proto,'textContent')) proto = Object.getPrototypeOf(proto);
    const original = Object.getOwnPropertyDescriptor(proto,'textContent');
    Object.defineProperty(cell,'textContent',{configurable:true,get(){reads++;return original.get.call(this);},set(value){original.set.call(this,value);}});
  }
  const writes = vi.spyOn(content.window.Element.prototype,'setAttribute');
  const before = markers(content.document);
  await choose(popup,'zhroma-catppuccin');
  expect(reads).toBe(0);
  expect(writes.mock.calls.filter(([name])=>name==='data-zhroma-priority')).toEqual([]);
  const light = content.document.documentElement.style.getPropertyValue('--zhroma-priority-urgent');
  content.document.documentElement.setAttribute('data-theme','dark'); await settle();
  expect(content.document.documentElement.style.getPropertyValue('--zhroma-priority-urgent')).not.toBe(light);
  expect(reads).toBe(0);
  expect(writes.mock.calls.filter(([name])=>name==='data-zhroma-priority')).toEqual([]);
  expect(markers(content.document)).toEqual(before);
  for(const value of ['unknown','DARK','']) {
    content.document.documentElement.setAttribute('data-theme',value); await settle();
    expect(content.document.documentElement.style.getPropertyValue('--zhroma-priority-urgent')).toBe(light);
  }
  content.document.documentElement.removeAttribute('data-theme'); await settle();
  expect(content.document.documentElement.style.getPropertyValue('--zhroma-priority-urgent')).toBe(light);
  expect(world.forbidden).toEqual([]);
});

test('unreadable theme warning is independent; effective Classic reselection preserves raw bytes/events', async () => {
  const raw = {v:99,id:'future',extra:['preserve']};
  const {world,popup} = await bootAll({stored:{theme:raw}});
  const changes=[]; world.workerChrome.storage.onChanged.addListener(change=>changes.push(change));
  expect(selected(popup)).toBe('zhroma-classic');
  expect(popup.document.getElementById('zhroma-theme-status').textContent).toBe('Your saved theme could not be read. Using Classic.');
  expect(statusText(popup.document)).toBe('Priority tinting is working');
  expect(await world.sendToWorker({type:'set-setting',requestId:77,key:'theme',value:'zhroma-classic'},sender))
    .toEqual({type:'set-setting',requestId:77,outcome:'unchanged',revision:null});
  await choose(popup,'zhroma-classic');
  expect(world.getStored('theme')).toEqual(raw); expect(world.writeLog).toEqual([]); expect(changes).toEqual([]);
  await choose(popup,'zhroma-catppuccin'); await choose(popup,'zhroma-classic');
  expect(world.writeLog).toHaveLength(2); expect(world.getStored('theme')).toEqual({v:1,id:'zhroma-classic'});
});

test('pending theme save displays last confirmed choice and permits only one owner', async () => {
  const {world,popup} = await bootAll(); world.setWriteMode('deferred');
  await choose(popup,'zhroma-catppuccin');
  expect(selected(popup)).toBe('zhroma-classic');
  expect([...popup.document.querySelectorAll('input[name="zhroma-theme"]')].every(radio=>radio.disabled)).toBe(true);
  await choose(popup,'zhroma-classic');
  expect(world.pendingWriteCount()).toBe(1);
  world.flushWrites(); await settle(); await settle();
  expect(selected(popup)).toBe('zhroma-catppuccin'); expect(world.writeLog).toHaveLength(1);
  expect(popup.document.getElementById('zhroma-theme-status').textContent).toBe('Theme saved');
});

test('confirmed save failure retains choice and off/no-view still permit theme saving', async () => {
  const {world,content,popup} = await bootAll({stored:{enabled:false},writeMode:'rejected'});
  content.document.body.replaceChildren();
  await choose(popup,'zhroma-catppuccin');
  expect(selected(popup)).toBe('zhroma-classic');
  expect(popup.document.getElementById('zhroma-theme-status').textContent).toBe('Theme could not be saved. Try again.');
  world.setWriteMode('immediate'); await choose(popup,'zhroma-catppuccin');
  expect(world.getStored('enabled')).toBe(false);
  expect(world.getStored('theme')).toEqual({v:1,id:'zhroma-catppuccin'});
  expect(content.document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
});

test('get-theme exact sender/request contract refuses spoofing and failed imports answer unconfirmed', async () => {
  const world=createWorld(); loadWorker(world);
  expect(await world.sendToWorker({type:'get-theme',requestId:1},sender)).toEqual({type:'get-theme',requestId:1,confirmed:true,value:'zhroma-classic',status:'default'});
  for(const refused of [{...sender,id:'foreign'}, {...sender,tab:{id:3}}, optionsSender(), {...sender,url:'popup.html'}])
    expect(await world.sendToWorker({type:'get-theme',requestId:2},refused)).toBeInstanceOf(Error);
  for(const request of [{type:'get-theme',requestId:0}, {type:'get-theme',requestId:2,extra:true}])
    expect(await world.sendToWorker(request,sender)).toBeInstanceOf(Error);
  expect(world.writeLog).toEqual([]); expect(world.forbidden).toEqual([]);
  const broken=createWorld();loadWorker(broken,{imports:'throws'});
  expect(await broken.sendToWorker({type:'get-theme',requestId:3},sender)).toEqual({type:'get-theme',requestId:3,confirmed:false,value:null,status:null});
});

test('hung read is bounded and unconfirmed, never interpreted as absent', async () => {
  vi.useFakeTimers(); const world=createWorld({settingsReadMode:'hang',portCloseMs:20000}); loadWorker(world);
  const answer=world.sendToWorker({type:'get-theme',requestId:1},sender);
  await vi.advanceTimersByTimeAsync(4001);
  expect(await answer).toEqual({type:'get-theme',requestId:1,confirmed:false,value:null,status:null});
  expect(world.writeLog).toEqual([]);
});

test('initial dark properties exist before the first positive priority stamp', async () => {
  const atPaint=[];
  const {world,content} = await bootAll({dataTheme:'dark',beforeScripts({window,document}) {
    const original = window.Element.prototype.setAttribute;
    window.Element.prototype.setAttribute = function(name,value) {
      if(name==='data-zhroma-priority') atPaint.push(document.documentElement.style.getPropertyValue(`--zhroma-priority-${value.toLowerCase()}`));
      return original.call(this,name,value);
    };
  }});
  expect(atPaint).toEqual(['rgb(220 38 38 / 0.3)','rgb(234 88 12 / 0.3)','rgb(202 138 4 / 0.3)','rgb(22 163 74 / 0.3)']);
  expect(markers(content.document)).toEqual(['Urgent','High','Normal','Low']);
  expect(world.writeLog).toEqual([]);
});

test('unknown issued write triggers one bounded readback and never an optimistic saved claim', async () => {
  vi.useFakeTimers(); const world=createWorld({portCloseMs:20000}); loadWorker(world); loadContent(world);
  await vi.advanceTimersByTimeAsync(150);
  const popup=loadPopup(world); await vi.advanceTimersByTimeAsync(150);
  const before = world.traffic.filter(entry=>entry.direction==='to-worker' && entry.payload.type==='get-theme').length;
  world.setWriteMode('deferred');
  const radio=popup.document.querySelector('input[value="zhroma-catppuccin"]'); radio.checked=true;
  radio.dispatchEvent(new popup.window.Event('change',{bubbles:true}));
  await vi.advanceTimersByTimeAsync(4050);
  const reads = world.traffic.filter(entry=>entry.payload?.type==='get-theme' && entry.direction==='to-worker').length;
  expect(reads-before).toBe(1);
  expect(selected(popup)).toBe('zhroma-classic');
  expect(popup.document.getElementById('zhroma-theme-status').textContent).not.toMatch(/saved|applied/i);
  expect(world.pendingWriteCount()).toBe(1);
  world.flushWrites(); await vi.advanceTimersByTimeAsync(150);
  expect(world.getStored('theme')).toEqual({v:1,id:'zhroma-catppuccin'});
  expect(world.writeLog).toHaveLength(1);
});
