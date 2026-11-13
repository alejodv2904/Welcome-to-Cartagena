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

/* ---------- base models: all skinned parts merged into one mesh with a texture atlas + part mask ---------- */
function imgOf(tex){return tex&&tex.image}
function avgColor(img){const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d');g.drawImage(img,0,0,8,8);const d=g.getImageData(0,0,8,8).data;let r=0,gg=0,b=0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<10)continue;r+=d[i];gg+=d[i+1];b+=d[i+2];n++}return[r/n,gg/n,b/n]}
function partOfMesh(name){name=name.toLowerCase();if(name.includes('eye')||name.includes('teeth'))return 6;if(name.includes('beard'))return 7;if(name.includes('hair'))return 5;if(name.includes('outfit_top'))return 1;if(name.includes('outfit_bottom'))return 2;if(name.includes('footwear'))return 3;if(name==='mesh'||name.includes('headwear'))return 4;return 0}
function mergeSkinned(list,keepTri,size){// list: [{mesh,part,reg}]; keepTri(it,u,v) decides per triangle (atlas uv of its centre)
  const P=[],N=[],U=[],SI=[],SW=[],I=[];let base=0;
  for(const it of list){const g=it.mesh.geometry;const p=g.attributes.position,nn=g.attributes.normal,uv=g.attributes.uv,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;const r=it.reg;
    for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(nn.getX(i),nn.getY(i),nn.getZ(i));
      let u=uv?uv.getX(i):.5,v=uv?uv.getY(i):.5;u=Math.min(.999,Math.max(.001,u-Math.floor(u)));v=Math.min(.999,Math.max(.001,v-Math.floor(v)));
      U.push((r[0]+1+u*(r[2]-2))/size,(r[1]+1+v*(r[3]-2))/size);SI.push(si.getX(i),si.getY(i),si.getZ(i),si.getW(i));SW.push(sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i))}
    const idx=g.index?Array.from(g.index.array):[...Array(p.count).keys()];
    for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];if(keepTri){const u=(U[(base+a)*2]+U[(base+b)*2]+U[(base+c)*2])/3,v=(U[(base+a)*2+1]+U[(base+b)*2+1]+U[(base+c)*2+1])/3;const C=[0,1,2].map(k=>(P[(base+a)*3+k]+P[(base+b)*3+k]+P[(base+c)*3+k])/3);if(!keepTri(it,u,v,C))continue}I.push(base+a,base+b,base+c)}
    base+=p.count}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));g.setIndex(I);g.computeBoundingSphere();return g}

function prepModel(gltf,kind){const scene=gltf.scene;scene.updateMatrixWorld(true);const skinned=[];scene.traverse(o=>{if(o.isSkinnedMesh)skinned.push(o)});
  const SZ=1024;const atlas=document.createElement('canvas');atlas.width=atlas.height=SZ;const ag=atlas.getContext('2d');
  const mask=document.createElement('canvas');mask.width=mask.height=SZ;const mg=mask.getContext('2d');
  const setMask=(r,part)=>{mg.fillStyle='rgb('+(part*32+16)+',0,0)';mg.fillRect(r[0],r[1],r[2],r[3])};
  let skinAvg=[150,100,80];const variants={};
  if(kind==='m'){
    // atlas layout (pixels): clothes get the big cells
    const L={1:[0,0,512,512],2:[512,0,512,512],0:[0,512,512,512],4:[512,512,256,256],3:[768,512,256,256],5:[512,768,64,64],6:[576,768,128,128],7:[704,768,64,64]};
    const items=[];
    for(const m of skinned){const part=partOfMesh(m.name);const mat=m.material;let reg;
      if(m.name==='Wolf3D_Body')reg=L[7];else if(part===6)reg=L[6];else if(part===7)reg=L[5];else reg=L[part];
      items.push({mesh:m,part,reg,mat})}
    // paint atlas
    const head=items.find(i=>i.mesh.name==='Wolf3D_Head');if(head&&imgOf(head.mat.map))skinAvg=avgColor(imgOf(head.mat.map));
    for(const it of items){const r=it.reg,img=imgOf(it.mat.map);
      if(it.mesh.name==='Wolf3D_Body'){ag.fillStyle='rgb('+skinAvg.map(Math.round).join(',')+')';ag.fillRect(r[0],r[1],r[2],r[3])}
      else if(img&&it.part===4){ag.drawImage(img,r[0],r[1],r[2],r[3]);const d=ag.getImageData(r[0],r[1],r[2],r[3]).data,md=mg.createImageData(r[2],r[3]);
        for(let i=0;i<d.length;i+=4){const R=d[i],G2=d[i+1],B=d[i+2],mx=Math.max(R,G2,B),mn=Math.min(R,G2,B);const olive=G2>=R&&G2>B+6&&(mx-mn)>10;md.data[i]=(olive?4:5)*32+16;md.data[i+3]=255}
        it.maskData=md;continue}
      else if(img&&it.part!==6){ag.drawImage(img,r[0],r[1],r[2],r[3])}
      else if(it.part===6){// eyes & teeth share a cell: white with a dark iris in the middle
        ag.fillStyle='#f2efe8';ag.fillRect(r[0],r[1],r[2],r[3]);ag.fillStyle='#2a1a10';ag.beginPath();ag.arc(r[0]+r[2]/2,r[1]+r[3]/2,r[2]*.22,0,TAU);ag.fill()}
      else{const c=it.mat.color;ag.fillStyle='#'+c.getHexString();ag.fillRect(r[0],r[1],r[2],r[3])}
      setMask(r,it.part)}
    for(const it of items)if(it.maskData)mg.putImageData(it.maskData,it.reg[0],it.reg[1]);
    const eyes=items.filter(i=>i.part===6&&/eye/i.test(i.mesh.name));
    // eyes: use the real eye texture if present (iris centred on uv .5)
    for(const e of eyes){const img=imgOf(e.mat.map);if(img){ag.drawImage(img,L[6][0],L[6][1],L[6][2],L[6][3]);break}}
    const teeth=items.filter(i=>/teeth/i.test(i.mesh.name));items.forEach(i=>{if(/teeth/i.test(i.mesh.name))i.reg=[L[6][0]+8,L[6][1]+8,8,8]});
    let hc=[0,0,0],hn=0,htop=-9;{const hp=items.find(i=>i.mesh.name==='Wolf3D_Head').mesh.geometry.attributes.position;for(let i=0;i<hp.count;i++){hc[0]+=hp.getX(i);hc[2]+=hp.getZ(i);hn++;htop=Math.max(htop,hp.getY(i))}hc[0]/=hn;hc[2]/=hn}
    const mk=mg.getImageData(0,0,SZ,SZ).data;const partAt=(u,v)=>Math.floor(mk[(Math.min(SZ-1,Math.floor(v*SZ))*SZ+Math.min(SZ-1,Math.floor(u*SZ)))*4]/32);
    for(const withHat of [true,false])for(const beard of [true,false]){const use=items.filter(i=>beard||i.part!==7);
      variants[(withHat?'hat':'nohat')+(beard?'B':'')]=mergeSkinned(use,(it,u,v,c)=>withHat||it.part!==4||partAt(u,v)!==4&&c[1]<htop+.005&&Math.hypot(c[0]-hc[0],c[2]-hc[2])<.12,SZ)}
  }else{
    // single-texture model: classify texels into parts (yellow trousers → bottom, skin, dark hair/top)
    const m=skinned[0];const img=imgOf(m.material.map);ag.drawImage(img,0,0,SZ,SZ);
    const d=ag.getImageData(0,0,SZ,SZ),md=mg.createImageData(SZ,SZ);let sr=0,sg=0,sb=0,sn=0;
    for(let i=0;i<d.data.length;i+=4){const r=d.data[i],g=d.data[i+1],b=d.data[i+2];const mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0;let h=0;
      if(mx!==mn){if(mx===r)h=((g-b)/(mx-mn))%6;else if(mx===g)h=(b-r)/(mx-mn)+2;else h=(r-g)/(mx-mn)+4;h*=60;if(h<0)h+=360}
      let part=6;const top=i/4<SZ*SZ*.13;
      if((h<14||h>340)&&s>.55&&mx>100||top&&h>=14&&h<70&&s>.4)part=4;   // goggle lenses & red trims → dark glasses/accents
      else if(h>38&&h<70&&s>.45&&mx>120)part=2;                        // yellow trousers
      else if(h>8&&h<40&&s>.22&&s<.8&&mx>80&&mx<215){part=0;sr+=r;sg+=g;sb+=b;sn++} // skin
      else if(mx<80)part=5;                                             // hair (dark)
      else if(s<.14&&mx>=80&&mx<205)part=1;                             // grey crop top
      md.data[i]=part*32+16;md.data[i+3]=255}
    mg.putImageData(md,0,0);if(sn)skinAvg=[sr/sn,sg/sn,sb/sn];
    variants.nohat=mergeSkinned([{mesh:m,part:0,reg:[-1,-1,SZ+2,SZ+2]}],null,SZ)}
  // average brightness of every part, so recoloured cloth keeps its folds but reaches the wanted colour
  const pl=new Array(NP).fill(0),pn=new Array(NP).fill(0);{const a=ag.getImageData(0,0,SZ,SZ).data,mk=mg.getImageData(0,0,SZ,SZ).data;for(let i=0;i<a.length;i+=16){const id=Math.floor(mk[i]/32);if(id<NP&&mk[i]>0){pl[id]+=(a[i]*.299+a[i+1]*.587+a[i+2]*.114)/255;pn[id]++}}}
  const plum=pl.map((v,i)=>pn[i]?Math.max(.05,v/pn[i]):.5);
  const tex=new THREE.CanvasTexture(atlas);tex.flipY=false;tex.anisotropy=4;
  const mtex=new THREE.CanvasTexture(mask);mtex.flipY=false;mtex.magFilter=mtex.minFilter=THREE.NearestFilter;mtex.generateMipmaps=false;
  // template: keep the skeleton, drop the original meshes, add one merged mesh per variant
  const tpl={};const first=skinned[0];
  for(const key in variants){const root=THREE.SkeletonUtils.clone(scene);const rs=[];root.traverse(o=>{if(o.isSkinnedMesh)rs.push(o)});
    const keep=rs.find(o=>o.name===first.name);rs.forEach(o=>{if(o!==keep)o.parent.remove(o)});
    keep.geometry=variants[key];keep.morphTargetInfluences=undefined;keep.morphTargetDictionary=undefined;keep.updateMorphTargets&&keep.updateMorphTargets();
    tpl[key]={root,meshName:keep.name}}
  for(const k of ['hat','hatB','nohatB'])if(!variants[k])variants[k]=variants.nohat;
  let hips=null;scene.traverse(o=>{if(!hips&&strip(o.name)==='Hips')hips=o});
  return{kind,scene,hips,tex,mtex,tpl,skinAvg,plum,clips:{}}}

/* ---------- shader: per-part recolouring, one draw call per person ---------- */
const FRAG=`
uniform sampler2D partMask;uniform vec3 pc[${NP}];uniform float pm[${NP}];uniform float pl[${NP}];
`;
function makeMaterial(M,cols,modes){const m=new THREE.MeshPhongMaterial({map:M.tex,skinning:true,shininess:14,specular:0x1c1a18});
  const U={partMask:{value:M.mtex},pc:{value:cols},pm:{value:modes},pl:{value:M.plum}};m.userData.U=U;
  m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);s.fragmentShader=FRAG+s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    float pid=floor(texture2D(partMask,vUv).r*255.0/32.0+0.02);vec3 tc=diffuseColor.rgb;float lum=dot(tc,vec3(.299,.587,.114));
    vec3 pcol=vec3(1.0);float mode=0.0;float al=0.5;
    if(pid<0.5){pcol=pc[0];mode=pm[0];al=pl[0];}else if(pid<1.5){pcol=pc[1];mode=pm[1];al=pl[1];}else if(pid<2.5){pcol=pc[2];mode=pm[2];al=pl[2];}else if(pid<3.5){pcol=pc[3];mode=pm[3];al=pl[3];}
    else if(pid<4.5){pcol=pc[4];mode=pm[4];al=pl[4];}else if(pid<5.5){pcol=pc[5];mode=pm[5];al=pl[5];}else if(pid>6.5){pcol=pc[7];mode=pm[7];al=pl[7];}
    if(mode>1.5)diffuseColor.rgb=pcol*clamp(0.25+0.75*lum/al,0.0,1.6);else if(mode>0.5)diffuseColor.rgb=tc*pcol;`)};
  m.customProgramCacheKey=()=>'gente1';return m}

const models={m:prepModel(G.hombre,'m'),f:prepModel(G.mujer,'f')};
// clips: walk/run/idle from one capture set, talking gestures from another
const srcA={scene:G.animA.scene},srcB={scene:G.animB.scene};
const findClip=(g,n)=>g.animations.find(a=>a.name===n);
for(const k in models){const M=models[k];const tgt={scene:M.tpl.nohat.root,hips:null};let h=null;tgt.scene.traverse(o=>{if(!h&&strip(o.name)==='Hips')h=o});tgt.hips=h;
  M.clips.idle=retarget(srcA,findClip(G.animA,'Idle'),tgt);M.clips.walk=retarget(srcA,findClip(G.animA,'Walk'),tgt);M.clips.run=retarget(srcA,findClip(G.animA,'Run'),tgt);
  M.clips.idle2=retarget(srcB,findClip(G.animB,'idle'),tgt);M.clips.agree=retarget(srcB,findClip(G.animB,'agree'),tgt);M.clips.shake=retarget(srcB,findClip(G.animB,'headShake'),tgt)}

/* ---------- instances ---------- */
const col=(c)=>new THREE.Color(c);
function create(sp){const M=models[sp.model||'m'];const T=M.tpl[(sp.hat&&M.kind==='m'?'hat':'nohat')+(sp.beard&&M.kind==='m'?'B':'')];const root=THREE.SkeletonUtils.clone(T.root);
  let mesh=null;root.traverse(o=>{if(o.isSkinnedMesh&&o.name===T.meshName)mesh=o});
  // skin: ratio between wanted tone and the texture's own average, so shading detail survives
  const sa=M.skinAvg;const sk=col(sp.skin||'#8d5a3b');const skinRatio=new THREE.Color(sk.r*255/sa[0],sk.g*255/sa[1],sk.b*255/sa[2]);
  const cols=[skinRatio,col(sp.top||'#ffffff'),col(sp.bottom||'#333333'),col(sp.shoes||'#222222'),col(sp.hatC||(M.kind==='f'?'#141414':'#e9dcb0')),col(sp.hairC||'#1b1310'),col('#ffffff'),col(sp.hairC||'#1b1310')];
  const modes=[1,sp.top?2:0,sp.bottom?2:0,sp.shoes?2:0,2,M.kind==='m'?2:(sp.hairC?2:0),0,2];
  if(M.kind==='f'){modes[1]=sp.top?1:0;cols[1]=col(sp.top||'#ffffff').multiplyScalar(4)}// the dark top only takes a hint of colour
  const mat=makeMaterial(M,cols,modes);mesh.material=mat;mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;
  const bones=bonesOf(root);
  const mixer=new THREE.AnimationMixer(root);const A={};for(const k in M.clips){A[k]=mixer.clipAction(M.clips[k]);A[k].play();A[k].setEffectiveWeight(0)}
  A.idle.setEffectiveWeight(1);
  const g=new THREE.Group();g.add(root);const s=sp.scale||1;root.scale.multiplyScalar(s);
  const rest={};for(const n in bones)rest[n]=bones[n].quaternion.clone();
  return{mesh:g,root,skin:mesh,mixer,A,bones,rest,sp,model:M.kind,phase:Math.random()*10,talk:0,talkT:0,w:{idle:1,walk:0,run:0},props:[]}}

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

return{create,animate,attach,attachAt,models,POSES,aim}};
