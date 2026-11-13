/* Genera sitios.js: los sitios conocidos de Cartagena que tienen modelo propio en el juego (Puente Román, Mercado de Bazurto,
   Estadio Jaime Morón, Muelle de La Bodeguita, Fuerte del Pastelillo, baluartes, Plaza de Toros, centros comerciales,
   Hospital Naval, Claustro de San Agustín, puerto de contenedores, Monumento a Blas de Lezo, La Ermita y torres de Bocagrande),
   con su forma y ubicación reales tomadas de OpenStreetMap.
   Uso:   node herramientas/sitios-osm.js
   Los datos son © colaboradores de OpenStreetMap (licencia ODbL). */
'use strict';
const fs=require('fs'),path=require('path');
const ORIGIN=[10.4225,-75.549];               // mismo origen que mapa.js, ciudad-osm.js y lugares.js
const KX=111320*Math.cos(ORIGIN[0]*Math.PI/180),KZ=110600;
const toG=(lat,lon)=>[+((lon-ORIGIN[1])*KX).toFixed(1),+((ORIGIN[0]-lat)*KZ).toFixed(1)];

// [nombre en el juego, tipo, elemento de OSM, datos extra]
const SITIOS=[
  ['Puente Román','puente','way/1355664513'],
  ['Mercado de Bazurto','mercado','way/94687123',{edif:['way/49612080','way/94687130']}],
  ['Estadio Jaime Morón','futbol','relation/9086207'],
  ['Muelle de La Bodeguita','muelle','way/67061100',{punta:'node/4663495389'}],
  ['Fuerte de San Sebastián del Pastelillo','fuerte','way/54977866'],
  ['Plaza de Toros La Monumental','toros','relation/2516179'],
  ['Centro Comercial Caribe Plaza','mall','way/94957107'],
  ['Mall Plaza El Castillo','mall','way/188840472'],
  ['Centro Comercial Plaza Bocagrande','mall','way/1175331449',{torre:1}],
  ['Hospital Naval de Cartagena','hospital','way/1175331466'],
  ['Universidad de Cartagena · Claustro de San Agustín','claustro','relation/12924243'],
  ['Puerto de Cartagena','puerto','way/166291566',{muelles:['way/166292802','way/166292803','way/166292804','way/166292805','way/166292806','way/166292807']}],
  ['Monumento a Blas de Lezo','blas','node/798956035'],
  ['Iglesia de La Ermita','ermita','way/49602080'],
  ['Hotel Estelar · Torre Bocagrande','torre','way/1379019097'],
  ['Edificio Gran Bahía','torre','way/1379020514'],
  ['Palmetto Eliptic','torre','way/1379019100'],
  ['Baluarte de San Ignacio','baluarte','way/1031619546'],['Baluarte de Santiago Apóstol','baluarte','way/1031619547'],
  ['Baluarte de Santo Domingo','baluarte','way/1031619548'],['Baluarte de Santa Cruz','baluarte','way/1031619549'],
  ['Baluarte de Santa Catalina','baluarte','way/1031619550'],['Baluarte de San Lucas','baluarte','way/1031619551'],
  ['Baluarte de San Pedro Mártir','baluarte','way/1031619552'],['Baluarte de San Miguel','baluarte','way/1031619553'],
  ['Baluarte de Santa Teresa','baluarte','way/1031619554'],['Baluarte de Santa Bárbara','baluarte','way/1031619555'],
  ['Baluarte de San José','baluarte','way/1031619556'],['Baluarte El Reducto','baluarte','way/1031619557'],
  ['Baluarte de San Juan Evangelista','baluarte','way/1031619545'],['Baluarte de San Francisco Javier','baluarte','way/54781701'],
];

async function overpass(q){const urls=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter'];
  for(let i=0;;i++){const u=urls[i%urls.length];try{const r=await fetch(u,{method:'POST',headers:{'User-Agent':'cartagena-libre-map-builder','Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)});
    if(!r.ok)throw new Error('Overpass '+r.status);return await r.json()}catch(e){if(i>=5)throw e;console.log('Overpass ocupado, reintentando…');await new Promise(r=>setTimeout(r,6000*(i+1)))}}}

// une los tramos de las relaciones en anillos cerrados y devuelve el mayor
function anillos(ways){const segs=ways.map(w=>w.slice());const out=[];
  while(segs.length){let r=segs.shift();let grow=true;
    while(grow&&!(r.length>3&&eq(r[0],r[r.length-1]))){grow=false;
      for(let i=0;i<segs.length;i++){const s=segs[i];
        if(eq(r[r.length-1],s[0])){r=r.concat(s.slice(1))}else if(eq(r[r.length-1],s[s.length-1])){r=r.concat(s.slice(0,-1).reverse())}
        else if(eq(r[0],s[s.length-1])){r=s.slice(0,-1).concat(r)}else if(eq(r[0],s[0])){r=s.slice(1).reverse().concat(r)}else continue;
        segs.splice(i,1);grow=true;break}}
    out.push(r)}
  return out}
const eq=(a,b)=>Math.abs(a[0]-b[0])<1e-9&&Math.abs(a[1]-b[1])<1e-9;
const area=P=>{let a=0;for(let i=0;i<P.length;i++){const j=(i+1)%P.length;a+=P[i][0]*P[j][1]-P[j][0]*P[i][1]}return a/2};
// quita puntos casi alineados (tolerancia en metros)
function simplifica(P,tol){if(P.length<4)return P;const keep=new Array(P.length).fill(false);keep[0]=keep[P.length-1]=true;
  const rec=(a,b)=>{let md=0,mi=-1;const [ax,az]=P[a],[bx,bz]=P[b],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1;
    for(let i=a+1;i<b;i++){const d=Math.abs((P[i][0]-ax)*dz-(P[i][1]-az)*dx)/L;if(d>md){md=d;mi=i}}if(md>tol){keep[mi]=true;rec(a,mi);rec(mi,b)}};
  rec(0,P.length-1);return P.filter((p,i)=>keep[i])}
function poligono(e){let rings;
  if(e.type==='way')rings=[e.geometry.map(g=>[g.lat,g.lon])];
  else if(e.type==='relation')rings=anillos(e.members.filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>m.geometry.map(g=>[g.lat,g.lon])));
  else return null;
  let best=null,ba=0;for(const r of rings){const P=r.map(p=>toG(p[0],p[1]));const a=Math.abs(area(P));if(a>ba){ba=a;best=P}}
  if(!best)return null;if(eq(best[0],best[best.length-1]))best=best.slice(0,-1);
  let P=simplifica(best,.6);if(area(P)<0)P.reverse();   // sentido antihorario, como mapa.js
  return P.map(p=>[+p[0].toFixed(1),+p[1].toFixed(1)])}
const centro=P=>{let x=0,z=0;for(const p of P){x+=p[0];z+=p[1]}return[+(x/P.length).toFixed(1),+(z/P.length).toFixed(1)]};

(async()=>{
  const ids=new Set();for(const s of SITIOS){ids.add(s[2]);const x=s[3]||{};for(const k of ['edif','muelles'])(x[k]||[]).forEach(i=>ids.add(i));if(x.punta)ids.add(x.punta)}
  const by={node:[],way:[],relation:[]};for(const i of ids){const [t,n]=i.split('/');by[t].push(n)}
  const q=`[out:json][timeout:120];(${Object.entries(by).filter(([,a])=>a.length).map(([t,a])=>`${t}(id:${a.join(',')});`).join('')});out geom;`;
  console.log('Pidiendo',ids.size,'elementos a Overpass…');const j=await overpass(q);
  const E=new Map();for(const e of j.elements)E.set(e.type+'/'+e.id,e);
  const out=[];
  for(const [name,kind,id,x0] of SITIOS){const e=E.get(id);if(!e){console.warn('falta en OSM:',name,id);continue}const x=x0||{};
    const s={n:name,k:kind};
    if(e.type==='node'){const g=toG(e.lat,e.lon);s.x=g[0];s.z=g[1]}
    else{const P=poligono(e);if(!P){console.warn('sin forma:',name);continue}const c=centro(P);s.x=c[0];s.z=c[1];s.p=P.flat()}
    const lv=e.tags&&+e.tags['building:levels'],h=e.tags&&parseFloat(e.tags.height);if(lv)s.pisos=lv;if(h)s.h=h;
    if(x.edif)s.edif=x.edif.map(i=>E.get(i)).filter(Boolean).map(poligono).filter(Boolean).map(P=>P.flat());
    if(x.muelles)s.muelles=x.muelles.map(i=>E.get(i)).filter(Boolean).map(poligono).filter(Boolean).map(P=>P.flat());
    if(x.punta){const n=E.get(x.punta);if(n)s.punta=toG(n.lat,n.lon)}
    if(x.torre)s.torre=1;
    out.push(s)}
  const txt='/* Sitios conocidos de Cartagena con su forma y ubicación reales. Generado por herramientas/sitios-osm.js.\n   Datos © colaboradores de OpenStreetMap (ODbL). */\nwindow.SITIOS='+JSON.stringify(out)+';\n';
  fs.writeFileSync(path.join(__dirname,'..','sitios.js'),txt);
  console.log('sitios.js:',out.length,'sitios,',(txt.length/1024).toFixed(1),'KB');
  for(const s of out)console.log(' ',s.k.padEnd(9),s.n.padEnd(52),s.x,s.z,s.p?(s.p.length/2)+' vértices':'')})();
