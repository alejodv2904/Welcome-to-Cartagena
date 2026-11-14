/* Genera relieve.js: el relieve real de toda Cartagena (La Popa, Albornoz, Loma de Marion, Los Cerros / El Bosque,
   las lomas hacia Turbaco, Tierra Bomba…) como una cuadrícula de alturas de 20 m sobre CIUDAD.WORLD.
   Fuente: mosaicos de elevación «Terrarium» de Mapzen / AWS Open Data (derivados de SRTM y otras fuentes abiertas),
   https://registry.opendata.aws/terrain-tiles/ — sin clave.
   Uso:   node herramientas/relieve.js <carpeta-cache>      (descarga a la carpeta los mosaicos que falten)
   El SRTM es un modelo de superficie (incluye edificios y árboles): por eso se quitan las protuberancias angostas
   (apertura morfológica), se suaviza, se descuenta el «piso» de la ciudad plana y la orilla baja a nivel del mar. */
'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
global.window={};
require(path.join(__dirname,'..','mapa.js'));require(path.join(__dirname,'..','ciudad-osm.js'));require(path.join(__dirname,'..','ciudad.js'));
const MAP=window.MAPA,CD=window.CIUDAD;
const ORIGIN=MAP.origin,KX=111320*Math.cos(ORIGIN[0]*Math.PI/180),KZ=110600;   // = toG de herramientas/ciudad-osm.js
const toLL=(x,z)=>[ORIGIN[0]-z/KZ,ORIGIN[1]+x/KX];
const WORLD=CD.WORLD,G=20,NX=Math.round((WORLD[2]-WORLD[0])/G)+1,NZ=Math.round((WORLD[3]-WORLD[1])/G)+1;
const Z=14,CACHE=process.argv[2]||path.join(__dirname,'.relieve-cache');
fs.mkdirSync(CACHE,{recursive:true});

// ---- PNG mínimo (8 bits, RGB o RGBA, sin entrelazado) ----
function png(buf){let p=8,W,H,ct,idat=[];
  while(p<buf.length){const n=buf.readUInt32BE(p),t=buf.toString('ascii',p+4,p+8),d=buf.subarray(p+8,p+8+n);p+=12+n;
    if(t==='IHDR'){W=d.readUInt32BE(0);H=d.readUInt32BE(4);ct=d[9];if(d[8]!==8||d[12])throw Error('PNG no soportado')}
    else if(t==='IDAT')idat.push(d);else if(t==='IEND')break}
  const bpp=ct===6?4:ct===2?3:0;if(!bpp)throw Error('PNG tipo '+ct);
  const raw=zlib.inflateSync(Buffer.concat(idat)),st=W*bpp,out=Buffer.alloc(W*H*bpp);
  for(let y=0;y<H;y++){const f=raw[y*(st+1)],src=y*(st+1)+1,o=y*st;
    for(let x=0;x<st;x++){const a=x>=bpp?out[o+x-bpp]:0,b=y?out[o-st+x]:0,c=x>=bpp&&y?out[o-st+x-bpp]:0;let v=raw[src+x];
      if(f===1)v+=a;else if(f===2)v+=b;else if(f===3)v+=(a+b)>>1;else if(f===4){const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?b:c}
      out[o+x]=v&255}}
  return{W,H,bpp,d:out}}

const tx=lon=>(lon+180)/360*2**Z*256;
const ty=lat=>{const s=Math.sin(lat*Math.PI/180);return(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*2**Z*256};
const TILES=new Map();
async function tile(i,j){const k=i+','+j;if(TILES.has(k))return TILES.get(k);const f=path.join(CACHE,`${Z}-${i}-${j}.png`);
  if(!fs.existsSync(f)){const r=await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${i}/${j}.png`);if(!r.ok)throw Error('HTTP '+r.status+' '+k);
    fs.writeFileSync(f,Buffer.from(await r.arrayBuffer()))}
  const t=png(fs.readFileSync(f));TILES.set(k,t);return t}
function elevPx(px,py){const i=Math.floor(px/256),j=Math.floor(py/256),t=TILES.get(i+','+j),x=Math.floor(px)-i*256,y=Math.floor(py)-j*256,o=(y*256+x)*t.bpp;
  return t.d[o]*256+t.d[o+1]+t.d[o+2]/256-32768}
function elev(lat,lon){const px=tx(lon)-.5,py=ty(lat)-.5,x0=Math.floor(px),y0=Math.floor(py),fx=px-x0,fy=py-y0;
  return(elevPx(x0,y0)*(1-fx)+elevPx(x0+1,y0)*fx)*(1-fy)+(elevPx(x0,y0+1)*(1-fx)+elevPx(x0+1,y0+1)*fx)*fy}

// agua: la misma que usa el juego (máscara de mapa.js en el área detallada, ciudad.js afuera)
const MK=MAP.mask,MW=MK.w,MH=MK.h,water=new Uint8Array(MW*MH);
MK.runs.forEach((row,j)=>{let i=0,w=false;for(const n of row){if(w)water.fill(1,j*MW+i,j*MW+i+n);i+=n;w=!w}});
function isWater(x,z){const i=Math.floor((x-MK.x0)/MK.cell),j=Math.floor((z-MK.z0)/MK.cell);if(i>=0&&j>=0&&i<MW&&j<MH)return water[j*MW+i]===1;return!CD.outerLand(x,z)}

(async()=>{
  const [la0,lo0]=toLL(WORLD[0]-200,WORLD[1]-200),[la1,lo1]=toLL(WORLD[2]+200,WORLD[3]+200);
  const i0=Math.floor(tx(lo0)/256),i1=Math.floor(tx(lo1)/256),j0=Math.floor(ty(la0)/256),j1=Math.floor(ty(la1)/256);
  console.log(`mosaicos z${Z}: ${(i1-i0+1)*(j1-j0+1)}`);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)await tile(i,j);
  const N=NX*NZ,E=new Float32Array(N),L=new Uint8Array(N);
  for(let b=0;b<NZ;b++)for(let a=0;a<NX;a++){const x=WORLD[0]+a*G,z=WORLD[1]+b*G,[la,lo]=toLL(x,z);E[b*NX+a]=Math.max(0,elev(la,lo));L[b*NX+a]=isWater(x,z)?0:1}
  const at=(A,a,b)=>A[Math.min(NZ-1,Math.max(0,b))*NX+Math.min(NX-1,Math.max(0,a))];
  const filt=(A,r,f)=>{const T=new Float32Array(N),O=new Float32Array(N);   // filtro separable (min, max o promedio)
    for(let b=0;b<NZ;b++)for(let a=0;a<NX;a++){let v=f==='avg'?0:A[b*NX+a];for(let k=-r;k<=r;k++){const w=at(A,a+k,b);v=f==='min'?Math.min(v,w):f==='max'?Math.max(v,w):v+w}T[b*NX+a]=f==='avg'?v/(2*r+1):v}
    for(let b=0;b<NZ;b++)for(let a=0;a<NX;a++){let v=f==='avg'?0:T[b*NX+a];for(let k=-r;k<=r;k++){const w=at(T,a,b+k);v=f==='min'?Math.min(v,w):f==='max'?Math.max(v,w):v+w}O[b*NX+a]=f==='avg'?v/(2*r+1):v}
    return O};
  const probe=(n,A)=>{const P={'Torre del Reloj':[0,0],'Cima de La Popa':[2568,369],'Bocagrande':[-1100,2200],'Manga':[800,1300]};
    console.log(n,Object.entries(P).map(([k,[x,z]])=>k+' '+at(A,Math.round((x-WORLD[0])/G),Math.round((z-WORLD[1])/G)).toFixed(1)).join(' · '))};
  probe('SRTM:',E);
  // 1) apertura (mín y luego máx, ventana de 100 m): quita torres, bloques de edificios y copas de árboles aisladas
  let H=filt(filt(E,2,'min'),2,'max');
  // 2) suavizado; en lo alto (> 25 m) vuelve a la forma original para no limar las cimas (la de La Popa mide ~150 m)
  H=filt(filt(H,1,'avg'),1,'avg');const Eb=filt(E,1,'avg');
  for(let i=0;i<N;i++){const t=Math.min(1,Math.max(0,(H[i]-25)/35)),s=t*t*(3-2*t);H[i]+=(Math.max(H[i],Eb[i])-H[i])*s}
  probe('abierto+suave:',H);
  // 3) la ciudad baja queda plana: se descuenta un piso de 4 m con transición suave
  const FL=4,KN=4;for(let i=0;i<N;i++){const h=H[i]-FL;H[i]=h<=0?0:h<KN?h*h/(2*KN):h-KN/2}
  // 4) la orilla baja al nivel del mar (distancia al agua en celdas, 80 m de transición)
  const D=new Float32Array(N).fill(1e9),Q=[];for(let i=0;i<N;i++)if(!L[i]){D[i]=0;Q.push(i)}
  for(let q=0;q<Q.length;q++){const i=Q[q],a=i%NX,b=(i-a)/NX;for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){const A=a+da,B=b+db;if(A<0||B<0||A>=NX||B>=NZ)continue;const j=B*NX+A;if(D[j]>D[i]+1){D[j]=D[i]+1;Q.push(j)}}}
  for(let i=0;i<N;i++){const t=Math.min(1,Math.max(0,(D[i]-1)/4));H[i]*=t*t*(3-2*t)}
  probe('final:',H);
  let mx=0;for(let i=0;i<N;i++)mx=Math.max(mx,H[i]);const HMAX=Math.ceil(mx);
  const V=new Uint8Array(N);let nz=0;for(let i=0;i<N;i++){V[i]=Math.round(Math.sqrt(H[i]/HMAX)*255);if(V[i])nz++}
  console.log(`altura máxima ${HMAX} m · ${(100*nz/N).toFixed(1)}% de la cuadrícula con relieve`);
  const out=`/* Relieve real de Cartagena (generado con herramientas/relieve.js; no editar a mano).
   Cuadrícula de ${NX}×${NZ} nodos cada ${G} m sobre CIUDAD.WORLD; altura = (byte/255)² × ${HMAX} m.
   Datos de elevación: Mapzen Terrain Tiles / AWS Open Data (SRTM y otras fuentes abiertas). */
window.RELIEVE={x0:${WORLD[0]},z0:${WORLD[1]},cell:${G},nx:${NX},nz:${NZ},hmax:${HMAX},d:'${Buffer.from(V).toString('base64')}'};
`;
  fs.writeFileSync(path.join(__dirname,'..','relieve.js'),out);console.log('relieve.js',(out.length/1024).toFixed(0),'KB')})().catch(e=>{console.error(e);process.exit(1)});
