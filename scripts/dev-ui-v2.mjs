import {createServer} from 'node:http';
import {watch} from 'node:fs';
let buildImport=0;

const port=Number(process.env.PORT||4174);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT는 유효한 포트 번호여야 합니다');
let html='',building=false,dirty=false,error=null,revision=0,timer;
async function rebuild(){
 dirty=true;if(building)return;building=true;
 try{while(dirty){dirty=false;try{const {buildUiV2}=await import('./build-ui-v2.mjs?build='+(++buildImport));html=await buildUiV2();error=null;revision++;console.log('새 화면 준비 완료 · 브라우저를 새로고침하세요 · '+revision);}catch(e){error=e;console.error('조립 실패 · 현재 오류를 교정하세요:',e.message);}}}
 finally{building=false;}
}
await rebuild();
function changed(){clearTimeout(timer);timer=setTimeout(rebuild,100)}
const watchers=['../src/ui-v2/','../src/artifact/'].map(path=>watch(new URL(path,import.meta.url),changed));watchers.push(watch(new URL('./',import.meta.url),(_,file)=>{if(String(file)==='build-ui-v2.mjs')changed();}));
const server=createServer((req,res)=>{
 res.setHeader('cache-control','no-store');
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/__dev/status'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({revision,building,error:error?.message||null}));}
 if(path!=='/'&&path!=='/ui-v2.html'){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});return res.end('파일을 찾을 수 없습니다');}
 if(error||building){res.writeHead(503,{'content-type':'text/plain; charset=utf-8'});return res.end('화면 조립을 확인한 뒤 새로고침하세요');}
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);
});
server.listen(port,'127.0.0.1',()=>console.log('새 화면 개발 주소 · http://127.0.0.1:'+port));
function close(){clearTimeout(timer);for(const watcher of watchers)watcher.close();server.close();}
process.once('SIGINT',close);process.once('SIGTERM',close);
