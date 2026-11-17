<script lang="ts">
  import wasmBase64 from './core.b64?raw';

  let status = '준비 중';
  let value = 0;
  let advance: ((n: number) => number) | undefined;
  Promise.resolve().then(() => {
    const bytes = Uint8Array.from(atob(wasmBase64.trim()), c => c.charCodeAt(0));
    return WebAssembly.instantiate(bytes, {});
  }).then(({ instance }) => {
    const exported = instance.exports.advance_demo;
    if (typeof exported !== 'function') throw new Error('missing WASM export');
    advance = exported as (n: number) => number;
    status = '준비 완료';
  }).catch(() => { status = '시작하지 못했습니다'; });

  function increment() {
    if (advance) value = advance(value);
  }
</script>

<main>
  <h1>LoL GM</h1>
  <p role="status">{status}</p>
  <p>값: <span id="value">{value}</span></p>
  <button disabled={!advance} onclick={increment}>확인</button>
</main>
