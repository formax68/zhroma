// Developer-only browser paint oracle; implementation follows behavioural RED.
export function decodePng() { throw new Error('PNG decode not implemented'); }
export function comparePixel() { throw new Error('Pixel comparison not implemented'); }
export function crc32() { return 0; }
export function expectedPixel() { return []; }
export function requireCompleteReport() { return true; }
export function readIdentity() { return {identity:{},records:[{id:'zhroma-classic'}]}; }
export function caseKeys() { return ['pending']; }
