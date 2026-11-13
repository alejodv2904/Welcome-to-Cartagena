/* Genera lugares.js: barrios (límites reales) y lugares reales de Cartagena (bancos, cajeros, bares,
   discotecas, farmacias, talleres, universidades, hoteles, restaurantes…) tomados de OpenStreetMap.
   Uso:   node herramientas/lugares-osm.js
   Los datos son © colaboradores de OpenStreetMap (licencia ODbL). */
'use strict';
const fs=require('fs'),path=require('path');
const ORIGIN=[10.4225,-75.549];               // mismo origen que mapa.js
const BOX=[-1751.7,-1382.5,3175.0,4147.5];   // zona jugable (metros del juego)
const BB='(10.383,-75.567,10.437,-75.518)';
const KX=111320*Math.cos(ORIGIN[0]*Math.PI/180),KZ=110600;
const toG=(lat,lon)=>[+((lon-ORIGIN[1])*KX).toFixed(1),+((ORIGIN[0]-lat)*KZ).toFixed(1)];
const inBox=([x,z])=>x>=BOX[0]-50&&x<=BOX[2]+50&&z>=BOX[1]-50&&z<=BOX[3]+50;

const Q_POIS=`[out:json][timeout:120];(
nwr["amenity"~"^(bank|atm|bar|pub|nightclub|pharmacy|university|college|restaurant|cafe|fast_food|ice_cream|hospital|clinic)$"]${BB};
nwr["shop"~"^(car_repair|tyres|motorcycle_repair|supermarket|convenience|bakery|clothes|jewelry|gift|mall|department_store|chemist)$"]${BB};
nwr["tourism"~"^(hotel|hostel)$"]${BB};nwr["leisure"="fitness_centre"]${BB};nwr["craft"="car_repair"]${BB};);out center tags;`;
const Q_BARRIOS=`[out:json][timeout:120];(rel["boundary"="administrative"]["admin_level"~"^(9|10)$"]${BB};node["place"~"^(neighbourhood|suburb|quarter)$"]${BB};);out geom;`;

async function overpass(q){for(let i=0;;i++){try{return await overpass1(q)}catch(e){if(i>=3)throw e;console.log('Overpass ocupado, reintentando…');await new Promise(r=>setTimeout(r,8000*(i+1)))}}}
async function overpass1(q){const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'User-Agent':'cartagena-libre-map-builder','Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)});
  if(!r.ok)throw new Error('Overpass '+r.status);return r.json()}

/* ---------- categorías del juego ---------- */
function categoria(t){
  if(t.amenity==='atm')return'cajero';
  if(t.amenity==='bank')return'banco';
  if(t.amenity==='nightclub')return'discoteca';
  if(t.amenity==='bar'||t.amenity==='pub')return'bar';
  if(t.amenity==='pharmacy'||t.shop==='chemist')return'drogueria';
  if(t.amenity==='university'||t.amenity==='college')return'universidad';
  if(t.amenity==='restaurant')return'restaurante';
  if(t.amenity==='fast_food')return'comidas';
  if(t.amenity==='cafe')return'cafe';
  if(t.amenity==='ice_cream')return'heladeria';
  if(t.amenity==='hospital'||t.amenity==='clinic')return'clinica';
  if(t.shop==='car_repair'||t.shop==='tyres'||t.shop==='motorcycle_repair'||t.craft==='car_repair')return'taller';
  if(t.shop==='supermarket'||t.shop==='department_store')return'supermercado';
  if(t.shop==='convenience')return'tienda';
  if(t.shop==='bakery')return'panaderia';
  if(t.shop==='clothes')return'ropa';
  if(t.shop==='jewelry')return'joyeria';
  if(t.shop==='gift')return'recuerdos';
  if(t.shop==='mall')return'mall';
  if(t.tourism==='hotel'||t.tourism==='hostel')return'hotel';
  if(t.leisure==='fitness_centre')return'gimnasio';
  return null}
const limpia=s=>String(s||'').replace(/\s+/g,' ').trim();

/* ---------- barrios: unir los tramos de cada límite en anillos cerrados ---------- */
function anillos(rel){const ways=rel.members.filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>m.geometry.map(p=>[p.lat,p.lon]));const out=[];
  const eq=(a,b)=>Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7;
  while(ways.length){let ring=ways.shift().slice();let grew=true;
    while(!eq(ring[0],ring[ring.length-1])&&grew){grew=false;
      for(let i=0;i<ways.length;i++){const w=ways[i];const end=ring[ring.length-1];
        if(eq(w[0],end)){ring=ring.concat(w.slice(1));ways.splice(i,1);grew=true;break}
        if(eq(w[w.length-1],end)){ring=ring.concat(w.slice(0,-1).reverse());ways.splice(i,1);grew=true;break}}}
    if(ring.length>3)out.push(ring)}
  return out}
// simplificación Douglas-Peucker en metros del juego
function simplifica(pts,tol){if(pts.length<4)return pts;const keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;const st=[[0,pts.length-1]];
  while(st.length){const [a,b]=st.pop();let md=0,mi=-1;const [ax,az]=pts[a],[bx,bz]=pts[b],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1;
    for(let i=a+1;i<b;i++){const d=Math.abs((pts[i][0]-ax)*dz-(pts[i][1]-az)*dx)/L;if(d>md){md=d;mi=i}}
    if(md>tol){keep[mi]=1;st.push([a,mi],[mi,b])}}
  return pts.filter((p,i)=>keep[i])}
const NOMBRE_BARRIO={'Centro':'Centro Histórico','Pie De La Popa':'Pie de la Popa','Martinez Martelo':'Martínez Martelo','Pablo VI - I':'Pablo VI','Pablo VI - II':'Pablo VI'};

(async()=>{
  // con argumentos: usar respuestas de Overpass ya guardadas (JSON); sin argumentos: descargarlas
  let pois,bar;const files=process.argv.slice(2);
  if(files.length){const els=[];for(const f of files)els.push(...JSON.parse(fs.readFileSync(f,'utf8')).elements);pois=bar={elements:els}}
  else{console.log('Descargando de OpenStreetMap…');pois=await overpass(Q_POIS);bar=await overpass(Q_BARRIOS)}
  /* barrios */
  const barrios=[],puntos=[];
  for(const e of bar.elements){const t=e.tags||{};const nm=NOMBRE_BARRIO[limpia(t.name)]||limpia(t.name);if(!nm)continue;
    if(e.type==='relation'){if(!e.members||t.boundary!=='administrative')continue;for(const r of anillos(e)){const g=simplifica(r.slice(0,-1).map(p=>toG(p[0],p[1])),3);if(g.length<4)continue;barrios.push([nm,+t.admin_level,g.flat()])}}
    else if(e.type==='node'&&t.place){const p=toG(e.lat,e.lon);if(!puntos.some(q=>q[0]===nm&&Math.hypot(q[1]-p[0],q[2]-p[1])<300))puntos.push([nm,p[0],p[1]])}}
  /* lugares */
  const lugares=[];const visto=[];
  for(const e of pois.elements){const t=e.tags||{};const cat=categoria(t);if(!cat)continue;
    const lat=e.lat!==undefined?e.lat:e.center&&e.center.lat,lon=e.lon!==undefined?e.lon:e.center&&e.center.lon;if(lat===undefined)continue;
    const p=toG(lat,lon);if(!inBox(p))continue;
    let nm=limpia(t.name);
    if(cat==='cajero'){nm=limpia(t.brand||t.operator||t.name||'Cajero automático').replace(/^Bancolombia .*/,'Bancolombia')}
    else if(!nm)continue;
    if(cat==='universidad'&&/^Colegio (?!Mayor)/i.test(nm))continue; // colegios de primaria/bachillerato
    if(cat==='banco'&&/seguros|western union|supergiros|efecty/i.test(nm))continue;
    const key=cat+'|'+nm.toLowerCase();
    if(visto.some(v=>v[0]===key&&Math.hypot(v[1]-p[0],v[2]-p[1])<35))continue;visto.push([key,p[0],p[1]]);
    lugares.push([cat,nm,p[0],p[1]])}
  lugares.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:a[1]<b[1]?-1:1);
  const out='/* Barrios y lugares reales de Cartagena — datos © colaboradores de OpenStreetMap (ODbL).\n   Generado con herramientas/lugares-osm.js; no editar a mano. */\n'+
    'window.LUGARES={barrios:'+JSON.stringify(barrios)+',\npuntosBarrio:'+JSON.stringify(puntos)+',\nlugares:[\n'+lugares.map(l=>JSON.stringify(l)).join(',\n')+'\n]};\n';
  fs.writeFileSync(path.join(__dirname,'..','lugares.js'),out);
  const c={};for(const l of lugares)c[l[0]]=(c[l[0]]||0)+1;
  console.log('Barrios con límite:',barrios.length,'· puntos de barrio:',puntos.length);console.log('Lugares:',lugares.length,c);
})().catch(e=>{console.error(e);process.exit(1)});
