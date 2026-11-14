/* Genera ambiente.js: los manglares reales de Cartagena (Ciénaga de la Virgen, caños, Tierra Bomba…) y las zonas de
   fondeo de la bahía, tomados de OpenStreetMap (natural=wetland + wetland=mangrove; seamark:type=anchorage).
   Uso:   node herramientas/ambiente-osm.js            (descarga de Overpass)
          node herramientas/ambiente-osm.js <carpeta>   (usa manglar.json y fondeo.json ya descargados; si no están, los descarga ahí)
   Los datos son © colaboradores de OpenStreetMap (licencia ODbL). */
'use strict';
const fs=require('fs'),path=require('path');
global.window={};require(path.join(__dirname,'..','mapa.js'));const MAP=window.MAPA;
const ORIGIN=MAP.origin,KX=111320*Math.cos(ORIGIN[0]*Math.PI/180),KZ=110600;
const toG=(lat,lon)=>[+((lon-ORIGIN[1])*KX).toFixed(1),+((ORIGIN[0]-lat)*KZ).toFixed(1)];   // = herramientas/ciudad-osm.js
const WORLD=[-3400,-7600,11600,10600];
const BB=`(${(ORIGIN[0]-WORLD[3]/KZ).toFixed(4)},${(ORIGIN[1]+WORLD[0]/KX).toFixed(4)},${(ORIGIN[0]-WORLD[1]/KZ).toFixed(4)},${(ORIGIN[1]+WORLD[2]/KX).toFixed(4)})`;
const Q={
  manglar:`(way["natural"="wetland"]["wetland"="mangrove"]${BB};relation["natural"="wetland"]["wetland"="mangrove"]${BB};way["natural"="mangrove"]${BB};);out geom;`,
  fondeo:`(nwr["seamark:type"="anchorage"]${BB};nwr["seamark:type"="anchor_berth"]${BB};);out geom;`};
const SERVERS=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
async function overpass(q){for(let i=0;i<8;i++){const S=SERVERS[i%SERVERS.length];try{
    const r=await fetch(S,{method:'POST',headers:{'User-Agent':'cartagena-libre-map-builder','Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent('[out:json][timeout:300];'+q)});
    if(r.ok)return r.json();console.log('Overpass',r.status,'— reintentando…')}catch(e){console.log('Overpass:',e.message,'— reintentando…')}
  await new Promise(r=>setTimeout(r,8000*(i+1)))}throw new Error('Overpass no respondió')}
function simplifica(pts,tol){if(pts.length<3)return pts;const keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;const st=[[0,pts.length-1]];
  while(st.length){const [a,b]=st.pop();let md=0,mi=-1;const [ax,az]=pts[a],[bx,bz]=pts[b],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);
    for(let i=a+1;i<b;i++){const d=L>.01?Math.abs((pts[i][0]-ax)*dz-(pts[i][1]-az)*dx)/L:Math.hypot(pts[i][0]-ax,pts[i][1]-az);if(d>md){md=d;mi=i}}
    if(md>tol){keep[mi]=1;st.push([a,mi],[mi,b])}}
  return pts.filter((p,i)=>keep[i])}
const area=p=>{let a=0;for(let i=0;i<p.length;i++){const j=(i+1)%p.length;a+=p[i][0]*p[j][1]-p[j][0]*p[i][1]}return a/2};
// anillos cerrados de un way o de los miembros "outer" de una relación (uniendo los tramos)
function anillos(el){const ways=el.type==='way'?[el.geometry]:(el.members||[]).filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>m.geometry);
  const segs=ways.map(g=>g.map(p=>[p.lat,p.lon])),out=[];
  while(segs.length){let r=segs.shift();let grew=true;
    while(grew&&(r[0][0]!==r[r.length-1][0]||r[0][1]!==r[r.length-1][1])){grew=false;
      for(let i=0;i<segs.length;i++){const s=segs[i],e=r[r.length-1];
        if(s[0][0]===e[0]&&s[0][1]===e[1]){r=r.concat(s.slice(1));segs.splice(i,1);grew=true;break}
        if(s[s.length-1][0]===e[0]&&s[s.length-1][1]===e[1]){r=r.concat(s.slice(0,-1).reverse());segs.splice(i,1);grew=true;break}}}
    out.push(r)}
  return out.filter(r=>r.length>3)}
(async()=>{const dir=process.argv[2];const D={};
  for(const k of Object.keys(Q)){const f=dir&&path.join(dir,k+'.json');
    if(f&&fs.existsSync(f))D[k]=JSON.parse(fs.readFileSync(f,'utf8'));else{console.log('descargando',k);D[k]=await overpass(Q[k]);if(f)fs.writeFileSync(f,JSON.stringify(D[k]))}}
  const M=[];let tot=0;
  for(const el of D.manglar.elements)for(const r of anillos(el)){let P=simplifica(r.map(p=>toG(p[0],p[1])),3);if(P.length>3&&P[0][0]===P[P.length-1][0]&&P[0][1]===P[P.length-1][1])P.pop();
    const a=Math.abs(area(P));if(a<300||P.length<3)continue;if(!P.some(p=>p[0]>WORLD[0]&&p[0]<WORLD[2]&&p[1]>WORLD[1]&&p[1]<WORLD[3]))continue;tot+=a;M.push(P.flat().map(v=>Math.round(v)))}
  const F=[];for(const el of D.fondeo.elements){const nm=(el.tags&&(el.tags['seamark:name']||el.tags.name))||'';
    if(el.type==='node'){F.push({n:nm,p:toG(el.lat,el.lon).map(Math.round)});continue}
    for(const r of anillos(el)){const P=simplifica(r.map(p=>toG(p[0],p[1])),10);F.push({n:nm,a:P.flat().map(v=>Math.round(v))})}}
  console.log(`manglares: ${M.length} polígonos, ${(tot/1e6).toFixed(2)} km² · zonas de fondeo: ${F.length}`);
  const out=`/* Manglares y zonas de fondeo reales de Cartagena (generado con herramientas/ambiente-osm.js; no editar a mano).
   Datos © colaboradores de OpenStreetMap (ODbL). Coordenadas del juego en metros (x al este, z al sur, origen en la Torre del Reloj). */
window.AMBIENTE={manglar:${JSON.stringify(M)},fondeo:${JSON.stringify(F)}};
`;
  fs.writeFileSync(path.join(__dirname,'..','ambiente.js'),out);console.log('ambiente.js',(out.length/1024).toFixed(0),'KB')})().catch(e=>{console.error(e);process.exit(1)});
