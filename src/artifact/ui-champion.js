// ===== LOL GM: 챔피언 초상화 렌더러 =====
// 실존 챔피언은 pinned Data Dragon 아이콘을 우선 사용하고, 신챔/오프라인은 결정론적 SVG 일러스트로 폴백한다.

const CHAMPION_PORTRAIT_PALETTES={
  arcane:['#10213b','#266bc2','#9ee7ff','#f1d9a0'],celestial:['#171a35','#6456b7','#efcaff','#ffe6a6'],
  infernal:['#261016','#a62922','#ff9a45','#ffd28a'],verdant:['#10271f','#267259','#8ad6a1','#e8dba5'],
  storm:['#172332','#365a89','#9bc9ff','#eef5ff'],shadow:['#15131e','#403354','#a98bd2','#e9d7fb'],
  void:['#1b1028','#632a82','#d16bff','#ffc5f4'],frost:['#122834','#3e7896','#bfefff','#f4fbff'],
  solar:['#2f2112','#9d6320','#ffd05a','#fff0b5'],hex:['#10282b','#1b7373','#75e0d0','#e4c56e']
};
function championPortraitUrl(c){return c?.riotAlias?`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_SOURCE_PATCH}/img/champion/${encodeURIComponent(c.riotAlias)}.png`:null}
function championPortraitVisual(c){return c?.visual||generatedChampionVisual(c)}
function championPortraitSvg(c){
  const v=championPortraitVisual(c),p=CHAMPION_PORTRAIT_PALETTES[v.theme]||CHAMPION_PORTRAIT_PALETTES.hex,s=Math.abs(v.seed||hashStr(c?.id||'portrait')),rev=v.revision||0;
  const flip=v.pose==='profile'?-1:1,headX=v.pose==='front'?60:v.pose==='profile'?66:63,eyeY=48+(s%3),shoulder=v.silhouette==='heavy'?17:v.silhouette==='ornate'?24:20;
  const ornament={
    hood:`<path d="M34 55 Q35 18 60 15 Q87 21 88 57 L78 45 Q70 28 60 29 Q48 28 40 46Z" fill="${p[0]}" opacity=".96"/>`,
    crown:`<path d="M40 31 L44 14 54 27 61 9 69 27 80 14 82 35Z" fill="${p[3]}" opacity=".85"/>`,
    horns:`<path d="M43 29 Q28 23 27 8 Q42 17 49 31M75 29 Q90 22 93 8 Q79 16 70 31" fill="none" stroke="${p[2]}" stroke-width="5"/>`,
    mask:`<path d="M43 45 Q60 35 77 45 L72 60 Q60 68 47 59Z" fill="${p[0]}" stroke="${p[2]}" stroke-width="2"/>`,
    halo:`<ellipse cx="60" cy="28" rx="24" ry="8" fill="none" stroke="${p[2]}" stroke-width="3" opacity=".72"/>`,
    crest:`<path d="M58 34 L60 7 69 35Z" fill="${p[2]}" opacity=".85"/>`,
    braids:`<path d="M42 47 Q28 67 37 101 M76 47 Q92 70 82 103" fill="none" stroke="${p[0]}" stroke-width="7"/>`,
    visor:`<path d="M40 43 L79 40 74 55 42 57Z" fill="${p[2]}" opacity=".7"/>`
  }[v.ornament]||'';
  const weapon={
    shield:`<path d="M14 63 Q29 50 38 65 L33 108 Q19 103 10 88Z" fill="${p[1]}" stroke="${p[3]}" stroke-width="2"/>`,
    blade:`<path d="M91 19 L101 15 77 103 69 107Z" fill="${p[3]}" opacity=".92"/>`,
    spear:`<path d="M93 5 L98 14 72 111" fill="none" stroke="${p[3]}" stroke-width="4"/><path d="M92 5 L104 15 96 20Z" fill="${p[2]}"/>`,
    staff:`<path d="M92 11 L75 112" stroke="${p[3]}" stroke-width="4"/><circle cx="93" cy="15" r="9" fill="none" stroke="${p[2]}" stroke-width="3"/>`,
    orb:`<circle cx="91" cy="78" r="13" fill="${p[2]}" opacity=".38"/><circle cx="91" cy="78" r="7" fill="${p[2]}"/>`,
    blades:`<path d="M17 25 L45 72 M102 24 L76 72" stroke="${p[3]}" stroke-width="5"/>`,
    bow:`<path d="M92 18 Q112 61 88 109 M91 18 L91 108" fill="none" stroke="${p[3]}" stroke-width="3"/>`,
    rifle:`<path d="M72 79 L108 63 112 71 80 91Z" fill="${p[3]}"/>`
  }[v.weapon]||'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><radialGradient id="g${s}" cx="50%" cy="38%"><stop offset="0" stop-color="${p[2]}" stop-opacity=".45"/><stop offset=".46" stop-color="${p[1]}" stop-opacity=".72"/><stop offset="1" stop-color="${p[0]}"/></radialGradient><linearGradient id="a${s}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p[2]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient><filter id="t${s}"><feTurbulence baseFrequency=".55" numOctaves="2" seed="${(s+rev*17)%97}" type="fractalNoise" result="n"/><feBlend in="SourceGraphic" in2="n" mode="soft-light"/></filter></defs><rect width="120" height="120" fill="url(#g${s})"/><path d="M0 94 Q28 69 45 80 Q60 58 80 76 Q101 67 120 91 V120 H0Z" fill="${p[0]}" opacity=".72"/><g opacity=".28" fill="none" stroke="${p[2]}" stroke-width="2"><circle cx="${18+s%16}" cy="${26+s%18}" r="18"/><path d="M4 80 Q46 32 116 17"/></g><g transform="translate(60 60) scale(${flip} 1) translate(-60 -60)" filter="url(#t${s})">${weapon}<path d="M${shoulder} 119 Q23 81 43 72 Q49 66 50 62 H71 Q72 67 79 73 Q100 82 ${120-shoulder} 119Z" fill="${p[1]}" stroke="${p[3]}" stroke-opacity=".3" stroke-width="2"/><path d="M38 86 L53 76 60 88 68 76 83 87 76 120 44 120Z" fill="url(#a${s})" opacity=".85"/><ellipse cx="${headX}" cy="48" rx="19" ry="24" fill="#d6a17d"/><path d="M42 42 Q44 20 62 20 Q80 22 81 45 Q69 34 58 34 Q48 34 42 42Z" fill="${p[0]}"/>${ornament}<path d="M49 ${eyeY} L56 ${eyeY-1} M66 ${eyeY-1} L73 ${eyeY}" stroke="${p[2]}" stroke-width="2.7" stroke-linecap="round"/><path d="M54 61 Q61 65 68 60" fill="none" stroke="${p[0]}" stroke-width="1.8" opacity=".7"/><path d="M44 73 Q60 81 78 72" fill="none" stroke="${p[3]}" stroke-width="2" opacity=".55"/></g><rect x="2" y="2" width="116" height="116" rx="7" fill="none" stroke="${p[3]}" stroke-opacity=".28" stroke-width="3"/></svg>`;
}
function championPortraitDataUri(c){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(championPortraitSvg(c))}
function championPortraitMarkup(c,opt={}){
  const cls=opt.className||'champ-portrait',alt=opt.alt===false?'':esc(championDisplayName(c)),fallback=championPortraitDataUri(c),url=championPortraitUrl(c);
  if(!url)return `<img class="${cls}" src="${fallback}" alt="${alt}" loading="lazy">`;
  return `<img class="${cls}" src="${url}" alt="${alt}" loading="lazy" decoding="async" data-fallback="${fallback}" onerror="this.onerror=null;this.src=this.dataset.fallback">`;
}
