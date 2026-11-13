/* Genera ciudad-osm.js: las calles, los edificios y el agua reales de TODA Cartagena (por fuera del área
   detallada de mapa.js), tomados de OpenStreetMap.
   Uso:   node herramientas/ciudad-osm.js            (descarga de Overpass)
          node herramientas/ciudad-osm.js <carpeta>   (usa vias.json, edificios.json, agua.json, pista.json, otros.json ya descargados)
   Los datos son © colaboradores de OpenStreetMap (licencia ODbL). */
'use strict';
const fs=require('fs'),path=require('path');
global.window={};require(path.join(__dirname,'..','mapa.js'));const MAP=window.MAPA;
const ORIGIN=MAP.origin;                                  // mismo origen que mapa.js y lugares.js
const KX=111320*Math.cos(ORIGIN[0]*Math.PI/180),KZ=110600;
const toG=(lat,lon)=>[+((lon-ORIGIN[1])*KX).toFixed(1),+((ORIGIN[0]-lat)*KZ).toFixed(1)];
const WORLD=[-3400,-7600,11600,10600];                    // = CIUDAD.WORLD (ciudad.js)
const BOX=MAP.box;                                        // área detallada: allí mandan mapa.js y sus modelos
const BB=`(${(ORIGIN[0]-WORLD[3]/KZ).toFixed(4)},${(ORIGIN[1]+WORLD[0]/KX).toFixed(4)},${(ORIGIN[0]-WORLD[1]/KZ).toFixed(4)},${(ORIGIN[1]+WORLD[2]/KX).toFixed(4)})`;
const inBox=(x,z,m)=>{m=m||0;return x>BOX[0]-m&&x<BOX[2]+m&&z>BOX[1]-m&&z<BOX[3]+m};
const inWorld=(x,z)=>x>WORLD[0]&&x<WORLD[2]&&z>WORLD[1]&&z<WORLD[3];

const Q={
  vias:`way["highway"]${BB};out geom;`,
  edificios:`(way["building"]${BB};relation["building"]${BB};);out geom;`,
  agua:`(nwr["natural"="water"]${BB};nwr["waterway"="riverbank"]${BB};way["natural"="coastline"]${BB};);out geom;`,
  pista:`way["aeroway"="runway"]${BB};out geom;`,
  barrios:`(rel["boundary"="administrative"]["admin_level"~"^(9|10)$"]${BB};way["place"~"^(neighbourhood|suburb|quarter)$"]${BB};node["place"~"^(neighbourhood|suburb|quarter|village|hamlet)$"]${BB};);out geom;`,
  transcaribe:`nwr["network"~"transcaribe",i]${BB};out center tags;`,
  otros:`(nwr["amenity"="fuel"]${BB};nwr["amenity"~"^(hospital|bus_station|police|university)$"]${BB};nwr["leisure"~"^(park|stadium)$"]["name"]${BB};nwr["shop"="mall"]${BB};);out center tags;`};
const SERVERS=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
async function overpass(q){for(let i=0;i<8;i++){const S=SERVERS[i%SERVERS.length];try{
    const r=await fetch(S,{method:'POST',headers:{'User-Agent':'cartagena-libre-map-builder','Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent('[out:json][timeout:400];'+q)});
    if(r.ok)return r.json();console.log('Overpass',r.status,'— reintentando…')}catch(e){console.log('Overpass:',e.message,'— reintentando…')}
  await new Promise(r=>setTimeout(r,8000*(i+1)))}throw new Error('Overpass no respondió')}

/* ---------- utilidades ---------- */
function simplifica(pts,tol,fixed){if(pts.length<3)return pts;const keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;if(fixed)fixed.forEach((f,i)=>{if(f)keep[i]=1});
  const st=[[0,pts.length-1]];
  while(st.length){const [a,b]=st.pop();let md=0,mi=-1;const [ax,az]=pts[a],[bx,bz]=pts[b],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);
    for(let i=a+1;i<b;i++){const d=L>.01?Math.abs((pts[i][0]-ax)*dz-(pts[i][1]-az)*dx)/L:Math.hypot(pts[i][0]-ax,pts[i][1]-az);if(d>md){md=d;mi=i}}
    if(md>tol){keep[mi]=1;st.push([a,mi],[mi,b])}else for(let i=a+1;i<b;i++)if(keep[i]){st.push([a,i],[i,b]);break}}
  return pts.filter((p,i)=>keep[i])}
function area(p){let a=0;for(let i=0;i<p.length;i++){const j=(i+1)%p.length;a+=p[i][0]*p[j][1]-p[j][0]*p[i][1]}return a/2}
function inPoly(P,x,z){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const xi=P[i][0],zi=P[i][1],xj=P[j][0],zj=P[j][1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c}return c}
function segD(px,pz,ax,az,bx,bz){const ex=bx-ax,ez=bz-az,l2=ex*ex+ez*ez;let t=l2?((px-ax)*ex+(pz-az)*ez)/l2:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-ex*t,pz-az-ez*t)}
// une los tramos (miembros de una relación) en anillos cerrados
function anillos(lines){const ways=lines.map(l=>l.slice());const out=[];const eq=(a,b)=>Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7;
  while(ways.length){let ring=ways.shift();let grew=true;
    while(!eq(ring[0],ring[ring.length-1])&&grew){grew=false;
      for(let i=0;i<ways.length;i++){const w=ways[i],end=ring[ring.length-1];
        if(eq(w[0],end)){ring=ring.concat(w.slice(1));ways.splice(i,1);grew=true;break}
        if(eq(w[w.length-1],end)){ring=ring.concat(w.slice(0,-1).reverse());ways.splice(i,1);grew=true;break}}}
    if(ring.length>3&&eq(ring[0],ring[ring.length-1]))out.push(ring)}
  return out}
const geo=g=>g.map(p=>[p.lat,p.lon]);

/* ---------- calles ---------- */
// mismo criterio que mapa.js: 0 troncal, 1 primaria, 2 secundaria y enlaces, 3 terciaria, 4 residencial, 5 servicio
const TY={trunk:0,motorway:0,primary:1,secondary:2,primary_link:2,trunk_link:2,motorway_link:2,tertiary:3,secondary_link:3,tertiary_link:3,
  residential:4,unclassified:4,living_street:4,service:5,track:5,busway:4};
function calles(V){
  // calles del mapa detallado: índice de segmentos (celdas de 20 m) y vértices exactos
  const C=20,grid=new Map(),keys=new Set();const gk=(i,j)=>i*100000+j;
  for(const r of MAP.roads){const p=r[5];for(let i=0;i<p.length;i+=2)keys.add(p[i]+','+p[i+1]);
    for(let i=0;i<p.length-2;i+=2){const s=[p[i],p[i+1],p[i+2],p[i+3]];for(let a=Math.floor(Math.min(s[0],s[2])/C)-1;a<=Math.floor(Math.max(s[0],s[2])/C)+1;a++)for(let b=Math.floor(Math.min(s[1],s[3])/C)-1;b<=Math.floor(Math.max(s[1],s[3])/C)+1;b++){const k=gk(a,b);let L=grid.get(k);if(!L){L=[];grid.set(k,L)}L.push(s)}}}
  const nearDet=(x,z,r)=>{const L=grid.get(gk(Math.floor(x/C),Math.floor(z/C)));if(!L)return false;for(const s of L)if(segD(x,z,s[0],s[1],s[2],s[3])<r)return true;return false};
  const nearestKey=(x,z,r)=>{let best=null,bd=r;const L=grid.get(gk(Math.floor(x/C),Math.floor(z/C)));if(!L)return null;for(const s of L)for(const q of [[s[0],s[1]],[s[2],s[3]]]){const d=Math.hypot(q[0]-x,q[1]-z);if(d<bd){bd=d;best=q}}return best};
  const ways=V.elements.filter(w=>w.type==='way'&&w.geometry&&TY[w.tags.highway]!==undefined&&w.tags.area!=='yes'&&w.tags.access!=='no'&&!(w.tags.highway==='service'&&/parking_aisle|drive-through/.test(w.tags.service||'')));
  const uses=new Map();for(const w of ways)w.nodes.forEach((n,i)=>uses.set(n,(uses.get(n)||0)+(i===0||i===w.nodes.length-1?1:2)));
  const out=[];let dup=0;
  for(const w of ways){const t=w.tags;let ty=TY[t.highway];const name=String(t.name||'').replace(/\s+/g,' ').trim();if(name==='Avenida Pedro de Heredia'&&t.highway==='trunk')ty=0;
    let ow=(t.oneway==='yes'||t.oneway==='1'||t.oneway==='true'||t.junction==='roundabout'||t.junction==='circular')?1:t.oneway==='-1'?-1:0;
    const lanes=Math.min(7,parseInt(t.lanes)||0),br=t.bridge&&t.bridge!=='no'?1:0;
    let P=w.geometry.map((g,i)=>{const p=toG(g.lat,g.lon);return{x:p[0],z:p[1],id:w.nodes[i]}});if(ow<0){P.reverse();ow=1}
    // tramos entre cruces
    const pieces=[];let cur=[P[0]];for(let i=1;i<P.length;i++){cur.push(P[i]);if(i<P.length-1&&uses.get(P[i].id)>=3){pieces.push(cur);cur=[P[i]]}}pieces.push(cur);
    for(const pc of pieces){
      // fuera del área detallada y sin repetir calles que ya están en mapa.js
      const cov=[];for(let i=0;i<pc.length-1;i++){const a=pc[i],b=pc[i+1],mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
        cov.push(inBox(mx,mz)||!inWorld(mx,mz)||(nearDet(a.x,a.z,2.5)&&nearDet(b.x,b.z,2.5)&&nearDet(mx,mz,2.5)))}
      let run=null;const flush=()=>{if(run&&run.length>1)emit(run);run=null};
      for(let i=0;i<pc.length-1;i++){if(cov[i]){if(run)dup++;flush();continue}if(!run)run=[pc[i]];run.push(pc[i+1])}flush();
      function emit(r){let pts=r.map(p=>[p.x,p.z]);
        // los extremos que tocan el mapa detallado se pegan a su vértice para que el tránsito pase de uno a otro
        for(const e of [0,pts.length-1]){const k=pts[e][0]+','+pts[e][1];if(keys.has(k))continue;const q=nearestKey(pts[e][0],pts[e][1],12);if(q)pts[e]=[q[0],q[1]]}
        pts=simplifica(pts,.4);
        // tramos de hasta ~200 m (cada uno se construye con el bloque de 250 m donde empieza)
        const S=[0];for(let i=1;i<pts.length;i++)S.push(S[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const tot=S[S.length-1];if(tot<1)return;
        const n=Math.max(1,Math.ceil(tot/200));let at=0;
        for(let k=1;k<=n;k++){const end=tot*k/n;const seg=[];
          // punto en la distancia d
          const pt=d=>{let i=0;while(i<S.length-2&&S[i+1]<d)i++;const f=(d-S[i])/((S[i+1]-S[i])||1);return[+(pts[i][0]+(pts[i+1][0]-pts[i][0])*f).toFixed(1),+(pts[i][1]+(pts[i+1][1]-pts[i][1])*f).toFixed(1)]};
          seg.push(k===1?pts[0]:pt(at));for(let i=1;i<pts.length-1;i++)if(S[i]>at+.5&&S[i]<end-.5)seg.push(pts[i]);seg.push(k===n?pts[pts.length-1]:pt(end));at=end;
          out.push([ty,ow,lanes,br,name,seg.flat()])}}}}
  return{roads:out,dup}}

/* ---------- edificios ---------- */
const KIND=t=>{const b=t.building;
  if(/^(church|cathedral|chapel|mosque|temple)$/.test(b)||t.amenity==='place_of_worship')return 1;
  if(/^(industrial|warehouse|hangar|manufacture|storage_tank|factory|silo|depot)$/.test(b))return 2;
  if(/^(apartments|hotel|dormitory)$/.test(b))return 4;
  if(/^(commercial|retail|office|supermarket|kiosk)$/.test(b)||t.shop)return 8;
  if(/^(school|university|college|hospital|public|civic|government|train_station|transportation|stadium|fire_station)$/.test(b))return 16;
  if(/^(house|residential|detached|semidetached_house|terrace|bungalow)$/.test(b))return 32;
  return 0};
function edificios(E){
  // edificios de mapa.js (para no repetirlos en el borde)
  const det=MAP.buildings.map(b=>{const p=[];for(let i=0;i<b[3].length;i+=2)p.push([b[3][i],b[3][i+1]]);return p});
  const out=[];let skip=0;
  for(const e of E.elements){const t=e.tags||{};if(/^(roof|carport|ruins|no|construction|collapsed|cabin)$/.test(t.building))continue;
    let ring=null;
    if(e.type==='way'&&e.geometry)ring=geo(e.geometry);
    else if(e.type==='relation'&&e.members){const rs=anillos(e.members.filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>geo(m.geometry)));let best=0;for(const r of rs){const a=Math.abs(area(r));if(a>best){best=a;ring=r}}}
    if(!ring||ring.length<4)continue;
    let P=ring.slice(0,-1).map(p=>toG(p[0],p[1]));let cx=0,cz=0;for(const p of P){cx+=p[0];cz+=p[1]}cx/=P.length;cz/=P.length;
    if(!inWorld(cx,cz)||inBox(cx,cz)){skip++;continue}
    if(det.some(d=>Math.abs(d[0][0]-cx)<300&&Math.abs(d[0][1]-cz)<300&&inPoly(d,cx,cz))){skip++;continue}
    P=simplifica(P.concat([P[0]]),.35).slice(0,-1);const a=Math.abs(area(P));if(P.length<3||a<10||a>80000)continue;
    let lv=parseFloat(t['building:levels'])||0;if(!lv&&parseFloat(t.height))lv=Math.round(parseFloat(t.height)/3.2);lv=Math.max(0,Math.min(60,Math.round(lv)));
    out.push([lv,KIND(t),P.flat()])}
  return{bld:out,skip}}

/* ---------- agua: costa del Caribe, bahía, Ciénaga de la Virgen, caños y lagunas (cuadrícula de 16 m de ciudad.js) ---------- */
function agua(A){const OC=16,W=Math.ceil((WORLD[2]-WORLD[0])/OC),H=Math.ceil((WORLD[3]-WORLD[1])/OC);
  const g=new Uint8Array(W*H);// 0 sin definir, 1 tierra (costa), 2 agua
  const cell=(x,z)=>[Math.floor((x-WORLD[0])/OC),Math.floor((z-WORLD[1])/OC)];
  // 1. la línea de costa es una barrera
  const coast=A.elements.filter(e=>e.type==='way'&&e.tags&&e.tags.natural==='coastline'&&e.geometry);
  for(const w of coast){const P=w.geometry.map(p=>toG(p.lat,p.lon));for(let i=0;i<P.length-1;i++){const L=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]),n=Math.max(1,Math.ceil(L/(OC*.3)));
    for(let k=0;k<=n;k++){const [a,b]=cell(P[i][0]+(P[i+1][0]-P[i][0])*k/n,P[i][1]+(P[i+1][1]-P[i][1])*k/n);if(a>=0&&b>=0&&a<W&&b<H)g[b*W+a]=1}}}
  // 2. el mar entra desde puntos que con seguridad son agua (Caribe al noroccidente, la bahía y su parte sur)
  const seeds=[[-3300,-7500],[-3300,-3000],[0,4200],[2000,8000],[-3000,10400]];const st=[];
  for(const [x,z] of seeds){const [a,b]=cell(x,z);if(!g[b*W+a]){g[b*W+a]=2;st.push(b*W+a)}}
  while(st.length){const k=st.pop(),a=k%W,b=(k-a)/W;for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){const na=a+da,nb=b+db;if(na<0||nb<0||na>=W||nb>=H)continue;const q=nb*W+na;if(g[q])continue;g[q]=2;st.push(q)}}
  const sea=new Uint8Array(W*H);for(let i=0;i<W*H;i++)sea[i]=g[i]===2?1:0;
  // 3. cuerpos de agua (ciénaga, lagunas, caños): relleno par-impar por elemento, con sus islas
  const polys=[];
  for(const e of A.elements){const t=e.tags||{};if(!(t.natural==='water'||t.waterway==='riverbank'))continue;
    let rings=[];if(e.type==='way'&&e.geometry)rings=[geo(e.geometry)];else if(e.type==='relation'&&e.members)rings=anillos(e.members.filter(m=>m.type==='way'&&m.geometry).map(m=>geo(m.geometry)));
    rings=rings.filter(r=>r.length>3).map(r=>r.map(p=>toG(p[0],p[1])));if(!rings.length)continue;
    let a=0;for(const r of rings)a+=Math.abs(area(r));if(a<600)continue;polys.push(rings)}
  for(const rings of polys){let z0=1e9,z1=-1e9;for(const r of rings)for(const p of r){z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1])}
    for(let b=Math.max(0,cell(0,z0)[1]);b<=Math.min(H-1,cell(0,z1)[1]);b++){const z=WORLD[1]+(b+.5)*OC;const xs=[];
      for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const A1=r[j],B1=r[i];if((A1[1]>z)!==(B1[1]>z))xs.push(A1[0]+(B1[0]-A1[0])*(z-A1[1])/(B1[1]-A1[1]))}
      xs.sort((p,q)=>p-q);for(let k=0;k+1<xs.length;k+=2){const a0=Math.max(0,Math.ceil((xs[k]-WORLD[0])/OC-.5)),a1=Math.min(W-1,Math.floor((xs[k+1]-WORLD[0])/OC-.5));for(let a=a0;a<=a1;a++)sea[b*W+a]=1}}}
  // fila a fila en tramos alternos tierra/agua (empieza en tierra), como la máscara de mapa.js
  const runs=[];let nw=0;for(let b=0;b<H;b++){const row=[];let cur=0,n=0;for(let a=0;a<W;a++){const v=sea[b*W+a];if(v)nw++;if(v!==cur){row.push(n);cur=v;n=0}n++}row.push(n);runs.push(row)}
  // contorno de la Ciénaga de la Virgen (para el nombre del agua)
  let cienaga=null,ca=0;for(const e of A.elements){const t=e.tags||{};if(!/^Ci[eé]naga de la Virgen$/i.test(t.name||''))continue;
    const rings=e.type==='relation'?anillos(e.members.filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>geo(m.geometry))):[geo(e.geometry)];
    for(const r of rings){const P=r.map(p=>toG(p[0],p[1]));const a=Math.abs(area(P));if(a>ca){ca=a;cienaga=simplifica(P,30).slice(0,-1).flat()}}}
  const land=(x,z)=>{const a=Math.floor((x-WORLD[0])/OC),b=Math.floor((z-WORLD[1])/OC);if(a<0||b<0||a>=W||b>=H)return false;
    // dentro de la máscara detallada de mapa.js manda esa máscara
    const M=MAP.mask,i=Math.floor((x-M.x0)/M.cell),j=Math.floor((z-M.z0)/M.cell);if(i>=0&&j>=0&&i<M.w&&j<M.h)return!maskW(i,j);return!sea[b*W+a]};
  return{water:{x0:WORLD[0],z0:WORLD[1],cell:OC,w:W,h:H,runs},cienaga,land,frac:nw/(W*H),coast:coast.length,polys:polys.length}}
let MW=null;function maskW(i,j){const M=MAP.mask;if(!MW){MW=new Uint8Array(M.w*M.h);M.runs.forEach((row,jj)=>{let ii=0,w=false;for(const n of row){if(w)MW.fill(1,jj*M.w+ii,jj*M.w+ii+n);ii+=n;w=!w}})}return MW[j*M.w+i]===1}

/* ---------- barrios reales: límites, y dónde quedan de verdad los barrios y lugares de ciudad.js ---------- */
const NOMBRE_BARRIO={'Centro':'Centro Histórico','Pie De La Popa':'Pie de la Popa','Martinez Martelo':'Martínez Martelo','Pablo VI - I':'Pablo VI','Pablo VI - II':'Pablo VI','Urbanización Los Corales':'Los Corales','Olaya - Sector Villa Olímpica':'Olaya Villa Olímpica'};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
// nombres de ciudad.js que en OpenStreetMap están partidos o se llaman distinto
const ALIAS={'Olaya Herrera':n=>/^olaya( - sector|\s+st\.)/.test(n)&&!/olimpica/.test(n),'Villa Olímpica':n=>/villa olimpica/.test(n),'Rosedal':n=>n==='el rosedal'};
// lugares de ciudad.js que tienen su sitio real en OpenStreetMap
const LUGAR_OSM={'Terminal de Transportes':'Terminal de Transportes de Cartagena','Hospital Universitario del Caribe':'Hospital Universitario del Caribe',
  'Estadio de Béisbol Once de Noviembre':'Estadio de Beisbol Once de Noviembre','Universidad de Cartagena · Zaragocilla':'Universidad de Cartagena - Sede Zaragocilla',
  'Centro de Salud El Pozón':'Hospital El Pozón','CAI Crespo':'CAI Crespo','CAI San Francisco':'CAI San Francisco','CAI Blas de Lezo':'CAI ‒ Blas de Lezo',
  'Parque de Las Gaviotas':'Parque de las gaviotas','CAI Las Gaviotas':'CAI - Castellana','CAI El Socorro':'Estación de Policía - Los Caracoles'};
function barrios(Bd,Od,land,roads){
  const polys=[],seen=new Set();
  for(const e of Bd.elements){const t=e.tags||{};const nm=NOMBRE_BARRIO[String(t.name||'').trim()]||String(t.name||'').trim();if(!nm||e.type==='node')continue;
    let rings=[];if(e.type==='relation'&&e.members)rings=anillos(e.members.filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>geo(m.geometry)));else if(e.type==='way'&&e.geometry)rings=[geo(e.geometry)];
    for(const r of rings){const P=simplifica(r.slice(0,-1).map(p=>toG(p[0],p[1])).concat([toG(r[0][0],r[0][1])]),3).slice(0,-1);if(P.length<3)continue;
      let cx=0,cz=0;for(const p of P){cx+=p[0];cz+=p[1]}cx/=P.length;cz/=P.length;if(!inWorld(cx,cz))continue;
      const k=nm+'|'+Math.round(cx/50)+','+Math.round(cz/50);if(seen.has(k))continue;seen.add(k);
      polys.push({nm,lv:e.type==='relation'?+t.admin_level||10:10,P,a:Math.abs(area(P)),cx,cz})}}
  const nodes=Bd.elements.filter(e=>e.type==='node'&&e.tags&&e.tags.name).map(e=>({nm:e.tags.name,p:toG(e.lat,e.lon)}));
  // grilla de calles para buscar tierra con calles cerca
  const RG=new Map();for(const p of roads)for(let i=0;i<p.length;i+=2){const k=Math.floor(p[i]/50)*100000+Math.floor(p[i+1]/50);RG.set(k,1)}
  const urban=(x,z)=>land(x,z)&&RG.has(Math.floor(x/50)*100000+Math.floor(z/50));
  const toUrban=(x,z)=>{if(urban(x,z))return[x,z];for(let r=40;r<=2500;r+=40)for(let k=0;k<Math.ceil(r/12);k++){const a=k/Math.ceil(r/12)*Math.PI*2,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r;if(urban(px,pz))return[Math.round(px),Math.round(pz)]}return[x,z]};
  // los barrios de ciudad.js en su sitio real (centro por área de sus polígonos; si no está en OSM y cayó al agua, a la tierra con calles más cercana)
  global.window.CIUDAD_OSM=null;require(path.join(__dirname,'..','ciudad.js'));const CD=global.window.CIUDAD;
  const centros={},mov=[];
  for(const b of CD.BARRIOS){const n0=norm(b[0]),f=ALIAS[b[0]]||(n=>n===n0||n==='urbanizacion '+n0);const ms=polys.filter(p=>f(norm(p.nm)));
    let x,z,r=b[5];if(ms.length){let A=0;x=0;z=0;for(const m of ms){x+=m.cx*m.a;z+=m.cz*m.a;A+=m.a}x/=A;z/=A;r=Math.max(300,Math.min(1300,Math.sqrt(A/Math.PI)*1.3));[x,z]=toUrban(x,z)}
    else{const nd=nodes.find(q=>norm(q.nm)===n0);[x,z]=nd?toUrban(nd.p[0],nd.p[1]):toUrban(b[1],b[2])}
    x=Math.round(x);z=Math.round(z);r=Math.round(r);centros[b[0]]=[x,z,r];mov.push([b[1],b[2],x-b[1],z-b[2]])}
  // lugares: los que están en OSM van a su sitio; los demás se corren lo mismo que su barrio
  const named=new Map();for(const e of Od.elements){const t=e.tags||{};if(!t.name)continue;const lat=e.lat!==undefined?e.lat:e.center&&e.center.lat,lon=e.lon!==undefined?e.lon:e.center&&e.center.lon;if(lat!==undefined&&!named.has(t.name))named.set(t.name,toG(lat,lon))}
  const lugares={};
  for(const L of CD.LUGARES){if(L.inner||L.kind==='aeropuerto'||inBox(L.x,L.z,600))continue;let p=LUGAR_OSM[L.name]&&named.get(LUGAR_OSM[L.name]);
    if(!p){let best=null,bd=1e18;for(const m of mov){const d=(m[0]-L.x)**2+(m[1]-L.z)**2;if(d<bd){bd=d;best=m}}p=toUrban(L.x+best[2],L.z+best[3]);if(L.kind==='playa')p=[L.x+best[2],L.z+best[3]]}
    lugares[L.name]=[Math.round(p[0]),Math.round(p[1])]}
  const out=polys.map(p=>[p.nm,p.lv,p.P.flat()]);
  return{barrios:out,centros,lugares}}

(async()=>{
  const dir=process.argv[2];const D={};
  for(const k of Object.keys(Q)){const f=dir&&path.join(dir,k+'.json');
    if(f&&fs.existsSync(f))D[k]=JSON.parse(fs.readFileSync(f,'utf8'));else{console.log('Descargando',k,'de OpenStreetMap…');D[k]=await overpass(Q[k]);if(dir)fs.writeFileSync(f,JSON.stringify(D[k]))}}
  const R=calles(D.vias),B=edificios(D.edificios),A=agua(D.agua);
  const Z=barrios(D.barrios,D.otros,A.land,R.roads.map(r=>r[5]).concat(MAP.roads.filter(r=>r[0]<=5).map(r=>r[5])));
  // pista del aeropuerto Rafael Núñez: [x0,z0,x1,z1] de la más larga
  let runway=null,rl=0;for(const w of D.pista.elements){if(!w.geometry)continue;const a=toG(w.geometry[0].lat,w.geometry[0].lon),b=toG(w.geometry[w.geometry.length-1].lat,w.geometry[w.geometry.length-1].lon);const l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>rl){rl=l;runway=[...a,...b]}}
  // terminal del aeropuerto (para saber a qué lado de la pista queda)
  let terminal=null;for(const e of D.edificios.elements){const t=e.tags||{};if(t.aeroway==='terminal'&&t.name&&e.geometry){let x=0,z=0;for(const g of e.geometry){const p=toG(g.lat,g.lon);x+=p[0];z+=p[1]}terminal=[Math.round(x/e.geometry.length),Math.round(z/e.geometry.length)]}}
  // estaciones del Transcaribe con nombre (una por nombre, en el promedio de sus plataformas)
  const tcm=new Map();for(const e of D.transcaribe.elements){const t=e.tags||{};if(!t.name||/\d|\|/.test(t.name)||!/transcaribe/i.test(t.network||'')||!/^(platform|station)$/.test(t.public_transport||''))continue;const lat=e.lat!==undefined?e.lat:e.center&&e.center.lat,lon=e.lon!==undefined?e.lon:e.center&&e.center.lon;if(lat===undefined)continue;
    const p=toG(lat,lon),nm=String(t.name).replace(/^Estaci[oó]n\s+/i,'').trim();const a=tcm.get(nm)||[0,0,0];a[0]+=p[0];a[1]+=p[1];a[2]++;tcm.set(nm,a)}
  const transcaribe=[...tcm].map(([nm,a])=>[nm,Math.round(a[0]/a[2]),Math.round(a[1]/a[2])]);
  const fuel=[];for(const e of D.otros.elements){const t=e.tags||{};if(t.amenity!=='fuel')continue;const lat=e.lat!==undefined?e.lat:e.center&&e.center.lat,lon=e.lon!==undefined?e.lon:e.center&&e.center.lon;if(lat===undefined)continue;
    const p=toG(lat,lon);if(!inWorld(p[0],p[1])||inBox(p[0],p[1]))continue;fuel.push([String(t.brand||t.name||'Estación de servicio').replace(/\s+/g,' ').trim(),p[0],p[1]])}
  const out='/* Calles, edificios y agua reales de toda Cartagena (fuera del área detallada de mapa.js) — datos © colaboradores de OpenStreetMap (ODbL).\n   Generado con herramientas/ciudad-osm.js; no editar a mano.\n'+
    '   roads: [tipo, sentido único, carriles, puente, nombre, puntos]   bld: [pisos (0 = sin dato), clase, puntos]   water: tramos tierra/agua por fila\n'+
    '   barrios: [nombre, nivel, límite]   centros/lugares: dónde quedan de verdad los barrios y lugares de ciudad.js */\n'+
    'window.CIUDAD_OSM={runway:'+JSON.stringify(runway)+',terminal:'+JSON.stringify(terminal)+',\nfuel:'+JSON.stringify(fuel)+',\ntranscaribe:'+JSON.stringify(transcaribe)+',\ncentros:'+JSON.stringify(Z.centros)+',\nlugares:'+JSON.stringify(Z.lugares)+',\ncienaga:'+JSON.stringify(A.cienaga)+
    ',\nbarrios:[\n'+Z.barrios.map(b=>JSON.stringify(b)).join(',\n')+'],\nwater:'+JSON.stringify(A.water)+',\nroads:[\n'+R.roads.map(r=>JSON.stringify(r)).join(',\n')+'],\nbld:[\n'+B.bld.map(b=>JSON.stringify(b)).join(',\n')+']};\n';
  fs.writeFileSync(path.join(__dirname,'..','ciudad-osm.js'),out);
  const c={};for(const r of R.roads)c[r[0]]=(c[r[0]]||0)+1;let km=0;for(const r of R.roads){const p=r[5];for(let i=0;i<p.length-2;i+=2)km+=Math.hypot(p[i+2]-p[i],p[i+3]-p[i+1])/1000}
  console.log('Calles:',R.roads.length,'tramos',c,Math.round(km),'km · repetidas con mapa.js:',R.dup);
  console.log('Edificios:',B.bld.length,'· en el área detallada:',B.skip,'· con pisos:',B.bld.filter(b=>b[0]).length);
  console.log('Agua:',(A.frac*100).toFixed(1)+'% · costas',A.coast,'· cuerpos de agua',A.polys,'· pista',runway&&Math.round(rl)+' m','· gasolineras',fuel.length);
  console.log('ciudad-osm.js:',(out.length/1e6).toFixed(2),'MB')})().catch(e=>{console.error(e);process.exit(1)});
