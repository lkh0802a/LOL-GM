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
console.log('single HTML / WASM / UI DOM simulation: PASS');
