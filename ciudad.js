/* Cartagena completa: geografía de la ciudad por fuera del área con datos detallados de OpenStreetMap
   (Centro, Getsemaní, Manga, Bocagrande, Pie de la Popa…). Aquí están, en metros (x hacia el este, z hacia el sur,
   origen en la Torre del Reloj), la costa norte hasta La Boquilla, la Ciénaga de la Virgen, el aeropuerto, el sur
   industrial hasta Mamonal, los barrios con su población y las avenidas principales. Las posiciones son aproximadas:
   el trazado de las calles de cada barrio se genera a partir de estos datos. */
window.CIUDAD=(function(){
'use strict';
// límites del mundo jugable y rectángulo con datos de OpenStreetMap
const WORLD=[-3400,-7600,11600,10600];
const OSMR=[-1800,-1470,3420,4160];
// costa del Caribe al norte del mapa detallado (Crespo → La Boquilla) y orilla oriental de la bahía al sur (Mamonal)
const COAST_N=[[3222,-3041],[3550,-3350],[4050,-3800],[4450,-4300],[5000,-4950],[5600,-5600],[6300,-6350],[7000,-7100],[7700,-7800]];
const COAST_S=[[4438,5806],[4350,6500],[4150,7400],[4050,8300],[4150,9200],[4450,10000],[4700,10700]];
const CIENAGA=[[5450,-1500],[5420,-2600],[5350,-3500],[5650,-4300],[6150,-5100],[6750,-5900],[7350,-6700],[7900,-7700],[9000,-7700],[9900,-6400],[10400,-5000],[10600,-3500],[10600,-2000],[10300,-900],[9500,-450],[8500,-350],[7500,-500],[6700,-700],[6100,-900],[5700,-1100]];
const TBOMBA=[[-3362,5806],[-1650,5806],[-1550,6400],[-1800,7200],[-2400,7900],[-3400,8300],[-3400,5806]];
// aeropuerto Rafael Núñez: pista paralela a la costa en Crespo
const AIRPORT={x:3050,z:-2420,dx:Math.SQRT1_2,dz:-Math.SQRT1_2,len:2500,w0:-190,w1:360};

// barrios fuera del área detallada: nombre, x, z, población, tipo, radio (m)
const BARRIOS=[
  ['Crespo',2900,-1750,14000,'medio',650],['Villa Gloria',4700,-3000,18000,'popular',750],['Cielo Mar',5450,-5050,9000,'medio',650],['La Boquilla',6450,-6150,16000,'playa',850],
  ['San Francisco',4500,-1550,40000,'popular',650],['La María',4100,-650,26000,'popular',560],['Boston',4750,-150,22000,'popular',520],['Tesca',5650,-500,20000,'popular',520],
  ['La Esperanza',4800,550,24000,'popular',520],['La Candelaria',5550,250,22000,'popular',520],['Nuevo Paraíso',6200,600,26000,'popular',520],['Olaya Herrera',7150,350,120000,'popular',950],
  ['Fredonia',8350,1050,38000,'popular',700],['El Pozón',9900,1500,95000,'popular',1050],['Chiquinquirá',4250,1150,15000,'popular',460],['Zaragocilla',5150,1450,20000,'medio',520],
  ['España',3900,1800,14000,'medio',460],['María Auxiliadora',4650,2050,15000,'medio',460],['Los Ejecutivos',5100,2650,9000,'alto',460],['La Castellana',5850,2950,12000,'medio',520],
  ['Los Alpes',6500,2050,16000,'medio',520],['Las Gaviotas',7400,2300,28000,'medio',620],['Villa Olímpica',8300,2300,10000,'medio',520],['San José de los Campanos',9900,3700,38000,'popular',850],
  ['Blas de Lezo',3950,3800,30000,'popular',620],['Los Corales',4700,3350,18000,'medio',520],['San Fernando',5300,4600,28000,'popular',620],['El Socorro',6150,4200,32000,'popular',580],
  ['Ternera',7300,3900,26000,'popular',650],['La Consolata',8600,4500,24000,'popular',650],['Santa Lucía',6500,5300,30000,'popular',620],['Villa Estrella',9300,5700,26000,'popular',720],
  ['Ceballos',4750,5850,14000,'popular',520],['Albornoz',4600,6900,9000,'industrial',650],['Henequén',6200,6500,22000,'popular',620],['Nelson Mandela',7700,6700,65000,'popular',1000],
  ['Policarpa',4950,8500,18000,'popular',650],['Mamonal',5700,9700,4000,'industrial',1200],['Rosedal',8800,7200,20000,'popular',750],
];
// barrios del área detallada (los nombres de las zonas del juego) con su población
const INNER_POP={'Centro Histórico':6000,'San Diego':5000,'Getsemaní':6000,'La Matuna':2500,'Manga':26000,'Bocagrande':22000,'El Laguito':3500,'Castillogrande':7000,'Pie de la Popa':16000,
  'El Cabrero':4500,'Torices':32000,'Chambacú':9000,'Cerro de La Popa':3000,'Pie del Cerro':11000,'Marbella':9000,'Lo Amador':12000,'Bazurto':9000,'El Bosque':30000,'Alto Bosque':18000,'Daniel Lemaitre':20000,'Canapote':22000};
const INNER_ZONES=[['Lo Amador',1700,600],['Bazurto',2300,900],['El Bosque',2850,2050],['Alto Bosque',3200,2900],['Daniel Lemaitre',2700,-1050],['Canapote',3350,-650]];
const STYLE_DENS={popular:1,medio:.75,alto:.6,playa:.65,industrial:.25};

// avenidas principales (ty: 0 autopista/avenida, 1 avenida, 2 vía principal). dual = dos calzadas de un solo sentido
const AVENIDAS=[
  {name:'Avenida Pedro de Heredia',ty:0,lanes:3,dual:{off:8,eStart:[3411.7,1390.1],wEnd:[3214.5,1239.7]},
    pts:[[3420,1380],[3880,1690],[4400,1980],[4950,2280],[5600,2560],[6300,2620],[7000,2600],[7700,2620],[8400,2700],[9100,2800],[9600,2880]]},
  {name:'Troncal de Occidente',ty:0,lanes:2,pts:[[9600,2880],[10200,3450],[10800,4300],[11500,5250]]},
  {name:'Avenida Santander',ty:1,lanes:2,dual:{off:5.5,eStart:[1218.7,-1448.9],wEnd:[1212.7,-1458.7]},pts:[[1215.7,-1453.8],[1560,-1650],[1950,-1800],[2200,-2000],[2400,-2200]]},
  {name:'Anillo Vial',ty:1,lanes:2,pts:[[2400,-2200],[2640,-2400],[2840,-2600],[3050,-2800],[3340,-3041],[3640,-3420],[4150,-3880],[4560,-4370],[5100,-5000],[5700,-5650],[6380,-6380],[7050,-7100],[7550,-7550]]},
  {name:'Avenida Perimetral',ty:1,lanes:2,pts:[[3950,-1150],[4600,-1150],[5250,-1050],[5800,-750],[6600,-450],[7500,-250],[8500,-100],[9500,-200],[10350,-600],[11000,-1100]]},
  {name:'Avenida El Consulado',ty:1,lanes:2,pts:[[3371,1679.3],[3900,2250],[4600,2900],[5400,3350],[6300,3550],[7300,3700],[8300,3800],[9300,3600],[10100,3350]]},
  {name:'Corredor Vial de Cartagena',ty:1,lanes:2,dual:{off:4.6,eStart:[3638.6,3761.1],wEnd:[3632.7,3753.8]},pts:[[3635.6,3757.4],[4100,4500],[4750,5600],[4850,6600],[4700,7600],[4800,8600],[5100,9700],[5400,10500]]},
  {name:'Transversal 54',ty:1,lanes:2,pts:[[5000,2000],[5150,3000],[5350,4100],[5600,5300],[5800,6400],[5850,7600],[5900,8800],[5950,9750]]},
  {name:'Carretera de La Cordialidad',ty:1,lanes:2,pts:[[9350,2700],[9800,2200],[10400,1500],[11000,800],[11550,200]]},
  {name:'Variante Mamonal - Gambote',ty:1,lanes:2,pts:[[5700,9450],[7000,9100],[8300,8600],[9600,8000],[11500,7300]]},
  {name:'Avenida Pedro Romero',ty:2,lanes:2,pts:[[6900,3100],[6950,1600],[7000,700],[7050,-350]]},
  {name:'Avenida Crisanto Luque',ty:2,lanes:2,pts:[[3700,700],[4300,1300],[4700,1900],[5300,3300],[5900,4900],[6500,6300],[7300,7700]]},
  {name:'Avenida del Aeropuerto',ty:2,lanes:2,pts:[[4300,-1150],[4250,-1900],[4050,-2500],[3700,-2900]]},
];

// lugares: aeropuerto, terminal, hospitales, centros comerciales, estadios, CAI, gasolineras, iglesias, parques, playas
// kind: aeropuerto, terminal, hospital, salud, mall, estadio, universidad, cai, gasolinera, iglesia, parque, playa, mercado
const LUGARES=[
  {name:'Aeropuerto Rafael Núñez',kind:'aeropuerto',x:3700,z:-2950,mission:1},
  {name:'Terminal de Transportes',kind:'terminal',x:9500,z:3080,w:130,d:45,mission:1},
  {name:'Hospital Universitario del Caribe',kind:'hospital',x:5250,z:1250,w:60,d:40,mission:1},
  {name:'Centro de Salud Olaya',kind:'salud',x:7000,z:250,w:30,d:20},
  {name:'Centro de Salud El Pozón',kind:'salud',x:9800,z:1350,w:30,d:20},
  {name:'Centro de Salud Nelson Mandela',kind:'salud',x:7650,z:6600,w:30,d:20},
  {name:'Centro de Salud Blas de Lezo',kind:'salud',x:4000,z:3700,w:30,d:20},
  {name:'Centro Comercial Los Ejecutivos',kind:'mall',x:5050,z:2460,w:70,d:48,mission:1},
  {name:'Centro Comercial La Castellana',kind:'mall',x:5900,z:2760,w:70,d:48,mission:1},
  {name:'Estadio de Béisbol Once de Noviembre',kind:'estadio',x:8200,z:2380,r:62,mission:1},
  {name:'Universidad de Cartagena · Zaragocilla',kind:'universidad',x:5050,z:1600,w:70,d:35,mission:1},
  {name:'Mercado de Bazurto',kind:'mercado',x:2050,z:1000,label:true,mission:1},
  {name:'Playa de Crespo',kind:'playa',x:2150,z:-2150,mission:1},{name:'Playa de La Boquilla',kind:'playa',x:6200,z:-6500,mission:1},{name:'Playa de Marbella',kind:'playa',x:1200,z:-1600,mission:0},
  {name:'Parque de Olaya',kind:'parque',x:7300,z:500,mission:1},{name:'Parque de El Pozón',kind:'parque',x:10000,z:1700,mission:1},{name:'Parque de Las Gaviotas',kind:'parque',x:7350,z:2150,mission:1},
  {name:'Parque de Blas de Lezo',kind:'parque',x:3900,z:3950,mission:0},{name:'Parque de Ternera',kind:'parque',x:7250,z:4050,mission:1},{name:'Parque de San Fernando',kind:'parque',x:5350,z:4700,mission:0},
  {name:'Parque de Crespo',kind:'parque',x:2950,z:-1650,mission:1},{name:'Parque de La María',kind:'parque',x:4150,z:-600,mission:0},
  {name:'Parroquia de Olaya Herrera',kind:'iglesia',x:7050,z:450},{name:'Parroquia de El Pozón',kind:'iglesia',x:9750,z:1650},{name:'Parroquia de Crespo',kind:'iglesia',x:2800,z:-1850},
  {name:'Parroquia de San Fernando',kind:'iglesia',x:5200,z:4500},{name:'Parroquia de La Boquilla',kind:'iglesia',x:6500,z:-6100},{name:'Parroquia de Nelson Mandela',kind:'iglesia',x:7800,z:6850},
  {name:'CAI Crespo',kind:'cai',x:2700,z:-1700},{name:'CAI La Boquilla',kind:'cai',x:6350,z:-6250},{name:'CAI Olaya',kind:'cai',x:7250,z:150},{name:'CAI El Pozón',kind:'cai',x:10050,z:1350},
  {name:'CAI Los Ejecutivos',kind:'cai',x:5200,z:2350},{name:'CAI Las Gaviotas',kind:'cai',x:7600,z:2450},{name:'CAI Blas de Lezo',kind:'cai',x:4100,z:3900},{name:'CAI El Socorro',kind:'cai',x:6100,z:4300},
  {name:'CAI Nelson Mandela',kind:'cai',x:7600,z:6800},{name:'CAI San Francisco',kind:'cai',x:4400,z:-1650},{name:'CAI Ternera',kind:'cai',x:7350,z:3800},{name:'CAI Mamonal',kind:'cai',x:5500,z:9400},
  {name:'CAI Bocagrande',kind:'cai',x:-1050,z:2350,inner:1},{name:'CAI Manga',kind:'cai',x:800,z:800,inner:1},{name:'CAI Getsemaní',kind:'cai',x:420,z:120,inner:1},{name:'CAI Pie de la Popa',kind:'cai',x:1750,z:350,inner:1},
];
// gasolineras sobre las avenidas: [avenida, fracción del recorrido]
const GAS=[['Avenida Pedro de Heredia',.18],['Avenida Pedro de Heredia',.55],['Avenida Pedro de Heredia',.85],['Anillo Vial',.15],['Anillo Vial',.7],['Avenida Perimetral',.4],
  ['Avenida El Consulado',.35],['Avenida El Consulado',.75],['Corredor Vial de Cartagena',.3],['Corredor Vial de Cartagena',.7],['Transversal 54',.45],['Carretera de La Cordialidad',.5],['Troncal de Occidente',.5]];

/* ---------- geometría ---------- */
function inPolyA(P,x,z){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const xi=P[i][0],zi=P[i][1],xj=P[j][0],zj=P[j][1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c}return c}
function lineX(L,z){// x of a polyline (monotonic in z) at height z, extrapolated past the ends
  const up=L[L.length-1][1]>L[0][1];for(let i=0;i<L.length-1;i++){const a=L[i],b=L[i+1];if(up?(z>=a[1]&&z<=b[1]):(z<=a[1]&&z>=b[1])){const t=(z-a[1])/((b[1]-a[1])||1);return a[0]+(b[0]-a[0])*t}}
  const a=(up?z<L[0][1]:z>L[0][1])?[L[0],L[1]]:[L[L.length-2],L[L.length-1]];const t=(z-a[0][1])/((a[1][1]-a[0][1])||1);return a[0][0]+(a[1][0]-a[0][0])*t}
// land outside the detailed mask
function outerLand(x,z){if(x<WORLD[0]||x>WORLD[2]||z<WORLD[1]||z>WORLD[3])return false;if(inPolyA(CIENAGA,x,z))return false;
  if(z<-3041)return x>lineX(COAST_N,z);if(z>5806)return x>lineX(COAST_S,z)||inPolyA(TBOMBA,x,z);return x>5366}
function waterName(x,z){if(inPolyA(CIENAGA,x,z))return'Ciénaga de la Virgen';if(z<-600||x<-1300||(x<-600&&z<1600))return'Mar Caribe';return'Bahía de Cartagena'}
const inAirport=(x,z,m)=>{m=m||0;const rx=x-AIRPORT.x,rz=z-AIRPORT.z,s=rx*AIRPORT.dx+rz*AIRPORT.dz;const lat=rx*(-AIRPORT.dz)+rz*AIRPORT.dx;
  return s>-120-m&&s<AIRPORT.len+120+m&&lat>AIRPORT.w0-m&&lat<AIRPORT.w1+m};
function hashI(a,b){let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function vnoise(x,z,seed){const xi=Math.floor(x),zi=Math.floor(z),tx=x-xi,tz=z-zi,sx=tx*tx*(3-2*tx),sz=tz*tz*(3-2*tz);
  const a=hashI(xi+seed*101,zi),b=hashI(xi+1+seed*101,zi),c=hashI(xi+seed*101,zi+1),d=hashI(xi+1+seed*101,zi+1);return(a*(1-sx)+b*sx)*(1-sz)+(c*(1-sx)+d*sx)*sz}
function nearestBarrio(x,z){let b=null,bd=1e18;for(const q of BARRIOS){const d=(q[1]-x)**2+(q[2]-z)**2;if(d<bd){bd=d;b=q}}return{b,d:Math.sqrt(bd)}}
function segDist(px,pz,ax,az,bx,bz){const ex=bx-ax,ez=bz-az,l2=ex*ex+ez*ez;let t=l2?((px-ax)*ex+(pz-az)*ez)/l2:0;t=Math.max(0,Math.min(1,t));return[Math.hypot(px-ax-ex*t,pz-az-ez*t),t]}
function segX(a,b,c,d){// intersection of segments ab and cd: [t,u] or null
  const rx=b[0]-a[0],rz=b[1]-a[1],sx=d[0]-c[0],sz=d[1]-c[1],den=rx*sz-rz*sx;if(Math.abs(den)<1e-9)return null;const qx=c[0]-a[0],qz=c[1]-a[1];
  const t=(qx*sz-qz*sx)/den,u=(qx*rz-qz*rx)/den;if(t<=1e-6||t>=1-1e-6||u<=1e-6||u>=1-1e-6)return null;return[t,u]}

/* ---------- generador: calles de los barrios, cruces con las avenidas y empalmes con el mapa detallado ---------- */
// C: {isWater(x,z), hillR(x,z), roads (MAP.roads del área detallada)}
function generar(C){const t0=Date.now();
  // 1. zonas cubiertas por calles de OpenStreetMap (celdas de 40 m a menos de ~70 m de una calle)
  const CV=40,cw=Math.ceil((WORLD[2]-WORLD[0])/CV),ch=Math.ceil((WORLD[3]-WORLD[1])/CV),cov=new Uint8Array(cw*ch);
  const mark=(x,z,r)=>{const i0=Math.floor((x-r-WORLD[0])/CV),i1=Math.floor((x+r-WORLD[0])/CV),j0=Math.floor((z-r-WORLD[1])/CV),j1=Math.floor((z+r-WORLD[1])/CV);
    for(let i=Math.max(0,i0);i<=Math.min(cw-1,i1);i++)for(let j=Math.max(0,j0);j<=Math.min(ch-1,j1);j++){const cx=WORLD[0]+(i+.5)*CV,cz=WORLD[1]+(j+.5)*CV;if((cx-x)**2+(cz-z)**2<(r+CV*.5)**2)cov[j*cw+i]=1}};
  const osmEnds=new Map();
  for(const r of C.roads){if(r[0]>5)continue;const p=r[5];for(let i=0;i<p.length-2;i+=2){const L=Math.hypot(p[i+2]-p[i],p[i+3]-p[i+1]),n=Math.max(1,Math.ceil(L/20));for(let k=0;k<=n;k++)mark(p[i]+(p[i+2]-p[i])*k/n,p[i+1]+(p[i+3]-p[i+1])*k/n,62)}
    for(const k of [0,p.length-2]){const key=Math.round(p[k]*10)+','+Math.round(p[k+1]*10);const e=osmEnds.get(key)||{x:p[k],z:p[k+1],n:0,ty:r[0]};e.n++;e.ty=Math.min(e.ty,r[0]);osmEnds.set(key,e)}
    for(let k=2;k<p.length-2;k+=2){const key=Math.round(p[k]*10)+','+Math.round(p[k+1]*10);const e=osmEnds.get(key);if(e)e.n+=2}}
  const covered=(x,z)=>{const i=Math.floor((x-WORLD[0])/CV),j=Math.floor((z-WORLD[1])/CV);return i>=0&&j>=0&&i<cw&&j<ch&&cov[j*cw+i]===1};
  const inOSMR=(x,z)=>x>OSMR[0]&&x<OSMR[2]&&z>OSMR[1]&&z<OSMR[3];
  // 2. lugares grandes que no llevan calles por dentro
  const bigSpots=LUGARES.filter(l=>l.kind==='terminal'||l.kind==='estadio'||l.kind==='universidad'||l.kind==='hospital'||l.kind==='mall');
  const inBig=(x,z)=>{for(const l of bigSpots){const hw=(l.w||l.r*2.2)/2+10,hd=((l.d||l.r*2.2)+(l.kind==='mall'||l.kind==='terminal'?32:0))/2+10;if(Math.abs(x-l.x)<hw&&Math.abs(z-l.z)<hd)return true}return false};
  // avenidas: calzadas dobles a partir del eje
  const avs=[];
  for(const A of AVENIDAS){const P=A.pts;
    if(A.dual){const o=A.dual.off,E=[],W=[];for(let i=0;i<P.length;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
        E.push([P[i][0]-dz*o,P[i][1]+dx*o]);W.push([P[i][0]+dz*o,P[i][1]-dx*o])}
      if(A.dual.eStart)E[0]=A.dual.eStart.slice();W.reverse();if(A.dual.wEnd)W.push(A.dual.wEnd.slice());
      avs.push({name:A.name,ty:A.ty,lanes:A.lanes,ow:1,pts:E},{name:A.name,ty:A.ty,lanes:A.lanes,ow:1,pts:W})}
    else avs.push({name:A.name,ty:A.ty,lanes:A.lanes,ow:0,pts:P.map(q=>q.slice())})}
  // densify long avenue segments to ~60 m so they follow the ground and can be split cleanly
  for(const a of avs){const out=[a.pts[0]];for(let i=1;i<a.pts.length;i++){const p=a.pts[i-1],q=a.pts[i],L=Math.hypot(q[0]-p[0],q[1]-p[1]),n=Math.max(1,Math.ceil(L/60));for(let k=1;k<=n;k++)out.push([p[0]+(q[0]-p[0])*k/n,p[1]+(q[1]-p[1])*k/n])}a.pts=out}
  const nearAvenue=(x,z,r)=>{for(const a of avs){const P=a.pts;for(let i=0;i<P.length-1;i++){if(Math.abs(P[i][0]-x)>r+70||Math.abs(P[i][1]-z)>r+70)continue;const [d]=segDist(x,z,P[i][0],P[i][1],P[i+1][0],P[i+1][1]);if(d<r)return{a,i}}}return null};
  // 3. cuadrícula de calles de los barrios (girada como la Avenida Pedro de Heredia, con curvas suaves)
  const TH=.55,ux=Math.cos(TH),uz=Math.sin(TH),vx=-uz,vz=ux,SU=104,SV=82;
  const corners=[[WORLD[0],WORLD[1]],[WORLD[2],WORLD[1]],[WORLD[0],WORLD[3]],[WORLD[2],WORLD[3]]];let i0=1e9,i1=-1e9,j0=1e9,j1=-1e9;
  for(const [x,z] of corners){const a=(x*ux+z*uz)/SU,b=(x*vx+z*vz)/SV;i0=Math.min(i0,Math.floor(a));i1=Math.max(i1,Math.ceil(a));j0=Math.min(j0,Math.floor(b));j1=Math.max(j1,Math.ceil(b))}
  const NI=i1-i0+1,NJ=j1-j0+1;const node=new Int32Array(NI*NJ).fill(-1);const NX=[],NZ=[],NB=[];
  const landAt=(x,z)=>!C.isWater(x,z);
  const okPoint=(x,z)=>landAt(x,z)&&!covered(x,z)&&!inOSMR(x,z)&&C.hillR(x,z)>1.25&&!inAirport(x,z,30);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){let x=i*SU*ux+j*SV*vx,z=i*SU*uz+j*SV*vz;if(x<WORLD[0]+60||x>WORLD[2]-60||z<WORLD[1]+60||z>WORLD[3]-60)continue;
    x+=(vnoise(i*.31,j*.27,1)-.5)*26;z+=(vnoise(i*.29,j*.33,2)-.5)*26;
    const nb=nearestBarrio(x,z);if(nb.d>nb.b[5]*1.75)continue;
    if(!okPoint(x,z)||!landAt(x+14,z)||!landAt(x-14,z)||!landAt(x,z+14)||!landAt(x,z-14)||inBig(x,z))continue;
    node[(i-i0)*NJ+(j-j0)]=NX.length;NX.push(x);NZ.push(z);NB.push(BARRIOS.indexOf(nb.b))}
  const lines=[];// {a:[x,z],b:[x,z],ty,name,barrio}
  const calle=j=>'Calle '+(j-j0+12),carrera=i=>'Carrera '+(i-i0+20);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const n=node[(i-i0)*NJ+(j-j0)];if(n<0)continue;
    for(const [di,dj] of [[1,0],[0,1]]){if(i+di>i1||j+dj>j1)continue;const m=node[(i+di-i0)*NJ+(j+dj-j0)];if(m<0)continue;
      const ax=NX[n],az=NZ[n],bx=NX[m],bz=NZ[m];let ok=true;for(let k=1;k<8&&ok;k++){const x=ax+(bx-ax)*k/8,z=az+(bz-az)*k/8;if(!okPoint(x,z)||inBig(x,z))ok=false}if(!ok)continue;
      // drop streets running alongside an avenue
      const mx=(ax+bx)/2,mz=(az+bz)/2,na=nearAvenue(mx,mz,26);if(na){const P=na.a.pts,q=P[na.i],r=P[na.i+1],L=Math.hypot(r[0]-q[0],r[1]-q[1])||1,el=Math.hypot(bx-ax,bz-az)||1;
        if(Math.abs(((r[0]-q[0])*(bx-ax)+(r[1]-q[1])*(bz-az))/(L*el))>.8)continue}
      const along=di===1;const ty=along?(j%4===0?3:4):(i%5===0?3:4);lines.push({a:[ax,az],b:[bx,bz],ty,name:along?calle(j):carrera(i),barrio:NB[n],pts:null})}}
  // 4. empalmes: calles del mapa detallado que quedaron cortadas en el borde → al nodo de barrio más cercano
  const ngrid=new Map(),NG=120;for(let k=0;k<NX.length;k++){const key=Math.floor(NX[k]/NG)+','+Math.floor(NZ[k]/NG);let a=ngrid.get(key);if(!a){a=[];ngrid.set(key,a)}a.push(k)}
  const used=new Set(lines.flatMap(l=>[Math.round(l.a[0]*10)+','+Math.round(l.a[1]*10),Math.round(l.b[0]*10)+','+Math.round(l.b[1]*10)]));
  const avEnds=new Set();for(const a of avs)for(const k of [0,a.pts.length-1])avEnds.add(Math.round(a.pts[k][0]*10)+','+Math.round(a.pts[k][1]*10));
  let joins=0;
  for(const [key,e] of osmEnds){if(e.n!==1||e.ty>4||avEnds.has(key))continue;let best=-1,bd=175;const ci=Math.floor(e.x/NG),cj=Math.floor(e.z/NG);
    for(let a=ci-2;a<=ci+2;a++)for(let b=cj-2;b<=cj+2;b++){const l=ngrid.get(a+','+b);if(!l)continue;for(const k of l){const d=Math.hypot(NX[k]-e.x,NZ[k]-e.z);if(d<bd&&used.has(Math.round(NX[k]*10)+','+Math.round(NZ[k]*10))){
      let ok=true;for(let s=1;s<10&&ok;s++)if(C.isWater(e.x+(NX[k]-e.x)*s/10,e.z+(NZ[k]-e.z)*s/10))ok=false;if(ok){bd=d;best=k}}}}
    if(best>=0){lines.push({a:[e.x,e.z],b:[NX[best],NZ[best]],ty:4,name:'',barrio:NB[best],join:true});joins++}}
  // 5. cruces: partir avenidas y calles donde se cruzan (para que el tráfico pueda girar)
  const SX=150,sh=new Map();const addS=(key,o)=>{let a=sh.get(key);if(!a){a=[];sh.set(key,a)}a.push(o)};
  lines.forEach((l,li)=>{const x0=Math.min(l.a[0],l.b[0]),x1=Math.max(l.a[0],l.b[0]),z0=Math.min(l.a[1],l.b[1]),z1=Math.max(l.a[1],l.b[1]);for(let a=Math.floor(x0/SX);a<=Math.floor(x1/SX);a++)for(let b=Math.floor(z0/SX);b<=Math.floor(z1/SX);b++)addS(a+','+b,li)});
  const cutsL=lines.map(()=>[]);
  avs.forEach(a=>{a.cuts=[]});
  for(const a of avs){const P=a.pts;for(let i=0;i<P.length-1;i++){const p=P[i],q=P[i+1];const seen=new Set();
      for(let A=Math.floor(Math.min(p[0],q[0])/SX);A<=Math.floor(Math.max(p[0],q[0])/SX);A++)for(let B=Math.floor(Math.min(p[1],q[1])/SX);B<=Math.floor(Math.max(p[1],q[1])/SX);B++){const l=sh.get(A+','+B);if(!l)continue;
        for(const li of l){if(seen.has(li))continue;seen.add(li);const L=lines[li];const r=segX(p,q,L.a,L.b);if(!r)continue;const x=p[0]+(q[0]-p[0])*r[0],z=p[1]+(q[1]-p[1])*r[0];a.cuts.push([i+r[0],x,z]);cutsL[li].push([r[1],x,z])}}}}
  // avenue × avenue
  for(let m=0;m<avs.length;m++)for(let n=m+1;n<avs.length;n++){const A=avs[m].pts,B=avs[n].pts;for(let i=0;i<A.length-1;i++)for(let k=0;k<B.length-1;k++){
      if(Math.max(A[i][0],A[i+1][0])<Math.min(B[k][0],B[k+1][0])||Math.min(A[i][0],A[i+1][0])>Math.max(B[k][0],B[k+1][0])||Math.max(A[i][1],A[i+1][1])<Math.min(B[k][1],B[k+1][1])||Math.min(A[i][1],A[i+1][1])>Math.max(B[k][1],B[k+1][1]))continue;
      const r=segX(A[i],A[i+1],B[k],B[k+1]);if(!r)continue;const x=A[i][0]+(A[i+1][0]-A[i][0])*r[0],z=A[i][1]+(A[i+1][1]-A[i][1])*r[0];avs[m].cuts.push([i+r[0],x,z]);avs[n].cuts.push([k+r[1],x,z])}}
  // avenue ends that stop just short of another avenue (T junctions): snap onto it
  for(const a of avs)for(const end of [0,a.pts.length-1]){const p=a.pts[end];if(a===avs.find(q=>q.name==='Avenida Pedro de Heredia'))continue;let best=null,bd=30;
    for(const b of avs){if(b===a)continue;const P=b.pts;for(let i=0;i<P.length-1;i++){const [d,t]=segDist(p[0],p[1],P[i][0],P[i][1],P[i+1][0],P[i+1][1]);if(d<bd&&d>.5&&t>.001&&t<.999){bd=d;best={b,i,t}}}}
    if(best){const P=best.b.pts,x=P[best.i][0]+(P[best.i+1][0]-P[best.i][0])*best.t,z=P[best.i][1]+(P[best.i+1][1]-P[best.i][1])*best.t;best.b.cuts.push([best.i+best.t,x,z]);a.pts[end]=[x,z]}}
  for(const a of avs){a.cuts.sort((p,q)=>p[0]-q[0]);const out=[];let ci=0;for(let i=0;i<a.pts.length;i++){out.push(a.pts[i]);while(ci<a.cuts.length&&a.cuts[ci][0]<i+1){if(a.cuts[ci][0]>i)out.push([a.cuts[ci][1],a.cuts[ci][2]]);ci++}}
    a.pts=out.filter((q,k)=>k===0||Math.hypot(q[0]-out[k-1][0],q[1]-out[k-1][1])>.4)}
  // 6. tramos de calle (cada cuadra partida en sus cruces)
  const segs=[];lines.forEach((l,li)=>{const c=cutsL[li].sort((p,q)=>p[0]-q[0]);const P=[l.a,...c.map(q=>[q[1],q[2]]),l.b];for(let k=0;k<P.length-1;k++){if(Math.hypot(P[k+1][0]-P[k][0],P[k+1][1]-P[k][1])<.4)continue;
      segs.push({ax:P[k][0],az:P[k][1],bx:P[k+1][0],bz:P[k+1][1],ty:l.ty,name:l.name,barrio:l.barrio,join:!!l.join})}});
  // 7. quitar pedazos sueltos que no conectan con el resto de la ciudad
  {const key=(x,z)=>Math.round(x*10)+','+Math.round(z*10);const par=new Map();const find=k=>{let r=k;while(par.get(r)!==r)r=par.get(r);let c=k;while(par.get(c)!==r){const n=par.get(c);par.set(c,r);c=n}return r};
    const add=k=>{if(!par.has(k))par.set(k,k)};const uni=(a,b)=>{add(a);add(b);const ra=find(a),rb=find(b);if(ra!==rb)par.set(ra,rb)};
    const ROOT='__osm';add(ROOT);
    for(const s of segs){uni(key(s.ax,s.az),key(s.bx,s.bz));if(s.join)uni(key(s.ax,s.az),ROOT)}
    for(const a of avs){for(let i=0;i<a.pts.length-1;i++)uni(key(a.pts[i][0],a.pts[i][1]),key(a.pts[i+1][0],a.pts[i+1][1]))}
    // avenues that start on the detailed map are connected to it
    for(const a of avs){const p=a.pts[0],q=a.pts[a.pts.length-1];if(osmEnds.has(key(p[0],p[1]))||osmEnds.has(key(q[0],q[1])))uni(key(p[0],p[1]),ROOT)}
    const root=find(ROOT);for(let k=segs.length-1;k>=0;k--){const s=segs[k];if(find(key(s.ax,s.az))!==root)segs.splice(k,1)}}
  segs.forEach((s,i)=>{s.id=i});
  // roads in the MAP.roads format: [ty, oneway, lanes, bridge, name, pts]
  const roads=avs.map(a=>[a.ty,a.ow,a.lanes,0,a.name,a.pts.flat()]);
  return{roads,segs,avs,ms:Date.now()-t0,joins,nodes:NX.length,grid:{TH,SU,SV,i0,j0,NI,NJ,ux,uz,vx,vz}}}

// estilos de construcción por tipo de barrio
const STYLES={
  popular:{lw:[5.5,4.5],d:[10,7],fl:[0,1.25],colors:['#ffd23f','#ee4266','#3bceac','#f78c35','#8e6cc2','#2fa4e7','#9bd34a','#ff6fa5','#f4a259','#5bc0be','#e8e2d4','#c9c2b4','#f0e6c8'],tex:['worn','mod','worn'],gable:.45,shop:.2},
  medio:{lw:[8,6],d:[12,7],fl:[1,2.6],colors:['#e6d2ae','#d8c3a0','#efe1c4','#cdbda2','#efd3a7','#e3c3a3','#c9d3c4','#f0e2c8','#bcd2dc','#e8c9c0','#ffffff'],tex:['mod','col2','mod'],gable:.15,shop:.16},
  alto:{lw:[14,10],d:[14,6],fl:[3,9],colors:['#f4f1ea','#ebe7df','#e2e9ee','#ffffff','#e9ecef'],tex:['mod'],gable:0,shop:.14,tower:.45},
  playa:{lw:[7,5],d:[9,5],fl:[0,1.2],colors:['#3bceac','#ffd23f','#2fa4e7','#ffffff','#f78c35','#ff6fa5','#9bd34a'],tex:['worn','mod'],gable:.55,shop:.25},
  industrial:{lw:[26,30],d:[22,18],fl:[1,1.8],colors:['#b8bec4','#9aa6b0','#d6d2c8','#7d8b99','#c9c2b4'],tex:['mod'],gable:0,shop:.03,ware:true},
  avenida:{lw:[10,8],d:[14,6],fl:[1,3.5],colors:['#f4f1ea','#e6d2ae','#efe1c4','#bcd2dc','#ffffff','#f0e2c8'],tex:['mod','mod','col2'],gable:0,shop:.3,tower:.03},
  relleno:{lw:[7,5],d:[10,5],fl:[0,1.7],colors:['#e6d2ae','#d8c3a0','#efe1c4','#cdbda2','#efd3a7','#e3c3a3','#c9d3c4','#f0e2c8','#bcd2dc','#e8c9c0'],tex:['mod','col2'],gable:.25,shop:.12},
};
/* lotes de un tramo de calle: casas a ambos lados, dejando libres las esquinas.
   H: {clear(x,z,m) → no hay calle a menos de m del borde, water(x,z), solid(x,z), special(x,z)}  — todo es determinista */
function lotsFor(s,styleKey,H){const ST=STYLES[styleKey]||STYLES.popular;const dx=s.bx-s.ax,dz=s.bz-s.az,L=Math.hypot(dx,dz);if(L<(s.grid?22:12))return[];const ux=dx/L,uz=dz/L;const out=[];
  const trimA=s.ja?Math.max(13,s.w*.5+11):3,trimB=s.jb?Math.max(13,s.w*.5+11):3;const set=s.w/2+2.7;
  for(const side of [1,-1]){const nx=-uz*side,nz=ux*side;let st=trimA+hashI(s.id*7+1,side+5)*2,k=0;
    while(k<80){const h1=hashI(s.id*131+k,side*17+3),h2=hashI(s.id*71+k*3,side*29+11);const lw=ST.lw[0]+h1*ST.lw[1];if(st+lw>L-trimB)break;
      const d=Math.min(ST.d[0]+h2*ST.d[1],34);const fx0=s.ax+ux*st+nx*set,fz0=s.az+uz*st+nz*set,fx1=fx0+ux*lw,fz1=fz0+uz*lw;const bx0=fx0+nx*d,bz0=fz0+nz*d,bx1=fx1+nx*d,bz1=fz1+nz*d;
      const cx=(fx0+bx1)/2,cz=(fz0+bz1)/2;let ok=true;
      for(const [px,pz] of [[fx0+ux*.4,fz0+uz*.4],[fx1-ux*.4,fz1-uz*.4],[bx0,bz0],[bx1,bz1],[cx,cz],[(bx0+bx1)/2,(bz0+bz1)/2]]){if(H.water(px,pz)||H.solid(px,pz)||H.special(px,pz)||!H.clear(px,pz,1.2)){ok=false;break}}
      if(ok){const h3=hashI(s.id*13+k,side*41+7);out.push({pts:[fx0,fz0,fx1,fz1,bx1,bz1,bx0,bz0],cx,cz,lw,d,k,side,fx:(fx0+fx1)/2-nx*1.4,fz:(fz0+fz1)/2-nz*1.4,wx:(fx0+fx1)/2,wz:(fz0+fz1)/2,nx:-nx,nz:-nz,
        floors:Math.max(0,Math.round(ST.fl[0]+h3*h3*ST.fl[1])),col:ST.colors[Math.floor(hashI(s.id*3+k,side*5+1)*ST.colors.length)],tex:ST.tex[Math.floor(hashI(s.id+k*5,side*3)*ST.tex.length)],
        gable:hashI(s.id*5+k,side*9+2)<ST.gable,tower:ST.tower&&hashI(s.id*11+k,side*13)<ST.tower,ware:!!ST.ware,style:styleKey})}
      st+=lw+(hashI(s.id*17+k,side*23)<.08?2+h2*4:.05+h1*.35);k++}}
  return out}
// población total (los barrios suman ~1,5 millones)
const TOTAL=1500000;
(function(){let s=0;for(const b of BARRIOS)s+=b[3];for(const k in INNER_POP)s+=INNER_POP[k];const f=TOTAL/s;for(const b of BARRIOS)b[3]=Math.round(b[3]*f/10)*10;for(const k in INNER_POP)INNER_POP[k]=Math.round(INNER_POP[k]*f/10)*10})();
return{WORLD,OSMR,COAST_N,COAST_S,CIENAGA,TBOMBA,AIRPORT,BARRIOS,INNER_POP,INNER_ZONES,STYLE_DENS,AVENIDAS,LUGARES,GAS,STYLES,TOTAL,
  outerLand,waterName,inAirport,inPolyA,nearestBarrio,hashI,vnoise,segDist,generar,lotsFor}})();
