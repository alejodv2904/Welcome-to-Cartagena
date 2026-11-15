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
/* ---------- rostro: la cabeza, los ojos y los dientes del modelo de antes (con su textura de cara), enganchados al esqueleto nuevo ---------- */
// medidas de la cabeza original (metros, sin escalar): ojos y=1.730, boca 1.658, mentón 1.61, cejas 1.745, coronilla 1.846, orejas |x|>.079 entre 1.68 y 1.74; centro del cráneo z=.02
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const HSC=1.78/1.83,FM=[.9,.92,.93];
// la mujer: mandíbula y mentón más finos, ceja y nariz más suaves; luego más pequeña que la del hombre
function femMorph(x,y,z){const lo=smooth(1.71,1.6,y);x*=1-.12*lo;z-=.007*lo*smooth(.05,.12,z);
  z-=.004*Math.exp(-Math.pow((y-1.75)/.012,2))*smooth(.09,.12,z);
  const nz=smooth(.122,.142,z)*Math.exp(-Math.pow((y-1.7)/.025,2));z-=(z-.122)*.35*nz;return[x,y,z]}
function toBody(x,y,z,kind){if(kind==='f'){[x,y,z]=femMorph(x,y,z)}x*=HSC;y*=HSC;z*=HSC;if(kind==='f'){x*=FM[0];z*=FM[1];y=(y-1.585)*FM[2]+1.505}return[x,y,z]}
function faceGeo(mesh,kind,neck){const g=mesh.geometry.clone();g.morphAttributes={};const P=g.attributes.position;const raw=new Float32Array(P.count*3);
  for(let i=0;i<P.count;i++){let x=P.getX(i),y=P.getY(i),z=P.getZ(i);
    // la base del cuello de la cabeza trae solapas anchas que se salían por el cuello de la camiseta: se recogen al grueso del cuello
    if(neck&&y<1.578){const r=Math.hypot(x,z+.006),rm=.056;if(r>rm){const k=1-smooth(1.578,1.548,y)*(1-rm/r);x*=k;z=-.006+(z+.006)*k}}raw[i*3]=x;raw[i*3+1]=y;raw[i*3+2]=z;const q=toBody(x,y,z,kind);P.setXYZ(i,q[0],q[1],q[2])}
  // pesos propios: del cuello hacia arriba la cabeza se mueve rígida (los pesos originales apuntan a huesos que el esqueleto nuevo no tiene)
  const nw=CB.neckW(kind),SI=new Uint16Array(P.count*4),SW=new Float32Array(P.count*4);
  for(let i=0;i<P.count;i++){const w=nw(P.getY(i));for(let j=0;j<Math.min(4,w.length);j++){SI[i*4+j]=w[j][0];SW[i*4+j]=w[j][1]}let t=0;for(let j=0;j<4;j++)t+=SW[i*4+j];if(t<=0){SI[i*4]=CB.IDX.Head;SW[i*4]=1;t=1}for(let j=0;j<4;j++)SW[i*4+j]/=t}
  g.setAttribute('skinIndex',new THREE.BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(SW,4));
  g.computeBoundingSphere();g.boundingSphere.radius*=2;g.userData.raw=raw;return g}
// textura lineal (el resto del juego pinta sin corrección de gamma: así la cara queda del mismo tono que el cuerpo)
function linTex(img){const t=new THREE.Texture(img);t.flipY=false;t.encoding=THREE.LinearEncoding;t.anisotropy=4;t.needsUpdate=true;return t}
// textura de la cara repintada: cejas nuevas (las originales eran rayas verdosas), y en la mujer pestañas, labios y rubor
function faceTex(img,f){const S=img.width,k=S/512,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');g.drawImage(img,0,0);
  const px=(x,y)=>{const d=g.getImageData(x*k,y*k,1,1).data;return'rgb('+d[0]+','+d[1]+','+d[2]+')'};
  // borrar las cejas con la piel de la frente
  g.save();g.filter='blur('+(5*k)+'px)';for(const cx of [211,301]){g.fillStyle=px(cx,124);g.beginPath();g.ellipse(cx*k,145*k,34*k,14*k,0,0,TAU);g.fill()}g.restore();
  g.save();g.filter='blur('+(2*k)+'px)';for(const cx of [211,301]){g.fillStyle=px(cx,124);g.beginPath();g.ellipse(cx*k,144*k,30*k,10*k,0,0,TAU);g.fill()}g.restore();
  // cejas: pelitos cortos a lo largo de una curva (adentro = cerca de la nariz)
  const brow=(sd,inX,outX,inY,peakY,outY,w0,w1)=>{const pts=[];for(let i=0;i<=24;i++){const t=i/24;const x=inX+(outX-inX)*t;const y=(1-t)*(1-t)*inY+2*(1-t)*t*peakY+t*t*outY;pts.push([x,y,w0+(w1-w0)*t])}
    g.lineCap='round';g.strokeStyle='rgba(38,26,20,.55)';for(let i=0;i<pts.length-1;i++){g.lineWidth=(pts[i][2])*k;g.beginPath();g.moveTo(pts[i][0]*k,pts[i][1]*k);g.lineTo(pts[i+1][0]*k,pts[i+1][1]*k);g.stroke()}
    g.strokeStyle='rgba(22,14,10,.7)';g.lineWidth=1*k;for(let i=0;i<70;i++){const t=Math.random(),p=pts[Math.round(t*24)];const a=(sd>0?-1:1)*(.35+.4*t);const l=(p[2]*.7+1)*k;const ox=(Math.random()-.5)*p[2]*.6*k,oy=(Math.random()-.5)*p[2]*.6*k;
      g.beginPath();g.moveTo(p[0]*k+ox,p[1]*k+oy+l*.5);g.lineTo(p[0]*k+ox+Math.cos(a)*l*(sd>0?-1:1),p[1]*k+oy-l*.5);g.stroke()}};
  // en la textura la izquierda de la imagen es el lado derecho del personaje
  if(f){brow(-1,240,186,149,137,145,4.2,1.6);brow(1,272,326,149,137,145,4.2,1.6)}
  else{brow(-1,241,185,147,138,143,7,3.2);brow(1,271,327,147,138,143,7,3.2)}
  if(f){// pestañas y delineado arriba del ojo
    g.lineCap='round';for(const [cx,sd] of [[205,-1],[306,1]]){g.strokeStyle='rgba(12,8,6,.85)';g.lineWidth=2.2*k;g.beginPath();g.ellipse(cx*k,158*k,19*k,7*k,0,Math.PI*1.08,Math.PI*1.94);g.stroke();
      g.lineWidth=1.3*k;const ox=cx+sd*17;g.beginPath();g.moveTo(ox*k,154*k);g.lineTo((ox+sd*5)*k,150*k);g.stroke();
      g.fillStyle='rgba(90,50,60,.12)';g.beginPath();g.ellipse(cx*k,151*k,17*k,5*k,0,0,TAU);g.fill()}
    // labios con más color y rubor en las mejillas
    g.save();g.globalCompositeOperation='multiply';g.filter='blur('+(1.2*k)+'px)';g.fillStyle='rgb(218,140,150)';g.beginPath();g.ellipse(255*k,242.5*k,38*k,5.5*k,0,0,TAU);g.fill();g.beginPath();g.ellipse(255*k,251*k,33*k,6*k,0,0,TAU);g.fill();g.restore();
    g.save();g.globalCompositeOperation='multiply';g.filter='blur('+(10*k)+'px)';g.fillStyle='rgb(246,222,220)';for(const cx of [180,332]){g.beginPath();g.ellipse(cx*k,212*k,22*k,15*k,0,0,TAU);g.fill()}g.restore()}
  return linTex(cv)}
const FACE={};
{const sm=G.hombre.scene,get=n=>{let r=null;sm.traverse(o=>{if(o.isSkinnedMesh&&o.name===n)r=o});return r};
  const head=get('Wolf3D_Head'),img=head.material.map.image;
  // color base de la piel en la textura (frente, mejillas y cuello), para que el tinte dé justo el tono de cada persona
  const base=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.drawImage(img,0,0,64,64);let r=0,gg=0,b=0,n=0;
    for(const [x,y] of [[256,70],[256,100],[200,110],[312,110],[170,200],[342,200],[200,280],[312,280],[256,300]]){const d=g.getImageData(Math.round(x/8),Math.round(y/8),1,1).data;r+=d[0];gg+=d[1];b+=d[2];n++}return[r/n/255,gg/n/255,b/n/255]})();
  for(const kind of ['m','f']){const F={parts:[],base};
    F.parts.push({geo:faceGeo(head,kind,true),map:faceTex(img,kind==='f'),skin:true});
    for(const n of ['EyeLeft','EyeRight','Wolf3D_Teeth']){const m=get(n);if(m)F.parts.push({geo:faceGeo(m,kind),map:linTex(m.material.map.image),skin:false})}
    FACE[kind]=F}}
// materiales de la cara compartidos por tono de piel
const FMAT={};
function faceMat(kind,i,part,skinHex){const key=kind+i+(part.skin?skinHex:'');if(FMAT[key])return FMAT[key];let m;
  if(part.skin){const sk=new THREE.Color(skinHex),b=FACE[kind].base;m=new THREE.MeshPhongMaterial({map:part.map,skinning:true,shininess:10,specular:0x141210});m.color.setRGB(sk.r/b[0]*.96,sk.g/b[1]*.96,sk.b/b[2]*.96)}
  else m=new THREE.MeshLambertMaterial({map:part.map,skinning:true});
  return FMAT[key]=m}
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
// textura de pelo: mechones finos en una dirección
const HAIRTEX={};function hairTex(c){if(HAIRTEX[c])return HAIRTEX[c];const S=128,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');const base=new THREE.Color(c);g.fillStyle='#'+base.getHexString();g.fillRect(0,0,S,S);
  const hi='#'+base.clone().offsetHSL(0,0,.09).getHexString(),lo='#'+base.clone().multiplyScalar(.55).getHexString();
  for(let i=0;i<520;i++){const x=Math.random()*S,y=Math.random()*S,l=10+Math.random()*30;g.strokeStyle=Math.random()<.55?lo:hi;g.globalAlpha=.25+Math.random()*.35;g.lineWidth=.6+Math.random()*1.1;
    g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+(Math.random()-.5)*4,y+l/2,x+(Math.random()-.5)*3,y+l);g.stroke();if(y+l>S){g.beginPath();g.moveTo(x,y-S);g.lineTo(x,y+l-S);g.stroke()}}
  g.globalAlpha=1;const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;HAIRTEX[c]=t;return t}
// rizos (afro): grano menudo sin dirección
const CURLTEX={};function curlTex(c){if(CURLTEX[c])return CURLTEX[c];const S=128,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');const base=new THREE.Color(c);g.fillStyle='#'+base.getHexString();g.fillRect(0,0,S,S);
  for(let i=0;i<1400;i++){const x=Math.random()*S,y=Math.random()*S,r=1+Math.random()*2.2;g.strokeStyle=Math.random()<.6?'rgba(0,0,0,.4)':'rgba(255,255,255,.08)';g.lineWidth=.8;g.beginPath();g.arc(x,y,r,Math.random()*TAU,Math.random()*TAU+3);g.stroke()}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;CURLTEX[c]=t;return t}
// interpolación lineal en una tabla [[a,valor],...]
function tab(T,a){if(a<=T[0][0])return T[0][1];for(let i=1;i<T.length;i++)if(a<=T[i][0]){const p=T[i-1],q=T[i];return p[1]+(q[1]-p[1])*(a-p[0])/(q[0]-p[0])}return T[T.length-1][1]}
// línea del pelo según el ángulo alrededor de la cabeza (0 = frente, PI = nuca), en la altura de la cabeza original
const HLINE={
  m:[[0,1.799],[.35,1.802],[.6,1.797],[.85,1.786],[1.05,1.773],[1.18,1.762],[1.27,1.738],[1.33,1.716],[1.43,1.71],[1.49,1.748],[1.82,1.748],[1.95,1.702],[2.4,1.662],[Math.PI,1.645]],
  f:[[0,1.797],[.35,1.8],[.6,1.794],[.9,1.776],[1.15,1.745],[1.35,1.70],[1.6,1.66],[2.2,1.63],[Math.PI,1.615]]};
// máscaras (en metros, positivo = hay pelo) calculadas sobre la cabeza original
function hairMask(kind,x,y,z){const a=Math.abs(Math.atan2(x,z-.02));let m=y-tab(HLINE[kind],a);if(kind==='m')m=Math.min(m,Math.max(.079-Math.abs(x),y-1.75));return m}
// barba (kind: full = completa, goatee = candado, stache = bigote); mejillas en diagonal de la patilla a la comisura
function beardMask(kind,x,y,z){const a=Math.abs(Math.atan2(x,z-.02)),ax=Math.abs(x);
  const top=tab([[0,1.681],[.18,1.677],[.42,1.683],[.8,1.689],[1.05,1.697],[1.18,1.716],[1.27,1.738],[1.43,1.742]],a)-y;
  const lips=(Math.hypot(x/.028,(y-1.657)/.0088)-1)*.009+(z<.095?1:0);
  if(kind==='stache')return Math.min(top,y-(1.6668-Math.max(0,ax-.021)*.55),.034-ax,z-.1);
  const bot=y-(1.586+Math.max(0,a-.85)*.1);const back=(1.43-a)*.06;let m=Math.min(top,bot,back,lips);
  if(kind==='goatee')m=Math.min(m,.034-ax,z-.085,y-1.597);return m}
// normales suavizadas sobre los vértices que comparten posición (la malla de la cabeza viene cortada por las costuras de la textura)
function weldNormals(geo){const P=geo.attributes.position,N=geo.attributes.normal,acc=new Map(),key=i=>Math.round(P.getX(i)*2000)+','+Math.round(P.getY(i)*2000)+','+Math.round(P.getZ(i)*2000);
  for(let i=0;i<P.count;i++){const k=key(i);const v=acc.get(k)||[0,0,0];v[0]+=N.getX(i);v[1]+=N.getY(i);v[2]+=N.getZ(i);acc.set(k,v)}
  const out=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const v=acc.get(key(i));const l=Math.hypot(v[0],v[1],v[2])||1;out[i*3]=v[0]/l;out[i*3+1]=v[1]/l;out[i*3+2]=v[2]/l}return out}
// cáscara sobre la piel: sigue la cabeza exacta y se corta por la máscara (el borde se recorta por píxel en el shader, así no queda serrucho)
const SHELLS={};
// cráneo como elipsoide liso (sin orejas), para los peinados con volumen
function skull(kind){const c=toBody(0,1.745,.025,kind),px=toBody(.079,1.745,.025,kind),py=toBody(0,1.848,.025,kind),pz=toBody(0,1.745,.123,kind);return{c,r:[px[0]-c[0],py[1]-c[1],pz[2]-c[2]]}}
// vol: si viene, la cáscara pasa de la piel (en la línea del pelo) a un volumen redondo sobre el cráneo, del grosor que diga thickFn
function shell(kind,name,maskFn,thickFn,vol){const key=kind+name;if(SHELLS[key])return SHELLS[key];const g=FACE[kind].parts[0].geo,P=g.attributes.position,raw=g.userData.raw,I=g.index.array;
  const NW=g.userData.nw||(g.userData.nw=weldNormals(g));const M=new Float32Array(P.count);for(let i=0;i<P.count;i++)M[i]=maskFn(raw[i*3],raw[i*3+1],raw[i*3+2]);const SK=vol?skull(kind):null;
  const pos=[],uv=[],msk=[],idx=[],map=new Map();
  const vtx=(i,wrap)=>{const id=wrap?-1-i:i;if(map.has(id))return map.get(id);const x=raw[i*3],y=raw[i*3+1],z=raw[i*3+2],k=thickFn(M[i],x,y,z);const n=pos.length/3;
    let X=P.getX(i)+NW[i*3]*k,Y=P.getY(i)+NW[i*3+1]*k,Z=P.getZ(i)+NW[i*3+2]*k;
    if(vol){const t=vol(M[i],x,y,z);if(t>0){const dx=P.getX(i)-SK.c[0],dy=P.getY(i)-SK.c[1],dz=P.getZ(i)-SK.c[2];const l=Math.hypot(dx,dy,dz)||1,ux=dx/l,uy=dy/l,uz=dz/l;
      const re=1/Math.hypot(ux/SK.r[0],uy/SK.r[1],uz/SK.r[2]);const R=re+k;X+=(SK.c[0]+ux*R-X)*t;Y+=(SK.c[1]+uy*R-Y)*t;Z+=(SK.c[2]+uz*R-Z)*t}}
    let u=Math.atan2(x,z-.02);if(wrap&&u<0)u+=TAU;pos.push(X,Y,Z);uv.push(u*.5,y*4);msk.push(M[i]);map.set(id,n);return n};
  for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],c=I[t+2];if(Math.max(M[a],M[b],M[c])<=0)continue;
    // los triángulos que cruzan la nuca (donde el ángulo salta de -PI a PI) usan copias de sus vértices, así la textura no se estira
    const ua=Math.atan2(raw[a*3],raw[a*3+2]-.02),ub=Math.atan2(raw[b*3],raw[b*3+2]-.02),uc=Math.atan2(raw[c*3],raw[c*3+2]-.02);const wrap=Math.max(ua,ub,uc)-Math.min(ua,ub,uc)>Math.PI;
    idx.push(vtx(a,wrap),vtx(b,wrap),vtx(c,wrap))}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));out.setAttribute('aM',new THREE.Float32BufferAttribute(msk,1));out.setIndex(idx);out.computeVertexNormals();
  return SHELLS[key]=out}
// melena larga: cae derecho desde la altura de las orejas, por fuera de la cabeza y de las orejas, hasta los hombros (más larga atrás)
function drapeGeo(kind){const key=kind+'drape';if(SHELLS[key])return SHELLS[key];const g=FACE[kind].parts[0].geo,P=g.attributes.position;let top=-9;for(let i=0;i<P.count;i++)top=Math.max(top,P.getY(i));
  let zc=0;{let zn=9,zx=-9;for(let i=0;i<P.count;i++){if(Math.abs(P.getY(i)-(top-.1))<.02){zn=Math.min(zn,P.getZ(i));zx=Math.max(zx,P.getZ(i))}}zc=(zn+zx)/2}
  const y0=top-.07,C=30,Rr=12,Y=[];// columnas alrededor de la cabeza (ángulo desde el frente) y filas hacia abajo
  const prof=[];for(let c=0;c<=C;c++){const ph=1.2+(TAU-2.4)*c/C;const rows=new Array(Rr+1).fill(0);
    for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);if(y>y0+.01)continue;const an=Math.atan2(x,z-zc),d=Math.abs(Math.atan2(Math.sin(an-ph),Math.cos(an-ph)));if(d>.18)continue;const r=Math.hypot(x,z-zc);
      for(let k=0;k<=Rr;k++){const yk=y0-.06*k/Rr*4;if(y>=yk-.01)rows[k]=Math.max(rows[k],r)}}
    for(let k=1;k<=Rr;k++)rows[k]=Math.max(rows[k],rows[k-1]);prof.push(rows)}
  const pos=[],uv=[],idx=[];
  for(let c=0;c<=C;c++){const ph=1.2+(TAU-2.4)*c/C,back=Math.pow(Math.max(0,-Math.cos(ph)),.7),edge=Math.min(c,C-c)/C;
    const len=.26+.12*back+.006*Math.sin(c*1.9)-(edge<.12?(.12-edge)*.5:0);
    for(let r=0;r<=Rr;r++){const t=r/Rr,y=y0-len*t;const kk=Math.min(Rr,Math.round((y0-y)/.24*Rr));const base=prof[c][kk]||prof[c][Rr];
      const rr=base+.0105+(.006+.035*back)*smooth(.3,1,t);pos.push(Math.sin(ph)*rr,y,zc+Math.cos(ph)*rr);uv.push(ph*.5,y*4)}}
  for(let c=0;c<C;c++)for(let r=0;r<Rr;r++){const a=c*(Rr+1)+r,b=a+1,d=a+Rr+1,e=d+1;idx.push(a,b,d,b,e,d)}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));out.setAttribute('aM',new THREE.Float32BufferAttribute(new Float32Array(pos.length/3).fill(1),1));out.setIndex(idx);out.computeVertexNormals();
  return SHELLS[key]=out}
// material del pelo: recorta por la máscara y oscurece un poco el borde (pelitos más ralos)
const HMAT={};
function hairMat(c,curly,side){const key=c+(curly?'r':'')+(side||'');if(HMAT[key])return HMAT[key];const m=new THREE.MeshLambertMaterial({map:curly?curlTex(c):hairTex(c),side:side||THREE.FrontSide});
  m.onBeforeCompile=s=>{s.vertexShader='attribute float aM;varying float vM;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvM=aM;');
    s.fragmentShader='varying float vM;\n'+s.fragmentShader.replace('#include <map_fragment>','if(vM<0.0)discard;\n#include <map_fragment>\ndiffuseColor.rgb*=mix(0.72,1.0,smoothstep(0.0,0.008,vM));')};
  m.customProgramCacheKey=()=>'pelo';return HMAT[key]=m}
function makeHair(root,bones,kind,hair,beard,hairC,out){
  const rp=CB.restPos(kind).Head;const holder=new THREE.Group();holder.position.set(-rp[0],-rp[1],-rp[2]);bones.Head.add(holder);
  const c=hair&&hair.c||hairC||'#1b1310',f=kind==='f';
  const put=(geo,mat)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=true;holder.add(m);out.props.push(m);return m};
  const H=(()=>{const g=FACE[kind].parts[0].geo,P=g.attributes.position;let top=-9,zn=9,zx=-9,rx=0;for(let i=0;i<P.count;i++)top=Math.max(top,P.getY(i));
    for(let i=0;i<P.count;i++){const y=P.getY(i);if(y>top-.12&&y<top-.04){rx=Math.max(rx,Math.abs(P.getX(i)));zn=Math.min(zn,P.getZ(i));zx=Math.max(zx,P.getZ(i))}}return{top,rx,zc:(zn+zx)/2,rz:(zx-zn)/2}})();
  const hm=(x,y,z)=>hairMask(kind,x,y,z);
  if(hair){const st=hair.style||'short';
    if(st==='afro'){// volumen redondo que nace en la línea del pelo
      const T=f?.055:.04;put(shell(kind,'afro',hm,(m,x,y)=>.0015+T*smooth(0,.028,m)*(.85+.15*smooth(1.72,1.84,y)),m=>smooth(0,.03,m)),hairMat(c,true))}
    else if(st!=='none'){
      if(f){const tied=st==='bun'||st==='bunLow'||st==='ponytail';
        // recogido: deja las orejas al aire; suelto: tapa las orejas con una forma lisa (sin bultos)
        if(tied)put(shell(kind,'tied',(x,y,z)=>Math.min(hm(x,y,z),Math.max(.079-Math.abs(x),y-1.748)),(m,x,y)=>.0013+.0075*smooth(0,.012,m)),hairMat(c));
        else put(shell(kind,'long',hm,(m,x,y)=>.0015+(.011+.007*smooth(1.79,1.68,y))*smooth(0,.015,m),m=>smooth(0,.02,m)),hairMat(c))}
      else{// corte de hombre: desvanecido, rapado o con copete (al azar)
        const cut=hair.cut||['fade','fade','rapado','copete'][Math.floor(Math.random()*4)];
        const th=cut==='rapado'?(m=>.0011+.0022*smooth(0,.006,m)):cut==='copete'?((m,x,y,z)=>.0012+(.003+.016*smooth(1.76,1.83,y)*smooth(-.02,.06,z))*smooth(0,.012,m)):((m,x,y)=>.0012+(.0035+.008*smooth(1.75,1.82,y))*smooth(0,.012,m));
        put(shell(kind,'short-'+cut,hm,th),hairMat(c))}
      const sph=new THREE.SphereGeometry(1,16,12);sph.setAttribute('aM',new THREE.Float32BufferAttribute(new Float32Array(sph.attributes.position.count).fill(1),1));
      if(st==='bun'){const b=put(sph,hairMat(c));b.position.set(0,H.top-.005,H.zc-H.rz*.7);b.scale.set(.052,.046,.052)}
      if(st==='bunLow'){const b=put(sph,hairMat(c));b.position.set(0,H.top-.11,H.zc-H.rz*1.05);b.scale.set(.054,.048,.05)}
      if(st==='ponytail'){const g2=new THREE.CylinderGeometry(.024,.01,.24,10,4);g2.translate(0,-.12,0);g2.setAttribute('aM',new THREE.Float32BufferAttribute(new Float32Array(g2.attributes.position.count).fill(1),1));const p=put(g2,hairMat(c));p.position.set(0,H.top-.06,H.zc-H.rz*1.02);p.rotation.x=.12}
      if(st==='long')put(drapeGeo(kind),hairMat(c,false,THREE.DoubleSide))}}
  if(beard&&!f){const v=typeof beard==='string'?beard:'full',bc=new THREE.Color(c).offsetHSL(0,0,.02).getStyle();
    put(shell(kind,'beard-'+v,(x,y,z)=>beardMask(v,x,y,z),(m)=>.0012+(v==='full'?.0042:.0036)*smooth(0,.006,m)),hairMat(bc))}
  return out.props[0]||null}
/* ---------- instancias ---------- */
function create(sp){const kind=sp.model||'m';const M=models[kind];const O=outfit(sp,kind);const key=kind+JSON.stringify(O);let geo=GEO.get(key);if(!geo){geo=CB.build(kind,O);GEO.set(key,geo)}
  const rig=CB.makeRig(kind),root=rig.root,bones=rig.bones;const skel=new THREE.Skeleton(rig.list,rig.inv);
  const sk=col(sp.skin||'#8d5a3b');const hairC=sp.hairC||'#1b1310';
  const cols=[sk,col(sp.top||'#ffffff'),col(sp.bottom||'#333333'),col(sp.shoes||'#222222'),col(sp.hatC||'#e9dcb0'),col(hairC),col('#ffffff'),col(hairC),col(sp.shirtC||'#f4f2ee'),col(sp.beltC||'#3b2416')];
  const mat=makeMaterial(cols,{pat:sp.pat,patB:sp.patB,jersey:sp.jersey,kx:CB.SC[kind].x,ty:1.49*CB.SC[kind].y});
  const mesh=new THREE.SkinnedMesh(geo,mat);mesh.name='cuerpo';root.add(mesh);root.updateMatrixWorld(true);mesh.bind(skel,new THREE.Matrix4());mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=true;
  FACE[kind].parts.forEach((part,i)=>{const fm=new THREE.SkinnedMesh(part.geo,faceMat(kind,i,part,sp.skin||'#8d5a3b'));fm.name='cara';root.add(fm);fm.frustumCulled=true;fm.bind(skel,new THREE.Matrix4())});
  const mixer=new THREE.AnimationMixer(root);const A={};for(const k in M.clips){A[k]=mixer.clipAction(M.clips[k]);A[k].play();A[k].setEffectiveWeight(0)}
  A.idle.setEffectiveWeight(1);
  const g=new THREE.Group();g.add(root);const s=sp.scale||1;root.scale.multiplyScalar(s);
  const rest={};for(const n in bones)rest[n]=bones[n].quaternion.clone();
  // barba: completa, candado o bigote (si no viene dicha, se escoge al azar)
  const br=Math.random(),bv=sp.beard&&kind==='m'?(typeof sp.beard==='string'?sp.beard:br<.6?'full':br<.88?'goatee':'stache'):null;
  const ch0={props:[]};const hm=makeHair(root,bones,kind,sp.hair,bv,hairC,ch0);
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
