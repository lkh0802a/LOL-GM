# Isolated Rust/Svelte foundation

This is a transport and packaging proof. It has no game rules, world, persistence, migration or connection to the existing game. The original build, saves and release paths remain authoritative.

With Rust 1.99.1, the `wasm32-unknown-unknown` target and Node 24 installed:

```sh
cd rebuild
npm ci
cargo test --locked
npm run build
npm run check
npm run test:bundle
```

The generated `web/dist/index.html` inlines JavaScript and WASM bytes. The bundle test uses a DOM simulation with external script/CSS loading disabled; it does not prove real-browser `file://` cold start, Android device support, or save compatibility. Those remain separate acceptance gates.
