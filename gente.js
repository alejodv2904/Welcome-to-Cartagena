/* Personas realistas: modelos con esqueleto, ropa recoloreable por piezas y animaciones de captura de movimiento
   adaptadas (retarget) al esqueleto de cada modelo. */
window.GENTE=function(THREE,G){
'use strict';
const TAU=Math.PI*2;
const strip=n=>n.replace(/^mixamorig:?/,'');
// parts: 0 skin, 1 top, 2 bottom, 3 shoes, 4 hat/glasses, 5 hair, 6 eyes/teeth (never tinted), 7 beard
const NP=8;

/* ---------- animation retarget (world-space rotation deltas, so rest poses may differ) ---------- */
function bonesOf(root){const m={};root.traverse(o=>{const n=strip(o.name);if(n&&!m[n]&&o!==root)m[n]=o});return m}
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_m=new THREE.Matrix4();
function restState(root){root.updateMatrixWorld(true);const s=new Map();root.traverse(o=>{s.set(o,{q:o.quaternion.clone(),p:o.position.clone(),wq:o.getWorldQuaternion(new THREE.Quaternion()),wp:o.getWorldPosition(new THREE.Vector3())})});return s}
function retarget(src,clip,tgt,fps){fps=fps||30;
  const srcRest=restState(src.scene),tgtRest=restState(tgt.scene);
  const sb=bonesOf(src.scene),tb=bonesOf(tgt.scene);
  const order=[];tgt.hips.traverse(o=>order.push(o));
  const mixer=new THREE.AnimationMixer(src.scene);const act=mixer.clipAction(clip);act.play();
  const n=Math.max(2,Math.round(clip.duration*fps)+1),times=new Float32Array(n);
  const vals=new Map();order.forEach(o=>vals.set(o,new Float32Array(n*4)));const hipP=new Float32Array(n*3);
  const sH=sb.Hips,tH=tgt.hips;const sr=srcRest.get(sH).wp,tr=tgtRest.get(tH).wp;const k=tr.y/Math.max(1e-3,sr.y);
  // the capture rig may face another way than the model: R turns source world space into target world space
  const tb0=bonesOf(tgt.scene);const lr=(b,st)=>{const a=st.get(b.LeftUpLeg).wp.clone().sub(st.get(b.RightUpLeg).wp);a.y=0;return a.normalize()};
  const R=new THREE.Quaternion().setFromUnitVectors(lr(sb,srcRest),lr(tb0,tgtRest));if(Math.abs(R.w)<1e-4&&Math.abs(R.y)<1e-4)R.set(0,1,0,0);const Ri=R.clone().invert();
  // first bend the target's rest pose so every bone points like the source's rest pose (A-pose vs T-pose)
  const AL=new Map(),primary=o=>o.children.find(c=>sb[strip(c.name)]);
  for(const o of order){const pa=AL.get(o.parent)||tgtRest.get(o.parent).wq;const cand=pa.clone().multiply(tgtRest.get(o).q);const s=sb[strip(o.name)],c=primary(o);
    if(s&&c&&o!==tH){const sc=sb[strip(c.name)];const ds=srcRest.get(sc).wp.clone().sub(srcRest.get(s).wp).applyQuaternion(R);const dt=c.position.clone().applyQuaternion(cand);
      if(ds.lengthSq()>1e-10&&dt.lengthSq()>1e-10){const sw=new THREE.Quaternion().setFromUnitVectors(dt.normalize(),ds.normalize());cand.premultiply(sw)}}
    AL.set(o,cand)}
  const W=new Map();
  for(let f=0;f<n;f++){const t=Math.min(clip.duration,f/fps);times[f]=t;mixer.setTime(t);src.scene.updateMatrixWorld(true);
    for(const o of order){const name=strip(o.name),s=sb[name];const tr0=tgtRest.get(o);const parentW=W.get(o.parent)||tgtRest.get(o.parent).wq;let wq;
      if(s){const sr0=srcRest.get(s);s.getWorldQuaternion(_q);_q2.copy(sr0.wq).invert();_q.multiply(_q2);wq=R.clone().multiply(_q).multiply(Ri).multiply(AL.get(o))}
      else wq=parentW.clone().multiply(tr0.q);
      W.set(o,wq);const lq=parentW.clone().invert().multiply(wq);vals.get(o).set([lq.x,lq.y,lq.z,lq.w],f*4)}
    // hips translation, scaled to the target's leg length
    sH.getWorldPosition(_v);_v.sub(sr).applyQuaternion(R).multiplyScalar(k).add(tr);_m.copy(tH.parent.matrixWorld).invert();_v.applyMatrix4(_m);hipP.set([_v.x,_v.y,_v.z],f*3);W.delete(null)}
  act.stop();mixer.uncacheRoot(src.scene);
  // restore source rest pose
  for(const [o,r] of srcRest){o.quaternion.copy(r.q);o.position.copy(r.p)}src.scene.updateMatrixWorld(true);
  const tracks=[];for(const o of order){const v=vals.get(o);for(let f=1;f<n;f++){const a=(f-1)*4,b=f*4;if(v[a]*v[b]+v[a+1]*v[b+1]+v[a+2]*v[b+2]+v[a+3]*v[b+3]<0)for(let c=0;c<4;c++)v[b+c]*=-1}
    tracks.push(new THREE.QuaternionKeyframeTrack(o.name+'.quaternion',times,v))}
  tracks.push(new THREE.VectorKeyframeTrack(tH.name+'.position',times,hipP));
  return new THREE.AnimationClip(clip.name,clip.duration,tracks)}

/* ---------- cuerpos construidos por código (cuerpos.js): hombre y mujer con esqueleto completo y ropa en piezas ---------- */
const CB=window.CUERPOS(THREE);
const WHITE=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);WHITE.needsUpdate=true;
// tejido: ruido fino de hilos que se repite sobre toda la ropa, para que la tela no se vea plana
const WEAVE=(function(){const S=64,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');const d=g.createImageData(S,S);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*4;const v=128+(((x+y)%4<2)?18:-18)+((x%2)?10:-10)+(Math.random()*44-22);d.data[i]=d.data[i+1]=d.data[i+2]=Math.max(0,Math.min(255,v));d.data[i+3]=255}g.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
const col=(c)=>new THREE.Color(c);
const models={};
for(const k of ['m','f']){const rig=CB.makeRig(k);models[k]={kind:k,rig,clips:{},tgt:{scene:rig.root,hips:rig.bones.Hips}}}
// clips: caminar/correr/quieto de una captura, gestos de conversación de otra; se adaptan al esqueleto de cada modelo
const srcA={scene:G.animA.scene},srcB={scene:G.animB.scene};
const findClip=(g,n)=>g.animations.find(a=>a.name===n);
for(const k in models){const M=models[k],tgt=M.tgt;
  M.clips.idle=retarget(srcA,findClip(G.animA,'Idle'),tgt);M.clips.walk=retarget(srcA,findClip(G.animA,'Walk'),tgt);M.clips.run=retarget(srcA,findClip(G.animA,'Run'),tgt);
  M.clips.idle2=retarget(srcB,findClip(G.animB,'idle'),tgt);M.clips.agree=retarget(srcB,findClip(G.animB,'agree'),tgt);M.clips.shake=retarget(srcB,findClip(G.animB,'headShake'),tgt)}
/* ---------- rostro original: la cabeza, los ojos y los dientes de los modelos de antes (con su textura de cara), enganchados al esqueleto nuevo ---------- */
function avgColor(img){const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d');g.drawImage(img,0,0,8,8);const d=g.getImageData(0,0,8,8).data;let r=0,gg=0,b=0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<10)continue;r+=d[i];gg+=d[i+1];b+=d[i+2];n++}return[r/n,gg/n,b/n]}
function nameToIdx(n){n=strip(n);if(/shoulder|arm|hand/i.test(n))return CB.IDX.Spine2;if(n in CB.IDX)return CB.IDX[n];return /eye|jaw|head|teeth/i.test(n)?CB.IDX.Head:CB.IDX.Neck}
function faceGeo(mesh,sc,keepTri,kind,fm){const g=mesh.geometry.clone();g.morphAttributes={};const P=g.attributes.position;for(let i=0;i<P.count;i++){let x=P.getX(i)*sc,y=P.getY(i)*sc,z=P.getZ(i)*sc;if(fm){x*=fm[0];z*=fm[1];y=(y-1.585)*fm[2]+1.505}P.setXYZ(i,x,y,z)}
  // pesos propios: del cuello hacia arriba la cabeza se mueve rígida (los pesos originales apuntan a huesos que el esqueleto nuevo no tiene)
  const nw=CB.neckW(kind),SI=new Uint16Array(P.count*4),SW=new Float32Array(P.count*4);
  for(let i=0;i<P.count;i++){const w=nw(P.getY(i));for(let j=0;j<Math.min(4,w.length);j++){SI[i*4+j]=w[j][0];SW[i*4+j]=w[j][1]}let t=0;for(let j=0;j<4;j++)t+=SW[i*4+j];if(t<=0){SI[i*4]=CB.IDX.Head;SW[i*4]=1;t=1}for(let j=0;j<4;j++)SW[i*4+j]/=t}
  g.setAttribute('skinIndex',new THREE.BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(SW,4));
  if(keepTri&&g.index){const I=g.index.array,out=[];for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],c=I[t+2];const cx=(P.getX(a)+P.getX(b)+P.getX(c))/3,cy=(P.getY(a)+P.getY(b)+P.getY(c))/3;if(keepTri(cx,cy,g.attributes.uv.getX(a),g.attributes.uv.getY(a),t))out.push(a,b,c)}g.setIndex(out)}
  g.computeBoundingSphere();g.boundingSphere.radius*=2;return g}
// quita de la cabeza de la mujer los audífonos y las gafas (son piezas sueltas de la malla): se separan por islas de triángulos
function dropAccessories(g){const P=g.attributes.position,I=g.index.array;const key=new Map(),par=[];const find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
  const vid=new Array(P.count);for(let i=0;i<P.count;i++){const k=Math.round(P.getX(i)*1000)+','+Math.round(P.getY(i)*1000)+','+Math.round(P.getZ(i)*1000);if(!key.has(k)){key.set(k,par.length);par.push(par.length)}vid[i]=key.get(k)}
  for(let i=0;i<I.length;i+=3){const a=find(vid[I[i]]);par[find(vid[I[i+1]])]=a;par[find(vid[I[i+2]])]=a}
  const comp=new Map();for(let t=0;t<I.length;t+=3){const r=find(vid[I[t]]);let c=comp.get(r);if(!c){c={n:0,mn:[9,9,9],mx:[-9,-9,-9]};comp.set(r,c)}c.n++;for(let k=0;k<3;k++){const j=I[t+k];const v=[P.getX(j),P.getY(j),P.getZ(j)];for(let q=0;q<3;q++){c.mn[q]=Math.min(c.mn[q],v[q]);c.mx[q]=Math.max(c.mx[q],v[q])}}}
  const bad=new Set();for(const [r,c] of comp){if(c.mx[0]-c.mn[0]>.2||c.mn[0]>.105||c.mx[0]<-.105||(c.n<=80&&c.mn[1]>1.4&&c.mx[2]>.045))bad.add(r)}
  const out=[];for(let t=0;t<I.length;t+=3)if(!bad.has(find(vid[I[t]])))out.push(I[t],I[t+1],I[t+2]);g.setIndex(out)}
const FACE={};
{const sm=G.hombre.scene,get=n=>{let r=null;sm.traverse(o=>{if(o.isSkinnedMesh&&o.name===n)r=o});return r};
  const head=get('Wolf3D_Head'),sc=1.78/1.83;const F={parts:[],sc};
  F.avg=avgColor(head.material.map.image);F.parts.push({geo:faceGeo(head,sc,null,'m'),map:head.material.map,skin:true,cls:false});
  for(const n of ['EyeLeft','EyeRight','Wolf3D_Teeth']){const m=get(n);if(m)F.parts.push({geo:faceGeo(m,sc,null,'m'),map:m.material.map,color:m.material.color,skin:false})}
  FACE.m=F;
  // la mujer usa la misma cabeza natural del hombre (con su textura), un poco más pequeña y fina; sin barba
  const FF={parts:[],sc,avg:F.avg};const FM=[.9,.92,.93];
  FF.parts.push({geo:faceGeo(head,sc,null,'f',FM),map:head.material.map,skin:true,cls:false});
  for(const n of ['EyeLeft','EyeRight','Wolf3D_Teeth']){const m=get(n);if(m)FF.parts.push({geo:faceGeo(m,sc,null,'f',FM),map:m.material.map,color:m.material.color,skin:false})}
  FACE.f=FF}
// cara de mujer lisa: piel del tono de cada persona con cejas, ojos y labios sencillos (la textura original era una máscara con gafas)
const FTEX={};
function femFaceTex(hex){if(FTEX[hex])return FTEX[hex];const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');const sk=new THREE.Color(hex);const rgb=(c,k)=>'rgb('+[c.r,c.g,c.b].map(v=>Math.round(Math.min(1,v*k)*255)).join(',')+')';
  g.fillStyle=rgb(sk,1);g.fillRect(0,0,S,S);
  const X=x=>(x+.1)/.2*S,Y=y=>(1.6-y)/.27*S,R=r=>r/.2*S;
  const lip=new THREE.Color(sk).lerp(new THREE.Color('#a8505a'),.5);
  g.fillStyle='rgba(0,0,0,.12)';for(const sd of [1,-1]){g.beginPath();g.ellipse(X(sd*.034),Y(1.462),R(.019),R(.011),0,0,TAU);g.fill()}// sombra del párpado
  for(const sd of [1,-1]){const cx=X(sd*.034),cy=Y(1.457);g.fillStyle='#f3eee6';g.beginPath();g.ellipse(cx,cy,R(.0135),R(.0075),0,0,TAU);g.fill();
    g.fillStyle='#3a281c';g.beginPath();g.arc(cx,cy,R(.0068),0,TAU);g.fill();g.fillStyle='#0c0806';g.beginPath();g.arc(cx,cy,R(.0033),0,TAU);g.fill();
    g.strokeStyle='#1c120c';g.lineWidth=2;g.beginPath();g.ellipse(cx,cy,R(.0138),R(.0078),0,Math.PI*1.05,Math.PI*1.95);g.stroke();
    g.strokeStyle='#2a1a12';g.lineWidth=2.4;g.beginPath();g.moveTo(X(sd*.016),Y(1.492));g.quadraticCurveTo(X(sd*.036),Y(1.503),X(sd*.054),Y(1.49));g.stroke()}
  g.fillStyle=rgb(lip,1);g.beginPath();g.ellipse(X(0),Y(1.3785),R(.0205),R(.0042),0,0,TAU);g.fill();g.fillStyle=rgb(lip,1.1);g.beginPath();g.ellipse(X(0),Y(1.3705),R(.0165),R(.0045),0,0,TAU);g.fill();
  g.strokeStyle='rgba(40,12,12,.7)';g.lineWidth=1.4;g.beginPath();g.moveTo(X(-.019),Y(1.3745));g.lineTo(X(.019),Y(1.3745));g.stroke();
  g.fillStyle='rgba(0,0,0,.35)';for(const sd of [1,-1]){g.beginPath();g.ellipse(X(sd*.0085),Y(1.4135),R(.0028),R(.0018),0,0,TAU);g.fill()}
  const t=new THREE.CanvasTexture(cv);t.flipY=false;t.anisotropy=4;FTEX[hex]=t;return t}
function faceMat(part,ratio){if(part.plain)return new THREE.MeshPhongMaterial({map:femFaceTex(ratio),skinning:true,shininess:14,specular:0x1c1a18});if(false)return new THREE.MeshPhongMaterial({color:0xaaaaaa,skinning:true});const m=part.skin?new THREE.MeshPhongMaterial({map:part.map,skinning:true,shininess:14,specular:0x1c1a18}):new THREE.MeshLambertMaterial({map:part.map,skinning:true});
  if(part.skin){const R=ratio,cls=part.cls;m.onBeforeCompile=s=>{s.uniforms.uSkinR={value:R};s.fragmentShader='uniform vec3 uSkinR;\n'+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+(cls?`vec3 cs=pow(max(diffuseColor.rgb,vec3(0.0)),vec3(0.4545));float mx=max(cs.r,max(cs.g,cs.b)),mn=min(cs.r,min(cs.g,cs.b));float sat=mx>0.0?(mx-mn)/mx:0.0;float hh=0.0;
      if(mx>mn){if(mx==cs.r)hh=mod((cs.g-cs.b)/(mx-mn),6.0);else if(mx==cs.g)hh=(cs.b-cs.r)/(mx-mn)+2.0;else hh=(cs.r-cs.g)/(mx-mn)+4.0;hh*=60.0;}
      if(hh>8.0&&hh<40.0&&sat>0.22&&sat<0.8&&mx>0.31&&mx<0.84)diffuseColor.rgb*=uSkinR;`:'diffuseColor.rgb*=uSkinR;'))};m.customProgramCacheKey=()=>'cara'+(cls?'f':'m')}
  return m}
/* ---------- material: un color por pieza (piel, camiseta, pantalón, zapatos...) y estampados ---------- */
const NPART=10;
function makeMaterial(cols,X){const m=new THREE.MeshPhongMaterial({vertexColors:true,skinning:true,shininess:14,specular:0x1c1a18});
  const U={pcA:{value:cols},uPat:{value:X.pat||WHITE},uPatOn:{value:X.pat?1:0},uPatB:{value:X.patB||WHITE},uPatBOn:{value:X.patB?1:0},uWeave:{value:WEAVE},uJersey:{value:X.jersey?1:0},uJk:{value:new THREE.Vector2(X.kx||1,X.ty||1.49)}};m.userData.U=U;
  m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
    s.vertexShader='attribute float aPart;varying float vPart;varying vec3 vPC;varying vec3 vBind;varying vec2 vUv2;uniform vec3 pcA['+NPART+'];\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBind=position;vUv2=uv;vPart=aPart;vPC=pcA[int(aPart+0.5)];');
    s.fragmentShader='uniform sampler2D uPat,uPatB,uWeave;uniform float uPatOn,uPatBOn,uJersey;uniform vec2 uJk;varying float vPart;varying vec3 vPC;varying vec3 vBind;varying vec2 vUv2;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float pid=vPart+0.02;diffuseColor.rgb*=vPC;
    bool cloth=(pid>0.5&&pid<2.5)||(pid>7.5&&pid<8.5);
    if(uPatOn>0.5&&pid>0.5&&pid<1.5)diffuseColor.rgb=texture2D(uPat,vUv2*7.0).rgb*(0.55+0.45*vColor.r);
    else if(uPatBOn>0.5&&pid>1.5&&pid<2.5)diffuseColor.rgb=texture2D(uPatB,vUv2*6.0).rgb;
    if(uJersey>0.5&&pid>0.5&&pid<1.5){float ax=abs(vBind.x),ay=vBind.y;vec3 bl=vec3(0.0,0.22,0.58),rd=vec3(0.81,0.07,0.15);
      if(ay>uJk.y-0.03)diffuseColor.rgb=bl;
      else if(ay>uJk.y-0.1&&ax>0.115*uJk.x&&abs(vBind.z)<0.034)diffuseColor.rgb=abs(vBind.z)<0.014?rd:bl;
      if(ax>0.285*uJk.x&&ay<uJk.y-0.1&&ay>uJk.y-0.19)diffuseColor.rgb=bl;
      if(vBind.z>0.04){vec2 d=vec2(vBind.x-0.095*uJk.x,vBind.y-(uJk.y-0.22));float r=length(d);if(r<0.036)diffuseColor.rgb=r<0.012?bl:(r<0.026?vec3(0.99,0.82,0.09):rd);}}
    if(cloth)diffuseColor.rgb*=0.9+0.2*texture2D(uWeave,vUv2*28.0).r;`)};
  m.customProgramCacheKey=()=>'cuerpo1';return m}
/* ---------- ropa a partir de los datos de la persona ---------- */
const GEO=new Map();
function outfit(sp,kind){const f=kind==='f',ky=CB.SC[kind].y;let top='tee',neck='crew';
  if(sp.suit)top=(sp.hem!==undefined&&sp.hem>.95)?'shirt':'jacket';else if(sp.topReg==='guaya'||sp.sleeve===0&&sp.top&&!sp.jersey&&!sp.pat)top='shirt';
  if(sp.jersey)neck='v';else if(sp.fem===2||sp.topReg==='blouse')neck='scoop';
  let sleeve=sp.sleeve===undefined?1:sp.sleeve;if(sp.fem===2)sleeve=2;
  const skirt=sp.skirt&&sp.skirtReg!=='skirt'?'skirt-'+(sp.skirt==='long'?'long':'short'):null;
  const hem=sp.hem!==undefined?sp.hem*ky:(skirt?1.08*ky:undefined);const effHem=hem!==undefined?hem:(f?.9:.86);
  const bottom=skirt||(sp.noBottom||sp.fem===2?null:(sp.shorts?'shorts':'long'));
  return{top,neck,sleeve,hem,bottom,belt:!!sp.belt&&!f&&effHem>.98*ky&&!!bottom,shoes:true}}
/* ---------- cabello, barba ---------- */
const HAIRTEX={};function hairTex(c){if(HAIRTEX[c])return HAIRTEX[c];const S=64,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');g.fillStyle=c;g.fillRect(0,0,S,S);
  for(let i=0;i<900;i++){const v=Math.random();g.fillStyle=v<.5?'rgba(0,0,0,.35)':'rgba(255,255,255,.08)';g.fillRect(Math.random()*S,Math.random()*S,1,1+Math.random()*2)}const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,2);HAIRTEX[c]=t;return t}
// el pelo se calcula sobre la propia cabeza: una cáscara que sigue su forma exacta, más piezas (melena, moño, cola) ancladas a sus medidas
const HSH={};
function headStats(kind){if(HSH[kind])return HSH[kind];const g=FACE[kind].parts[0].geo,P=g.attributes.position;let top=-9;for(let i=0;i<P.count;i++)top=Math.max(top,P.getY(i));
  let rx=0,zmin=9,zmax=-9;for(let i=0;i<P.count;i++){const y=P.getY(i);if(y>top-.17&&y<top-.05){rx=Math.max(rx,Math.abs(P.getX(i)));zmin=Math.min(zmin,P.getZ(i));zmax=Math.max(zmax,P.getZ(i))}}
  return HSH[kind]={top,rx,zc:(zmin+zmax)/2,rz:(zmax-zmin)/2,cy:top-.1}}
function hairShell(kind,thick,front,side,back,fluff){const g=FACE[kind].parts[0].geo,P=g.attributes.position,I=g.index.array,H=headStats(kind);
  const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
  const tc=(x,y,z)=>{const a=Math.max(-1,Math.min(1,(z-H.zc)/H.rz));const b=sm(.2,.9,Math.abs(x)/H.rx);let t=front+(back-front)*sm(.1,-.9,a);t=t+(side-t)*b*sm(.3,-.2,a)*0+((Math.min(t,side)-t)*b);return t};
  const pos=[],uv=[],idx=[],map=new Map();
  const vtx=i=>{if(map.has(i))return map.get(i);const x=P.getX(i),y=P.getY(i),z=P.getZ(i);let dx=x,dy=(y-H.cy)*.85,dz=z-H.zc;const l=Math.hypot(dx,dy,dz)||1;const k=thick+(fluff||0)*sm(0,.1,H.top-y)*.0;
    const n=pos.length/3;pos.push(x+dx/l*k,y+dy/l*k,z+dz/l*k);uv.push(x*9,z*9+y*3);map.set(i,n);return n};
  for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],c=I[t+2];const cx=(P.getX(a)+P.getX(b)+P.getX(c))/3,cy=(P.getY(a)+P.getY(b)+P.getY(c))/3,cz=(P.getZ(a)+P.getZ(b)+P.getZ(c))/3;
    if(H.top-cy<tc(cx,cy,cz)&&cy>H.top-.3)idx.push(vtx(a),vtx(b),vtx(c))}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));out.setIndex(idx);out.computeVertexNormals();return out}
function makeHair(root,bones,kind,hair,beard,hairC,out){const H=headStats(kind);
  const rp=CB.restPos(kind).Head;const holder=new THREE.Group();holder.position.set(-rp[0],-rp[1],-rp[2]);bones.Head.add(holder);
  const mat=new THREE.MeshLambertMaterial({map:hairTex(hair&&hair.c||hairC||'#1b1310'),color:'#ffffff',side:THREE.DoubleSide});
  const put=(geo,x,y,z,sx,sy,sz,rx)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx||1,sy||1,sz||1);m.rotation.x=rx||0;m.castShadow=true;holder.add(m);out.props.push(m);return m};
  const sph=new THREE.SphereGeometry(1,16,12);const f=kind==='f',cx=0,cz=H.zc;
  if(hair){const st=hair.style||'short';
    if(st==='afro'&&!f){put(new THREE.SphereGeometry(1,26,16,0,TAU,0,Math.PI*.53),0,H.cy+.03,cz-.03,H.rx*1.42,(H.top-H.cy)*1.5,H.rz*1.3,-.12);}
    else if(st==='afro'){put(hairShell(kind,.009,.072,.115,.16),0,0,0);put(sph,H.rx*.95,H.top-.0,cz-.02,.07,.07,.07);put(sph,-H.rx*.95,H.top-.0,cz-.02,.07,.07,.07)}
    else if(st!=='none'){
      const shell=st==='short'?hairShell(kind,.01,.072,.115,.17):hairShell(kind,.009,.075,.125,.22);
      put(shell,0,0,0);
      if(st==='bun'){put(sph,0,H.top-.01,cz-H.rz*.72,.056,.05,.056)}
      if(st==='bunLow'){put(sph,0,H.top-.12,cz-H.rz*1.02,.056,.05,.054)}
      if(st==='ponytail'){put(new THREE.CylinderGeometry(.03,.02,.24,8),0,H.top-.13,cz-H.rz*1.05,1,1,1,.45)}
      if(st==='long'){const ln=new THREE.CylinderGeometry(1,.85,1,22,1,true,Math.PI-.62*Math.PI,1.24*Math.PI);put(ln,0,H.top-.3,cz-H.rz*.05,H.rx*1.12,.48,H.rz*1.08)}
      }
    if(f&&st==='afro'){}}
  if(beard&&!f){const bg=new THREE.SphereGeometry(1,18,10,0,TAU,Math.PI*.64,Math.PI*.36);put(bg,0,H.cy-.035,cz+.006,H.rx*.97,(H.top-H.cy)*1.05,H.rz*.97);}
  return out.props[0]||null}
/* ---------- instancias ---------- */
function create(sp){const kind=sp.model||'m';const M=models[kind];const O=outfit(sp,kind);const key=kind+JSON.stringify(O);let geo=GEO.get(key);if(!geo){geo=CB.build(kind,O);GEO.set(key,geo)}
  const rig=CB.makeRig(kind),root=rig.root,bones=rig.bones;const skel=new THREE.Skeleton(rig.list,rig.inv);
  const sk=col(sp.skin||'#8d5a3b');const hairC=sp.hairC||'#1b1310';
  const cols=[sk,col(sp.top||'#ffffff'),col(sp.bottom||'#333333'),col(sp.shoes||'#222222'),col(sp.hatC||'#e9dcb0'),col(hairC),col('#ffffff'),col(hairC),col(sp.shirtC||'#f4f2ee'),col(sp.beltC||'#3b2416')];
  const mat=makeMaterial(cols,{pat:sp.pat,patB:sp.patB,jersey:sp.jersey,kx:CB.SC[kind].x,ty:1.49*CB.SC[kind].y});
  const mesh=new THREE.SkinnedMesh(geo,mat);mesh.name='cuerpo';root.add(mesh);root.updateMatrixWorld(true);mesh.bind(skel,new THREE.Matrix4());mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=true;
  {const F=FACE[kind],sa=F.avg,ratio=new THREE.Color(sk.r*255/sa[0]*1.1,sk.g*255/sa[1]*1.1,sk.b*255/sa[2]*1.1);
    for(const part of F.parts){const fm=new THREE.SkinnedMesh(part.geo,faceMat(part,part.plain?(sp.skin||'#8d5a3b'):ratio));fm.name='cara';root.add(fm);fm.frustumCulled=true;fm.bind(skel,new THREE.Matrix4())}}
  const mixer=new THREE.AnimationMixer(root);const A={};for(const k in M.clips){A[k]=mixer.clipAction(M.clips[k]);A[k].play();A[k].setEffectiveWeight(0)}
  A.idle.setEffectiveWeight(1);
  const g=new THREE.Group();g.add(root);const s=sp.scale||1;root.scale.multiplyScalar(s);
  const rest={};for(const n in bones)rest[n]=bones[n].quaternion.clone();
  const ch0={props:[]};const hm=makeHair(root,bones,kind,sp.hair,!!sp.beard&&kind==='m',hairC,ch0);
  return{mesh:g,root,skin:mesh,mixer,A,bones,rest,sp,model:kind,hairMesh:hm,phase:Math.random()*10,talk:0,talkT:0,w:{idle:1,walk:0,run:0},props:[]}}


/* ---------- sombras solo para la gente cercana: cada persona animada pesa unos 16.000 triángulos y la sombra la dibuja otra vez ---------- */
const SHC={x:0,z:0,d2:Infinity};
function setShadowCenter(x,z,d){SHC.x=x;SHC.z=z;SHC.d2=d*d}
function shadowByDistance(ch){const e=ch.skin.matrixWorld.elements,dx=e[12]-SHC.x,dz=e[14]-SHC.z;const on=dx*dx+dz*dz<SHC.d2;
  if(ch.skin.castShadow!==on){ch.skin.castShadow=on;if(ch.hairMesh)ch.hairMesh.castShadow=on}}
/* ---------- pose overrides on top of the captured motion: aim bones along directions in character space ---------- */
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_pw=new THREE.Quaternion(),_mq=new THREE.Quaternion(),_sw=new THREE.Quaternion();
function aim(ch,name,x,y,z,blend){const b=ch.bones[name];if(!b)return;const c=b.children.find(o=>o.isBone);if(!c)return;
  b.updateMatrixWorld(true);b.getWorldPosition(_a);c.getWorldPosition(_b);_b.sub(_a).normalize();
  ch.mesh.getWorldQuaternion(_mq);const want=new THREE.Vector3(x,y,z).normalize().applyQuaternion(_mq);
  _sw.setFromUnitVectors(_b,want);if(blend!==undefined&&blend<1)_sw.slerp(new THREE.Quaternion(),1-blend);
  b.parent.getWorldQuaternion(_pw);const inv=_pw.clone().invert();b.quaternion.premultiply(inv.multiply(_sw).multiply(_pw));b.updateMatrixWorld(true)}
const POSES={
  sit(ch){// seated: thighs forward, shins down, hands forward on a wheel / handlebar
    aim(ch,'LeftUpLeg',.12,-.12,1);aim(ch,'RightUpLeg',-.12,-.12,1);aim(ch,'LeftLeg',.02,-1,.25);aim(ch,'RightLeg',-.02,-1,.25);
    aim(ch,'LeftArm',.22,-.55,.8);aim(ch,'RightArm',-.22,-.55,.8);aim(ch,'LeftForeArm',-.25,.15,1);aim(ch,'RightForeArm',.25,.15,1)},
  car(ch){// seated in a car: knees up and shins forward under the dashboard, so the feet stay inside the floor
    aim(ch,'LeftUpLeg',.1,.12,1);aim(ch,'RightUpLeg',-.1,.12,1);aim(ch,'LeftLeg',.02,-.42,.9);aim(ch,'RightLeg',-.02,-.42,.9);
    aim(ch,'LeftArm',.22,-.5,.8);aim(ch,'RightArm',-.22,-.5,.8);aim(ch,'LeftForeArm',-.25,.2,1);aim(ch,'RightForeArm',.25,.2,1)},
  bowl(ch){aim(ch,'RightArm',-.3,.95,.05,.9);aim(ch,'RightForeArm',.75,.55,0,.9)},
  hips(ch){aim(ch,'LeftArm',.6,-.75,-.12,.9);aim(ch,'RightArm',-.6,-.75,-.12,.9);aim(ch,'LeftForeArm',-.75,-.35,.45,.9);aim(ch,'RightForeArm',.75,-.35,.45,.9)},
  wave(ch,t){aim(ch,'RightArm',-.55,.8,.2,.95);aim(ch,'RightForeArm',-.15+Math.sin(t*8)*.45,1,.25,.95)},
  cooler(ch){},
  // agente de tránsito dirigiendo: un brazo extendido (pare) y el otro haciendo señas para que pasen
  traffic(ch,t){const s=Math.sin(t*2.6);aim(ch,'RightArm',-1,.08,.12,.95);aim(ch,'RightForeArm',-.85,.5,.1,.95);aim(ch,'LeftArm',.45,.05+.12*s,.88,.95);aim(ch,'LeftForeArm',.05-.8*Math.max(0,s),.25,1,.95)},
};
// blend idle / walk / run by speed (m/s); clips are time-scaled so the feet match the ground speed
function animate(ch,speed,dt,pose,far){const A=ch.A,t=(ch.clock=(ch.clock||0)+dt);
  shadowByDistance(ch);
  if(pose==='sit'||pose==='car'){for(const k in A)A[k].setEffectiveWeight(k==='idle2'?1:0);ch.mixer.update(dt);POSES[pose](ch);return}
  const walkW=Math.min(1,Math.max(0,(speed-.15)/.9)),runW=Math.min(1,Math.max(0,(speed-2.6)/2));
  const wi=1-walkW,ww=walkW*(1-runW),wr=walkW*runW;
  // standing people sometimes gesture as if chatting
  ch.talkT-=dt;if(ch.talkT<=0){ch.talkT=3+Math.random()*7;ch.talk=pose==='talk'||pose===''&&speed<.1&&Math.random()<.35?(Math.random()<.5?1:2):0}
  const tk=ch.talk&&wi>.9?1:0;ch.w.tk=(ch.w.tk||0)+(tk-(ch.w.tk||0))*Math.min(1,dt*3);
  A.idle.setEffectiveWeight(wi*(1-ch.w.tk)*(ch.sp.model==='f'?.4:.7));A.idle2.setEffectiveWeight(wi*(1-ch.w.tk)*(ch.sp.model==='f'?.6:.3));
  A.agree.setEffectiveWeight(ch.talk===1?wi*ch.w.tk:0);A.shake.setEffectiveWeight(ch.talk===2?wi*ch.w.tk:0);
  A.walk.setEffectiveWeight(ww);A.run.setEffectiveWeight(wr);
  const ws=speed/1.35,rs=speed/5.2;A.walk.timeScale=Math.max(.5,ws);A.run.timeScale=Math.max(.6,rs);
  // keep run in phase with walk
  if(wr>0&&ww>0){const p=A.walk.time/A.walk.getClip().duration;A.run.time=p*A.run.getClip().duration}
  ch.mixer.update(far?dt:dt);
  const P=POSES[pose];if(P)P(ch,t)}

/* ---------- props attached to bones (metres, in the bone's frame scaled back to world size) ---------- */
// attach at a point given in character space (metres, bind pose); the holder keeps the character's axes
function attachAt(ch,boneName,obj,X,Y,Z){const b=ch.bones[boneName];if(!b)return;ch.mesh.updateMatrixWorld(true);const holder=new THREE.Group();b.add(holder);
  const desired=new THREE.Matrix4().multiplyMatrices(ch.mesh.matrixWorld,new THREE.Matrix4().makeTranslation(X,Y,Z));const local=new THREE.Matrix4().copy(b.matrixWorld).invert().multiply(desired);
  local.decompose(holder.position,holder.quaternion,holder.scale);holder.add(obj);ch.props.push(obj);return obj}
function attach(ch,boneName,obj,x,y,z,rx,ry,rz){const b=ch.bones[boneName];if(!b)return;ch.root.updateMatrixWorld(true);const ws=b.getWorldScale(new THREE.Vector3()).x/ch.root.scale.x;
  const holder=new THREE.Group();holder.scale.setScalar(1/ws);b.add(holder);obj.position.set(x,y,z);obj.rotation.set(rx||0,ry||0,rz||0);holder.add(obj);ch.props.push(obj);return obj}

return{create,animate,attach,attachAt,models,POSES,aim,setShadowCenter}};
