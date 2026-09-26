# LOL GM Artifact Source

- `../index.html` — 브라우저에서 바로 열리는 단일 파일 (현재 Artifact와 동일)
- `src/*.js` — 모듈별 원본. 아래 순서대로 이어 붙이면 index.html의 스크립트가 된다 (의존 순서)
  engine → data → champs2 → patch → competition → world → office → finance → features → app
- `src/shell.html` — HTML·CSS 틀. `/*CODE*/` 자리에 위 모듈을 순서대로 합쳐 넣는다

빌드 예시:
  cd src && { cat engine.js data.js champs2.js patch.js competition.js world.js office.js finance.js features.js app.js; } > bundle.js
  python3 -c "s=open('shell.html').read();open('../index.html','w').write(s.replace('/*CODE*/',open('bundle.js').read()))"
