/* Vehículos de Cartagena modelados por código: carrocería curva (secciones interpoladas), vidrios y pintura con reflejos,
   ruedas con llanta y rin que giran y doblan, suspensión, luces, placas y sombra de contacto. Diseños genéricos (sin marcas). */
window.VEHICULOS=function(THREE,opts){
'use strict';
const TAU=Math.PI*2;const env=opts.env;
const C=c=>new THREE.Color(c);
/* ---------- materials (shared) ---------- */
const M={
  paint:new THREE.MeshPhongMaterial({vertexColors:true,shininess:70,specular:0x555555,envMap:env,reflectivity:.22,combine:THREE.MixOperation}),
  glass:new THREE.MeshPhongMaterial({color:0x0d151a,shininess:140,specular:0xbbbbbb,envMap:env,reflectivity:.3,combine:THREE.MixOperation,transparent:true,opacity:.62,depthWrite:false}),
  wheel:new THREE.MeshPhongMaterial({vertexColors:true,shininess:50,specular:0x444444,envMap:env,reflectivity:.18,combine:THREE.MixOperation}),
  head:new THREE.MeshBasicMaterial({color:0xd9d6c8}),
  tail:new THREE.MeshBasicMaterial({color:0x7a1010}),
  brake:new THREE.MeshBasicMaterial({color:0xff2a1a}),
  lod:new THREE.MeshLambertMaterial({vertexColors:true}),
  shadow:null,
};
// soft contact shadow under each vehicle
{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,4,32,32,32);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(.6,'rgba(0,0,0,.32)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  M.shadow=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6})}
M.tex={};
function plateTex(){// Colombian private plate: yellow, black letters ABC·123, city below
  const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.fillStyle='#f6c516';g.fillRect(0,0,128,64);g.strokeStyle='#111';g.lineWidth=4;g.strokeRect(2,2,124,60);
  const L='ABCDEFGHJKLMNPRSTUVWXYZ';let s='';for(let i=0;i<3;i++)s+=L[Math.floor(Math.random()*L.length)];s+=' '+String(Math.floor(100+Math.random()*899));
  g.fillStyle='#111';g.font='bold 30px Arial Narrow,Arial,sans-serif';g.textAlign='center';g.fillText(s,64,38);g.font='bold 11px Arial,sans-serif';g.fillText('CARTAGENA',64,56);return new THREE.CanvasTexture(c)}
const PLATES=[...Array(10)].map(()=>new THREE.MeshLambertMaterial({map:plateTex()}));
function signTex(text,bg,fg,w,h){const c=document.createElement('canvas');c.width=w||256;c.height=h||64;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.font='bold '+Math.round(c.height*.62)+'px Arial Narrow,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,c.width/2,c.height/2+2);return new THREE.CanvasTexture(c)}
M.taxiSign=new THREE.MeshBasicMaterial({map:signTex('TAXI','#fff4c2','#111',128,48)});
M.police=new THREE.MeshLambertMaterial({map:signTex('POLICÍA','#ffffff','#0f6b33',256,48),transparent:true});
M.busSign=new THREE.MeshBasicMaterial({map:signTex('CENTRO · BOCAGRANDE','#111','#ffb020',256,40)});

/* ---------- geometry helpers ---------- */
// arrays builder with per-vertex colours
function B(){return{p:[],n:[],c:[],u:[],idx:[]}}
function addGeo(A,geo,col,mtx,colFn){const g=geo.index?geo.toNonIndexed():geo.clone();if(mtx)g.applyMatrix4(mtx);if(!g.attributes.normal)g.computeVertexNormals();
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;const cc=C(col);const base=A.p.length/3;
  for(let i=0;i<p.count;i++){A.p.push(p.getX(i),p.getY(i),p.getZ(i));A.n.push(n.getX(i),n.getY(i),n.getZ(i));let q=cc;if(colFn){const r=colFn(p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i));if(r)q=r}A.c.push(q.r,q.g,q.b);A.u.push(uv?uv.getX(i):0,uv?uv.getY(i):0)}}
function toGeo(A){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(A.u,2));g.computeBoundingSphere();return g}
const mx=(x,y,z,rx,ry,rz,sx,sy,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx||1,sy||sx||1,sz||sx||1));
// loft: sections along z, each a half-profile [[x,y],...] from the bottom centre to the top centre; mirrored in x
function loft(sections,smooth){const P=[],I=[];const m=sections[0].pts.length;
  sections.forEach(s=>{const full=[];for(let i=0;i<m;i++)full.push([s.pts[i][0],s.pts[i][1]]);for(let i=m-2;i>=1;i--)full.push([-s.pts[i][0],s.pts[i][1]]);full.forEach(q=>P.push(q[0],q[1],s.z))});
  const k=2*m-2;for(let j=0;j<sections.length-1;j++)for(let i=0;i<k;i++){const a=j*k+i,b=j*k+(i+1)%k,c=(j+1)*k+i,d=(j+1)*k+(i+1)%k;I.push(a,b,c,b,d,c)}
  // caps
  for(const [j,flip] of [[0,true],[sections.length-1,false]]){const s=sections[j];let cx=0,cy=0;for(let i=0;i<k;i++){cx+=P[(j*k+i)*3];cy+=P[(j*k+i)*3+1]}const ci=P.length/3;P.push(cx/k,cy/k,s.z);for(let i=0;i<k;i++){const a=j*k+i,b=j*k+(i+1)%k;flip?I.push(ci,b,a):I.push(ci,a,b)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}
// smooth interpolation of a key list [[z,val],...]
function interp(keys,z){if(z<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(z<=keys[i][0]){const a=keys[i-1],b=keys[i];let t=(z-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);return a[1]+(b[1]-a[1])*t}return keys[keys.length-1][1]}
// rounded body: params as functions of z → width, bottom, shoulder (belt), top
function bodyLoft(L,f,n){const S=[];n=n||28;for(let i=0;i<=n;i++){const t=i/n,z=-L/2+L*(.5-.5*Math.cos(Math.PI*t));const w=f.w(z),y0=f.y0(z),yb=f.yb(z),yt=f.yt(z),r=Math.min(.12,(yt-y0)*.3);
  S.push({z,pts:[[0,y0],[w*.92,y0],[w,y0+r*.8],[w,yb-r*.3],[w*.97,yb+.02],[w*.86,yt-.01],[w*.55,yt],[0,yt]]})}return loft(S)}
// greenhouse (glass cabin) loft between zs and ze
function cabinLoft(f,zs,ze,n){const S=[];n=n||16;for(let i=0;i<=n;i++){const z=zs+(ze-zs)*i/n;const wb=f.wb(z),wt=f.wt(z),yb=f.yb(z),yt=f.yt(z);S.push({z,pts:[[0,yb],[wb,yb],[wb*.97,yb+(yt-yb)*.35],[wt,yt],[wt*.6,yt+.012],[0,yt+.015]]})}return loft(S)}
/* ---------- wheels ---------- */
const WG=new Map();
function wheelGeo(r,w,spokes,style){const key=r+'|'+w+'|'+spokes+'|'+style;if(WG.has(key))return WG.get(key);const A=B();
  // tyre: lathe of a rounded profile, axis along x
  const prof=[];const ri=r*.66;for(let i=0;i<=10;i++){const a=-Math.PI/2+Math.PI*i/10;prof.push(new THREE.Vector2(r-.04+Math.cos(a)*.04*(1+.6*Math.abs(Math.sin(a))),w/2*Math.sin(a)*.98))}
  prof.unshift(new THREE.Vector2(ri,-w/2*.9));prof.push(new THREE.Vector2(ri,w/2*.9));
  const tyre=new THREE.LatheGeometry(prof,22);tyre.rotateZ(Math.PI/2);addGeo(A,tyre,'#1b1b1c');
  // rim: dish + spokes + hub, on the outer face
  const rimC=style==='black'?'#2b2b2b':style==='steel'?'#8d9196':'#c9ccd1';
  const dish=new THREE.CylinderGeometry(ri,ri,.03,20);dish.rotateZ(Math.PI/2);addGeo(A,dish,'#55585c',mx(w*.32,0,0));
  const lip=new THREE.TorusGeometry(ri*.98,.018,6,22);lip.rotateY(Math.PI/2);addGeo(A,lip,rimC,mx(w*.4,0,0));
  for(let k=0;k<spokes;k++){const a=k/spokes*TAU;const sp=new THREE.BoxGeometry(.03,ri*.9,ri*.18);addGeo(A,sp,rimC,mx(w*.39,Math.cos(a)*ri*.47,Math.sin(a)*ri*.47,a,0,0))}
  const hub=new THREE.CylinderGeometry(ri*.22,ri*.26,.05,10);hub.rotateZ(Math.PI/2);addGeo(A,hub,rimC,mx(w*.4,0,0));
  const g=toGeo(A);WG.set(key,g);return g}
/* ---------- vehicle designs ---------- */
const SPEC={};
// each returns {A (painted body arrays), glass:[geo], head:[geo], tail:[geo], extra:[{geo,mat}], wheels:[{x,z,r,w,front,spokes,style}], seat:{x,y,z}, len, wid}
function sedan(col,o){o=o||{};const L=o.L||4.45,W=(o.W||1.76)/2,A=B();const hood=o.hood||.92,deck=o.deck||.98;
  const f={w:z=>W*interp([[-L/2,.86],[-L/2+.35,.98],[L/2-.45,.98],[L/2,.84]],z),y0:z=>interp([[-L/2,.42],[-L/2+.5,.3],[L/2-.6,.3],[L/2,.4]],z),
    yb:z=>interp([[-L/2,deck-.1],[-L/2+.6,deck],[L/2-1.3,hood+.04],[L/2,hood-.12]],z),yt:z=>interp([[-L/2,deck-.06],[-L/2+.5,deck+.02],[L/2-1.4,hood+.07],[L/2-.3,hood],[L/2,hood-.1]],z)};
  addGeo(A,bodyLoft(L,f),col);
  const roof=o.roof||1.43,zf=o.zf!==undefined?o.zf:L/2-1.4,zr=o.zr!==undefined?o.zr:-L/2+.95;const cz0=zf-.95,cz1=zr+.75;// windshield base at zf, roof between cz0..cz1
  const cf={wb:z=>W*.93,wt:z=>W*.74,yb:z=>interp([[zr,deck+.01],[zf,hood+.06]],z),yt:z=>interp([[zr,deck+.02],[cz1,roof],[cz0,roof],[zf,hood+.07]],z)};
  const cab=cabinLoft(cf,zr,zf,18);
  // roof panel painted, the rest is glass: split by normal
  const glass=B();addGeo(glass,cab,'#ffffff',null);
  addGeo(A,new THREE.BoxGeometry(W*1.36,.035,cz0-cz1+.05),col,mx(0,roof+.006,(cz0+cz1)/2));
  // B-pillars (dark) between the side windows
  for(const sd of [-1,1])addGeo(A,new THREE.BoxGeometry(.03,roof-deck-.06,.09),'#15181b',mx(sd*W*.9,(roof+deck)/2-.02,(cz0+cz1)/2+.05,0,0,sd*.18));
  // bumpers, grille, sills, mirrors
  const dark='#1e1f21';addGeo(A,new THREE.BoxGeometry(W*2-.04,.2,.16),o.bumper||col,mx(0,.42,L/2-.03));addGeo(A,new THREE.BoxGeometry(W*2-.04,.2,.16),o.bumper||col,mx(0,.44,-L/2+.03));
  addGeo(A,new THREE.BoxGeometry(W*1.1,.14,.04),dark,mx(0,.62,L/2+.01));addGeo(A,new THREE.BoxGeometry(W*1.4,.08,.05),dark,mx(0,.34,L/2+.06));
  for(const s of [-1,1]){addGeo(A,new THREE.BoxGeometry(.04,.07,L-1.3),dark,mx(s*(W+.005),.36,0));const mr=new THREE.BoxGeometry(.16,.1,.08);addGeo(A,mr,col,mx(s*(W*.93+.07),hood+.12,zf-.18));
    addGeo(A,new THREE.BoxGeometry(.02,.03,.18),'#9a9da2',mx(s*(W+.002),deck-.12,.25));addGeo(A,new THREE.BoxGeometry(.02,.03,.18),'#9a9da2',mx(s*(W+.002),deck-.12,-.75))}
  // wheel arches (dark liners)
  const wz=o.wz||[L/2-.95,-L/2+.85];for(const z of wz)for(const s of [-1,1]){const arch=new THREE.CylinderGeometry(.4,.4,.2,14,1,true,0,Math.PI);arch.rotateZ(Math.PI/2);addGeo(A,arch,'#121212',mx(s*(W-.09),.36,z))}
  const head=[],tail=[];for(const s of [-1,1]){head.push(new THREE.BoxGeometry(.36,.11,.05).applyMatrix4(mx(s*(W-.28),hood-.2,L/2-.03,-.25,0,0)));tail.push(new THREE.BoxGeometry(.34,.12,.05).applyMatrix4(mx(s*(W-.25),deck-.18,-L/2+.02)))}
  const plates=[new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.5,L/2+.115)),new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.62,-L/2-.085,0,Math.PI,0))];
  return{A,glass:[toGeo(glass)],head,tail,plates,wheels:wz.map((z,i)=>[-1,1].map(s=>({x:s*(W-.12),z,r:o.wr||.31,w:.21,front:i===0,spokes:o.spokes||5,style:o.rim||'alloy'}))).flat(),seat:{x:.36,y:.38,z:(cz0+zr)/2+.2},len:L,wid:W*2,roof}}
SPEC.car=(col)=>sedan(col);
SPEC.hatch=(col)=>sedan(col,{L:3.7,W:1.66,roof:1.5,zr:-1.65,zf:.45,deck:1.0,hood:.9,wz:[1.18,-1.2],wr:.29,spokes:4,rim:'steel'});
SPEC.taxi=(col)=>{const s=sedan(col,{L:3.65,W:1.64,roof:1.52,zr:-1.62,zf:.42,deck:1.0,hood:.88,wz:[1.16,-1.18],wr:.28,spokes:4,rim:'steel',bumper:'#2a2a2a'});
  s.extra=[{geo:new THREE.BoxGeometry(.56,.16,.22).applyMatrix4(mx(0,s.roof+.1,-.45)),mat:M.taxiSign}];
  // number on the doors (company stripe) in black checks
  for(const sd of [-1,1])for(let k=0;k<8;k++)addGeo(s.A,new THREE.BoxGeometry(.01,.06,.12),k%2?'#111':'#f2c01e',mx(sd*(1.64/2+.004),.62,-.9+k*.24));return s};
SPEC.police=(col)=>{const s=sedan('#f4f4f2',{L:4.5,W:1.78,roof:1.44,bumper:'#1f1f1f'});
  for(const sd of [-1,1]){addGeo(s.A,new THREE.BoxGeometry(.012,.16,3.6),'#0f6b33',mx(sd*(1.78/2+.006),.66,0));addGeo(s.A,new THREE.BoxGeometry(.012,.04,3.6),'#f2c01e',mx(sd*(1.78/2+.007),.56,0))}
  const bar=new THREE.BoxGeometry(1.0,.1,.24).applyMatrix4(mx(0,s.roof+.07,-.25));s.extra=[{geo:bar,mat:'siren'}];
  s.extra.push({geo:new THREE.PlaneGeometry(1.4,.26).applyMatrix4(mx(1.78/2+.012,.86,-.2,0,Math.PI/2,0)),mat:M.police},{geo:new THREE.PlaneGeometry(1.4,.26).applyMatrix4(mx(-1.78/2-.012,.86,-.2,0,-Math.PI/2,0)),mat:M.police});return s};
SPEC.suv=(col)=>sedan(col,{L:4.6,W:1.86,roof:1.72,hood:1.08,deck:1.12,zr:-2.1,zf:.95,wz:[1.4,-1.42],wr:.36,spokes:6});
// minibus (buseta) and city bus share a boxy rounded loft
function busBody(col,o){const L=o.L,W=o.W/2,A=B();const H=o.H;
  const f={w:z=>W*interp([[-L/2,.985],[-L/2+.2,1],[L/2-.2,1],[L/2,.985]],z),y0:z=>.45,yb:z=>H-.25,yt:z=>interp([[-L/2,H-.05],[-L/2+.25,H],[L/2-.3,H],[L/2,H-.08]],z)};
  addGeo(A,bodyLoft(L,f,12),col);
  const gl='#1f2b33';
  for(const sd of [-1,1]){addGeo(A,new THREE.BoxGeometry(.02,H-.32-o.win0,L-1.0),gl,mx(sd*(W+.008),(H-.32+o.win0)/2,-.25));
    for(const [a,b,c] of o.stripes)addGeo(A,new THREE.BoxGeometry(.02,b-a,L-.1),c,mx(sd*(W+.009),(a+b)/2,0))}
  addGeo(A,new THREE.BoxGeometry(W*2-.15,H-.25-o.win0+.1,.03),gl,mx(0,(H-.25+o.win0-.1)/2,L/2+.008));
  addGeo(A,new THREE.BoxGeometry(W*2-.3,.7,.03),gl,mx(0,H-.75,-L/2-.008));
  for(const [a,b,c] of o.stripes)addGeo(A,new THREE.BoxGeometry(W*2-.05,b-a,.02),c,mx(0,(a+b)/2,L/2+.01));
  const head=[],tail=[];for(const s of [-1,1]){head.push(new THREE.BoxGeometry(.32,.18,.05).applyMatrix4(mx(s*(W-.3),.95,L/2+.01)));tail.push(new THREE.BoxGeometry(.2,.32,.05).applyMatrix4(mx(s*(W-.2),1.2,-L/2-.01)))}
  addGeo(A,new THREE.BoxGeometry(W*2,.28,.12),'#1e1f21',mx(0,.55,L/2+.02));addGeo(A,new THREE.BoxGeometry(W*2,.28,.12),'#1e1f21',mx(0,.55,-L/2-.02));
  // window pillars
  const nwin=o.nwin;for(let k=0;k<=nwin;k++){const z=-L/2+.5+k*(L-1.6)/nwin;for(const s of [-1,1])addGeo(A,new THREE.BoxGeometry(.03,H-.32-o.win0,.1),col,mx(s*(W+.004),(H-.32+o.win0)/2,z))}
  // doors on both sides
  for(const sd of [-1,1])addGeo(A,new THREE.BoxGeometry(.03,H-.6,.9),'#2b3a44',mx(sd*(W+.006),(H-.2)/2+.15,L/2-1.2));
  for(const s of [-1,1])addGeo(A,new THREE.BoxGeometry(.18,.12,.12),'#1e1f21',mx(s*(W+.08),H-.5,L/2-.15));
  const plates=[new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.55,L/2+.09)),new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.62,-L/2-.09,0,Math.PI,0))];
  for(const z of o.wz)for(const s of [-1,1]){const arch=new THREE.CylinderGeometry(o.wr+.08,o.wr+.08,.24,14,1,true,0,Math.PI);arch.rotateZ(Math.PI/2);addGeo(A,arch,'#121212',mx(s*(W-.11),o.wr+.03,z))}
  return{A,glass:[],head,tail,plates,wheels:o.wz.map((z,i)=>[-1,1].map(s=>({x:s*(W-.14),z,r:o.wr,w:.28,front:i===0,spokes:8,style:'steel'}))).flat(),seat:{x:W-.55,y:.75,z:L/2-.95},len:L,wid:W*2,roof:H}}
SPEC.buseta=(col,alt)=>{const s=busBody(col,{L:7,W:2.25,H:2.85,win0:1.55,nwin:5,wz:[2.35,-2.2],wr:.42,stripes:[[.85,1.05,alt[0]],[1.08,1.18,alt[1]]]});return s};
SPEC.bus=(col)=>{const s=busBody('#f4f4f2',{L:12,W:2.55,H:3.15,win0:1.35,nwin:8,wz:[4,-2.9,-4.1],wr:.5,stripes:[[.7,1.0,'#1f9aa6'],[1.02,1.16,'#f28c28']]});
  s.extra=[{geo:new THREE.PlaneGeometry(1.6,.26).applyMatrix4(mx(0,2.86,6.02)),mat:M.busSign}];return s};
// chiva rumbera: open-sided wooden party bus painted in bright stripes, truck nose in front
SPEC.chiva=()=>{const A=B();const L=8.2,W=1.2,H=3.05,cols=['#e4572e','#f0b429','#1f9aa6','#2e7d32','#d32f2f','#7b1fa2','#f28c28','#1565c0'];const wood='#8a5a36';
  addGeo(A,new THREE.BoxGeometry(W*2,.35,L-.3),'#1e1f21',mx(0,.62,0));
  // truck nose and cab
  addGeo(A,new THREE.BoxGeometry(W*2-.3,.75,1.5),'#f0b429',mx(0,1.12,L/2-.85));addGeo(A,new THREE.BoxGeometry(W*2-.32,.08,1.3),'#d32f2f',mx(0,1.52,L/2-.8));
  addGeo(A,new THREE.BoxGeometry(W*2-.4,.5,.06),'#2b2b2b',mx(0,1.05,L/2-.08));
  addGeo(A,new THREE.BoxGeometry(W*2,.12,.6),'#1e1f21',mx(0,.55,L/2-.1));
  // body floor and painted side boards (stripes)
  const z0=-L/2+.1,z1=L/2-1.65,BL=z1-z0,zc=(z0+z1)/2;
  addGeo(A,new THREE.BoxGeometry(W*2,.1,BL),wood,mx(0,.85,zc));
  for(const sd of [-1,1]){for(let k=0;k<6;k++){const y=.9+k*.12;addGeo(A,new THREE.BoxGeometry(.05,.11,BL),cols[(k+(sd>0?0:3))%cols.length],mx(sd*(W+.0),y+.055,zc))}
    // pillars between the open benches
    const n=8;for(let k=0;k<=n;k++){const z=z0+k*BL/n;addGeo(A,new THREE.BoxGeometry(.07,H-1.62,.09),cols[k%cols.length],mx(sd*W,1.62+(H-1.62)/2,z))}
    addGeo(A,new THREE.BoxGeometry(.06,.22,BL),cols[(sd>0?2:5)],mx(sd*W,H-.1,zc))}
  // back and front walls of the body, roof and luggage rack
  addGeo(A,new THREE.BoxGeometry(W*2,H-.85,.08),'#f0b429',mx(0,.85+(H-.85)/2,z0));addGeo(A,new THREE.BoxGeometry(W*2,1.0,.06),'#1f9aa6',mx(0,H-.5,z1));
  addGeo(A,new THREE.BoxGeometry(W*2+.12,.08,L-.2),'#f4f1ea',mx(0,H+.04,-.1));
  for(const sd of [-1,1])addGeo(A,new THREE.BoxGeometry(.05,.25,L-.6),'#c0c4c8',mx(sd*(W-.05),H+.2,-.2));
  for(let k=0;k<4;k++)addGeo(A,new THREE.BoxGeometry(.7,.45,.6),cols[k*2%cols.length],mx((k%2?-.4:.4),H+.3,-2.4+k*1.3));
  // benches across
  for(let k=0;k<7;k++){const z=z0+.5+k*(BL-.8)/6;addGeo(A,new THREE.BoxGeometry(W*2-.15,.08,.4),wood,mx(0,1.3,z));addGeo(A,new THREE.BoxGeometry(W*2-.15,.4,.06),wood,mx(0,1.55,z-.2))}
  const head=[],tail=[];for(const s of [-1,1]){head.push(new THREE.BoxGeometry(.26,.2,.05).applyMatrix4(mx(s*(W-.35),1.15,L/2-.06)));tail.push(new THREE.BoxGeometry(.2,.26,.05).applyMatrix4(mx(s*(W-.2),1.1,-L/2+.04)))}
  const plates=[new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.62,L/2+.21)),new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.75,-L/2+.03,0,Math.PI,0))];
  const wz=[2.7,-2.4],wr=.48;
  return{A,glass:[],head,tail,plates,wheels:wz.map((z,i)=>[-1,1].map(s=>({x:s*(W-.14),z,r:wr,w:.3,front:i===0,spokes:8,style:'steel'}))).flat(),seat:{x:.45,y:1.0,z:L/2-1.6},len:L,wid:W*2,roof:H}};
// motorcycle (no body loft): frame, tank, seat, fork; rider seated
SPEC.moto=(col)=>{const A=B();const dark='#1c1c1e',chrome='#b9bcc1';
  addGeo(A,new THREE.BoxGeometry(.1,.1,.95),dark,mx(0,.52,.0,-.25,0,0));addGeo(A,new THREE.BoxGeometry(.08,.08,.75),dark,mx(0,.42,-.25,.2,0,0));
  const tank=new THREE.SphereGeometry(.2,12,8);addGeo(A,tank,col,mx(0,.78,.18,0,0,0,.85,.7,1.35));
  addGeo(A,new THREE.BoxGeometry(.26,.09,.62),'#151515',mx(0,.8,-.32,.06,0,0));
  addGeo(A,new THREE.BoxGeometry(.3,.28,.3),col,mx(0,.62,-.38));// side panels
  addGeo(A,new THREE.BoxGeometry(.22,.24,.26),'#3a3c40',mx(0,.38,.05));// engine
  const ex=new THREE.CylinderGeometry(.04,.05,.8,8);ex.rotateX(Math.PI/2);addGeo(A,ex,chrome,mx(.14,.32,-.35,.12,0,0));
  for(const s of [-1,1]){const fk=new THREE.CylinderGeometry(.022,.022,.72,6);addGeo(A,fk,chrome,mx(s*.08,.6,.62,-.38,0,0))}
  addGeo(A,new THREE.BoxGeometry(.66,.03,.03),chrome,mx(0,.98,.48));for(const s of [-1,1])addGeo(A,new THREE.BoxGeometry(.08,.04,.04),'#111',mx(s*.32,.98,.47));
  addGeo(A,new THREE.BoxGeometry(.2,.04,.5),col,mx(0,.66,.66,-.3,0,0));// front fender
  addGeo(A,new THREE.BoxGeometry(.16,.04,.44),col,mx(0,.62,-.66,.4,0,0));
  const head=[new THREE.CylinderGeometry(.08,.07,.06,12).applyMatrix4(mx(0,.9,.62,Math.PI/2,0,0))],tail=[new THREE.BoxGeometry(.12,.05,.03).applyMatrix4(mx(0,.66,-.89))];
  const plates=[new THREE.PlaneGeometry(.2,.1).applyMatrix4(mx(0,.56,-.9,-.3,Math.PI,0))];
  return{A,glass:[],head,tail,plates,wheels:[{x:0,z:.68,r:.3,w:.11,front:true,spokes:6,style:'black'},{x:0,z:-.66,r:.3,w:.13,front:false,spokes:6,style:'black'}],seat:{x:0,y:.82,z:-.25},len:2,wid:.7,roof:1.2,moto:true}};
// motos de la Policía (verde neón, baúl con letrero y luces) y de Tránsito (blanca y azul), con espacio para dos
function motoKit(col,box,trim,txt,fg){const s=SPEC.moto(col);const A=s.A;
  addGeo(A,new THREE.BoxGeometry(.5,.4,.46),box,mx(0,1.0,-1.02));addGeo(A,new THREE.BoxGeometry(.52,.05,.48),trim,mx(0,1.22,-1.02));
  addGeo(A,new THREE.BoxGeometry(.06,.34,.6),'#1c1c1e',mx(0,.98,-.7));addGeo(A,new THREE.BoxGeometry(.28,.3,.05),'#9fb3bf',mx(0,1.12,.5,-.35,0,0));
  for(const sd of [-1,1])addGeo(A,new THREE.BoxGeometry(.05,.26,.5),trim,mx(sd*.17,.62,-.4));addGeo(A,new THREE.BoxGeometry(.3,.06,.36),trim,mx(0,.86,.18));
  const tm=new THREE.MeshLambertMaterial({map:signTex(txt,box,fg,256,64)});s.extra=[{geo:new THREE.BoxGeometry(.18,.06,.12).applyMatrix4(mx(0,1.27,-1.02)),mat:'siren'}];
  for(const sd of [-1,1])s.extra.push({geo:new THREE.PlaneGeometry(.42,.14).applyMatrix4(mx(sd*.253,1.0,-1.02,0,sd*Math.PI/2,0)),mat:tm});s.extra.push({geo:new THREE.PlaneGeometry(.42,.14).applyMatrix4(mx(0,1.0,-1.253,0,Math.PI,0)),mat:tm});
  s.sirenSmall=true;s.len=2.4;return s}
SPEC.motopol=()=>motoKit('#b5e61d','#b5e61d','#1c1c1e','POLICÍA','#0f3d1e');
SPEC.mototra=()=>motoKit('#f4f4f2','#1f4fa8','#1f4fa8','TRÁNSITO','#ffffff');
// cargo truck: square cab, chassis and either a closed box (furgón) or a wooden stake bed (estacas) loaded with sacks
function truck(col,kind){const A=B();const L=7.2,W=1.15,dark='#1e1f21',gl='#1f2b33',cz=L/2-1.0;
  addGeo(A,new THREE.BoxGeometry(W*2-.25,.28,L-.4),dark,mx(0,.72,0));
  addGeo(A,new THREE.BoxGeometry(W*2,1.45,1.8),col,mx(0,1.62,cz));addGeo(A,new THREE.BoxGeometry(W*2-.06,.5,.5),col,mx(0,1.05,L/2-.15));
  addGeo(A,new THREE.BoxGeometry(W*2-.25,.58,.02),gl,mx(0,1.98,cz+.91));for(const sd of [-1,1])addGeo(A,new THREE.BoxGeometry(.02,.55,.85),gl,mx(sd*(W+.005),1.98,cz+.3));
  addGeo(A,new THREE.BoxGeometry(W*1.3,.34,.03),'#9a9da2',mx(0,1.05,L/2+.11));addGeo(A,new THREE.BoxGeometry(W*2+.04,.22,.18),'#2a2a2a',mx(0,.72,L/2+.05));
  for(const sd of [-1,1])addGeo(A,new THREE.BoxGeometry(.08,.3,.06),dark,mx(sd*(W+.12),2.0,cz+.75));
  const z0=-L/2+.05,z1=cz-.95,BL=z1-z0,zc=(z0+z1)/2;
  if(kind==='box'){addGeo(A,new THREE.BoxGeometry(W*2+.05,2.4,BL),'#f2f0ea',mx(0,2.07,zc));for(const sd of [-1,1])addGeo(A,new THREE.BoxGeometry(.02,.28,BL-.2),col,mx(sd*(W+.04),1.2,zc))}
  else{const wood='#8a5a36',wood2='#a8774a';addGeo(A,new THREE.BoxGeometry(W*2+.05,.12,BL),wood,mx(0,.92,zc));
    for(const sd of [-1,1]){for(let k=0;k<=6;k++)addGeo(A,new THREE.BoxGeometry(.07,1.25,.08),wood2,mx(sd*(W+.0),1.6,z0+k*BL/6));for(const y of [1.25,1.65,2.1])addGeo(A,new THREE.BoxGeometry(.04,.12,BL),wood,mx(sd*(W+.02),y,zc))}
    for(let k=0;k<=4;k++)addGeo(A,new THREE.BoxGeometry(.07,1.25,.08),wood2,mx(-W+k*W/2,1.6,z0));
    for(let k=0;k<14;k++){const sx=-.7+(k%3)*.7,sz=z0+.6+Math.floor(k/3)*BL/5.3;addGeo(A,new THREE.SphereGeometry(.38,8,5),k%4?'#d8c79c':'#b5a07a',mx(sx,1.25+(k%2)*.12,sz,0,0,0,1,.6,1.3))}}
  const head=[],tail=[];for(const s of [-1,1]){head.push(new THREE.BoxGeometry(.3,.16,.05).applyMatrix4(mx(s*(W-.3),1.05,L/2+.11)));tail.push(new THREE.BoxGeometry(.18,.24,.05).applyMatrix4(mx(s*(W-.2),.9,-L/2-.02)))}
  const plates=[new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.8,L/2+.15)),new THREE.PlaneGeometry(.34,.17).applyMatrix4(mx(0,.8,-L/2-.03,0,Math.PI,0))];
  const wz=[cz-.15,-L/2+1.55];
  return{A,glass:[],head,tail,plates,wheels:wz.map((z,i)=>[-1,1].map(s=>({x:s*(W-.15),z,r:.5,w:.3,front:i===0,spokes:8,style:'steel'}))).flat(),seat:{x:-.5,y:1.3,z:cz-.05},len:L,wid:W*2,roof:kind==='box'?3.3:2.4}}
SPEC.camion=(col)=>truck(col,'box');
SPEC.estacas=(col)=>truck(col,'stake');
// pickup (camioneta de platón): sedan cabin up front, open bed with side walls behind it
SPEC.pickup=(col)=>{const s=sedan(col,{L:5.2,W:1.86,roof:1.86,hood:1.12,deck:1.1,zr:-.45,zf:1.45,wz:[1.65,-1.7],wr:.38,spokes:6,rim:'steel',bumper:'#2a2a2a'});
  const W=1.86/2,z0=-5.2/2+.06,z1=-.5,BL=z1-z0,zc=(z0+z1)/2;addGeo(s.A,new THREE.BoxGeometry(W*2-.18,.02,BL),'#26282b',mx(0,1.11,zc));
  for(const sd of [-1,1])addGeo(s.A,new THREE.BoxGeometry(.07,.42,BL),col,mx(sd*(W-.05),1.3,zc));addGeo(s.A,new THREE.BoxGeometry(W*2-.04,.42,.07),col,mx(0,1.3,z0));
  for(const sd of [-1,1])addGeo(s.A,new THREE.BoxGeometry(.05,.05,.9),'#9a9da2',mx(sd*(W-.05),1.55,-.95));return s};
// motocarro: three-wheeler with a canopy, front cowl and a bench for passengers or cargo
SPEC.motocarro=(col)=>{const A=B();const dark='#1c1c1e';
  addGeo(A,new THREE.BoxGeometry(1.25,.14,2.25),dark,mx(0,.38,-.15));addGeo(A,new THREE.BoxGeometry(1.2,.35,.9),col,mx(0,.62,-.7));
  addGeo(A,new THREE.BoxGeometry(.8,.95,.25),col,mx(0,.85,.98));addGeo(A,new THREE.BoxGeometry(.78,.45,.03),'#26343e',mx(0,1.55,.98));
  addGeo(A,new THREE.BoxGeometry(1.32,.06,2.3),col,mx(0,1.86,-.1));for(const sx of [-.6,.6])for(const sz of [.95,-1.15])addGeo(A,new THREE.BoxGeometry(.04,1.3,.04),dark,mx(sx,1.2,sz));
  addGeo(A,new THREE.BoxGeometry(.45,.12,.4),'#151515',mx(0,.92,.3));addGeo(A,new THREE.BoxGeometry(1.1,.14,.45),'#151515',mx(0,.92,-.75));addGeo(A,new THREE.BoxGeometry(1.1,.45,.06),'#151515',mx(0,1.15,-1.0));
  addGeo(A,new THREE.BoxGeometry(.6,.03,.03),'#b9bcc1',mx(0,1.2,.75));
  const head=[new THREE.CylinderGeometry(.08,.07,.05,12).applyMatrix4(mx(0,1.2,1.12,Math.PI/2,0,0))],tail=[];for(const s of [-1,1])tail.push(new THREE.BoxGeometry(.1,.08,.03).applyMatrix4(mx(s*.5,.6,-1.27)));
  const plates=[new THREE.PlaneGeometry(.26,.13).applyMatrix4(mx(0,.6,-1.29,0,Math.PI,0))];
  return{A,glass:[],head,tail,plates,wheels:[{x:0,z:.98,r:.25,w:.12,front:true,spokes:5,style:'black'},{x:-.55,z:-.75,r:.25,w:.12,front:false,spokes:5,style:'black'},{x:.55,z:-.75,r:.25,w:.12,front:false,spokes:5,style:'black'}],
    seat:{x:0,y:.98,z:.25},len:2.7,wid:1.32,roof:1.9,open:true}};
// bicycle: thin frame, handlebar and saddle; the rider sits on it like a motorcycle
SPEC.bici=(col)=>{const A=B();const dark='#1c1c1e',r=.34;const tube=(x0,y0,z0,x1,y1,z1,t,c)=>{const dx=x1-x0,dy=y1-y0,dz=z1-z0,l=Math.hypot(dx,dy,dz);const g=new THREE.CylinderGeometry(t,t,l,6);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/l,dy/l,dz/l));g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),q,new THREE.Vector3(1,1,1)));addGeo(A,g,c)};
  const rear=[0,r,-.52],front=[0,r,.55],bb=[0,.33,-.02],seatT=[0,.88,-.22],head=[0,.92,.4];
  tube(...rear,...bb,.018,col);tube(...bb,...seatT,.022,col);tube(...seatT,...head,.022,col);tube(...bb,...head,.025,col);tube(...rear,...seatT,.015,col);tube(...head,...front,.018,'#9a9da2');
  addGeo(A,new THREE.BoxGeometry(.12,.05,.26),dark,mx(0,.93,-.24));addGeo(A,new THREE.BoxGeometry(.5,.025,.025),dark,mx(0,1.0,.36));addGeo(A,new THREE.CylinderGeometry(.08,.08,.03,10),'#b9bcc1',mx(.06,.33,-.02,0,0,Math.PI/2));
  return{A,glass:[],head:[],tail:[],plates:[],wheels:[{x:0,z:.55,r,w:.04,front:true,spokes:12,style:'black'},{x:0,z:-.52,r,w:.04,front:false,spokes:12,style:'black'}],seat:{x:0,y:.86,z:-.2},len:1.75,wid:.5,roof:1.2,moto:true}};
// horse-drawn carriage of the walled city (horse is an animated model added by the game)
SPEC.coche=(col)=>{const A=B();const wood='#3a2617',gold='#c9a54a',red='#7a1414';
  const body=loft([{z:-1.5,pts:[[0,.75],[.7,.75],[.74,1.2],[.66,1.5],[0,1.5]]},{z:-1.4,pts:[[0,.72],[.74,.72],[.78,1.2],[.7,1.55],[0,1.55]]},{z:-.15,pts:[[0,.72],[.74,.72],[.78,1.2],[.7,1.55],[0,1.55]]},{z:-.05,pts:[[0,.8],[.7,.8],[.72,1.15],[.66,1.4],[0,1.4]]}]);
  addGeo(A,body,col);addGeo(A,new THREE.BoxGeometry(1.36,.1,1.2),red,mx(0,1.18,-.85));addGeo(A,new THREE.BoxGeometry(1.36,.45,.1),red,mx(0,1.42,-1.42));
  addGeo(A,new THREE.BoxGeometry(.9,.5,.5),col,mx(0,1.2,.3));addGeo(A,new THREE.BoxGeometry(.9,.08,.5),red,mx(0,1.47,.3));
  // folding canopy
  for(const s of [-1,1]){addGeo(A,new THREE.BoxGeometry(.04,.04,2.6),gold,mx(s*.78,1.2,-.4));addGeo(A,new THREE.BoxGeometry(.05,.05,1.9),wood,mx(s*.38,.95,1.55))}
  const head=[new THREE.BoxGeometry(.12,.16,.12).applyMatrix4(mx(-.7,1.7,.15)),new THREE.BoxGeometry(.12,.16,.12).applyMatrix4(mx(.7,1.7,.15))],tail=[];
  return{A,glass:[],head,tail,plates:[],wheels:[{x:-.8,z:-1.0,r:.62,w:.07,front:false,spokes:12,style:'wood'},{x:.8,z:-1.0,r:.62,w:.07,front:false,spokes:12,style:'wood'},{x:-.75,z:.35,r:.42,w:.06,front:true,spokes:10,style:'wood'},{x:.75,z:.35,r:.42,w:.06,front:true,spokes:10,style:'wood'}],
    seat:{x:0,y:1.36,z:.3},len:5.2,wid:1.6,roof:2.2,horse:{z:3.05}}};
function woodWheel(r,w,spokes){const key='wood|'+r;if(WG.has(key))return WG.get(key);const A=B();const t=new THREE.TorusGeometry(r-.03,.035,6,24);t.rotateY(Math.PI/2);addGeo(A,t,'#2a1a0e');
  for(let k=0;k<spokes;k++){const a=k/spokes*TAU;addGeo(A,new THREE.BoxGeometry(.03,r*.92,.03),'#b8862e',mx(0,Math.cos(a)*r*.46,Math.sin(a)*r*.46,a,0,0))}
  const hub=new THREE.CylinderGeometry(.07,.07,.12,10);hub.rotateZ(Math.PI/2);addGeo(A,hub,'#3a2617');const g=toGeo(A);WG.set(key,g);return g}

/* ---------- assemble ---------- */
const CACHE=new Map();
function design(type,col,alt){const key=type+col+(alt||'');if(CACHE.has(key))return CACHE.get(key);const d=SPEC[type](col,alt||['#e4572e','#1565c0']);
  d.bodyGeo=toGeo(d.A);d.wgeo=d.wheels.map(w=>w.style==='wood'?woodWheel(w.r,w.w,w.spokes):wheelGeo(w.r,w.w,w.spokes,w.style));
  // far-away version: everything merged into one mesh
  const L=B();addGeo(L,d.bodyGeo,'#ffffff',null,(x,y,z)=>null);for(let i=0;i<L.c.length;i++)L.c[i]=d.bodyGeo.attributes.color.array[i];
  for(const g of d.glass)addGeo(L,g,'#26343e');for(const g of d.head)addGeo(L,g,'#d9d6c8');for(const g of d.tail)addGeo(L,g,'#7a1010');
  d.wheels.forEach((w,i)=>{const g=d.wgeo[i];const m=mx(w.x,w.r,w.z);const off=L.c.length;addGeo(L,g,'#ffffff',m);const src=g.attributes.color.array;for(let k=0;k<src.length;k++)L.c[off+k]=src[k]});
  for(const e of d.extra||[])addGeo(L,e.geo,e.mat==='siren'?'#2244aa':'#f4f4f2');
  // far-away version: a few boxes (body, dark cabin, wheels) instead of the full merged model, so hundreds of cars stay cheap
  {const S=B(),Lh=d.len/2,Wd=d.wid,R=d.roof||1.5,bc=col||'#cccccc';const big=R>2.2,moto=!!d.moto;
    if(moto){addGeo(S,new THREE.BoxGeometry(.3,.6,d.len*.8),bc,mx(0,.65,0));addGeo(S,new THREE.BoxGeometry(.1,.6,.6),'#1b1b1b',mx(0,.3,d.len*.35));addGeo(S,new THREE.BoxGeometry(.1,.6,.6),'#1b1b1b',mx(0,.3,-d.len*.35))}
    else{const y0=big?.45:.32,yb=big?R*.5:R*.55;addGeo(S,new THREE.BoxGeometry(Wd*.98,yb-y0,d.len*.98),bc,mx(0,(y0+yb)/2,0));
      if(big)addGeo(S,new THREE.BoxGeometry(Wd*.99,R-yb,d.len*.96),'#2a3640',mx(0,(yb+R)/2,0));else{addGeo(S,new THREE.BoxGeometry(Wd*.86,R-yb,d.len*.5),'#26343e',mx(0,(yb+R)/2,-d.len*.05));addGeo(S,new THREE.BoxGeometry(Wd*.8,.04,d.len*.42),bc,mx(0,R,-d.len*.05))}
      for(const w of d.wheels)addGeo(S,new THREE.BoxGeometry(.22,w.r*1.9,w.r*1.9),'#151515',mx(w.x,w.r,w.z))}
    d.lodGeo=toGeo(S)}d.head=d.head.length?mergeG(d.head):null;d.tail=d.tail.length?mergeG(d.tail):null;CACHE.set(key,d);return d}
function mergeG(list){const A=B();list.forEach(g=>addGeo(A,g,'#fff'));const g=toGeo(A);g.deleteAttribute('color');return g}
const sirenMat=[new THREE.MeshBasicMaterial({color:0xff2a1a}),new THREE.MeshBasicMaterial({color:0x2a5bff})];
function build(type,col,alt){const d=design(type,col,alt);const root=new THREE.Group();const near=new THREE.Group();root.add(near);
  const body=new THREE.Group();near.add(body);// body moves with the suspension; wheels stay on the ground
  const paint=new THREE.Mesh(d.bodyGeo,M.paint);paint.castShadow=true;body.add(paint);
  for(const g of d.glass){const m=new THREE.Mesh(g,M.glass);m.renderOrder=2;body.add(m)}
  const hm=d.head?new THREE.Mesh(d.head,M.head):null;if(hm)body.add(hm);const tm=d.tail?new THREE.Mesh(d.tail,M.tail):null;if(tm)body.add(tm);
  const plate=PLATES[Math.floor(Math.random()*PLATES.length)];for(const g of d.plates)body.add(new THREE.Mesh(g,plate));
  let siren=null;for(const e of d.extra||[]){if(e.mat==='siren'){const bb=e.geo.clone();bb.computeBoundingBox();const c=bb.boundingBox.getCenter(new THREE.Vector3());
      const sm=d.sirenSmall,sw=sm?.1:.46,so=sm?.07:.25,l=new THREE.Mesh(new THREE.BoxGeometry(sw,sm?.08:.1,sm?.1:.22),sirenMat[0]),r=new THREE.Mesh(new THREE.BoxGeometry(sw,sm?.08:.1,sm?.1:.22),sirenMat[1]);l.position.set(c.x-so,c.y,c.z);r.position.set(c.x+so,c.y,c.z);body.add(l,r);siren=[l,r]}
    else body.add(new THREE.Mesh(e.geo,e.mat))}
  const wheels=d.wheels.map((w,i)=>{const piv=new THREE.Group();piv.position.set(w.x,w.r,w.z);const m=new THREE.Mesh(d.wgeo[i],M.wheel);m.castShadow=false;if(w.x<0&&w.style!=='wood')m.rotation.y=Math.PI;piv.add(m);near.add(piv);return{piv,m,r:w.r,front:w.front,flip:w.x<0&&w.style!=='wood'}});
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(d.wid+.7,d.len+.8),M.shadow);sh.rotation.x=-Math.PI/2;sh.position.y=.04;sh.renderOrder=1;root.add(sh);
  const lod=new THREE.Mesh(d.lodGeo,M.lod);lod.visible=false;lod.castShadow=true;root.add(lod);
  return{root,near,body,paint,wheels,lod,headMesh:hm,tailMesh:tm,siren,seat:d.seat,len:d.len,wid:d.wid,horse:d.horse,moto:!!d.moto,open:!!d.open,spin:0,steer:0,pitch:0,roll:0,pv:0,rv:0,lastSpeed:0,bounce:0}}
// per-frame animation: wheel spin & steering, suspension pitch/roll, brake lights
function animateRig(R,speed,yawRate,dt,opt){opt=opt||{};const near=!R.lod.visible;
  R.spin+=speed*dt;const acc=(speed-R.lastSpeed)/Math.max(dt,1e-3);R.lastSpeed=speed;
  if(near){for(const w of R.wheels){w.m.rotation.x=(w.flip?-1:1)*R.spin/w.r;if(w.front){const st=Math.max(-.55,Math.min(.55,yawRate*2.6/Math.max(2,Math.abs(speed))*Math.sign(speed||1)));w.piv.rotation.y+=(st-w.piv.rotation.y)*Math.min(1,dt*8)}}
    // spring-damper on pitch (accel/brake) and roll (cornering)
    const tp=R.moto?0:Math.max(-.045,Math.min(.045,-acc*.006)),tr=R.moto?Math.max(-.6,Math.min(.6,-yawRate*speed*.075)):Math.max(-.05,Math.min(.05,yawRate*speed*.012));
    R.pv+=((tp-R.pitch)*60-R.pv*9)*dt;R.pitch+=R.pv*dt;R.rv+=((tr-R.roll)*(R.moto?30:55)-R.rv*(R.moto?10:8))*dt;R.roll+=R.rv*dt;
    R.bounce+=Math.abs(speed)*dt;const bump=opt.cobble?Math.sin(R.bounce*9)*.012*Math.min(1,Math.abs(speed)/6):0;
    if(R.moto){R.near.rotation.z=R.roll}else{R.body.rotation.x=R.pitch;R.body.rotation.z=R.roll;R.body.position.y=bump+Math.abs(R.pitch)*.2}}
  if(R.tailMesh)R.tailMesh.material=acc<-2.5||opt.braking?M.brake:M.tail}
function setNear(R,on){R.near.visible=on;R.lod.visible=!on}
return{build,animateRig,setNear,M,sirenMat,design}};
