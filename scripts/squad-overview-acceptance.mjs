import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/artifact/ui-squad-controls.js',import.meta.url),'utf8');
function fixture(){
 const el={},db={teams:{a:{id:'a',region:'NA',division:1,active:true},b:{id:'b',region:'EU',division:1,active:true},closed:{id:'closed',active:false}},world:{manage:'manual',fired:false},manager:{teamId:null},worldDate:'2028-01-08',year:2028};
 const c=vm.createContext({DB:db,SQUAD:null,OPEN_P:'old',SLOT:'1',VIEW:'squad',UI_RENDER_ID:1,SLOT_SWITCHING:false,UI_OVERLAY:null,$:()=>el,nav:()=>c.calls++,calls:0,managerSelectableTeams:(db,region)=>Object.values(db.teams).filter(t=>t.region===region&&t.active!==false)});
 vm.runInContext(source,c);vm.runInContext('bindSquadTeamSelection()',c);return {c,el,db};
}
const changes=[c=>c.DB=JSON.parse(JSON.stringify(c.DB)),c=>c.DB.world={...c.DB.world},c=>c.DB.manager={...c.DB.manager},c=>c.DB.manager.teamId='a',c=>c.SLOT='2',c=>c.VIEW='season',c=>c.UI_RENDER_ID++,c=>c.SQUAD='a',c=>c.DB.worldDate='2028-01-09',c=>c.DB.year++,c=>c.DB.world.manage='ai',c=>c.DB.world.fired=true,c=>c.SLOT_SWITCHING=true,c=>c.UI_OVERLAY={}];
for(const change of changes){const {c,el}=fixture();change(c);const before=JSON.stringify(c.DB),squad=c.SQUAD;el.onchange({target:{value:'b'}});assert.equal(c.calls,0);assert.equal(c.SQUAD,squad);assert.equal(JSON.stringify(c.DB),before)}
for(const id of ['unknown','closed','']){const {c,el}=fixture(),before=JSON.stringify(c.DB);el.onchange({target:{value:id}});assert.equal(c.calls,0);assert.equal(JSON.stringify(c.DB),before)}
for(const mode of ['manual','ai']){const {c,el}=fixture();c.DB.world.manage=mode;vm.runInContext('bindSquadTeamSelection()',c);const before=JSON.stringify(c.DB);el.onchange({target:{value:'b'}});assert.equal(c.SQUAD,'b');assert.equal(c.OPEN_P,null);assert.equal(c.calls,1);assert.equal(JSON.stringify(c.DB),before);el.onchange({target:{value:'a'}});assert.equal(c.calls,1,'retained selection is consumed by the presentation change')}
console.log('선수단 공개 조회 수용: 14개 오래된 문맥 차단·잘못된 구단 거절·수동/AI 조회 데이터 무변경');
