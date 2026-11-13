/* Cartagena Libre — perros criollos y gatos de la calle: deambulan cerca del jugador, se sientan, se echan a dormir;
   los perros mueven la cola y ladran de vez en cuando (ninguno sigue al jugador), los gatos salen corriendo si te acercas.
   Todo con mallas instanciadas (pocas llamadas de dibujo) y patas animadas por cuadro. */
window.ANIMALES=function(C){
'use strict';
const THREE=C.THREE,TAU=Math.PI*2,player=C.player;
const rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];

// une varias cajas/conos en una sola geometría (sin índices)
function merge(parts){const P=[],N=[];for(const g0 of parts){const g=g0.index?g0.toNonIndexed():g0;const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i))}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return g}
const box=(w,h,d,x,y,z,rx)=>{const g=new THREE.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);return g.translate(x,y,z)};

/* ---------- especies: cuerpo (con cabeza y orejas), una pata (pivote arriba) y la cola (pivote en la base) ---------- */
const SPECIES={
  perro:{n:C.LOWEND?14:24,cols:['#c8a06a','#b8884f','#6b4a2b','#1d1d1d','#e8dcc8','#a0522d','#8d8d8d','#d9b98a'],
    body:merge([box(.22,.2,.56,0,.4,0),box(.17,.2,.16,0,.5,.26),box(.17,.16,.19,0,.6,.37),box(.1,.09,.13,0,.56,.51),box(.05,.1,.04,-.06,.71,.33,-.3),box(.05,.1,.04,.06,.71,.33,-.3),box(.03,.03,.02,0,.585,.58)]),
    leg:box(.065,.32,.065,0,-.16,0),legs:[[-.075,.33,.2],[.075,.33,.2],[-.075,.33,-.21],[.075,.33,-.21]],
    tail:box(.04,.04,.26,0,0,-.13),tailAt:[0,.47,-.27],tailLift:-.6,scale:[.85,1.15],speed:[1.1,1.9],run:3.8},
  gato:{n:C.LOWEND?10:16,cols:['#f2a65a','#1d1d1d','#e8e4dc','#7d7d7d','#b08a5a','#d98c3a','#4a4a4a'],
    body:merge([box(.13,.13,.32,0,.22,0),box(.12,.11,.11,0,.3,.2),box(.06,.05,.04,0,.28,.27),
      new THREE.ConeGeometry(.025,.06,4).translate(-.035,.38,.2),new THREE.ConeGeometry(.025,.06,4).translate(.035,.38,.2)]),
    leg:box(.04,.18,.04,0,-.09,0),legs:[[-.045,.18,.11],[.045,.18,.11],[-.045,.18,-.11],[.045,.18,-.11]],
    tail:box(.025,.025,.3,0,0,-.15),tailAt:[0,.26,-.16],tailLift:-1.0,scale:[.9,1.1],speed:[.5,.9],run:4.2}};
const A=[];const G={};
for(const k in SPECIES){const S=SPECIES[k],n=S.n;const mat=new THREE.MeshLambertMaterial({color:'#ffffff'});
  const mk=(geo,count)=>{const m=new THREE.InstancedMesh(geo,mat,count);m.castShadow=true;m.receiveShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;C.scene.add(m);return m};
  G[k]={body:mk(S.body,n),legs:mk(S.leg,n*4),tail:mk(S.tail,n)};
  for(let i=0;i<n;i++){const col=new THREE.Color(pick(S.cols));const a={sp:k,S,i,x:0,z:0,yaw:rr(0,TAU),v:0,tv:0,tx:0,tz:0,state:'idle',t:rr(0,4),ph:rr(0,TAU),sc:rr(S.scale[0],S.scale[1]),
      bark:rr(4,12),col,placed:false};A.push(a);
    G[k].body.setColorAt(i,col);G[k].tail.setColorAt(i,col);for(let l=0;l<4;l++)G[k].legs.setColorAt(i*4+l,col)}
  for(const m of Object.values(G[k]))m.instanceColor.needsUpdate=true}

/* ---------- dónde pueden estar: en tierra, fuera de edificios y cerca de una calle ---------- */
const free=(x,z)=>C.onLand(x,z)&&!C.solidAt(x,z);
function spot(cx,cz,r0,r1){for(let t=0;t<25;t++){const a=rr(0,TAU),r=rr(r0,r1),x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;if(free(x,z)&&C.nearestRoad(x,z,14))return{x,z}}return null}
function place(a,near){const p=spot(player.x,player.z,near?8:45,near?90:120);if(!p)return false;a.x=p.x;a.z=p.z;a.placed=true;a.state=Math.random()<.3?'lie':'idle';a.t=rr(1,6);return true}
function newTarget(a,far){const p=spot(a.x,a.z,2,far?14:7);if(!p){a.state='idle';a.t=rr(1,3);return}a.tx=p.x;a.tz=p.z;a.state='walk';a.tv=rr(a.S.speed[0],a.S.speed[1])}

/* ---------- comportamiento ---------- */
let initT=0;
function think(a,dt,d){a.t-=dt;
  if(a.sp==='gato'&&d<3.5&&a.state!=='flee'&&!player.car){// el gato sale corriendo, alejándose del jugador
    const ax=a.x-player.x,az=a.z-player.z,L=Math.hypot(ax,az)||1;a.tx=a.x+ax/L*9;a.tz=a.z+az/L*9;a.state='flee';a.tv=a.S.run;a.t=2.5;return}
  if(a.sp==='perro'){a.bark-=dt;if(d<12&&a.bark<=0){a.bark=rr(8,20);if(C.tone&&!C.isMuted()){C.tone(210,.07,'square',.03);setTimeout(()=>C.tone(190,.08,'square',.03),140)}}}
  if(a.t>0)return;
  const r=Math.random();
  if(a.state==='walk'||a.state==='flee'){a.state=r<.45?'idle':r<.75?'sit':'lie';a.t=a.state==='lie'?rr(6,16):rr(2,6);a.tv=0}
  else newTarget(a,a.sp==='perro')}
function move(a,dt){const dx=a.tx-a.x,dz=a.tz-a.z,L=Math.hypot(dx,dz);
  if((a.state==='walk'||a.state==='flee')&&L>.3){a.v+=(a.tv-a.v)*Math.min(1,dt*4);const st=Math.min(L,a.v*dt),nx=a.x+dx/L*st,nz=a.z+dz/L*st;
    if(free(nx,nz)){a.x=nx;a.z=nz}else{a.state='idle';a.t=rr(.5,2);a.v=0}
    const want=Math.atan2(dx,dz);let df=((want-a.yaw+Math.PI)%TAU+TAU)%TAU-Math.PI;a.yaw+=df*Math.min(1,dt*6)}
  else{a.v*=Math.max(0,1-dt*6);if(L<=.3&&(a.state==='walk'||a.state==='flee')){a.t=0}}}

/* ---------- dibujar: cuerpo, cuatro patas que se mueven al caminar y la cola ---------- */
const M=new THREE.Matrix4(),T=new THREE.Matrix4(),R=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),V=new THREE.Vector3(),Sv=new THREE.Vector3();
function draw(a,now){const S=a.S,g=G[a.sp];const y=C.standY(a.x,a.z);const sit=a.state==='sit',lie=a.state==='lie';
  const pitch=sit?-.42:0,drop=lie?-(S.legs[0][1]*.78):sit?-.04:0;
  // cuerpo
  E.set(pitch,a.yaw,0,'YXZ');Q.setFromEuler(E);M.compose(V.set(a.x,y+drop*a.sc,a.z),Q,Sv.set(a.sc,a.sc,a.sc));
  if(sit){// sentado: el cuerpo gira sobre las patas de atrás
    const back=S.legs[2];T.makeTranslation(0,back[1],back[2]);const T2=new THREE.Matrix4().makeTranslation(0,-back[1],-back[2]);E.set(pitch,0,0);R.makeRotationFromEuler(E);
    Q.setFromEuler(E.set(0,a.yaw,0));M.compose(V.set(a.x,y,a.z),Q,Sv.set(a.sc,a.sc,a.sc));M.multiply(T).multiply(R).multiply(T2)}
  g.body.setMatrixAt(a.i,M);
  const sp=a.v,sw=Math.min(1,sp/1.2)*(.5+.2*Math.min(1,sp/3));const ph=now*(5+sp*2.4)+a.ph;
  S.legs.forEach((L,l)=>{let ang=Math.sin(ph+(l===0||l===3?0:Math.PI))*sw;
    if(lie)ang=l<2?-1.35:1.35;else if(sit)ang=l>=2?-1.25:.42;
    T.makeTranslation(L[0],L[1],L[2]);R.makeRotationX(ang);const LM=M.clone().multiply(T).multiply(R);g.legs.setMatrixAt(a.i*4+l,LM)});
  const wag=a.sp==='perro'?Math.sin(now*(a.state==='idle'?12:7)+a.ph)*.35:Math.sin(now*1.5+a.ph)*.25;
  T.makeTranslation(S.tailAt[0],S.tailAt[1],S.tailAt[2]);E.set(S.tailLift+(lie?.5:0),wag,0,'YXZ');R.makeRotationFromEuler(E);g.tail.setMatrixAt(a.i,M.clone().multiply(T).multiply(R))}

let last=performance.now();
function update(){const now=performance.now()/1000,dt=Math.min(.1,(now*1000-last)/1000);last=now*1000;
  if(!C.started||C.inside())return;
  initT-=dt;
  for(const a of A){if(!a.placed){if(initT<=0)place(a,true);if(!a.placed)continue}
    const d=Math.hypot(a.x-player.x,a.z-player.z);if(d>150){a.placed=false;place(a,false);continue}
    think(a,dt,d);move(a,dt);draw(a,now)}
  if(initT<=0)initT=1;
  for(const k in G)for(const m of Object.values(G[k]))m.instanceMatrix.needsUpdate=true}
// los no ubicados quedan escondidos bajo tierra hasta que tengan sitio
{const hide=new THREE.Matrix4().makeScale(0,0,0);for(const a of A){G[a.sp].body.setMatrixAt(a.i,hide);G[a.sp].tail.setMatrixAt(a.i,hide);for(let l=0;l<4;l++)G[a.sp].legs.setMatrixAt(a.i*4+l,hide)}}
return{update,A}};
