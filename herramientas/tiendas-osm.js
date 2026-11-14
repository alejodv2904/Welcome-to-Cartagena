/* Genera tiendas.js: los supermercados Ara, D1 y Olímpica reales de toda Cartagena, tomados de OpenStreetMap,
   con la planta del edificio donde quedan (la del local en OpenStreetMap, o la del edificio de mapa.js / ciudad-osm.js
   que lo contiene; si no hay edificio, un lote del tamaño típico de la marca mirando a la calle).
   Uso:   node herramientas/tiendas-osm.js                 (descarga de Overpass)
          node herramientas/tiendas-osm.js <a.json> [b.json…]  (usa respuestas de Overpass ya guardadas)
   Los datos son © colaboradores de OpenStreetMap (licencia ODbL). Ara, D1 y Olímpica son marcas de sus dueños. */
'use strict';
const fs=require('fs'),path=require('path');
global.window={};for(const f of ['mapa.js','ciudad-osm.js','sitios.js'])require(path.join(__dirname,'..',f));
const MAP=window.MAPA,O=window.CIUDAD_OSM,SIT=window.SITIOS||[];
const ORIGIN=MAP.origin;
const KX=111320*Math.cos(ORIGIN[0]*Math.PI/180),KZ=110600;
const toG=(lat,lon)=>[+((lon-ORIGIN[1])*KX).toFixed(1),+((ORIGIN[0]-lat)*KZ).toFixed(1)];
const WORLD=[-3400,-7600,11600,10600];                    // = CIUDAD.WORLD (ciudad.js)
const BOX=MAP.box;                                        // área detallada (mapa.js)
const BB=`(${(ORIGIN[0]-WORLD[3]/KZ).toFixed(4)},${(ORIGIN[1]+WORLD[0]/KX).toFixed(4)},${(ORIGIN[0]-WORLD[1]/KZ).toFixed(4)},${(ORIGIN[1]+WORLD[2]/KX).toFixed(4)})`;
const inBox=(x,z)=>x>BOX[0]&&x<BOX[2]&&z>BOX[1]&&z<BOX[3];
const inWorld=(x,z)=>x>WORLD[0]+50&&x<WORLD[2]-50&&z>WORLD[1]+50&&z<WORLD[3]-50;
const Q=`(nwr["shop"]["name"~"^(tiendas? )?(ara|d1|ol[ií]mpica|sao)([^a-z]|$)",i]${BB};nwr["shop"]["brand"~"^(ara|d1|ol[ií]mpica)$",i]${BB};);out geom;`;
const SERVERS=['https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter'];
async function overpass(q){for(let i=0;i<8;i++){const S=SERVERS[i%SERVERS.length];try{
    const r=await fetch(S,{method:'POST',headers:{'User-Agent':'cartagena-libre-map-builder','Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent('[out:json][timeout:180];'+q)});
    if(r.ok)return r.json();console.log('Overpass',r.status,'— reintentando…')}catch(e){console.log('Overpass:',e.message,'— reintentando…')}
  await new Promise(r=>setTimeout(r,6000*(i+1)))}throw new Error('Overpass no respondió')}

/* ---------- geometría ---------- */
const area=p=>{let a=0;const n=p.length/2;for(let i=0;i<n;i++){const j=(i+1)%n;a+=p[i*2]*p[j*2+1]-p[j*2]*p[i*2+1]}return a/2};
const cen=p=>{let x=0,z=0;for(let i=0;i<p.length;i+=2){x+=p[i];z+=p[i+1]}return[x/(p.length/2),z/(p.length/2)]};
function inPoly(p,x,z){let c=false;const n=p.length/2;for(let i=0,j=n-1;i<n;j=i++){const xi=p[i*2],zi=p[i*2+1],xj=p[j*2],zj=p[j*2+1];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c}return c}
function polyDist(p,x,z){if(inPoly(p,x,z))return 0;let d=1e9;const n=p.length/2;for(let i=0;i<n;i++){const j=(i+1)%n,ax=p[i*2],az=p[i*2+1],dx=p[j*2]-ax,dz=p[j*2+1]-az,l2=dx*dx+dz*dz||1;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2));d=Math.min(d,Math.hypot(ax+dx*t-x,az+dz*t-z))}return d}
const ccw=p=>{if(area(p)>=0)return p;const q=[];for(let i=p.length-2;i>=0;i-=2)q.push(p[i],p[i+1]);return q};
const r1=v=>Math.round(v*10)/10;
// edificios: los de mapa.js en el área detallada y los de ciudad-osm.js afuera
const BLD=[];for(const b of MAP.buildings){if(b[1]&1)continue;BLD.push(b[3])}for(const b of O.bld)BLD.push(b[2]);
const BG=new Map(),GC=60;
BLD.forEach((p,i)=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(let k=0;k<p.length;k+=2){x0=Math.min(x0,p[k]);x1=Math.max(x1,p[k]);z0=Math.min(z0,p[k+1]);z1=Math.max(z1,p[k+1])}
  for(let gx=Math.floor(x0/GC);gx<=Math.floor(x1/GC);gx++)for(let gz=Math.floor(z0/GC);gz<=Math.floor(z1/GC);gz++){const k=gx+','+gz;let l=BG.get(k);if(!l){l=[];BG.set(k,l)}l.push(i)}});
function bldNear(x,z,r){const out=new Set();for(let gx=Math.floor((x-r)/GC);gx<=Math.floor((x+r)/GC);gx++)for(let gz=Math.floor((z-r)/GC);gz<=Math.floor((z+r)/GC);gz++)for(const i of BG.get(gx+','+gz)||[])out.add(i);return[...out]}
// calles con carros (para orientar los lotes inventados)
const SEG=[];for(const r of MAP.roads.concat(O.roads)){const ty=r[0],p=r[5];if(ty>4||!p)continue;for(let i=0;i<p.length-2;i+=2)SEG.push([p[i],p[i+1],p[i+2],p[i+3]])}
function nearestRoad(x,z,r){let best=null,bd=r;for(const [ax,az,bx,bz] of SEG){if(Math.min(ax,bx)>x+r||Math.max(ax,bx)<x-r||Math.min(az,bz)>z+r||Math.max(az,bz)<z-r)continue;
  const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)),px=ax+dx*t,pz=az+dz*t,d=Math.hypot(px-x,pz-z);if(d<bd){bd=d;best={x:px,z:pz,d,ux:dx/Math.sqrt(l2),uz:dz/Math.sqrt(l2)}}}return best}
function segDist(x,z){const r=nearestRoad(x,z,30);return r?r.d:99}
// tamaño típico del local de cada marca (frente × fondo, metros)
const TAM={ara:[24,30],d1:[20,28],olimpica:[36,40]};
function marca(t){const s=(t.brand||t.name||'').toLowerCase();
  if(/ol[ií]mpica|^sao/.test(s))return'olimpica';if(/(^|tiendas? )ara([^a-z]|$)/.test(s))return'ara';if(/(^|tiendas? )d1([^a-z]|$)/.test(s))return'd1';return null}
const NOMBRE={ara:'Ara',d1:'D1',olimpica:'Olímpica'};

(async()=>{
  // con argumentos: respuestas de Overpass ya guardadas (se juntan, sin repetir elementos); sin argumentos: descargarlas
  const files=process.argv.slice(2);let data;
  if(files.length){const seen=new Set(),els=[];for(const f of files)for(const e of JSON.parse(fs.readFileSync(f,'utf8')).elements){const k=e.type+e.id;if(seen.has(k)){if(e.geometry){const i=els.findIndex(q=>q.type+q.id===k);els[i]=e}continue}seen.add(k);els.push(e)}data={elements:els}}
  else{console.log('Descargando de OpenStreetMap…');data=await overpass(Q)}
  let L=[];
  for(const e of data.elements){const t=e.tags||{};const m=marca(t);if(!m)continue;
    let pt,poly=null;
    if(e.type==='node')pt=toG(e.lat,e.lon);
    else if(e.type==='way'&&e.geometry){const g=e.geometry.map(q=>toG(q.lat,q.lon));if(g.length>3&&g[0][0]===g[g.length-1][0]&&g[0][1]===g[g.length-1][1])g.pop();poly=ccw(g.flat());pt=cen(poly)}
    else if(e.center)pt=toG(e.center.lat,e.center.lon);else continue;
    if(!inWorld(pt[0],pt[1]))continue;
    // las que quedan dentro de un sitio con modelo propio (centro comercial, mercado…) ya tienen su local allá
    const sit=SIT.find(q=>q.p&&/^(mall|mercado|castellana)$/.test(q.k)&&inPoly(q.p,pt[0],pt[1]));if(sit){console.log('  dentro de '+sit.n+':',t.name);continue}
    // el nombre que va en el mapa: "Olímpica", "Ara", "D1" y, si lo trae, el barrio o la sede ("Tiendas Ara - 20 de Julio")
    const sede=(t.name||'').match(/\s[-–]\s(.+)$/);
    L.push({m,n:NOMBRE[m]+(sede&&m!=='olimpica'?' · '+sede[1].trim():''),x:r1(pt[0]),z:r1(pt[1]),poly,id:e.type[0]+e.id})}
  // duplicados (el mismo local como punto y como polígono, o dos puntos de la misma tienda): queda el polígono
  L.sort((a,b)=>(b.poly?1:0)-(a.poly?1:0));const T=[];
  for(const s of L){if(T.some(q=>q.m===s.m&&Math.hypot(q.x-s.x,q.z-s.z)<(s.m==='olimpica'?60:55)))continue;T.push(s)}
  // la planta de cada tienda
  const usados=new Set(),st={local:0,edificio:0,lote:0};
  for(const s of T){let P=null,how='';
    if(s.poly&&Math.abs(area(s.poly))>=60){
      // si el local es casi todo un edificio, se usa el edificio (así no queda otro edificio encima)
      for(const i of bldNear(s.x,s.z,40)){const b=BLD[i];if(!inPoly(b,s.x,s.z))continue;const ab=Math.abs(area(b)),as=Math.abs(area(s.poly));if(ab<as*2.2&&ab>as*.5){P=ccw(b.slice());usados.add(i);how='edificio'}break}
      if(!P){P=s.poly;how='local'}}
    if(!P){let best=-1,bd=14;
      for(const i of bldNear(s.x,s.z,40)){if(usados.has(i))continue;const b=BLD[i],a=Math.abs(area(b));if(a<110||a>15000)continue;const d=polyDist(b,s.x,s.z);if(d<bd){bd=d;best=i}}
      if(best>=0){P=ccw(BLD[best].slice());usados.add(best);how='edificio'}}
    if(!P){// lote nuevo del tamaño de la marca, con el frente hacia la calle más cercana: se prueba a lo largo de la calle
      // y a los dos lados, y queda el que no pisa calles y tumba menos edificios (los que pisa se quitan)
      const r=nearestRoad(s.x,s.z,80);const [W,D]=TAM[s.m];let best=null;
      const ux=r?r.ux:1,uz=r?r.uz:0;
      for(const side of [1,-1])for(const sh of [0,8,-8,16,-16,24,-24,34,-34]){
        let nx=-uz*side,nz=ux*side;const bx=r?r.x+ux*sh:s.x,bz=r?r.z+uz*sh:s.z;const cx=bx+nx*(D/2+6),cz=bz+nz*(D/2+6);
        const R=[cx-ux*W/2-nx*D/2,cz-uz*W/2-nz*D/2,cx+ux*W/2-nx*D/2,cz+uz*W/2-nz*D/2,cx+ux*W/2+nx*D/2,cz+uz*W/2+nz*D/2,cx-ux*W/2+nx*D/2,cz-uz*W/2+nz*D/2];
        let road=0;const hit=new Set();
        for(let a=-W/2+1;a<=W/2-1;a+=2.5)for(let b=-D/2+1;b<=D/2-1;b+=2.5){const x=cx+ux*a+nx*b,z=cz+uz*a+nz*b;if(segDist(x,z)<5)road++;
          for(const i of bldNear(x,z,2))if(!usados.has(i)&&inPoly(BLD[i],x,z))hit.add(i)}
        let lost=0;for(const i of hit)lost+=Math.abs(area(BLD[i]));
        const sc=road*400+lost+Math.hypot(cx-s.x,cz-s.z)*3+(side*((s.x-(r?r.x:s.x))*-uz+(s.z-(r?r.z:s.z))*ux)<0?150:0);
        if(!best||sc<best.sc)best={sc,R,hit}}
      P=ccw(best.R);s.quita=[...best.hit].map(i=>cen(BLD[i]).map(r1));for(const i of best.hit)usados.add(i);how='lote'}
    st[how]++;s.p=P.map(r1);s.det=inBox(s.x,s.z)?1:0;s.how=how}
  T.sort((a,b)=>a.m<b.m?-1:a.m>b.m?1:a.x-b.x);
  const out='/* Supermercados Ara, D1 y Olímpica de Cartagena en su ubicación real. Generado por herramientas/tiendas-osm.js; no editar a mano.\n'+
    '   Datos © colaboradores de OpenStreetMap (ODbL). Ara, D1 y Olímpica son marcas de sus dueños.\n'+
    '   m: marca · n: nombre · x,z: punto de OpenStreetMap · p: planta · det: 1 si queda en el área detallada (mapa.js)\n'+
    '   quita: centros de los edificios que ocupaban el lote nuevo (no se construyen) */\n'+
    'window.TIENDAS=[\n'+T.map(s=>JSON.stringify(Object.assign({m:s.m,n:s.n,x:s.x,z:s.z,det:s.det,p:s.p},s.quita&&s.quita.length?{quita:s.quita}:{}))).join(',\n')+'\n];\n';
  fs.writeFileSync(path.join(__dirname,'..','tiendas.js'),out);
  const c={};for(const s of T)c[s.m]=(c[s.m]||0)+1;
  console.log('Tiendas:',T.length,c,'· plantas:',st);
  for(const s of T)console.log(s.m.padEnd(9),s.n.padEnd(28),String(s.x).padStart(8),String(s.z).padStart(8),s.how.padEnd(9),Math.round(Math.abs(area(s.p)))+' m²',s.quita&&s.quita.length?'quita '+s.quita.length:'',s.det?'(detallada)':'');
})().catch(e=>{console.error(e);process.exit(1)});
