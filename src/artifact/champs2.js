// ===== LOL GM: 챔피언 확장 (아키타입 기반) =====
// kit: [burst,dps,cc,engage,disengage,peel,poke,waveclear,mobility,sustain,early,mid,late,difficulty]
const ARCH={
  juggernaut:['fighter',[5,7,4,4,2,1,1,5,2,7,6,7,7,4],150],diver:['fighter',[7,5,6,7,2,2,1,5,7,4,7,8,6,6],150],skirmisher:['fighter',[6,8,2,3,3,1,1,5,7,6,6,8,8,7],150],
  vanguard:['tank',[4,3,8,9,4,5,1,4,4,4,6,7,7,5],150],warden:['tank',[3,2,7,5,8,9,1,3,3,4,6,7,7,5],150],catcher:['tank',[4,2,9,8,4,5,2,2,4,3,7,8,6,6],300],
  burst:['mage',[9,4,5,3,3,2,6,6,4,2,7,8,6,6],550],battle:['mage',[6,8,5,5,3,2,3,7,4,5,6,8,7,5],450],control:['mage',[7,6,7,5,6,4,6,8,3,2,6,8,8,6],550],
  artillery:['mage',[7,5,3,1,4,2,10,7,2,2,6,8,7,6],650],specialist:['mage',[7,6,5,4,4,2,5,6,5,4,6,8,7,8],500],
  assassin:['assassin',[9,4,3,5,2,1,2,5,9,3,7,8,5,8],150],marksman:['marksman',[6,8,3,2,4,2,4,7,4,3,6,8,8,6],550],
  hyper:['marksman',[5,10,2,1,3,1,3,7,3,3,3,6,10,6],550],bully:['marksman',[7,7,2,2,3,1,6,7,5,3,9,8,5,6],550],enchanter:['enchanter',[3,2,5,2,8,9,4,3,4,5,6,7,8,5],550]
};
// [이름, 포지션, 아키타입, 피해 유형]
const CHAMP_ARCH=[
 ['Darius',['TOP'],'juggernaut','AD'],['Garen',['TOP'],'juggernaut','AD'],['Mordekaiser',['TOP'],'juggernaut','AP'],['Sett',['TOP','SUP'],'juggernaut','AD'],
 ['Illaoi',['TOP'],'juggernaut','AD'],['Nasus',['TOP'],'juggernaut','AD'],['Malphite',['TOP','SUP'],'vanguard','AP'],['Shen',['TOP','SUP'],'warden','AD'],
 ['Urgot',['TOP'],'juggernaut','AD'],['Irelia',['TOP','MID'],'diver','AD'],['Tryndamere',['TOP'],'skirmisher','AD'],['Volibear',['TOP','JGL'],'juggernaut','AD'],
 ["Dr. Mundo",['TOP'],'juggernaut','AD'],['Olaf',['TOP','JGL'],'juggernaut','AD'],['Teemo',['TOP'],'specialist','AP'],['Quinn',['TOP'],'marksman','AD'],
 ['Vayne',['TOP','ADC'],'hyper','AD'],['Singed',['TOP'],'specialist','AP'],['Yorick',['TOP'],'juggernaut','AD'],['Kayle',['TOP'],'hyper','AP'],
 ['Tahm Kench',['TOP','SUP'],'warden','AP'],['Zac',['JGL','TOP'],'vanguard','AP'],["Cho'Gath",['TOP'],'vanguard','AP'],['Heimerdinger',['TOP','MID','SUP'],'specialist','AP'],
 ['Rengar',['JGL','TOP'],'assassin','AD'],['Trundle',['TOP','JGL'],'juggernaut','AD'],['Warwick',['JGL','TOP'],'diver','AD'],['Gangplank',['TOP'],'specialist','AD'],
 ['Rek\'Sai',['JGL'],'diver','AD'],["Kha'Zix",['JGL'],'assassin','AD'],['Hecarim',['JGL'],'diver','AD'],['Kayn',['JGL'],'assassin','AD'],
 ['Master Yi',['JGL'],'skirmisher','AD'],['Evelynn',['JGL'],'assassin','AP'],['Shaco',['JGL'],'assassin','AD'],['Ekko',['JGL','MID'],'assassin','AP'],
 ['Diana',['JGL','MID'],'diver','AP'],['Lillia',['JGL'],'skirmisher','AP'],['Amumu',['JGL','SUP'],'vanguard','AP'],['Rammus',['JGL'],'vanguard','AP'],
 ['Ivern',['JGL'],'enchanter','AP'],['Karthus',['JGL'],'battle','AP'],['Fiddlesticks',['JGL'],'control','AP'],['Udyr',['JGL','TOP'],'juggernaut','AP'],
 ['Qiyana',['JGL','MID'],'assassin','AD'],['Talon',['MID','JGL'],'assassin','AD'],['Shyvana',['JGL'],'juggernaut','AP'],
 ['Zed',['MID'],'assassin','AD'],['Katarina',['MID'],'assassin','AP'],['Fizz',['MID'],'assassin','AP'],['Kassadin',['MID'],'assassin','AP'],
 ['Veigar',['MID'],'burst','AP'],['Annie',['MID','SUP'],'burst','AP'],['Malzahar',['MID'],'control','AP'],['Anivia',['MID'],'control','AP'],
 ['Lissandra',['MID','SUP'],'control','AP'],['Twisted Fate',['MID'],'control','AP'],['Vladimir',['MID','TOP'],'battle','AP'],['Swain',['MID','SUP','ADC'],'battle','AP'],
 ['Vex',['MID'],'burst','AP'],['Xerath',['MID','SUP'],'artillery','AP'],["Vel'Koz",['SUP','MID'],'artillery','AP'],['Lux',['MID','SUP'],'burst','AP'],
 ['Brand',['SUP','MID'],'battle','AP'],['Aurelion Sol',['MID'],'battle','AP'],['Yasuo',['MID','TOP'],'skirmisher','AD'],['Seraphine',['SUP','MID','ADC'],'control','AP'],
 ['Kog\'Maw',['ADC'],'hyper','AP'],['Miss Fortune',['ADC'],'bully','AD'],['Samira',['ADC'],'bully','AD'],['Twitch',['ADC'],'hyper','AD'],['Senna',['SUP','ADC'],'marksman','AD'],
 ['Blitzcrank',['SUP'],'catcher','AP'],['Pyke',['SUP'],'assassin','AD'],['Janna',['SUP'],'enchanter','AP'],['Soraka',['SUP'],'enchanter','AP'],
 ['Nami',['SUP'],'enchanter','AP'],['Yuumi',['SUP'],'enchanter','AP'],['Sona',['SUP'],'enchanter','AP'],['Taric',['SUP'],'warden','AP'],
 ['Morgana',['SUP','MID'],'control','AP'],['Zilean',['SUP','MID'],'control','AP'],
 ['Akshan',['MID','TOP'],'bully','AD'],['Nunu & Willump',['JGL'],'vanguard','AP'],['Ambessa',['TOP'],'diver','AD'],['Mel',['MID','SUP'],'control','AP'],
 ['Yunara',['ADC'],'marksman','AD'],['Briar',['JGL'],'diver','AD'],['Naafiri',['MID','JGL'],'assassin','AD'],['Nilah',['ADC'],'skirmisher','AD'],
 ["Bel'Veth",['JGL'],'skirmisher','AD'],['Zaahen',['TOP'],'juggernaut','AD']
];
// 현재 LoL의 모든 챔피언(172명)이 처음부터 들어 있다. 이후 신규 챔피언은 게임 안에서 새로 만들어진다
const CHAMP_RELEASES=[];
function archChampion(name,roles,arch,dmg,extra,id=championId(name)){
  const [cls,kit0,range]=ARCH[arch], h=hashStr(name), b={}, k={};
  const base=CLASS_BASE[cls];
  BASE_KEYS.forEach((key,i)=>{let v=base[i];if(key!=='range'&&key!=='as')v=Math.round(v*(0.96+(((h>>(i*3))&7)/7)*0.08)*100)/100;b[key]=v});
  b.range=range;
  KIT_KEYS.forEach((key,i)=>k[key]=clamp(kit0[i]+(((h>>(i*2+5))&3)-1)+((extra&&extra[key])||0),1,10));
  return enrichChampion({id,name,roles,cls,dmg,base:b,kit:k,arch});
}