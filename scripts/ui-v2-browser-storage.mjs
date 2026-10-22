import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
function section(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);if(a<0||b<0||source.indexOf(start,a+1)>=0)throw Error('저장 원본 조립 경계 변경: '+start);return source.slice(a,b).trim();}
// 기존 저장 writer 자체를 조립한다. 기존 화면/바인딩은 포함하지 않는다.
export async function uiV2BrowserStorageSource(){
 const [app,library,bridge]=await Promise.all(['src/artifact/app.js','src/artifact/ui-save-library.js','src/ui-v2/browser-storage.js'].map(p=>readFile(new URL(p,root),'utf8')));
 const native=[section(app,'function idb(){','async function loadDB('),section(app,'async function loadDB(','let saveTimer='),section(app,'function normalSnapshot(','function currentSaveStatus('),section(app,'function persistWorldSnapshot(','function saveDB('),section(library,'function savedGameSummary(','function savedGameLabel('),section(library,'async function readSavedGame(','function renderSavedGames(')].join('\n');
 if(bridge.split('/*NATIVE_STORAGE*/').length!==2)throw Error('저장 원본 조립 위치 필요');
 return bridge.replace('/*NATIVE_STORAGE*/',native);
}
