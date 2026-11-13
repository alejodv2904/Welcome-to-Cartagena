/* Genera alturas.js: los pisos reales (building:levels / height de OpenStreetMap) y el tipo de cada edificio
   del área detallada (MAPA.buildings de mapa.js), en el mismo orden que MAPA.buildings.
   Uso:   node herramientas/alturas-osm.js                     (descarga de Overpass los edificios del área)
          node herramientas/alturas-osm.js <edificios.json>    (usa una descarga ya hecha, p. ej. la de herramientas/ciudad-osm.js)
   Emparejamiento: los vértices de mapa.js salen de OSM con la misma transformación (toG), así que se busca el
   edificio de OSM con más vértices en común; si no comparte ninguno, el que contiene el centroide.
   Los datos son © colaboradores de OpenStreetMap (licencia ODbL). */
'use strict';
const fs=require('fs'),path=require('path');
global.window={};require(path.join(__dirname,'..','mapa.js'));const MAP=window.MAPA;
const ORIGIN=MAP.origin;
const KX=111320*Math.cos(ORIGIN[0]*Math.PI/180),KZ=110600;
const toG=(lat,lon)=>[+((lon-ORIGIN[1])*KX).toFixed(1),+((ORIGIN[0]-lat)*KZ).toFixed(1)];
const BOX=MAP.box,M=60;                                   // área detallada (+60 m de margen)
const BB=`(${(ORIGIN[0]-(BOX[3]+M)/KZ).toFixed(4)},${(ORIGIN[1]+(BOX[0]-M)/KX).toFixed(4)},${(ORIGIN[0]-(BOX[1]-M)/KZ).toFixed(4)},${(ORIGIN[1]+(BOX[2]+M)/KX).toFixed(4)})`;
const SERVERS=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
async function overpass(q){for(let i=0;i<8;i++){const S=SERVERS[i%SERVERS.length];try{
    const r=await fetch(S,{method:'POST',headers:{'User-Agent':'cartagena-libre-map-builder','Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent('[out:json][timeout:300];'+q)});
    if(r.ok)return r.json();console.log('Overpass',r.status,'— reintentando…')}catch(e){console.log('Overpass:',e.message,'— reintentando…')}
  await new Promise(r=>setTimeout(r,8000*(i+1)))}throw new Error('Overpass no respondió')}
function area(p){let a=0;for(let i=0;i<p.length;i++){const j=(i+1)%p.length;a+=p[i][0]*p[j][1]-p[j][0]*p[i][1]}return a/2}
function inPoly(P,x,z){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const xi=P[i][0],zi=P[i][1],xj=P[j][0],zj=P[j][1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c}return c}

// tipo de edificio (bits): 1 culto, 2 industrial/bodega, 4 apartamentos/hotel, 8 comercio/oficinas, 16 institucional, 32 casa
const KIND=t=>{const b=t.building;
  if(/^(church|cathedral|chapel|mosque|temple)$/.test(b)||t.amenity==='place_of_worship')return 1;
  if(/^(industrial|warehouse|hangar|manufacture|storage_tank|factory|silo|depot)$/.test(b))return 2;
  if(/^(apartments|hotel|dormitory)$/.test(b)||t.tourism==='hotel')return 4;
  if(/^(commercial|retail|office|supermarket|kiosk)$/.test(b)||t.shop)return 8;
  if(/^(school|university|college|hospital|public|civic|government|train_station|transportation|stadium|fire_station)$/.test(b))return 16;
  if(/^(house|residential|detached|semidetached_house|terrace|bungalow)$/.test(b))return 32;
  return 0};
// pisos totales (con la planta baja); 0 = sin dato
function pisos(t){let lv=parseFloat(String(t['building:levels']||'').replace(',','.'))||0;
  const h=parseFloat(String(t.height||'').replace(',','.'));if(!lv&&h>0)lv=Math.max(1,Math.round((h-.8)/3.3));
  return Math.max(0,Math.min(70,Math.round(lv)))}

(async()=>{
  const f=process.argv[2];let E;
  if(f){E=JSON.parse(fs.readFileSync(f,'utf8'))}
  else{console.log('Descargando de OpenStreetMap los edificios del área detallada…');E=await overpass(`(way["building"]${BB};relation["building"]${BB};);out geom;`)}
  const inB=(x,z)=>x>BOX[0]-M&&x<BOX[2]+M&&z>BOX[1]-M&&z<BOX[3]+M;
  // polígonos OSM en metros del juego
  const O=[];
  for(const e of E.elements){const t=e.tags||{};if(!t.building||/^(roof|carport|no|collapsed)$/.test(t.building))continue;
    let rings=[];
    if(e.type==='way'&&e.geometry)rings=[e.geometry];
    else if(e.type==='relation'&&e.members)rings=e.members.filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>m.geometry);
    for(const g of rings){const P=g.map(p=>toG(p.lat,p.lon));if(P.length>1&&P[0][0]===P[P.length-1][0]&&P[0][1]===P[P.length-1][1])P.pop();if(P.length<3)continue;
      let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of P){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1])}
      if(!inB((x0+x1)/2,(z0+z1)/2))continue;
      O.push({P,bb:[x0,x1,z0,z1],lv:pisos(t),k:KIND(t),a:Math.abs(area(P)),id:e.type[0]+e.id})}}
  // índice de vértices y cuadrícula de 50 m
  const V=new Map(),G=new Map(),C=50;
  O.forEach((o,i)=>{for(const p of o.P){const k=p[0]+','+p[1];let s=V.get(k);if(!s)V.set(k,s=[]);s.push(i)}
    for(let a=Math.floor(o.bb[0]/C);a<=Math.floor(o.bb[1]/C);a++)for(let b=Math.floor(o.bb[2]/C);b<=Math.floor(o.bb[3]/C);b++){const k=a*100000+b;let s=G.get(k);if(!s)G.set(k,s=[]);s.push(i)}});
  const PIS=[],KIN=[];let byV=0,byC=0,none=0,withLv=0;
  for(const b of MAP.buildings){const q=b[3],P=[];for(let i=0;i<q.length;i+=2)P.push([q[i],q[i+1]]);
    const cnt=new Map();for(const p of P){const s=V.get(p[0].toFixed(1)*1+','+p[1].toFixed(1)*1);if(s)for(const i of s)cnt.set(i,(cnt.get(i)||0)+1)}
    let best=-1,bn=0;for(const [i,n] of cnt)if(n>bn||(n===bn&&best>=0&&O[i].lv>O[best].lv)){best=i;bn=n}
    if(bn>=2)byV++;else{best=-1;
      let cx=0,cz=0;for(const p of P){cx+=p[0];cz+=p[1]}cx/=P.length;cz/=P.length;const ba=Math.abs(area(P));
      const s=G.get(Math.floor(cx/C)*100000+Math.floor(cz/C))||[];let bd=1e18;
      for(const i of s){const o=O[i];if(cx<o.bb[0]||cx>o.bb[1]||cz<o.bb[2]||cz>o.bb[3]||!inPoly(o.P,cx,cz))continue;const d=Math.abs(Math.log((o.a+1)/(ba+1)));if(d<bd){bd=d;best=i}}
      if(best>=0)byC++;else none++}
    const o=best>=0?O[best]:null;PIS.push(o?o.lv:0);KIN.push(o?o.k:0);if(o&&o.lv)withLv++}
  const hist={};PIS.forEach(v=>{if(v)hist[v]=(hist[v]||0)+1});
  console.log('Edificios OSM en el área:',O.length,'· de mapa.js:',MAP.buildings.length);
  console.log('Emparejados por vértices:',byV,'· por centroide:',byC,'· sin pareja:',none);
  console.log('Con pisos reales:',withLv,'·',JSON.stringify(hist));
  const kh={};KIN.forEach(v=>kh[v]=(kh[v]||0)+1);console.log('Tipos:',JSON.stringify(kh));
  const out='/* Pisos reales de los edificios del área detallada (mapa.js), de OpenStreetMap (building:levels / height) — datos © colaboradores de OpenStreetMap (ODbL).\n'+
    '   Generado con herramientas/alturas-osm.js; no editar a mano. Mismo orden que MAPA.buildings.\n'+
    '   pisos: pisos totales con la planta baja (0 = OSM no lo sabe)   tipo: 1 culto, 2 bodega, 4 apartamentos/hotel, 8 comercio/oficinas, 16 institucional, 32 casa, 0 sin dato */\n'+
    'window.ALTURAS={n:'+MAP.buildings.length+',\npisos:'+JSON.stringify(PIS)+',\ntipo:'+JSON.stringify(KIN)+'};\n';
  fs.writeFileSync(path.join(__dirname,'..','alturas.js'),out);
  console.log('alturas.js:',(out.length/1e3).toFixed(1),'KB')})().catch(e=>{console.error(e);process.exit(1)});
