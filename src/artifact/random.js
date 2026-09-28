// ===== LOL GM: shared deterministic RNG and numerical primitives =====
function clamp(v,a,b){return v<a?a:v>b?b:v}
function avg(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:0}
function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
class RNG{
  constructor(seed,name){this.a=hashStr(String(seed)+'::'+name)|0;this.sp=null}
  next(){let a=this.a=(this.a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}
  r(){return this.next()}
  range(a,b){return a+(b-a)*this.next()}
  chance(p){return this.next()<p}
  normal(m=0,s=1){if(this.sp!==null){const z=this.sp;this.sp=null;return m+s*z}const u=1-this.next(),v=this.next(),r=Math.sqrt(-2*Math.log(u));this.sp=r*Math.sin(2*Math.PI*v);return m+s*r*Math.cos(2*Math.PI*v)}
  pick(arr){return arr[Math.floor(this.next()*arr.length)]}
  int(a,b){return a+Math.floor(this.next()*(b-a+1))}
}
// 원인별로 분리된 랜덤 스트림
function makeStreams(seed){return {mech:new RNG(seed,'mechanical'),dec:new RNG(seed,'decision'),info:new RNG(seed,'information'),exec:new RNG(seed,'execution'),draft:new RNG(seed,'draft'),log:new RNG(seed,'log')}}
