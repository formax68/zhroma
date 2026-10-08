// @vitest-environment node
import { afterEach, expect, test } from 'vitest';
import { bootAll, closeWindows, settle } from './tracer-world.js';

afterEach(closeWindows);

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
