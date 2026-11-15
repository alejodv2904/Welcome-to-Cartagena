/* Cuerpos humanos construidos por código: esqueleto (nombres de Mixamo, pose en T), cuerpo completo (cabeza con cara, cuello, torso,
   brazos con manos, piernas) y ropa como piezas separadas (camiseta, camisa, saco, pantalón, pantaloneta, zapatos, cuello, cinturón)
   hechas con los mismos anillos del cuerpo, un poco más grandes. Todo sale en una sola malla con huesos por cada combinación de ropa. */
window.CUERPOS=function(THREE){
'use strict';
const TAU=Math.PI*2;
const NAMES=['Hips','Spine','Spine1','Spine2','Neck','Head','HeadTop_End','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'];
const PARENT={Spine:'Hips',Spine1:'Spine',Spine2:'Spine1',Neck:'Spine2',Head:'Neck',HeadTop_End:'Head',
  LeftShoulder:'Spine2',LeftArm:'LeftShoulder',LeftForeArm:'LeftArm',LeftHand:'LeftForeArm',RightShoulder:'Spine2',RightArm:'RightShoulder',RightForeArm:'RightArm',RightHand:'RightForeArm',
  LeftUpLeg:'Hips',LeftLeg:'LeftUpLeg',LeftFoot:'LeftLeg',LeftToeBase:'LeftFoot',RightUpLeg:'Hips',RightLeg:'RightUpLeg',RightFoot:'RightLeg',RightToeBase:'RightFoot'};
const IDX={};NAMES.forEach((n,i)=>IDX[n]=i);
// pose en T, en metros (x+ = izquierda del personaje); la mujer sale de escalar al hombre
const MALE={Hips:[0,1.0,0],Spine:[0,1.08,.005],Spine1:[0,1.2,.012],Spine2:[0,1.33,.012],Neck:[0,1.5,0],Head:[0,1.58,0],HeadTop_End:[0,1.78,0],
  LeftShoulder:[.05,1.45,0],LeftArm:[.2,1.45,0],LeftForeArm:[.47,1.45,-.01],LeftHand:[.72,1.45,0],
  LeftUpLeg:[.09,.95,0],LeftLeg:[.095,.52,.005],LeftFoot:[.1,.095,-.01],LeftToeBase:[.1,.04,.13]};
const SC={m:{x:1,y:1,z:1,r:1},f:{x:.88,y:.933,z:.93,r:.9}};
function restPos(kind){const k=SC[kind],o={};for(const n in MALE){const p=MALE[n];o[n]=[p[0]*k.x,p[1]*k.y,p[2]*k.z];if(n.startsWith('Left'))o['Right'+n.slice(4)]=[-p[0]*k.x,p[1]*k.y,p[2]*k.z]}return o}
/* ---------- esqueleto: huesos nuevos para cada persona (sin rotación: pose en T) ---------- */
function makeRig(kind){const P=restPos(kind),bones={};
  for(const n of NAMES){const b=new THREE.Bone();b.name=n;bones[n]=b}
  for(const n of NAMES){const par=PARENT[n];const p=P[n];if(par){const q=P[par];bones[n].position.set(p[0]-q[0],p[1]-q[1],p[2]-q[2]);bones[par].add(bones[n])}else bones[n].position.set(p[0],p[1],p[2])}
  const root=new THREE.Group();root.add(bones.Hips);root.updateMatrixWorld(true);
  const list=NAMES.map(n=>bones[n]);const inv=list.map(b=>new THREE.Matrix4().copy(b.matrixWorld).invert());
  return{root,bones,list,inv}}
/* ---------- constructor de tubos con anillos ---------- */
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
// pesos 1D: bones de menor a mayor coordenada, bounds = coordenadas de las articulaciones, s = ancho de la mezcla
function chainW(bones,bounds,s){return t=>{const out=[];for(let i=0;i<bones.length;i++){const lo=i===0?1:smooth(bounds[i-1]-s,bounds[i-1]+s,t),hi=i===bones.length-1?0:smooth(bounds[i]-s,bounds[i]+s,t);const w=lo-hi;if(w>.001)out.push([IDX[bones[i]],w])}return out}}
function Acc(){return{P:[],UV:[],C:[],PT:[],SI:[],SW:[],I:[]}}
function pushVert(A,x,y,z,u,v,col,part,w){A.P.push(x,y,z);A.UV.push(u,v);A.C.push(col[0],col[1],col[2]);A.PT.push(part);
  w=w.slice().sort((a,b)=>b[1]-a[1]).slice(0,4);let s=0;for(const q of w)s+=q[1];const si=[0,0,0,0],sw=[0,0,0,0];w.forEach((q,i)=>{si[i]=q[0];sw[i]=q[1]/s});A.SI.push(...si);A.SW.push(...sw)}
// o: nodes [{p,a,b,w(fn(t)->pesos)|w[]}], axis 'x'|'y'|'z', part, tint, fn(vertex)->{part,tint}, capA, capB
function refine(nodes,st){const out=[nodes[0]];for(let i=1;i<nodes.length;i++){const a=nodes[i-1],b=nodes[i];const d=Math.hypot(b.p[0]-a.p[0],b.p[1]-a.p[1],b.p[2]-a.p[2]);const m=Math.ceil(d/st);
    for(let j=1;j<m;j++){const t=j/m;out.push({p:[a.p[0]+(b.p[0]-a.p[0])*t,a.p[1]+(b.p[1]-a.p[1])*t,a.p[2]+(b.p[2]-a.p[2])*t],a:a.a+(b.a-a.a)*t,b:a.b+(b.b-a.b)*t,w:a.w})}out.push(b)}return out}
function tube(A,o){const n=o.n||14,axis=o.axis||'y';const nodes=o.step===0?o.nodes:refine(o.nodes,o.step||.07);const perim=o.perim||TAU*(nodes[0].a+nodes[0].b)/2;const base=A.P.length/3;let dist=0;
  for(let i=0;i<nodes.length;i++){const nd=nodes[i];if(i>0){const q=nodes[i-1].p;dist+=Math.hypot(nd.p[0]-q[0],nd.p[1]-q[1],nd.p[2]-q[2])}
    const t=axis==='x'?Math.abs(nd.p[0]):axis==='y'?nd.p[1]:nd.p[2];const w=typeof nd.w==='function'?nd.w(t):nd.w;
    for(let k=0;k<n;k++){const th=k/n*TAU,c=Math.cos(th),s=Math.sin(th);let x,y,z;
      if(axis==='y'){x=nd.p[0]+c*nd.a;y=nd.p[1];z=nd.p[2]+s*nd.b}else if(axis==='x'){x=nd.p[0];y=nd.p[1]+c*nd.a;z=nd.p[2]+s*nd.b}else{x=nd.p[0]+c*nd.a;y=nd.p[1]+s*nd.b;z=nd.p[2]}
      let part=o.part,tint=o.tint||[1,1,1];if(o.fn){const r=o.fn(x,y,z,c,s,nd);if(r){if(r.part!==undefined)part=r.part;if(r.tint)tint=r.tint}}
      pushVert(A,x,y,z,k/n*perim,dist,tint,part,o.wv?o.wv(x,y,z):w)}}
  // orientación: que la cara mire hacia afuera
  const k0=base,k1=base+n,pA=[A.P[k0*3],A.P[k0*3+1],A.P[k0*3+2]],pB=[A.P[(k0+1)*3],A.P[(k0+1)*3+1],A.P[(k0+1)*3+2]],pC=[A.P[k1*3],A.P[k1*3+1],A.P[k1*3+2]];
  const e1=[pB[0]-pA[0],pB[1]-pA[1],pB[2]-pA[2]],e2=[pC[0]-pA[0],pC[1]-pA[1],pC[2]-pA[2]];const nm=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  const cen=nodes[0].p,rad=[pA[0]-cen[0],pA[1]-cen[1],pA[2]-cen[2]];const flip=((nm[0]*rad[0]+nm[1]*rad[1]+nm[2]*rad[2])<0)!==(o.flip===true);
  for(let i=0;i<nodes.length-1;i++)for(let k=0;k<n;k++){const a=base+i*n+k,b=base+i*n+(k+1)%n,c=base+(i+1)*n+k,d=base+(i+1)*n+(k+1)%n;
    if(flip)A.I.push(a,c,b,b,c,d);else A.I.push(a,b,c,b,d,c)}
  const cap=(idx,up)=>{const nd=nodes[idx];const ci=A.P.length/3;const t=axis==='x'?Math.abs(nd.p[0]):axis==='y'?nd.p[1]:nd.p[2];const w=typeof nd.w==='function'?nd.w(t):nd.w;
    pushVert(A,nd.p[0],nd.p[1],nd.p[2],0,0,o.tint||[1,1,1],o.part,w);const r0=A.P.length/3;
    for(let k=0;k<n;k++){const s=base+idx*n+k;pushVert(A,A.P[s*3],A.P[s*3+1],A.P[s*3+2],0,0,o.tint||[1,1,1],o.part,w)}
    for(let k=0;k<n;k++){const a=r0+k,b=r0+(k+1)%n;(up!==flip)?A.I.push(ci,a,b):A.I.push(ci,b,a)}};
  if(o.capA)cap(0,false);if(o.capB)cap(nodes.length-1,true)}
function ell(A,c,r,part,tint,w,seg){// elipsoide suelto (ojos, nariz, orejas, busto...)
  seg=seg||[10,7];const base=A.P.length/3;
  for(let j=0;j<=seg[1];j++){const ph=j/seg[1]*Math.PI;for(let i=0;i<=seg[0];i++){const th=i/seg[0]*TAU;
    pushVert(A,c[0]+Math.cos(th)*Math.sin(ph)*r[0],c[1]+Math.cos(ph)*r[1],c[2]+Math.sin(th)*Math.sin(ph)*r[2],i/seg[0],j/seg[1],tint||[1,1,1],part,w)}}
  const W=seg[0]+1;for(let j=0;j<seg[1];j++)for(let i=0;i<seg[0];i++){const a=base+j*W+i,b=a+1,c2=a+W,d=c2+1;A.I.push(a,b,c2,b,d,c2)}}
// geometría final: normales, volumen de recorte y atributos de piel
function toGeo(A){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A.P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(A.UV,2));g.setAttribute('color',new THREE.Float32BufferAttribute(A.C,3));
  g.setAttribute('aPart',new THREE.Float32BufferAttribute(A.PT,1));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(A.SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(A.SW,4));g.setIndex(A.I);g.computeVertexNormals();
  g.computeBoundingSphere();g.boundingSphere.radius*=2;g.userData.cullR=true;return g}
// partes de color: 0 piel, 1 camiseta/saco, 2 pantalón, 3 zapatos, 4 sombrero, 5 pelo/cejas, 6 ojos, 7 barba, 8 camisa (debajo del saco), 9 cinturón
const PART={skin:0,top:1,bottom:2,shoes:3,hat:4,hair:5,eyes:6,beard:7,shirt:8,belt:9};
/* ---------- medidas del cuerpo ---------- */
function torsoTable(kind){// [y, rx, rz] de abajo hacia arriba
  if(kind==='m')return[[.8,.165,.105],[.94,.172,.106],[1.04,.158,.1],[1.16,.147,.095],[1.26,.168,.105],[1.34,.192,.108],[1.41,.205,.102],[1.45,.196,.096],[1.475,.15,.082],[1.49,.07,.06],[1.5,.056,.056]];
  const k=SC.f.y;return[[.8*k,.152,.098],[.94*k,.182,.104],[1.04*k,.158,.092],[1.16*k,.124,.084],[1.25*k,.152,.114],[1.31*k,.15,.104],[1.36*k,.162,.1],[1.41*k,.168,.094],[1.445*k,.152,.084],[1.47*k,.118,.072],[1.488*k,.072,.056],[1.5*k,.048,.048]]}
function torsoR(kind,y){const T=torsoTable(kind);if(y<=T[0][0])return[T[0][1],T[0][2]];for(let i=1;i<T.length;i++)if(y<=T[i][0]){const a=T[i-1],b=T[i],t=(y-a[0])/(b[0]-a[0]);return[a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}const e=T[T.length-1];return[e[1],e[2]]}
const LEG=[[.99,.095,.095],[.82,.09,.09],[.66,.075,.076],[.52,.058,.062],[.38,.057,.06],[.2,.043,.046],[.1,.04,.042]];
const ARM=[[.08,.06,.08],[.15,.057,.072],[.22,.056,.065],[.34,.051,.056],[.47,.043,.046],[.6,.038,.04],[.7,.03,.032]];
function legR(kind,y){const k=SC[kind],T=LEG;const yy=y/k.y;if(yy>=T[0][0])return[T[0][1]*k.r,T[0][2]*k.r];for(let i=1;i<T.length;i++)if(yy>=T[i][0]){const a=T[i-1],b=T[i],t=(yy-a[0])/(b[0]-a[0]);return[(a[1]+(b[1]-a[1])*t)*k.r,(a[2]+(b[2]-a[2])*t)*k.r]}const e=T[T.length-1];return[e[1]*k.r,e[2]*k.r]}
function legX(kind,y,sd){const k=SC[kind];return sd*(.088+.012*(1-Math.min(1,y/(.95*k.y))))*k.x}
function armR(kind,x){const k=SC[kind],T=ARM;const xx=x/k.x;if(xx<=T[0][0])return[T[0][1]*k.r,T[0][2]*k.r];for(let i=1;i<T.length;i++)if(xx<=T[i][0]){const a=T[i-1],b=T[i],t=(xx-a[0])/(b[0]-a[0]);return[(a[1]+(b[1]-a[1])*t)*k.r,(a[2]+(b[2]-a[2])*t)*k.r]}const e=T[T.length-1];return[e[1]*k.r,e[2]*k.r]}
// la raíz del brazo (y de la manga) se aplana hacia arriba al meterse en el torso, para que no salga por encima del hombro
const rootK=x=>.55+.45*smooth(.06,.17,x);
/* ---------- pesos por zona ---------- */
function weights(kind){const k=SC[kind];
  return{
    torso:chainW(['Hips','Spine','Spine1','Spine2'],[1.06*k.y,1.17*k.y,1.29*k.y],.05),
    neck:chainW(['Spine2','Neck','Head'],[1.46*k.y,1.56*k.y],.04),
    leg:s=>chainW(['Foot','Leg','UpLeg'].map(n=>s+n),[.125*k.y,.52*k.y],.05),
    arm:s=>chainW(['Spine2',s+'Arm',s+'ForeArm',s+'Hand'],[.2*k.x,.47*k.x,.7*k.x],.045),
    foot:s=>[[IDX[s+'Foot'],1]],head:[[IDX.Head,1]],hand:s=>[[IDX[s+'Hand'],1]]}}
const lookup=(W,side)=>W; // (los lados se resuelven con el prefijo en cada uso)
/* ---------- cuerpo ---------- */
function bodyParts(A,kind,sk){const k=SC[kind],W=weights(kind),T=torsoTable(kind);const SKIN=PART.skin;
  // torso
  tube(A,{nodes:T.map(r=>({p:[0,r[0],0],a:r[1],b:r[2],w:W.torso})),axis:'y',part:SKIN,n:16,capA:true});
  // cuello (se mete en la cabeza, un poco más delgado que el cuello de la cabeza para que no se peleen)
  const nr=.05*k.r;tube(A,{nodes:[[1.44*k.y,nr*1.15],[1.49*k.y,nr*.84],[1.62*k.y,nr*.64]].map(r=>({p:[0,r[0],-.004],a:r[1],b:r[1]*1.05,w:W.neck})),axis:'y',part:SKIN,n:12});
  // piernas y brazos de cada lado
  for(const sd of [1,-1]){const s=sd>0?'Left':'Right';
    tube(A,{nodes:LEG.map(r=>{const y=r[0]*k.y;return{p:[legX(kind,y,sd),y,.004],a:r[1]*k.r,b:r[2]*k.r,w:W.leg(s)}}),axis:'y',part:SKIN,n:12,capB:true,capA:true});
    tube(A,{nodes:ARM.map(r=>({p:[r[0]*k.x*sd,1.45*k.y,r[0]>.4?-.008:0],a:r[1]*k.r*rootK(r[0]),b:r[2]*k.r,w:W.arm(s)})),axis:'x',part:SKIN,n:12,capA:true});
    // mano: palma, cuatro dedos y pulgar
    const hx=sd*k.x,hy=1.45*k.y,hw=W.hand(s),r=k.r;
    tube(A,{nodes:[[.7,.03,.032],[.735,.024,.042],[.785,.018,.046]].map(q=>({p:[q[0]*hx,hy,0],a:q[1]*r,b:q[2]*r,w:hw})),axis:'x',part:SKIN,n:8,step:0});
    [[.03,.0,.083,.0078],[.011,.0,.092,.0082],[-.009,.0,.085,.0078],[-.027,.0,.068,.0068]].forEach(q=>{const z=q[0]*r,len=q[2]*r,rad=q[3]*r;const x0=.78*hx;
      tube(A,{nodes:[{p:[x0,hy,z],a:rad*1.15,b:rad*1.15,w:hw},{p:[x0+sd*len*.55,hy-.002,z],a:rad,b:rad,w:hw},{p:[x0+sd*len,hy-.006,z],a:rad*.75,b:rad*.75,w:hw}],axis:'x',part:SKIN,n:6,capB:true,step:0})});
    tube(A,{nodes:[0,1,2].map(i=>({p:[(.73+i*.012)*hx,hy-.004,(.03+i*.026)*r],a:(.0105-.0012*i)*r,b:(.0105-.0012*i)*r,w:hw})),axis:'z',part:SKIN,n:6,capB:true,step:0});
  }
  return A}
/* ---------- ropa ---------- */
const off=(y,hem,v)=>v;
function garments(A,kind,o){const k=SC[kind],W=weights(kind);
  const TOPY=1.49*k.y;
  // camiseta / camisa / saco: torso + mangas + cuello
  if(o.top){const jacket=o.top==='jacket',shirt=o.top==='shirt'||jacket,hem=o.hem!==undefined?o.hem:(kind==='m'?.86:.9);const loose=jacket?.034:o.top==='tee'?.016:.014,sl=o.sleeve;
    const ys=[];const top=TOPY;const N=12;for(let i=0;i<=N;i++)ys.push(hem+(top-hem)*i/N);
    for(let y=1.38*k.y;y<top-.004;y+=.01*k.y)if(y>hem)ys.push(y);ys.sort((a,b)=>a-b); // anillos seguidos en el hombro para que el cuerpo no se asome entre ellos
    const noSleeveless=sl===2;
    const nodes=ys.map((y,i)=>{let [rx,rz]=torsoR(kind,y);const f=1+loose/ .1;const tuck=hem>=.98*k.y&&!jacket&&y<1.12*k.y;let ax=tuck?rx+.005:rx+loose*(y<1.15*k.y?(jacket?1.1:1.5):1),az=tuck?rz+.005:rz+loose*(y<1.15*k.y?(jacket?1.1:1.5):1);
      if(noSleeveless&&y>1.38*k.y){ax*=.82}
      if(y>1.46*k.y){const t=smooth(1.44*k.y,TOPY,y);ax=ax*(1-t)+(.058*k.r+.014)*t;az=az*(1-t)+(.058*k.r+.014)*t}
      ax=Math.max(ax,rx+.007);az=Math.max(az,rz+.007); // que el hombro no se asome por la tela
      return{p:[0,y,0],a:ax,b:az,w:W.torso}});
    const vFn=(x,y,z,c,s)=>{ // zonas pintadas: V del cuello, camisa bajo el saco, escote
      if(z>0&&c>-2){const dy=y-(1.5*k.y);
        if(o.neck==='v'&&dy>-.17*k.y-.0&&Math.abs(x)<.012+(dy+.17*k.y)*.34&&s>.5)return{part:PART.skin};
        if(o.neck==='scoop'&&dy>-.1*k.y&&(x*x/(.075*.075)+((dy+.1*k.y)*(dy+.1*k.y))/(.1*.1))<1.0&&s>.4)return{part:PART.skin};
        if(jacket&&dy>-.3*k.y&&Math.abs(x)<.03+(dy+.3*k.y)*.2&&s>.5)return{part:PART.shirt}}return null};
    tube(A,{nodes,axis:'y',part:PART.top,n:18,fn:vFn});
    // mangas
    if(sl<2){for(const sd of [1,-1]){const s=sd>0?'Left':'Right';const cut=(sl===1?.34:.67)*k.x;const arr=[];
      for(let x=.075*k.x;x<cut;x+=.06*k.x)arr.push(x);arr.push(cut); // la manga nace adentro del hombro para taparlo
      const flare=jacket?.03:o.top==='tee'?.018:.014;
      const nd=arr.map((x,i)=>{const r=armR(kind,x);const lf=flare*(i/(arr.length-1)>.5?1.4:1);return{p:[x*sd,1.45*k.y,x>.4*k.x?-.008:0],a:(r[0]+lf+(x<.1*k.x?0:i<3?.008:0))*rootK(x/k.x),b:r[1]+lf+(x<.1*k.x?0:i<3?.008:0),w:W.arm(s)}});
      tube(A,{nodes:nd,axis:'x',part:PART.top,n:14,fn:()=>null});
      const e=nd[nd.length-1];tube(A,{nodes:[e,{...e,a:e.a-.012,b:e.b-.012},{...e,p:[e.p[0]-sd*.03,e.p[1],e.p[2]],a:e.a-.012,b:e.b-.012}],axis:'x',part:PART.top,n:14});
      if(shirt&&sl===0){const wr=armR(kind,.68*k.x);tube(A,{nodes:[{p:[.62*k.x*sd,1.45*k.y,-.008],a:wr[0]+.014,b:wr[1]+.014,w:W.arm(s)},{p:[.7*k.x*sd,1.45*k.y,0],a:wr[0]+.012,b:wr[1]+.012,w:W.arm(s)}],axis:'x',part:jacket?PART.shirt:PART.top,n:14})}}}
    // cuello: de camisa (o de camiseta redondo); se mueve con el torso para no despegarse de la tela
    if(shirt||o.collar){const cr=.058*k.r;tube(A,{nodes:[{p:[0,1.476*k.y,0],a:cr+.026,b:cr+.024,w:W.torso},{p:[0,1.535*k.y,0],a:cr+.012,b:cr+.012,w:W.torso},{p:[0,1.538*k.y,0],a:cr+.003,b:cr+.003,w:W.torso}],axis:'y',part:jacket?PART.shirt:PART.top,n:14})}
    else if(o.neck!=='v'&&o.neck!=='scoop'){const cr=.058*k.r;tube(A,{nodes:[{p:[0,1.472*k.y,0],a:cr+.026,b:cr+.024,w:W.torso},{p:[0,1.52*k.y,0],a:cr+.008,b:cr+.008,w:W.torso}],axis:'y',part:PART.top,n:14})}}
  // pantalón / pantaloneta
  if(o.bottom){const short=o.bottom==='shorts',waist=1.07*k.y;const T=[[waist,0],[.98*k.y,0],[.86*k.y,0],[.78*k.y,0]];
    tube(A,{nodes:T.map(r=>{const q=torsoR(kind,r[0]);return{p:[0,r[0],0],a:q[0]+.014,b:q[1]+.014,w:W.torso}}),axis:'y',part:PART.bottom,n:16,capB:true});
    for(const sd of [1,-1]){const s=sd>0?'Left':'Right';const yEnd=short?.6*k.y:.105*k.y;const ys=[.99*k.y];for(let y=.86*k.y;y>yEnd;y-=.13*k.y)ys.push(y);ys.push(yEnd);
      const nd=ys.map((y,i)=>{const r=legR(kind,y);const flare=short?.03:i===ys.length-1?.02:.012;const lf=(y<.3*k.y&&!short)?.014:0;return{p:[legX(kind,y,sd),y,.004],a:r[0]+.014+lf+(short&&i===ys.length-1?.012:0),b:r[1]+.014+lf+(short&&i===ys.length-1?.012:0),w:W.leg(s)}});
      tube(A,{nodes:nd,axis:'y',part:PART.bottom,n:14});
      const e=nd[nd.length-1];tube(A,{nodes:[e,{...e,a:e.a-.012,b:e.b-.012},{...e,p:[e.p[0],e.p[1]+.03,e.p[2]],a:e.a-.012,b:e.b-.012}],axis:'y',part:PART.bottom,n:14})}
    if(o.belt){const q=torsoR(kind,waist-.015);tube(A,{nodes:[waist+.0,waist-.045].map(y=>({p:[0,y,0],a:q[0]+.02,b:q[1]+.02,w:W.torso})),axis:'y',part:PART.belt,n:16});
      ell(A,[0,waist-.022,q[1]+.026],[.024,.02,.006],PART.belt,[2.2,2.2,2.1],W.torso(waist),[6,4])}}
  // falda: sigue a las piernas (cada lado se mueve con su muslo) sin partirse
  if(o.bottom==='skirt-long'||o.bottom==='skirt-short'){const long=o.bottom==='skirt-long',yw=1.07*k.y,yh=(long?.14:.58)*k.y,N=long?9:6,ki=long?.5:.78;const ys=[];for(let i=0;i<=N;i++)ys.push(yw+(yh-yw)*i/N);
    const nodes=ys.map((y,i)=>{const t=i/N,q=torsoR(kind,Math.max(y,1.0*k.y)),r0=q[0]+.018,rh=(long?.32:.25)*k.r,ra=r0+(rh-r0)*Math.pow(t,.85)*1.0;return{p:[0,y,0],a:ra,b:ra*.9,w:W.torso}});
    const wv=(x,y,z)=>{const g=Math.min(1,Math.max(0,(1.0*k.y-y)/(.5*k.y)))*ki,wl=smooth(-.1,.1,x);const base=W.torso(Math.max(y,1.0*k.y)).map(q=>[q[0],q[1]*(1-g)]);if(g>.001){base.push([IDX.LeftUpLeg,g*wl],[IDX.RightUpLeg,g*(1-wl)])}return base};
    tube(A,{nodes,axis:'y',part:PART.bottom,n:20,wv});
    const e=nodes[nodes.length-1];tube(A,{nodes:[e,{...e,a:e.a-.012,b:e.b-.012},{...e,p:[0,e.p[1]+.03,0],a:e.a-.012,b:e.b-.012}],axis:'y',part:PART.bottom,n:20,wv})}
  // zapatos
  if(o.shoes!==false){for(const sd of [1,-1]){const s=sd>0?'Left':'Right';const cx=.1*k.x*sd,w=W.foot(s);
    const ank=.115*k.y,sl=o.shoes==='boot'?.2*k.y:ank;
    tube(A,{nodes:[sl,ank,.07*k.y].map((y,i)=>({p:[cx,y,-.008],a:.046*k.r+(i?.004:0),b:.05*k.r,w:i===0?W.leg(s):W.leg(s)})),axis:'y',part:PART.shoes,n:12});
    // pie: de talón a punta
    const zs=[[-.075,.036,.05],[-.03,.044,.062],[.06,.046,.055],[.15,.04,.04],[.215,.026,.02],[.235,.012,.01]];
    tube(A,{nodes:zs.map(r=>({p:[cx,.052*k.y*(r[0]>.15?.7:1),r[0]*k.z],a:r[1]*k.r,b:r[2]*k.r,w})),axis:'z',part:PART.shoes,n:12,capA:true,capB:true})}}
  return A}
/* ---------- construcción de la malla para una combinación de ropa ---------- */
function build(kind,o){const A=Acc();bodyParts(A,kind);garments(A,kind,o);return toGeo(A)}
function headInfo(kind){return kind==='m'?{c:[0,1.665,.015],r:[.099,.118,.108]}:{c:[0,1.508,.013],r:[.093,.111,.101]}}
function neckW(kind){return weights(kind).neck}
return{makeRig,build,NAMES,IDX,PART,restPos,SC,headInfo,neckW}};
