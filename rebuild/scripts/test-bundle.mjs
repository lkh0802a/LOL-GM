import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';

const html = await readFile(new URL('../web/dist/index.html', import.meta.url), 'utf8');
assert.doesNotMatch(html, /<script[^>]+src\s*=|<link[^>]+href\s*=/i);
const script = html.match(/<script type="module"[^>]*>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'expected one inlined module');
const win = new Window({ url: 'file:///offline/index.html', settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
try {
  win.document.body.innerHTML = '<div id="app"></div>';
  win.eval(script);
  await win.happyDOM.whenAsyncComplete();
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(win.document.querySelector('[role="status"]')?.textContent, '준비 완료');
  assert.equal(win.document.querySelector('#value')?.textContent, '0');
  win.document.querySelector('button')?.click();
  await win.happyDOM.whenAsyncComplete();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(win.document.querySelector('#value')?.textContent, '1');
} finally { win.close(); }
const broken = new Window({ url: 'file:///offline/index.html', settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
try {
  broken.document.body.innerHTML = '<div id="app"></div>';
  broken.atob = () => { throw new Error('invalid encoded WASM'); };
  broken.eval(script);
  await broken.happyDOM.whenAsyncComplete();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(broken.document.querySelector('[role="status"]')?.textContent, '시작하지 못했습니다');
  assert.equal(broken.document.querySelector('button')?.disabled, true);
} finally { broken.close(); }
const missingExport = new Window({ url: 'file:///offline/index.html', settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
try {
  missingExport.document.body.innerHTML = '<div id="app"></div>';
  // A valid, empty WASM module has no advance_demo export.
  missingExport.atob = () => '\0asm\x01\0\0\0';
  missingExport.eval(script);
  await missingExport.happyDOM.whenAsyncComplete();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(missingExport.document.querySelector('[role="status"]')?.textContent, '시작하지 못했습니다');
  assert.equal(missingExport.document.querySelector('button')?.disabled, true);
} finally { missingExport.close(); }
console.log('single HTML / WASM / UI DOM simulation: PASS');
