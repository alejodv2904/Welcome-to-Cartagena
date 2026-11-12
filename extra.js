/* Cartagena Libre — vida de calle: locales y centros comerciales con interior, compras, energía,
   salto y golpe, radio del carro, postes con cables, semáforos y grupos de gente (dominó, terrazas). */
window.EXTRA=function(C){
'use strict';
const THREE=C.THREE,TAU=Math.PI*2,{rand,pick,rr,hash,dist2,clamp,lerp,angLerp}=C;
const player=C.player;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const $=id=>document.getElementById(id);

/* =========================================================================================
   1. TIPOS DE LOCAL, MENÚS Y NOMBRES (inventados, sin marcas reales)
   ========================================================================================= */
const TYPES={
  tienda:{label:'Tienda',bg:'#f0b429',fg:'#3b1d0a',names:['Tienda Donde Mañe','Tienda La Bendición','Granero La Esquina','Tienda Doña Chela','Tienda Mi Barrio','Granero El Progreso'],wall:'#f3e2b0',room:[8,9]},
  fritos:{label:'Fritos',bg:'#e4572e',fg:'#fff6d8',names:['Fritos Doña Eufemia','Arepas de Huevo La Negra','Fritanga El Bolsillo','Carimañolas Doña Cleo'],wall:'#f6d27a',room:[7,8]},
  restaurante:{label:'Restaurante',bg:'#2e7d32',fg:'#fff6d8',names:['Restaurante Sabor Costeño','Comedor La Muralla','Pescadería La Bahía','Restaurante El Corralito'],wall:'#f1e7d0',room:[12,12]},
  heladeria:{label:'Heladería',bg:'#f48fb1',fg:'#3b0a24',names:['Heladería Coco Loco','Raspao y Paleta','Heladería La Brisa'],wall:'#fde3ec',room:[8,8]},
  panaderia:{label:'Panadería',bg:'#a0522d',fg:'#fff1d6',names:['Panadería El Trigal','Panadería La Espiga','Panadería Pan de Coco'],wall:'#f6e6c8',room:[8,9]},
  drogueria:{label:'Droguería',bg:'#1565c0',fg:'#ffffff',names:['Droguería La Popa','Droguería San Diego','Droguería El Cabrero','Farmacia Manga'],wall:'#eef3f6',room:[8,9]},
  ropa:{label:'Ropa',bg:'#7b1fa2',fg:'#ffffff',names:['Almacén El Costeño','Boutique Caribe','Moda Getsemaní','Almacén La Moda'],wall:'#f2eef4',room:[12,13]},
  recuerdos:{label:'Artesanías',bg:'#1f9aa6',fg:'#ffffff',names:['Artesanías Las Bóvedas','Recuerdos del Caribe','Artesanías Zenú'],wall:'#f5ead7',room:[9,10]},
  joyeria:{label:'Joyería',bg:'#0b5d3b',fg:'#f6e7a8',names:['Esmeraldas del Corralito','Joyería La Esmeralda'],wall:'#e9efe9',room:[8,8]},
};
const MALLS=['Centro Comercial Bahía Plaza','Centro Comercial Portal de La Popa'];
const COLS={rojo:'#d32f2f',amarillo:'#f0b429',azul:'#1565c0',verde:'#2e7d32',negro:'#1d1d1d',blanco:'#f4f1ea',turquesa:'#1f9aa6',coral:'#e4572e'};
const MENUS={
  tienda:[{n:'Agua en bolsa',p:1000,e:15},{n:'Gaseosa',p:2500,e:22},{n:'Paquete de galletas',p:2000,e:18},{n:'Pan de bono',p:1500,e:15},{n:'Bolis de tamarindo',p:800,e:10},{n:'Jugo de corozo',p:3000,e:28}],
  fritos:[{n:'Arepa de huevo',p:4000,e:45},{n:'Carimañola',p:3000,e:35},{n:'Empanada',p:2500,e:30},{n:'Buñuelo',p:1500,e:18},{n:'Jugo de corozo',p:3000,e:28},{n:'Patacón con queso',p:6000,e:55}],
  restaurante:[{n:'Posta negra con arroz con coco',p:32000,e:100,max:10},{n:'Pescado frito con patacón',p:38000,e:100,max:10},{n:'Mote de queso',p:18000,e:70},{n:'Arroz con camarones',p:35000,e:100,max:8},{n:'Limonada de coco',p:9000,e:30}],
  heladeria:[{n:'Raspao de colores',p:3000,e:20},{n:'Paleta de mango',p:4000,e:22},{n:'Helado de coco',p:6000,e:30},{n:'Cocada',p:3000,e:25},{n:'Copa tropical',p:14000,e:55}],
  panaderia:[{n:'Pan de coco',p:2000,e:20},{n:'Pan de queso',p:1500,e:18},{n:'Tinto (café)',p:1000,e:15},{n:'Pastel de pollo',p:4500,e:40},{n:'Torta de plátano',p:5000,e:42}],
  drogueria:[{n:'Suero oral',p:4000,e:60},{n:'Bloqueador solar',p:25000,msg:'Ya no te vas a quemar con este sol'},{n:'Vitaminas',p:20000,e:30,max:15},{n:'Bebida energizante',p:6000,e:80}],
  ropa:[{n:'Guayabera blanca',p:85000,o:{top:'#f4f1ea',topReg:'guaya'}},{n:'Camiseta roja',p:35000,o:{top:COLS.rojo,topReg:null}},{n:'Camiseta amarilla',p:35000,o:{top:COLS.amarillo,topReg:null}},
        {n:'Camiseta azul',p:35000,o:{top:COLS.azul,topReg:null}},{n:'Camiseta negra',p:35000,o:{top:COLS.negro,topReg:null}},{n:'Pantalón beige',p:60000,o:{bottom:'#c8b89a'}},{n:'Jean',p:70000,o:{bottom:'#2b3a55'}},
        {n:'Pantalón blanco',p:60000,o:{bottom:'#efeae0'}},{n:'Tenis blancos',p:90000,o:{shoes:'#f2f2f2'}},{n:'Gorra roja',p:25000,o:{hat:'cap',hatC:COLS.rojo}},{n:'Gorra negra',p:25000,o:{hat:'cap',hatC:COLS.negro}},{n:'Quitarse el sombrero',p:0,o:{hat:null}}],
  recuerdos:[{n:'Sombrero vueltiao',p:90000,o:{hat:'vueltiao'}},{n:'Mochila wayuu',p:70000,o:{backpack:'#c2185b'}},{n:'Camiseta "Cartagena"',p:30000,o:{top:COLS.turquesa,topReg:null}},{n:'Camiseta coral',p:30000,o:{top:COLS.coral,topReg:null}},{n:'Llavero de chiva',p:5000,msg:'Un recuerdo de La Heroica'},{n:'Cuadro de palenquera',p:45000,msg:'Lo colgarás en tu casa'}],
  joyeria:[{n:'Anillo de esmeralda',p:450000,msg:'¡Una esmeralda colombiana! Ahora eres de la alta'},{n:'Cadena de oro',p:300000,msg:'Brilla bajo el sol del Caribe'},{n:'Aretes de filigrana',p:180000,msg:'Filigrana momposina, todo un clásico'}],
};
MENUS.mall_comidas=MENUS.fritos.concat(MENUS.restaurante.slice(0,2));

/* =========================================================================================
   2. ESTADO DEL JUGADOR: energía y vestimenta
   ========================================================================================= */
const P={en:100,max:100,spec:Object.assign({},C.heroSpec),cart:[],inv:[]};
function canSprint(){return P.en>2}
function rebuildPlayer(){const par=player.mesh.parent;const old=player.mesh;const nc=C.buildCharacter(Object.assign({},P.spec));
  nc.mesh.position.copy(old.position);nc.mesh.rotation.copy(old.rotation);if(par){par.remove(old);par.add(nc.mesh)}player.ch=nc;player.mesh=nc.mesh}

/* =========================================================================================
   3. TEXTURAS DE LETREROS (un atlas para todos los avisos de la calle)
   ========================================================================================= */
const SA=(function(){const W=2048,Hh=2048,c=document.createElement('canvas');c.width=W;c.height=Hh;const g=c.getContext('2d');const slots=[];const cw=512,chh=128;let n=0;
  function fit(t,maxW,size,font){g.font=`800 ${size}px ${font}`;while(g.measureText(t).width>maxW&&size>14){size-=2;g.font=`800 ${size}px ${font}`}return size}
  function sign(text,sub,bg,fg){const i=n++;const x=(i%4)*cw,y=Math.floor(i/4)*chh;g.save();g.translate(x,y);
    g.fillStyle=bg;g.fillRect(0,0,cw,chh);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(0,0,cw,chh*.45);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=8;g.strokeRect(4,4,cw-8,chh-8);
    g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';fit(text,cw-40,58,'Georgia, serif');g.fillText(text,cw/2,sub?chh*.42:chh/2);
    if(sub){g.font='700 24px sans-serif';g.globalAlpha=.85;g.fillText(sub.toUpperCase(),cw/2,chh*.8)}g.restore();
    const r=[x/W,1-(y+chh)/Hh,cw/W,chh/Hh];slots.push(r);return r}
  function stripes(colA,colB){const i=n++;const x=(i%4)*cw,y=Math.floor(i/4)*chh;for(let k=0;k<16;k++){g.fillStyle=k%2?colA:colB;g.fillRect(x+k*cw/16,y,cw/16,chh)}return[x/W,1-(y+chh)/Hh,cw/W,chh/Hh]}
  const tex=new THREE.CanvasTexture(c);tex.anisotropy=4;return{sign,stripes,tex,canvas:c}})();
const signR={};for(const k in TYPES)for(const nm of TYPES[k].names)signR[nm]=SA.sign(nm,TYPES[k].label,TYPES[k].bg,TYPES[k].fg);
for(const m of MALLS)signR[m]=SA.sign(m,'Centro comercial','#17130f','#f0b429');
const awnR={};for(const k in TYPES)awnR[k]=SA.stripes(TYPES[k].bg,'#f4f1ea');

/* =========================================================================================
   4. UBICAR LOCALES EN LAS FACHADAS QUE DAN A LA CALLE
   ========================================================================================= */
const SHOPS=[];
(function(){const B=C.MAP.buildings;const taken=new Map();const cell=(x,z,s)=>Math.floor(x/s)+','+Math.floor(z/s);
  const typeFor=zn=>{const r=rand();
    if(zn==='Centro Histórico'||zn==='San Diego')return r<.2?'recuerdos':r<.36?'restaurante':r<.48?'heladeria':r<.58?'ropa':r<.66?'joyeria':r<.76?'fritos':r<.86?'drogueria':'tienda';
    if(zn==='Getsemaní')return r<.3?'restaurante':r<.45?'fritos':r<.6?'tienda':r<.72?'recuerdos':r<.84?'heladeria':'panaderia';
    if(zn==='Bocagrande'||zn==='El Laguito'||zn==='Castillogrande')return r<.25?'restaurante':r<.4?'heladeria':r<.55?'ropa':r<.68?'drogueria':r<.8?'tienda':'recuerdos';
    return r<.3?'tienda':r<.45?'fritos':r<.58?'panaderia':r<.7?'drogueria':r<.82?'ropa':r<.9?'heladeria':'restaurante'};
  const order=B.map((b,i)=>i).sort((a,b)=>hash(a,77)-hash(b,77));
  // malls: the largest suitable building in Bocagrande and in Manga (or elsewhere outside the walls)
  const mallFor=[['Bocagrande',MALLS[0]],['Manga',MALLS[1]]];const mallB=new Set();
  for(const [zn,name] of mallFor){let best=-1,ba=0;B.forEach((b,i)=>{if(b[1]&1)return;const p=b[3];if(p.length<8)return;const a=Math.abs(C.signedArea(p));if(a<1200||a>15000)return;let cx=0,cz=0;for(let k=0;k<p.length;k+=2){cx+=p[k];cz+=p[k+1]}cx/=p.length/2;cz/=p.length/2;
      if(C.zoneName(cx,cz)!==zn)return;if(a>ba&&edgeDoor(p,true)){ba=a;best=i}});
    if(best<0)B.forEach((b,i)=>{if(best>=0||b[1]&1)return;const p=b[3];const a=Math.abs(C.signedArea(p));if(a>2500&&a<9000&&!mallB.size&&hash(i,5)<.05&&edgeDoor(p,true))best=i});
    if(best>=0){mallB.add(best);const d=edgeDoor(B[best][3],true);SHOPS.push(Object.assign(d,{type:'mall',name,mall:true}))}}
  for(const i of order){if(SHOPS.length>=170)break;if(mallB.has(i))continue;const b=B[i];if(b[1]&1)continue;const p=b[3];const a=Math.abs(C.signedArea(p));if(a<60||a>4000)continue;
    let cx=0,cz=0;for(let k=0;k<p.length;k+=2){cx+=p[k];cz+=p[k+1]}cx/=p.length/2;cz/=p.length/2;const zn=C.zoneName(cx,cz);
    const busy=zn==='Centro Histórico'||zn==='San Diego'||zn==='Getsemaní';const sp=busy?32:zn==='Bocagrande'?48:70;
    if(!busy&&hash(i,9)>.45)continue;const k=cell(cx,cz,sp);if(taken.has(k))continue;const d=edgeDoor(p,false);if(!d)continue;taken.set(k,1);
    const type=typeFor(zn);const nm=TYPES[type].names[Math.floor(hash(i,13)*TYPES[type].names.length)];SHOPS.push(Object.assign(d,{type,name:nm}))}
  // which edge of the footprint faces a street: door point on the sidewalk in front of it
  function edgeDoor(p,big){const n=p.length/2;let best=null,bs=-1;
    for(let k=0;k<n;k++){const j=(k+1)%n,ax=p[k*2],az=p[k*2+1],bx=p[j*2],bz=p[j*2+1];const L=Math.hypot(bx-ax,bz-az);if(L<(big?10:4.5))continue;
      let nx=(bz-az)/L,nz=-(bx-ax)/L;const mx=(ax+bx)/2,mz=(az+bz)/2;if(C.inPoly(p,mx+nx*.6,mz+nz*.6)){nx=-nx;nz=-nz}
      const dx=mx+nx*1.6,dz=mz+nz*1.6;if(!C.onLand(dx,dz)||C.solidAt(dx,dz))continue;const r=C.nearestRoad(dx,dz,big?16:11,s=>!s.walk);if(!r)continue;
      const sc=L-Math.hypot(r.x-dx,r.z-dz)*.5;if(sc>bs){bs=sc;best={x:dx,z:dz,wx:mx,wz:mz,nx,nz,len:L,yaw:Math.atan2(nx,nz),gy:C.ground(mx,mz)}}}
    return best}
})();

/* fachada: letrero, toldo de rayas y una puerta oscura — todo en un solo mesh */
(function(){const P=[],U=[],N=[],Pd=[],Nd=[];
  function quad(arr,nrm,a,b,c,d,uv,r){const pts=[a,b,c,d];const id=[0,1,2,0,2,3];for(const i of id){arr.push(pts[i].x,pts[i].y,pts[i].z);if(nrm)nrm.push(r.n.x,r.n.y,r.n.z);if(uv)U.push(uv[i][0],uv[i][1])}}
  for(const s of SHOPS){const n=V3(s.nx,0,s.nz),t=V3(s.nz,0,-s.nx);const w=V3(s.wx,s.gy,s.wz).addScaledVector(n,.06);
    const SW=s.mall?Math.min(14,s.len*.7):3.2,SH=s.mall?2.4:.72,sy=s.mall?7.2:3.35;const r=signR[s.name];
    const uv=[[r[0],r[1]],[r[0]+r[2],r[1]],[r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]];
    const p0=w.clone().addScaledVector(t,-SW/2).setY(s.gy+sy-SH/2),p1=w.clone().addScaledVector(t,SW/2).setY(s.gy+sy-SH/2);
    quad(P,N,p0,p1,p1.clone().setY(s.gy+sy+SH/2),p0.clone().setY(s.gy+sy+SH/2),uv,{n});
    if(!s.mall){// awning
      const ar=awnR[s.type];const auv=[[ar[0],ar[1]],[ar[0]+ar[2],ar[1]],[ar[0]+ar[2],ar[1]+ar[3]],[ar[0],ar[1]+ar[3]]];const AW=3.4,ay=2.95;
      const a0=w.clone().addScaledVector(t,-AW/2).setY(s.gy+ay),a1=w.clone().addScaledVector(t,AW/2).setY(s.gy+ay);const b1=a1.clone().addScaledVector(n,1.1).setY(s.gy+ay-.45),b0=a0.clone().addScaledVector(n,1.1).setY(s.gy+ay-.45);
      const an=V3(0,1,0).addScaledVector(n,.4).normalize();quad(P,N,b0,b1,a1,a0,auv,{n:an});
      const c0=b0.clone().setY(b0.y-.25),c1=b1.clone().setY(b1.y-.25);quad(P,N,c0,c1,b1,b0,auv,{n})}
    // dark doorway
    const DW=s.mall?4:1.5,DH=s.mall?3.4:2.5;const d0=w.clone().addScaledVector(n,.02).addScaledVector(t,-DW/2),d1=w.clone().addScaledVector(n,.02).addScaledVector(t,DW/2);
    const dd=[d0,d1,d1.clone().setY(s.gy+DH),d0.clone().setY(s.gy+DH)];for(const i of [0,1,2,0,2,3]){Pd.push(dd[i].x,dd[i].y,dd[i].z);Nd.push(n.x,n.y,n.z)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  const m=new THREE.MeshLambertMaterial({map:SA.tex,emissiveMap:SA.tex,emissive:0x000000,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});C.nightMats.push(m);
  const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;C.scene.add(mesh);
  const gd=new THREE.BufferGeometry();gd.setAttribute('position',new THREE.Float32BufferAttribute(Pd,3));gd.setAttribute('normal',new THREE.Float32BufferAttribute(Nd,3));
  const md=new THREE.MeshLambertMaterial({color:'#2a2018',emissive:0x000000,polygonOffset:true,polygonOffsetFactor:-1});C.nightMats.push(md);C.scene.add(new THREE.Mesh(gd,md))})();

/* marcadores de entrada (como los de los juegos de mundo abierto): solo los más cercanos */
const MK=[];{const g=new THREE.CylinderGeometry(.75,.75,1.2,24,1,true);g.translate(0,.6,0);const ring=new THREE.RingGeometry(.55,.75,24);ring.rotateX(-Math.PI/2);ring.translate(0,.06,0);
  for(let i=0;i<6;i++){const grp=new THREE.Group();const m1=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    const m2=new THREE.Mesh(ring,new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.85,depthWrite:false}));grp.add(m1,m2);grp.visible=false;C.scene.add(grp);MK.push(grp)}}
let nearShop=null,mkT=0;
function updateMarkers(dt,now){mkT-=dt;if(mkT<=0){mkT=.4;const list=SHOPS.map(s=>[s,dist2(s.x,s.z,player.x,player.z)]).filter(q=>q[1]<45).sort((a,b)=>a[1]-b[1]).slice(0,MK.length);
    MK.forEach((m,i)=>{const q=list[i];m.visible=!!q;if(q){m.position.set(q[0].x,C.ground(q[0].x,q[0].z),q[0].z);m.scale.setScalar(q[0].mall?1.6:1)}})}
  for(const m of MK)if(m.visible){m.children[0].material.opacity=.2+.12*Math.sin(now*4);m.rotation.y+=dt}
  nearShop=null;if(!player.car&&!player.ride&&!ENT)for(const s of SHOPS){if(Math.abs(s.x-player.x)<2.6&&Math.abs(s.z-player.z)<2.6&&dist2(s.x,s.z,player.x,player.z)<(s.mall?3:2.1)){nearShop=s;break}}}

/* =========================================================================================
   5. INTERIORES (otra escena; se construyen al entrar y se guardan)
   ========================================================================================= */
const IS=new THREE.Scene();IS.background=new THREE.Color('#1b1712');
IS.add(new THREE.HemisphereLight(0xfff6e8,0x5b4b3a,.56));const isun=new THREE.DirectionalLight(0xfff0d8,.3);isun.position.set(3,10,6);IS.add(isun);
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(rep)t.repeat.set(rep[0],rep[1]);return t}
const tileTex=(a,b,gr)=>canvasTex(256,256,(g,w,h)=>{for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.fillStyle=(x+y)%2?a:b;g.fillRect(x*128,y*128,128,128);for(let k=0;k<300;k++){g.fillStyle=`rgba(${k%2?255:0},${k%2?255:0},${k%2?255:0},.04)`;g.fillRect(x*128+Math.random()*128,y*128+Math.random()*128,3,3)}}
  g.strokeStyle=gr||'rgba(0,0,0,.25)';g.lineWidth=4;for(let i=0;i<=2;i++){g.beginPath();g.moveTo(i*128,0);g.lineTo(i*128,h);g.stroke();g.beginPath();g.moveTo(0,i*128);g.lineTo(w,i*128);g.stroke()}});
const ML={};const lm=c=>ML[c]||(ML[c]=new THREE.MeshLambertMaterial({color:c}));
const glow=c=>new THREE.MeshBasicMaterial({color:c});
function signTex(text,sub,bg,fg){return canvasTex(512,128,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';let s=56;g.font=`800 ${s}px Georgia,serif`;while(g.measureText(text).width>w-40){s-=2;g.font=`800 ${s}px Georgia,serif`}
  g.fillText(text,w/2,sub?h*.42:h/2);if(sub){g.font='700 22px sans-serif';g.fillText(sub.toUpperCase(),w/2,h*.8)}})}
function boxAt(grp,w,h,d,m,x,y,z,col){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);grp.add(o);if(col)col.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});return o}
// many small product boxes in one instanced mesh
function products(grp,list){if(!list.length)return;const g=new THREE.BoxGeometry(1,1,1);const im=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({color:'#ffffff'}),list.length);const o=new THREE.Object3D();
  list.forEach((p,i)=>{o.position.set(p[0],p[1]+p[4]/2,p[2]);o.scale.set(p[3],p[4],p[5]);o.rotation.set(0,0,0);o.updateMatrix();im.setMatrixAt(i,o.matrix);im.setColorAt(i,new THREE.Color(p[6]))});grp.add(im)}
const PCOLS=['#d32f2f','#f0b429','#1565c0','#2e7d32','#f28c28','#7b1fa2','#ffffff','#e4572e','#1f9aa6','#fdd835','#8d6e63','#c2185b'];
function shelf(grp,col,x,z,len,rot,prod){// gondola with 4 levels
  const w=rot?.6:len,d=rot?len:.6;boxAt(grp,w,1.7,d,lm('#cfd4d8'),x,0,z,col);
  for(let lv=0;lv<4;lv++){const y=.2+lv*.42;const n=Math.floor(len/.16);for(let k=0;k<n;k++){const t=-len/2+.08+k*len/n;if(Math.random()<.12)continue;const c=pick(PCOLS);const hh=.14+Math.random()*.16;
      for(const side of [-1,1]){const px=rot?x+side*.36:x+t,pz=rot?z+t:z+side*.36;prod.push([px,y+.0,pz,rot?.14:.12,hh,rot?.12:.14,c])}}}}
function fridge(grp,col,x,z,w,rotY,prod){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotY;grp.add(g);boxAt(g,w,2.1,.8,lm('#e8ecef'),0,0,0);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(w-.15,1.8),new THREE.MeshBasicMaterial({color:'#bfe6ff',transparent:true,opacity:.25}));glass.position.set(0,1.1,.41);g.add(glass);
  const inner=new THREE.Mesh(new THREE.PlaneGeometry(w-.2,1.75),glow('#f4fbff'));inner.position.set(0,1.1,-.3);g.add(inner);
  const c=Math.cos(rotY),s=Math.sin(rotY);for(let lv=0;lv<4;lv++)for(let k=0;k<Math.floor(w/.13);k++){const lx=-w/2+.12+k*.13,ly=.35+lv*.42,lz=.05;prod.push([x+lx*c+lz*s,ly,z-lx*s+lz*c,.08,.26,.08,pick(PCOLS)])}
  const hw=rotY%Math.PI?(.8/2):w/2,hd=rotY%Math.PI?w/2:.4;col.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd})}
function counter(grp,col,x,z,w,col2){boxAt(grp,w,1.0,.7,lm(col2||'#8a5a36'),x,0,z,col);boxAt(grp,w+.1,.05,.8,lm('#e8e2d4'),x,1.0,z);boxAt(grp,.4,.25,.3,lm('#2b2b2b'),x+w/2-.4,1.05,z)}
function table(grp,col,x,z,chairs){const t=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.04,16),lm('#f4f1ea'));t.position.set(x,.74,z);grp.add(t);boxAt(grp,.06,.72,.06,lm('#9aa0a6'),x,0,z);col.push({x0:x-.45,x1:x+.45,z0:z-.45,z1:z+.45});
  const seats=[];for(let k=0;k<(chairs||4);k++){const a=k/(chairs||4)*TAU;const cx=x+Math.sin(a)*.8,cz=z+Math.cos(a)*.8;const ch=plasticChair();ch.position.set(cx,0,cz);ch.rotation.y=a+Math.PI;grp.add(ch);seats.push({x:cx,z:cz,yaw:a+Math.PI})}return seats}
let chairGeo=null;function plasticChair(){if(!chairGeo){const parts=[];const add=(w,h,d,x,y,z,rx)=>{const g=new THREE.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);g.translate(x,y,z);parts.push(g.toNonIndexed())};
    add(.46,.04,.44,0,.45,0);add(.46,.42,.04,0,.7,-.22,-.12);for(const sx of [-.2,.2])for(const sz of [-.19,.19])add(.04,.45,.04,sx,.225,sz);
    const P=[];parts.forEach(g=>P.push(...g.attributes.position.array));chairGeo=new THREE.BufferGeometry();chairGeo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));chairGeo.computeVertexNormals()}
  return new THREE.Mesh(chairGeo,lm('#f4f4f2'))}
function poster(grp,text,bg,fg,x,y,z,rotY,w){const m=new THREE.Mesh(new THREE.PlaneGeometry(w||1.6,(w||1.6)/4),new THREE.MeshBasicMaterial({map:signTex(text,'',bg,fg)}));m.position.set(x,y,z);m.rotation.y=rotY;grp.add(m)}
function room(grp,w,d,h,wall,floorT,opts){opts=opts||{};const fl=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshPhongMaterial({map:floorT,shininess:opts.shiny||30,specular:0x333333}));fl.rotation.x=-Math.PI/2;floorT.repeat.set(w/1.2,d/1.2);grp.add(fl);
  const wm=new THREE.MeshLambertMaterial({color:wall,side:THREE.BackSide});const box=new THREE.Mesh(new THREE.BoxGeometry(w,h+.1,d),wm);box.position.y=h/2-.1;grp.add(box);
  const dado=lm('#'+new THREE.Color(wall).multiplyScalar(.72).getHexString());for(const [bw,bd,bx,bz] of [[w,.03,0,-d/2+.015],[w,.03,0,d/2-.015],[.03,d,-w/2+.015,0],[.03,d,w/2-.015,0]])boxAt(grp,bw,1.1,bd,dado,bx,0,bz);
  for(let k=0;k<Math.floor(w/3);k++){const fr=new THREE.Mesh(new THREE.PlaneGeometry(.9,.65),lm(pick(['#1f9aa6','#e4572e','#f0b429','#2e7d32','#7b1fa2'])));fr.position.set(-w/2+1.8+k*3,2.1,-d/2+.03);if(Math.abs(fr.position.x)>1.9)grp.add(fr)}
  // baseboard and ceiling lights
  for(const [bw,bd,bx,bz] of [[w,.04,0,-d/2+.02],[w,.04,0,d/2-.02],[.04,d,-w/2+.02,0],[.04,d,w/2-.02,0]])boxAt(grp,bw,.12,bd,lm('#6b5b4a'),bx,0,bz);
  for(let x=-w/2+2;x<w/2-1;x+=3.2)for(let z=-d/2+2;z<d/2-1;z+=3.2){const l=new THREE.Mesh(new THREE.BoxGeometry(1.2,.04,.3),glow('#fffdf2'));l.position.set(x,h-.03,z);grp.add(l)}
  // door (back to the street) with daylight behind it
  const door=new THREE.Mesh(new THREE.PlaneGeometry(opts.doorW||1.6,2.5),glow('#fff3cf'));door.position.set(0,1.25,d/2-.01);door.rotation.y=Math.PI;grp.add(door);
  return{w,d,h}}

const CLERK_OUT=[];
/* ---------- autoservicio: productos que se toman (F), canasta, caja y mochila ---------- */
// item: n name, p price, e energy, c display colour; drink/eat = goes to the backpack and is consumed with B; o = clothes worn when paid
const IT=(n,p,e,c,x)=>Object.assign({n,p,e,c},x||{});
const D={cola:IT('Gaseosa cola',2500,22,'#4a1c10',{drink:1}),naranja:IT('Gaseosa naranja',2500,22,'#f28c28',{drink:1}),uva:IT('Gaseosa de uva',2500,22,'#6a1b9a',{drink:1}),
  agua:IT('Botella de agua',1500,15,'#bfe6ff',{drink:1}),mango:IT('Jugo de mango',3000,26,'#f0b429',{drink:1}),corozo:IT('Jugo de corozo',3000,28,'#b71c1c',{drink:1}),
  kumis:IT('Kumis',2800,24,'#f4f1ea',{drink:1}),malta:IT('Malta',2500,25,'#3b1d0a',{drink:1}),energ:IT('Bebida energizante',6000,80,'#2e7d32',{drink:1}),suero:IT('Suero oral',4000,60,'#4fc3f7',{drink:1}),
  limonada:IT('Limonada de coco',5000,30,'#f4f1ea',{drink:1})};
const F=(n,p,e,c)=>IT(n,p,e,c,{eat:1}),G=(n,p,c,msg)=>IT(n,p,0,c,{msg});
const CAT={
  tienda:{fridges:[[D.cola,D.naranja],[D.agua,D.mango],[D.kumis,D.malta]],
    counter:[F('Chupeta',500,6,'#e4572e'),F('Chocolatina',1500,14,'#6b3a1e'),F('Cocada',2000,20,'#f3e2b0'),F('Bolsita de maní',1500,14,'#c8843c')],
    wall:[F('Paquete de papitas',2500,18,'#f0b429'),F('Galletas',2000,18,'#1565c0'),F('Pan tajado',4500,30,'#e3b26a'),G('Libra de arroz',3000,'#f4f1ea','Pa’l almuerzo de la casa'),G('Aceite',9000,'#f2c01e','Para fritar los patacones')],
    gondola:[G('Lata de atún',6000,'#1f9aa6','Pa’l arroz con atún'),G('Panela',3500,'#8d5a2b','Para la aguapanela'),G('Café molido',8000,'#3b1d0a','Tinto pa’ toda la semana'),G('Papel higiénico',5000,'#ffffff','Nunca sobra')]},
  panaderia:{fridges:[[D.kumis,D.mango],[D.cola,D.agua]],
    counter:[F('Pan de coco',2000,20,'#e3b26a'),F('Pan de queso',1500,18,'#f2c14e'),F('Pastel de pollo',4500,40,'#c8843c'),F('Torta de plátano',5000,42,'#a0522d'),F('Tinto (café)',1000,15,'#3b1d0a')],
    wall:[F('Galletas de soda',2500,18,'#f4f1ea'),F('Mantecada',2500,22,'#f2c14e'),F('Roscones',3000,24,'#c8843c')]},
  drogueria:{fridges:[[D.suero,D.energ]],
    counter:[F('Chicles',1000,4,'#81d4fa'),G('Pastillas para la tos',3500,'#c2185b','Ya no vas a toser')],
    wall:[G('Bloqueador solar',25000,'#f0b429','Ya no te vas a quemar con este sol'),F('Vitaminas',20000,30,'#ff7043'),G('Curitas',4000,'#e8b796','Por si te caes corriendo'),G('Acetaminofén',3000,'#1565c0','Para el dolor de cabeza'),G('Crema dental',6000,'#e53935','Sonrisa caribeña')],
    gondola:[G('Pañitos húmedos',7000,'#90caf9','Para el calor'),G('Champú',12000,'#7b1fa2','El pelo bien bonito'),G('Alcohol',5000,'#e0f7fa','Pa’ desinfectar'),G('Tapabocas',2000,'#4fc3f7','Por si acaso')]},
  heladeria:{fridges:[[D.agua,D.cola]],freezer:[F('Paleta de mango',4000,22,'#f0b429'),F('Paleta de coco',4000,22,'#f4f1ea'),F('Paleta de mora',4000,22,'#7b1fa2'),F('Bolis de tamarindo',800,10,'#8d5a2b')]},
  fritos:{fridges:[[D.cola,D.corozo]]},
  restaurante:{fridges:[[D.limonada,D.corozo]]},
};
const SELF=new Set(['tienda','panaderia','drogueria']);
let botGeo=null;
function bottles(grp,list){if(!list.length)return;if(!botGeo)botGeo=new THREE.CylinderGeometry(.034,.04,.26,8).translate(0,.13,0);const im=new THREE.InstancedMesh(botGeo,new THREE.MeshLambertMaterial({color:'#ffffff'}),list.length);const o=new THREE.Object3D();
  list.forEach((b,i)=>{o.position.set(b[0],b[1],b[2]);o.updateMatrix();im.setMatrixAt(i,o.matrix);im.setColorAt(i,new THREE.Color(b[3]))});grp.add(im)}
// world position of a point given in a rotated group's local frame
const loc=(x,z,rotY,lx,lz)=>({x:x+lx*Math.cos(rotY)+lz*Math.sin(rotY),z:z-lx*Math.sin(rotY)+lz*Math.cos(rotY)});
// glass-door fridge with two drinks (left / right half); the shopper stands in front of each half
function drinkFridge(grp,col,x,z,rotY,pair,bot,picks){const w=1.4,g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotY;grp.add(g);const fm=lm('#e8ecef');boxAt(g,w,2.1,.06,fm,0,0,-.35);for(const e of [-1,1])boxAt(g,.06,2.1,.75,fm,e*(w/2-.03),0,0);boxAt(g,w,.14,.75,fm,0,1.96,0);boxAt(g,w,.22,.75,fm,0,0,0);
  for(let lv=0;lv<4;lv++)boxAt(g,w-.1,.02,.62,lm('#c8d0d6'),0,.26+lv*.42,-.02);
  const inner=new THREE.Mesh(new THREE.PlaneGeometry(w-.2,1.75),glow('#f4fbff'));inner.position.set(0,1.1,-.28);g.add(inner);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(w-.12,1.8),new THREE.MeshBasicMaterial({color:'#bfe6ff',transparent:true,opacity:.22,depthWrite:false}));glass.position.set(0,1.1,.39);g.add(glass);
  boxAt(g,.03,1.8,.04,lm('#b0b4b8'),0,.2,.39);const top=new THREE.Mesh(new THREE.PlaneGeometry(w-.1,.22),new THREE.MeshBasicMaterial({map:signTex('Bien fría','',  '#d32f2f','#fff')}));top.position.set(0,1.98,.385);g.add(top);
  pair.forEach((it,h)=>{const x0=h?.05:-w/2+.12;for(let lv=0;lv<4;lv++)for(let k=0;k<7;k++){const p=loc(x,z,rotY,x0+k*.085,.05+(k%2)*.07);bot.push([p.x,.28+lv*.42,p.z,it.c])}
    const sp=loc(x,z,rotY,h?w/4:-w/4,1.0);picks.push({x:sp.x,z:sp.z,item:it,where:'la nevera'})});
  const c=Math.abs(Math.sin(rotY))>.5;col.push(c?{x0:x-.4,x1:x+.4,z0:z-w/2,z1:z+w/2}:{x0:x-w/2,x1:x+w/2,z0:z-.4,z1:z+.4})}
// wall shelf along z (side -1 left wall, +1 right wall) split into one zone per item
function wallShelf(grp,col,side,w,z0,z1,items,prod,picks){const x=side*(w/2-.3),L=z1-z0,n=items.length;boxAt(grp,.5,2.2,L,lm('#cfd4d8'),x,0,(z0+z1)/2,col);
  items.forEach((it,i)=>{const za=z0+i*L/n,zb=za+L/n;for(let lv=0;lv<5;lv++)for(let zz=za+.1;zz<zb-.06;zz+=.15)prod.push([side*(w/2-.42),.15+lv*.42,zz,.14,.12+(lv%2)*.08,.11,it.c]);
    picks.push({x:side*(w/2-1.15),z:(za+zb)/2,item:it,where:'el estante'})})}
// gondola along z with two items on each side
function gondola(grp,col,x,z0,z1,items,prod,picks){const L=z1-z0;boxAt(grp,.6,1.6,L,lm('#cfd4d8'),x,0,(z0+z1)/2,col);
  items.forEach((it,i)=>{const side=i<2?-1:1,half=i%2,za=z0+half*L/2,zb=za+L/2;for(let lv=0;lv<4;lv++)for(let zz=za+.1;zz<zb-.06;zz+=.15)prod.push([x+side*.36,.2+lv*.4,zz,.12,.14+(lv%2)*.06,.12,it.c]);
    picks.push({x:x+side*1.0,z:(za+zb)/2,item:it,where:'la góndola'})})}
// glass jars / bread tray on the counter top, picked from in front of the counter
function counterGoods(grp,cx,cz,xs,items,bread,picks){const jar=new THREE.MeshPhongMaterial({color:'#e8f6ff',transparent:true,opacity:.35,shininess:90,depthWrite:false});
  items.forEach((it,i)=>{const x=xs[i];if(bread){boxAt(grp,.42,.04,.32,lm('#c0a070'),x,1.05,cz);for(let k=0;k<5;k++)boxAt(grp,.12,.07,.1,lm(it.c),x-.14+(k%3)*.14,1.09,cz-.08+Math.floor(k/3)*.15)}
    else{boxAt(grp,.2,.18,.2,lm(it.c),x,1.05,cz);const j=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.32,12),jar);j.position.set(x,1.21,cz);grp.add(j);boxAt(grp,.28,.04,.28,lm('#c62828'),x,1.37,cz)}
    picks.push({x,z:cz+1.0,item:it,where:'el mostrador'})})}
// chest freezer (along x) with ice pops, one zone per item on the front side
function freezer(grp,col,x0,x1,z,items,prod,picks){const L=x1-x0,n=items.length;boxAt(grp,L,.85,.8,lm('#f4f6f8'),(x0+x1)/2,0,z,col);const lid=new THREE.Mesh(new THREE.BoxGeometry(L-.08,.02,.72),new THREE.MeshPhongMaterial({color:'#d6f0ff',transparent:true,opacity:.35,shininess:90,depthWrite:false}));lid.position.set((x0+x1)/2,.87,z);grp.add(lid);
  items.forEach((it,i)=>{const xa=x0+i*L/n;for(let k=0;k<8;k++)prod.push([xa+.1+(k%4)*(L/n-.2)/3,.72,z-.2+Math.floor(k/4)*.3,.06,.04,.16,it.c]);picks.push({x:xa+L/n/2,z:z+.95,item:it,where:'el congelador'})})}
function hangingClothes(grp,col,x,z,len,rot,cols){boxAt(grp,rot?.05:len,.05,rot?len:.05,lm('#b0b4b8'),x,1.55,z);for(const e of [-1,1])boxAt(grp,.05,1.6,.05,lm('#b0b4b8'),rot?x:x+e*len/2,0,rot?z+e*len/2:z);
  const prod=[];const n=Math.floor(len/.12);for(let k=0;k<n;k++){const t=-len/2+.06+k*len/n;const c=cols?cols[Math.min(cols.length-1,Math.floor((k/n)*cols.length))]:pick(PCOLS);prod.push([rot?x:x+t,.75,rot?z+t:z,rot?.42:.04,.75,rot?.04:.42,c])}products(grp,prod);col.push({x0:x-(rot?.3:len/2),x1:x+(rot?.3:len/2),z0:z-(rot?len/2:.3),z1:z+(rot?len/2:.3)})}
// clothes and souvenirs: each rack half shows one item of the shop's menu in its colour
function rackItems(type){return(MENUS[type]||[]).filter(it=>it.p>0&&it.o).map(it=>Object.assign({},it,{c:it.o.top||it.o.bottom||it.o.shoes||it.o.hatC||it.o.backpack||(it.o.hat==='vueltiao'?'#efe6cc':'#888')}))}

function buildShop(type){const T=TYPES[type];const grp=new THREE.Group();const col=[];const prod=[],bot=[],picks=[];const [w,d]=T.room;const R=room(grp,w,d,3.4,T.wall,type==='restaurante'?tileTex('#9c5f3a','#ad6f48'):tileTex('#efe9dc','#e2dccd'));
  const spots=[],seats=[];let clerk={x:0,z:-d/2+1.0,yaw:0},buy={x:0,z:-d/2+2.1},caja=null;const K=CAT[type]||{};
  poster(grp,T.names[0],T.bg,T.fg,0,2.75,-d/2+.02,0,3.2);
  if(SELF.has(type)){const cz=-d/2+1.6;counter(grp,col,0,cz,3.4);caja={x:1.3,z:cz+1.0};buy=caja;
    counterGoods(grp,0,cz,[-1.45,-.95,-.45,.05,.55].slice(0,K.counter.length),K.counter,type==='panaderia',picks);
    if(type==='panaderia'){const v=new THREE.Mesh(new THREE.BoxGeometry(2.6,.45,.5),new THREE.MeshBasicMaterial({color:'#ffe9b8',transparent:true,opacity:.28,depthWrite:false}));v.position.set(-.45,1.3,cz);grp.add(v)}
    const fz=K.fridges.length===3?[-1.7,-.2,1.3]:K.fridges.length===2?[-1.5,0]:[-1.6];
    K.fridges.forEach((pair,i)=>drinkFridge(grp,col,-w/2+.42,fz[i],Math.PI/2,pair,bot,picks));
    const lz0=fz[fz.length-1]+.85;if(type==='drogueria')wallShelf(grp,col,-1,w,lz0,d/2-1.5,[F('Pastillas de menta',1500,6,'#a5d6a7'),G('Repelente',15000,'#ffb74d','Los mosquitos ya no te pican')],prod,picks);
    wallShelf(grp,col,1,w,-d/2+2.3,d/2-1.3,K.wall,prod,picks);
    if(K.gondola)gondola(grp,col,.4,-d/2+3.4,d/2-3.0,K.gondola,prod,picks);
    spots.push([-1.5,1.6],[2,-.4],[-1.8,-1.2],[1.6,2.4])}
  else if(type==='fritos'||type==='heladeria'){counter(grp,col,0,-d/2+1.6,4,type==='heladeria'?'#f48fb1':'#e4572e');
    if(type==='heladeria'){for(let k=0;k<10;k++)prod.push([-1.6+k*.36,1.0,-d/2+1.5,.3,.08,.3,pick(['#fff3e0','#f8bbd0','#c8e6c9','#ffe082','#d7ccc8','#b39ddb'])]);
      drinkFridge(grp,col,w/2-.42,-d/2+2.3,-Math.PI/2,K.fridges[0],bot,picks);freezer(grp,col,-w/2+.5,-w/2+3.1,-.75,K.freezer,prod,picks)}
    else{for(let k=0;k<14;k++)prod.push([-1.7+Math.random()*3.4,1.0,-d/2+1.45+Math.random()*.2,.16,.07,.16,pick(['#e3a33a','#c8843c','#f2c14e'])]);const pot=new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,.3,16),lm('#3a3a3a'));pot.position.set(-1.2,-0.0+1.0+.15,-d/2+.7);grp.add(pot);
      drinkFridge(grp,col,-w/2+.42,-.2,Math.PI/2,K.fridges[0],bot,picks)}
    seats.push(...table(grp,col,type==='heladeria'?-1.4:-1.2,1.6,3),...table(grp,col,1.7,1.6,3));spots.push([0,2.6],[1.6,-.4])}
  else if(type==='restaurante'){counter(grp,col,-w/2+2.6,-d/2+1.5,3.6);poster(grp,'Comida típica cartagenera','#2e7d32','#fff8e1',w/2-2.2,2.3,-d/2+.03,0,2.6);
    drinkFridge(grp,col,w/2-.42,-d/2+2.2,-Math.PI/2,K.fridges[0],bot,picks);
    for(const [x,z] of [[-3,-1],[0,-1.2],[3,-.6],[-3,2],[0,2.2],[3,2.4]])seats.push(...table(grp,col,x,z,4));spots.push([0,4.3],[-4.5,.5],[4.5,.5])}
  else if(type==='ropa'||type==='recuerdos'||type==='joyeria'){counter(grp,col,w/2-2.2,-d/2+1.5,2.6,type==='joyeria'?'#0b5d3b':'#6b4a2b');buy={x:w/2-2.2,z:-d/2+2.6};clerk={x:w/2-2.2,z:-d/2+.9,yaw:0};
    if(type==='joyeria'){for(const x of [-2.2,0,2.2]){const v=new THREE.Mesh(new THREE.BoxGeometry(1.6,.35,.7),new THREE.MeshPhongMaterial({color:'#dff7ef',transparent:true,opacity:.35,shininess:90}));v.position.set(x,1.1,.4);grp.add(v);boxAt(grp,1.6,.95,.7,lm('#2b2b2b'),x,0,.4,col);
      for(let k=0;k<8;k++)prod.push([x-.6+k*.17,.97,.4,.06,.04,.06,k%2?'#0f9d58':'#f6d365'])}}
    else{caja=buy;const its=rackItems(type);const racks=type==='ropa'?[[-w/2+.6,-.5,d-4.5,true],[-1.6,1.2,3,false],[1.6,1.2,3,false],[-1.6,3.4,3,false],[1.6,3.4,2.4,false]]:[[-w/2+.6,-.3,d-4.5,true],[-1.4,1.4,2.6,false],[1.4,1.4,2.6,false]];let k=0;
      for(const [x,z,L,r] of racks){const two=its.slice(k,k+2);k+=2;if(!two.length){hangingClothes(grp,col,x,z,L,r);continue}hangingClothes(grp,col,x,z,L,r,two.map(i=>i.c));
        two.forEach((it,h)=>{const off=two.length===1?0:(h?L/4:-L/4);picks.push(r?{x:x+.95,z:z+off,item:it,where:'el exhibidor'}:{x:x+off,z:z+.95,item:it,where:'el exhibidor'})})}
      if(type==='recuerdos'){for(let q=0;q<8;q++){const h=new THREE.Mesh(new THREE.CylinderGeometry(.3,.33,.05,18),lm('#efe6cc'));h.position.set(w/2-.4,.6+q*.25,1.2+(q%4)*.7);h.rotation.z=Math.PI/2;grp.add(h)}}}
    // mirror
    const mir=new THREE.Mesh(new THREE.PlaneGeometry(1.2,2),new THREE.MeshPhongMaterial({color:'#9fb7c4',shininess:120,specular:0xffffff}));mir.position.set(-w/2+.03,1.2,-d/2+1.5);mir.rotation.y=Math.PI/2;grp.add(mir);
    spots.push([0,0],[-.5,2.3],[2,1.8],[-2,-2])}
  products(grp,prod);bottles(grp,bot);if(!caja&&picks.length)caja=buy;
  const def={grp,col,R,clerk,buy,spots,seats,menus:SELF.has(type)?[]:[{at:buy,menu:type,label:T.names[0]}],exit:{x:0,z:d/2-.6},picks,caja};
  // keep every pick spot reachable (out of furniture and inside the room)
  for(const p of picks){if(!blocked(def,p.x,p.z,.3))continue;let done=false;for(let rad=.15;rad<1.6&&!done;rad+=.15)for(let a=0;a<TAU;a+=TAU/12){const x=p.x+Math.sin(a)*rad,z=p.z+Math.cos(a)*rad;if(!blocked(def,x,z,.3)){p.x=x;p.z=z;done=true;break}}}
  if(caja&&blocked(def,caja.x,caja.z,.3)){caja.z+=.3}
  return def}

function buildMall(name){const grp=new THREE.Group();const col=[];const w=26,d=64,h=11;const R=room(grp,w,d,h,'#f2efe8',tileTex('#ece6da','#e6dfd2','rgba(0,0,0,.12)'),{shiny:90,doorW:4});
  poster(grp,name,'#17130f','#f0b429',0,6.5,d/2-.05,Math.PI,8);
  // second floor gallery along both sides with glass railing
  for(const s of [-1,1]){boxAt(grp,6,.35,d-8,lm('#e0dbd2'),s*(w/2-3),5,0);const rail=new THREE.Mesh(new THREE.PlaneGeometry(d-8,1.0),new THREE.MeshPhongMaterial({color:'#cfe8f0',transparent:true,opacity:.3,side:THREE.DoubleSide}));rail.position.set(s*(w/2-6),5.85,0);rail.rotation.y=Math.PI/2;grp.add(rail)}
  // skylight
  const sky=new THREE.Mesh(new THREE.PlaneGeometry(10,d-6),glow('#d9f1ff'));sky.rotation.x=Math.PI/2;sky.position.y=h-.05;grp.add(sky);
  // storefronts
  const stores=[['ropa','Boutique Caribe'],['recuerdos','Artesanías Zenú'],['joyeria','Esmeraldas del Corralito'],['heladeria','Heladería Coco Loco'],['drogueria','Droguería El Cabrero'],['tienda','Supermercado La Bahía'],['ropa','Moda Getsemaní'],['panaderia','Panadería El Trigal']];
  const menus=[];const prod=[];
  stores.forEach(([type,nm],i)=>{const s=i%2?1:-1,row=Math.floor(i/2);const z=-d/2+9+row*10.5;const T=TYPES[type];const x=s*(w/2-.02);
    const front=new THREE.Mesh(new THREE.PlaneGeometry(8,3.6),new THREE.MeshPhongMaterial({color:'#bfe0ea',transparent:true,opacity:.28,shininess:100}));front.position.set(s*(w/2-3.2),1.8,z);front.rotation.y=-s*Math.PI/2;grp.add(front);
    const back=new THREE.Mesh(new THREE.PlaneGeometry(8,4.2),lm(T.wall));back.position.set(x-s*.01,2.1,z);back.rotation.y=-s*Math.PI/2;grp.add(back);
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(5,1.1),new THREE.MeshBasicMaterial({map:signTex(nm,T.label,T.bg,T.fg)}));sg.position.set(s*(w/2-3.22),4.3,z);sg.rotation.y=-s*Math.PI/2;grp.add(sg);
    for(const e of [-1,1])boxAt(grp,3.2,4.6,.3,lm('#d8d2c8'),s*(w/2-1.6),0,z+e*4.15,col);
    // a few products inside each shop
    if(type==='ropa'||type==='recuerdos')hangingClothes(grp,[],s*(w/2-.7),z,5.5,true);else shelf(grp,[],s*(w/2-.9),z,5.5,true,prod);
    if(type==='joyeria'||type==='heladeria')boxAt(grp,.6,1,3,lm(T.bg),s*(w/2-2.4),0,z-1.5);
    col.push({x0:s>0?w/2-3.3:-w/2,x1:s>0?w/2:-w/2+3.3,z0:z-4,z1:z+4});
    menus.push({at:{x:s*(w/2-4.1),z},menu:type,label:nm})});
  // food court at the far end
  const seats=[];for(const [x,z] of [[-5,-d/2+3.5],[-1.7,-d/2+3.5],[1.7,-d/2+3.5],[5,-d/2+3.5],[-3.4,-d/2+6.3],[0,-d/2+6.6],[3.4,-d/2+6.3]])seats.push(...table(grp,col,x,z,4));
  counter(grp,col,0,-d/2+.8,8,'#e4572e');poster(grp,'Plazoleta de comidas','#e4572e','#fff8e1',0,3.6,-d/2+.03,0,6);menus.push({at:{x:0,z:-d/2+1.9},menu:'mall_comidas',label:'Plazoleta de comidas'});
  // planters with palms and benches down the middle
  for(let z=-d/2+14;z<d/2-6;z+=11){boxAt(grp,1.6,.6,1.6,lm('#8d6e63'),0,0,z,col);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,3.2,8),lm('#8a7a5a'));tr.position.set(0,2.2,z);grp.add(tr);
    const cr=new THREE.Mesh(new THREE.SphereGeometry(1.1,10,6),lm('#3f7d3a'));cr.scale.set(1.2,.55,1.2);cr.position.set(0,3.8,z);grp.add(cr);
    for(const e of [-1,1])boxAt(grp,.5,.45,2,lm('#6b4a2b'),e*2.4,0,z,col)}
  // escalator
  const esc=new THREE.Mesh(new THREE.BoxGeometry(1.4,.5,9),lm('#9aa0a6'));esc.position.set(-w/2+7,2.6,d/2-14);esc.rotation.x=-.5;grp.add(esc);col.push({x0:-w/2+6.2,x1:-w/2+7.8,z0:d/2-18.5,z1:d/2-9.5});
  products(grp,prod);
  const spots=[];for(let z=-d/2+9;z<d/2-4;z+=5)for(const x of [-5.5,-3,3,5.5])spots.push([x,z]);
  return{grp,col,R:{w,d,h},clerk:{x:0,z:-d/2+.3,yaw:0},buy:null,spots,seats,menus,exit:{x:0,z:d/2-.8},mall:true,camH:7}}

/* gente dentro: un grupo de personas reutilizado en cada interior */
const IN=[];let inPool=null;
function poolPeople(){if(inPool)return inPool;inPool=[];for(let i=0;i<18;i++){const ch=C.buildCharacter(C.archetype(i%5===0?'tourist':'local'));inPool.push(ch)}return inPool}
const CUR={def:null,shop:null};const CACHE={};
let inside=false,menuOpen=null;
function enter(shop){const def=CACHE[shop.mall?shop.name:shop.type]||(CACHE[shop.mall?shop.name:shop.type]=shop.mall?buildMall(shop.name):buildShop(shop.type));
  // update the poster with this shop's name
  CUR.def=def;CUR.shop=shop;IS.add(def.grp);inside=true;P.cart=[];
  C.scene.remove(player.mesh);IS.add(player.mesh);player.ix=def.exit.x;player.iz=def.exit.z-1.2;freeSpot(def);player.yaw=Math.PI;player.cy=Math.PI;player.cp=.35;player.spd=0;
  // people
  const pool=poolPeople();IN.length=0;let k=0;const nC=def.mall?15:Math.min(4,def.spots.length);
  const clerk=pool[k++];IS.add(clerk.mesh);clerk.mesh.position.set(def.clerk.x,0,def.clerk.z);clerk.mesh.rotation.y=0;IN.push({ch:clerk,kind:'clerk',x:def.clerk.x,z:def.clerk.z,yaw:0});
  if(def.mall)for(const m of def.menus.slice(0,-1)){if(k>=pool.length-4)break;const c=pool[k++];const s=m.at.x>0?1:-1;const x=s*(def.R.w/2-2.3);IS.add(c.mesh);IN.push({ch:c,kind:'clerk',x,z:m.at.z,yaw:-s*Math.PI/2})}
  for(let i=0;i<nC&&k<pool.length;i++){const free=def.spots.filter(q=>Math.hypot(q[0]-def.exit.x,q[1]-def.exit.z)>2.6);const c=pool[k++];IS.add(c.mesh);const sp=free[i%free.length];IN.push({ch:c,kind:'walk',x:sp[0],z:sp[1],yaw:rr(0,TAU),tx:sp[0],tz:sp[1],wait:rr(0,3)})}
  const fs=def.seats.slice().sort(()=>Math.random()-.5);for(let i=0;i<(def.mall?4:2)&&k<pool.length&&i<fs.length;i++){const c=pool[k++];IS.add(c.mesh);IN.push({ch:c,kind:'sit',x:fs[i].x,z:fs[i].z,yaw:fs[i].yaw})}
  for(const p of IN){p.ch.mesh.visible=true;p.ch.mesh.rotation.set(0,p.yaw,0);p.ch.mesh.position.set(p.x,0,p.z)}
  C.toast(shop.name,1800);C.chime&&0}
function leave(){const def=CUR.def,shop=CUR.shop;closeMenu();
  if(P.cart.length){const it=P.cart.slice();P.cart=[];deliver(it,true);setTimeout(()=>C.crime(1,'¡Te fuiste sin pagar! La policía te busca'),400)}IS.remove(def.grp);for(const p of IN)IS.remove(p.ch.mesh);IN.length=0;IS.remove(player.mesh);C.scene.add(player.mesh);inside=false;
  player.x=shop.x+shop.nx*.8;player.z=shop.z+shop.nz*.8;player.yaw=shop.yaw;player.cy=shop.yaw;player.mesh.position.set(player.x,C.ground(player.x,player.z),player.z);player.mesh.rotation.set(0,player.yaw,0)}
// never leave the player standing inside furniture: step toward the nearest free spot
function freeSpot(def){if(!blocked(def,player.ix,player.iz,.36))return;for(let rad=.3;rad<6;rad+=.3)for(let a=0;a<TAU;a+=TAU/16){const x=player.ix+Math.sin(a)*rad,z=player.iz+Math.cos(a)*rad;if(!blocked(def,x,z,.36)){player.ix=x;player.iz=z;return}}}
function blocked(def,x,z,r){const R=def.R;if(x<-R.w/2+r||x>R.w/2-r||z<-R.d/2+r||z>R.d/2-r)return true;for(const b of def.col)if(x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r)return true;return false}
/* canasta, caja y mochila */
// with something in the basket, the till wins over a product that is equally close
function nearPick(){const def=CUR.def;if(!def.picks)return null;let best=null,bd=1.05;if(P.cart.length&&def.caja)bd=Math.min(bd,Math.hypot(def.caja.x-player.ix,def.caja.z-player.iz)-.15);for(const p of def.picks){const d=Math.hypot(p.x-player.ix,p.z-player.iz);if(d<bd){bd=d;best=p}}return best}
function nearCaja(){const c=CUR.def.caja;return c&&Math.hypot(c.x-player.ix,c.z-player.iz)<1.4}
const cartTotal=()=>P.cart.reduce((a,it)=>a+it.p,0);
function take(pk){if(P.cart.length>=12){C.toast('La canasta está llena: ve a pagar',1400);return}P.cart.push(pk.item);C.tone&&C.tone(660,.06,'triangle',.04);C.toast('A la canasta: '+pk.item.n.toLowerCase(),1100)}
function pay(){const t=cartTotal();if(C.getMoney()<t){C.toast('No te alcanza: te faltan '+C.fmt(t-C.getMoney())+' (X para devolver todo)',2000);return}
  C.setMoney(C.getMoney()-t);C.chime();const it=P.cart.slice();P.cart=[];C.toast('Pagaste '+C.fmt(t)+'. ¡Gracias, vuelva pronto!',1800);deliver(it,false)}
// paid (or stolen) items: clothes are worn now, food and drinks go to the backpack, the rest are just bought
function deliver(items,stolen){let worn=false;for(const it of items){if(it.o){Object.assign(P.spec,it.o);if(it.o.hat===null)delete P.spec.hat;worn=true}else if(it.drink||it.eat)P.inv.push(it)}
  if(worn){rebuildPlayer();if(inside)IS.add(player.mesh)}
  const msg=items.find(i=>i.msg);if(msg&&!stolen)setTimeout(()=>C.toast(msg.msg,1700),1900)}
function consume(){if(!P.inv.length||menuOpen)return;const i=Math.max(0,P.inv.findIndex(x=>P.en<P.max*.6?x.e>=25:true));const it=P.inv.splice(i,1)[0];
  P.en=Math.min(P.max,P.en+(it.e||0));C.tone&&C.tone(it.drink?520:380,.08,'sine',.05);C.toast((it.drink?'Te tomaste ':'Te comiste ')+it.n.toLowerCase()+' (+'+(it.e||0)+' energía)',1500)}
function dropCart(){if(!P.cart.length)return;P.cart=[];C.toast('Devolviste todo a su lugar',1200)}
window.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='KeyB')consume();if(e.code==='KeyX'&&inside)dropCart()});
function nearMenu(){const def=CUR.def;let best=null,bd=1.6;for(const m of def.menus){const d=Math.hypot(m.at.x-player.ix,m.at.z-player.iz);if(d<bd){bd=d;best=m}}return best}
function updateInside(dt,inp){const def=CUR.def;const now=performance.now()/1000;
  if(!menuOpen){const f=[Math.sin(player.cy),Math.cos(player.cy)],r=[-f[1],f[0]];let mx=f[0]*inp.iz+r[0]*inp.ix,mz=f[1]*inp.iz+r[1]*inp.ix;const m=Math.hypot(mx,mz);let sp=0;
    if(m>.08){sp=(inp.run&&canSprint()?4.6:2.2)*Math.min(1,m);mx/=m;mz/=m;const nx=player.ix+mx*sp*dt,nz=player.iz+mz*sp*dt;
      // if already overlapping something, let any step through so the player can always walk free
      const stuck=blocked(def,player.ix,player.iz,.35);if(stuck||!blocked(def,nx,player.iz,.35))player.ix=nx;if(stuck||!blocked(def,player.ix,nz,.35))player.iz=nz;
      const R0=def.R;player.ix=clamp(player.ix,-R0.w/2+.36,R0.w/2-.36);player.iz=clamp(player.iz,-R0.d/2+.36,R0.d/2-.2);player.yaw=angLerp(player.yaw,Math.atan2(mx,mz),Math.min(1,dt*12))}
    player.spd=lerp(player.spd,sp,Math.min(1,dt*8))}else player.spd=lerp(player.spd,0,Math.min(1,dt*8));
  C.animate(player.ch,player.spd,dt,'');player.mesh.position.set(player.ix,0,player.iz);player.mesh.rotation.y=player.yaw;
  if(player.iz>def.R.d/2-.45&&Math.abs(player.ix-def.exit.x)<1.6&&!menuOpen&&!FADE.busy){fade('',()=>{leave();ENT={kind:'step',t:0}})}
  // people
  for(const p of IN){let speed=0,pose='';
    if(p.kind==='walk'){if(p.wait>0){p.wait-=dt}else{const dx=p.tx-p.x,dz=p.tz-p.z,dd=Math.hypot(dx,dz);if(dd<.2){p.wait=rr(2,6);const sp=pick(def.spots);p.tx=sp[0]+rr(-.4,.4);p.tz=sp[1]+rr(-.4,.4)}
        else{speed=1.1;const nx=p.x+dx/dd*speed*dt,nz=p.z+dz/dd*speed*dt;if(!blocked(def,nx,nz,.3)){p.x=nx;p.z=nz}else{p.wait=.5;const sp=pick(def.spots);p.tx=sp[0];p.tz=sp[1]}p.yaw=angLerp(p.yaw,Math.atan2(dx,dz),Math.min(1,dt*6))}}}
    else if(p.kind==='clerk'){const d=Math.hypot(player.ix-p.x,player.iz-p.z);if(d<5)p.yaw=angLerp(p.yaw,Math.atan2(player.ix-p.x,player.iz-p.z),Math.min(1,dt*3));pose=menuOpen&&d<4?'talk':''}
    else if(p.kind==='sit')pose='chair';
    p.ch.mesh.position.set(p.x,p.kind==='sit'?seatY(p.ch):0,p.z);p.ch.mesh.rotation.y=p.yaw;anim(p.ch,speed,dt,pose)}
  // camera (stays inside the room)
  const H=def.camH||3.1,dist=def.mall?6:3.8;const fx=Math.sin(player.cy),fz=Math.cos(player.cy);const cp=clamp(player.cp,.12,.7);
  let cx=player.ix-fx*Math.cos(cp)*dist,cz=player.iz-fz*Math.cos(cp)*dist;const R=def.R;cx=clamp(cx,-R.w/2+.25,R.w/2-.25);cz=clamp(cz,-R.d/2+.25,R.d/2-.25);
  C.camera.position.set(cx,Math.min(H,1.6+Math.sin(cp)*dist+.4),cz);C.camera.lookAt(player.ix,1.3,player.iz);
  // prompt
  const F=C.isTouch()?'Toca el botón':'F',pk=nearPick(),m=nearMenu(),cj=nearCaja()&&P.cart.length;
  setPrompt(menuOpen?'':pk?F+' · tomar '+pk.item.n.toLowerCase()+' ('+C.fmt(pk.item.p)+')':cj?F+' · pagar '+P.cart.length+(P.cart.length>1?' artículos: ':' artículo: ')+C.fmt(cartTotal()):m?F+' · comprar en '+m.label:
    player.iz>def.R.d/2-2.2?(P.cart.length?'Llevas '+P.cart.length+' sin pagar: si sales es robo'+(C.isTouch()?'':' (X: devolver)'):'Sal por la puerta para volver a la calle'):P.cart.length&&def.caja?'Paga en la caja, junto al mostrador':'')}
function seatY(ch){return .46-(ch.model==='f'?.93:1.0)+.1}

/* menú de compras */
const shopEl=document.createElement('div');shopEl.id='shopUI';shopEl.innerHTML='<div class="sbox"><h3></h3><div class="items"></div><div class="foot"><span class="bal"></span><button class="close">Salir</button></div></div>';document.body.appendChild(shopEl);
const st=document.createElement('style');st.textContent=`#shopUI{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:30;background:rgba(10,8,6,.35)}#shopUI.on{display:flex}
#shopUI .sbox{width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;background:rgba(23,19,15,.93);border:1px solid rgba(240,180,41,.5);border-radius:10px;padding:16px;color:#f5ead7;font:15px var(--body,system-ui)}
#shopUI h3{margin:0 0 10px;font:600 22px var(--display,Georgia);color:#f0b429}#shopUI .items{display:flex;flex-direction:column;gap:6px}
#shopUI .it{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border-radius:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:inherit;font:inherit;text-align:left;cursor:pointer}
#shopUI .it:hover,#shopUI .it:focus{background:rgba(240,180,41,.18);outline:none}#shopUI .it b{color:#8ac926;font-variant-numeric:tabular-nums;white-space:nowrap}#shopUI .it small{display:block;opacity:.7;font-size:12px}
#shopUI .it.no b{color:#e4572e}#shopUI .foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px}#shopUI .close{background:#e4572e;color:#fff;border:0;border-radius:6px;padding:10px 20px;font:700 15px inherit;cursor:pointer}
#energy{width:150px;height:8px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.25);border-radius:5px;overflow:hidden;margin:6px 0 0 auto}#energy i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3fa34d,#8ac926);transition:width .2s}
#energyL{font:700 10px var(--body,system-ui);letter-spacing:.12em;color:#f5ead7;text-align:right;margin-top:4px;text-shadow:0 1px 2px #000}
#radio{position:fixed;left:50%;top:14px;transform:translateX(-50%);font:700 15px var(--body,system-ui);color:#f0b429;background:rgba(23,19,15,.75);padding:6px 14px;border-radius:16px;display:none;z-index:5}#radio.on{display:block}`;document.head.appendChild(st);
shopEl.querySelector('.close').addEventListener('click',closeMenu);
function effectText(it){if(it.o)return 'Ropa';if(it.e)return '+'+it.e+' energía'+(it.max?' · aguante +'+it.max:'');return it.msg?'Recuerdo':''}
function openMenu(m){menuOpen=m;const items=MENUS[m.menu];shopEl.querySelector('h3').textContent=m.label;const box=shopEl.querySelector('.items');box.innerHTML='';
  items.forEach((it,i)=>{const b=document.createElement('button');b.className='it'+(C.getMoney()<it.p?' no':'');b.innerHTML=`<span>${i<9?(i+1)+'. ':''}${it.n}<small>${effectText(it)}</small></span><b>${it.p?C.fmt(it.p):'Gratis'}</b>`;b.addEventListener('click',()=>buy(it));box.appendChild(b)});
  refreshBal();shopEl.classList.add('on')}
function refreshBal(){shopEl.querySelector('.bal').textContent='Tienes '+C.fmt(C.getMoney());const items=MENUS[menuOpen.menu];shopEl.querySelectorAll('.it').forEach((b,i)=>b.classList.toggle('no',C.getMoney()<items[i].p))}
function closeMenu(){menuOpen=null;shopEl.classList.remove('on')}
function buy(it){if(C.getMoney()<it.p){C.toast('No te alcanza la plata',1400);return}C.setMoney(C.getMoney()-it.p);C.chime();
  if(it.e){P.en=Math.min(P.max+(it.max||0),P.en+it.e);if(it.max)P.max+=it.max;P.en=Math.min(P.en,P.max)}
  if(it.o){Object.assign(P.spec,it.o);if(it.o.hat===null)delete P.spec.hat;rebuildPlayer();IS.add(player.mesh)}
  C.toast(it.msg||('Compraste: '+it.n.toLowerCase()),1600);refreshBal()}
window.addEventListener('keydown',e=>{if(!menuOpen)return;if(e.code==='Escape'){closeMenu();return}const n=parseInt(e.key,10);if(n>=1&&n<=9){const it=MENUS[menuOpen.menu][n-1];if(it)buy(it)}});

/* =========================================================================================
   6. POSES EXTRA: salto, golpe, sentado en silla
   ========================================================================================= */
const aim=C.PPL.aim;
C.PPL.POSES.chair=ch=>{aim(ch,'LeftUpLeg',.1,-.05,1);aim(ch,'RightUpLeg',-.1,-.05,1);aim(ch,'LeftLeg',.03,-1,.1);aim(ch,'RightLeg',-.03,-1,.1);
  aim(ch,'LeftArm',.2,-.85,.45);aim(ch,'RightArm',-.2,-.85,.45);aim(ch,'LeftForeArm',-.15,-.15,1);aim(ch,'RightForeArm',.15,-.15,1)};
C.PPL.POSES.domino=ch=>{C.PPL.POSES.chair(ch);aim(ch,'LeftArm',.25,-.6,.75);aim(ch,'RightArm',-.25,-.6,.75);aim(ch,'LeftForeArm',-.3,-.05,1);aim(ch,'RightForeArm',.3,-.05,1)};
function anim(ch,speed,dt,pose){C.PPL.animate(ch,speed,dt,pose)}
const ACT={jumpY:0,vy:0,air:false,punchT:0,punchSide:1,hitDone:false};
function jump(){if(player.car||player.ride||ENT||inside||ACT.air||menuOpen)return;if(P.en<4){C.toast('Estás muy cansado',900);return}ACT.vy=5.4;ACT.air=true;P.en=Math.max(0,P.en-3)}
function punch(){if(player.car||player.ride||ENT||menuOpen||ACT.punchT>0)return;ACT.punchT=.42;ACT.punchSide=-ACT.punchSide;ACT.hitDone=false;C.tone&&C.tone(140,.08,'triangle',.05)}
function footPost(dt,inp){// energy
  const sprinting=inp.run&&player.spd>5;if(sprinting)P.en=Math.max(0,P.en-8*dt);else P.en=Math.min(P.max,P.en+(player.spd<1?5:2.5)*dt);
  if(ACT.air){ACT.vy-=15*dt;ACT.jumpY+=ACT.vy*dt;if(ACT.jumpY<=0){ACT.jumpY=0;ACT.vy=0;ACT.air=false}}
  const ch=player.ch;
  if(ACT.air){const k=clamp(ACT.jumpY/0.5,0,1);aim(ch,'LeftUpLeg',.1,-.6,.8,k);aim(ch,'RightUpLeg',-.1,-.8,.3,k);aim(ch,'LeftLeg',0,-.8,-.6,k);aim(ch,'RightLeg',0,-1,-.3,k);aim(ch,'LeftArm',.6,.3,.3,k*.8);aim(ch,'RightArm',-.6,.3,.3,k*.8)}
  if(ACT.punchT>0){ACT.punchT-=dt;const t=1-ACT.punchT/.42;const k=t<.35?t/.35:Math.max(0,1-(t-.35)/.65);const R=ACT.punchSide>0;
    aim(ch,R?'RightArm':'LeftArm',R?-.12:.12,.05,1,k);aim(ch,R?'RightForeArm':'LeftForeArm',R?-.05:.05,.08,1,k);aim(ch,R?'LeftArm':'RightArm',R?.25:-.25,-.4,.6,k*.7);aim(ch,R?'LeftForeArm':'RightForeArm',R?-.3:.3,.6,.6,k*.7);
    if(t>.3&&!ACT.hitDone){ACT.hitDone=true;hitAt(player.x+Math.sin(player.yaw)*1,player.z+Math.cos(player.yaw)*1)}}
  if(ACT.jumpY>0)player.mesh.position.y+=ACT.jumpY}
function hitAt(x,z){let hit=false;for(const p of C.ALLP){if(!p.vis||p.down>0)continue;if(dist2(p.x,p.z,x,z)<.95){p.down=5;p.skin=true;hit=true}}
  for(const g of GROUPS)for(const p of g.people)if(!p.down&&dist2(p.x,p.z,x,z)<.95){p.down=5;hit=true}
  if(hit){C.crash(.16);if(C.policeNear(player.x,player.z,60))C.crime(1,'¡La policía te vio pegándole a alguien!');else C.toast('¡Pum!',600)}}

/* entrar / salir del carro: caminar a la puerta, abrirla, (sacar al conductor), sentarse y cerrar */
const DOORS=[],doorMats={};const GLASSM=new THREE.MeshPhongMaterial({color:0x0d151a,shininess:120,specular:0xbbbbbb,transparent:true,opacity:.6,depthWrite:false});
const hasDoors=v=>!v.rig.moto&&!v.rig.open&&!v.bus&&v.type!=='coche';
function doorFor(v,side,rear){const key=(side>0?'L':'R')+(rear?'r':'f');v.rig.doors=v.rig.doors||{};if(v.rig.doors[key])return v.rig.doors[key];
  const s=v.rig.seat,w=v.rig.wid/2;const g=new THREE.Group();g.position.set(side*(w+.012),0,(rear?s.z-.95:s.z)+.55);
  const pm=doorMats[v.col]||(doorMats[v.col]=new THREE.MeshPhongMaterial({color:v.col||'#cccccc',shininess:60,specular:0x444444}));
  const panel=new THREE.Mesh(new THREE.BoxGeometry(.05,.6,1.02),pm);panel.position.set(0,.66,-.51);panel.castShadow=true;g.add(panel);
  const trim=new THREE.Mesh(new THREE.BoxGeometry(.04,.05,1.0),lm('#1d1d1d'));trim.position.set(0,.97,-.5);g.add(trim);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(.03,.36,.86),GLASSM);glass.position.set(0,1.17,-.47);g.add(glass);
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.18),lm('#c9ccd1'));handle.position.set(side*.03,.86,-.82);g.add(handle);
  g.visible=false;v.rig.body.add(g);const d={g,side,cur:0,tgt:0,v};v.rig.doors[key]=d;DOORS.push(d);return d}
function updateDoors(dt){for(const d of DOORS){if(d.tgt===0&&d.cur===0){if(d.g.visible)d.g.visible=false;continue}d.g.visible=true;const was=d.cur;d.cur=clamp(d.cur+clamp(d.tgt-d.cur,-dt*3.4,dt*3.4),0,1);
    d.g.rotation.y=-d.side*Math.sin(d.cur*Math.PI/2)*1.1;if(was>0&&d.cur===0&&C.tone)C.tone(95,.09,'triangle',.06)}}
function closeDoorLater(d,ms){setTimeout(()=>{d.tgt=0},ms)}
// local (car space) → world
function wpt(v,lx,lz){const c=Math.cos(v.yaw),s=Math.sin(v.yaw);return{x:v.x+lx*c+lz*s,z:v.z-lx*s+lz*c}}
function seatLocal(v,ch,rear){const s=v.rig.seat;const hipY=ch.model==='f'?.93:1.0;return V3(rear?-s.x:s.x,s.y-hipY+(v.rig.moto?.06:.12),rear?s.z-.95:s.z)}
function seatWorld(v,ch,rear){v.rig.root.updateMatrixWorld(true);return v.rig.body.localToWorld(seatLocal(v,ch,rear))}
const SITB=[['LeftUpLeg',.12,-.12,1],['RightUpLeg',-.12,-.12,1],['LeftLeg',.02,-1,.25],['RightLeg',-.02,-1,.25],['LeftArm',.22,-.55,.8],['RightArm',-.22,-.55,.8],['LeftForeArm',-.25,.15,1],['RightForeArm',.25,.15,1]];
function sitBlend(ch,k){if(k<=.01)return;for(const b of SITB)aim(ch,b[0],b[1],b[2],b[3],Math.min(1,k))}
function doorSpot(v,side,rear){const s=v.rig.seat,w=v.rig.wid/2;return{lx:side*(w+(v.rig.moto?.5:v.bus?.9:.62)),lz:(rear?s.z-.95:s.z)+(v.rig.moto?.1:-.05)}}
let ENT=null;
function enterCar(v,done,opts){opts=opts||{};const side=opts.rear?-1:1;const sp=doorSpot(v,side,opts.rear);ENT={kind:'in',v,done,opts,side,lx:sp.lx,lz:sp.lz,phase:'walk',t:0,victim:opts.victim||null}}
function exitCar(v,opts,done){opts=opts||{};let side=opts.rear?-1:1;let sp=doorSpot(v,side,opts.rear),tp=wpt(v,sp.lx,sp.lz);
  if(!C.onLand(tp.x,tp.z)||C.solidAt(tp.x,tp.z)){const s2=doorSpot(v,-side,opts.rear),t2=wpt(v,s2.lx,s2.lz);if(C.onLand(t2.x,t2.z)&&!C.solidAt(t2.x,t2.z)){side=-side;sp=s2;tp=t2}}
  const sw=seatWorld(v,player.ch,opts.rear);const quick=!!opts.quick||!hasDoors(v);if(hasDoors(v)&&!opts.quick)doorFor(v,side,opts.rear).tgt=1;
  ENT={kind:'out',v,done,opts,side,phase:'out',t:0,from:{x:sw.x,y:sw.y,z:sw.z},to:tp,quick,yaw:v.yaw};player.x=sw.x;player.z=sw.z}
// a pulled-out driver: stumbles out, falls, gets up and runs away shouting
const VICT=[];
function startVictim(e){const ch=e.victim,v=e.v;const p=ch.mesh.getWorldPosition(V3(0,0,0));if(ch.mesh.parent)ch.mesh.parent.remove(ch.mesh);C.scene.add(ch.mesh);ch.mesh.visible=true;ch.mesh.position.copy(p);ch.mesh.rotation.set(0,v.yaw,0);
  const out=wpt(v,e.lx+e.side*1.1,e.lz-.4);VICT.push({ch,t:0,from:p.clone(),to:out,yaw:Math.atan2(out.x-p.x,out.z-p.z),done:e.opts.onVictimDone,x:out.x,z:out.z});
  C.toast(pick(['—¡Oye! ¡Mi carro!','—¡Ladrón! ¡Auxilio!','—¡Ey, ey! ¿Qué te pasa?']),1500);C.crash&&C.crash(.1)}
function updateVictims(dt){for(let i=VICT.length-1;i>=0;i--){const q=VICT[i],ch=q.ch;q.t+=dt;const t=q.t;
    if(t<.6){const k=t/.6,s=k*k*(3-2*k);ch.mesh.position.set(lerp(q.from.x,q.to.x,s),lerp(q.from.y,C.ground(q.to.x,q.to.z),s)+Math.sin(k*Math.PI)*.25,lerp(q.from.z,q.to.z,s));ch.mesh.rotation.set(0,q.yaw,0);
      anim(ch,0,dt,'');sitBlend(ch,1-s);aim(ch,'LeftArm',.5,.6,.3,.8);aim(ch,'RightArm',-.5,.6,.3,.8)}
    else if(t<2.6){const k=t<1.1?(t-.6)/.5:t<2.1?1:1-(t-2.1)/.5;ch.mesh.rotation.set(-Math.PI/2*k*k,q.yaw,0);ch.mesh.position.set(q.x,C.ground(q.x,q.z)+.22*k,q.z);anim(ch,0,dt,'')}
    else if(t<9){if(!q.dir){let dx=q.x-player.x,dz=q.z-player.z;const l=Math.hypot(dx,dz)||1;q.dir=[dx/l,dz/l]}
      const sp=5.2;let nx=q.x+q.dir[0]*sp*dt,nz=q.z+q.dir[1]*sp*dt;if(!C.onLand(nx,nz)||C.solidAt(nx+q.dir[0],nz+q.dir[1])){q.dir=[-q.dir[1],q.dir[0]];nx=q.x;nz=q.z}
      q.x=nx;q.z=nz;ch.mesh.rotation.set(0,angLerp(ch.mesh.rotation.y,Math.atan2(q.dir[0],q.dir[1]),Math.min(1,dt*8)),0);ch.mesh.position.set(q.x,C.ground(q.x,q.z),q.z);anim(ch,sp,dt,'')}
    else{C.scene.remove(ch.mesh);VICT.splice(i,1);q.done&&q.done()}}}
function tween(dt){if(!ENT)return false;const e=ENT,v=e.v,ch=player.ch;e.t+=dt;
  if(e.kind==='shop'){const s=e.shop;const dx=s.wx-player.x,dz=s.wz-player.z,d=Math.hypot(dx,dz);if(d>.5){player.x+=dx/d*2*dt;player.z+=dz/d*2*dt;player.yaw=angLerp(player.yaw,Math.atan2(dx,dz),Math.min(1,dt*12))}C.animate(ch,d>.5?2:0,dt,'');
    player.mesh.position.set(player.x,C.ground(player.x,player.z),player.z);player.mesh.rotation.y=player.yaw;return true}
  if(e.kind==='step'){const sp=e.t<.55?1.8:0;player.x+=Math.sin(player.yaw)*sp*dt;player.z+=Math.cos(player.yaw)*sp*dt;C.animate(ch,sp,dt,'');player.mesh.position.set(player.x,C.ground(player.x,player.z),player.z);player.mesh.rotation.y=player.yaw;if(e.t>.6)ENT=null;return true}
  if(e.kind==='out'){const delay=e.quick?0:.28,dur=e.quick?.3:.55;let k=clamp((e.t-delay)/dur,0,1);const s=k*k*(3-2*k);
    const sw=seatWorld(v,ch,e.opts.rear);const fx=e.t<delay?sw.x:lerp(e.from.x,e.to.x,s),fz=e.t<delay?sw.z:lerp(e.from.z,e.to.z,s),fy=lerp(e.t<delay?sw.y:e.from.y,C.ground(e.to.x,e.to.z),s);
    if(e.t<delay){e.from={x:sw.x,y:sw.y,z:sw.z}}
    player.x=fx;player.z=fz;player.yaw=e.yaw+(k>.5?-e.side*Math.PI/2*(k-.5)*2*.6:0);C.animate(ch,k>.2&&k<1?1.4:0,dt,'');sitBlend(ch,1-s);
    player.mesh.position.set(fx,fy,fz);player.mesh.rotation.set(0,player.yaw,0);
    if(k>=1){ENT=null;if(hasDoors(v)&&!e.quick)closeDoorLater(doorFor(v,e.side,e.opts.rear),180);e.done&&e.done()}return true}
  // getting in
  if(e.phase==='walk'){const tp=wpt(v,e.lx,e.lz);const dx=tp.x-player.x,dz=tp.z-player.z,d=Math.hypot(dx,dz);
    if(d>.18&&e.t<2.2){const sp=Math.min(4.2,d/Math.max(dt,1e-3));player.x+=dx/d*sp*dt;player.z+=dz/d*sp*dt;player.yaw=angLerp(player.yaw,Math.atan2(dx,dz),Math.min(1,dt*14));C.animate(ch,Math.min(4.2,d*3+1),dt,'')}
    else{e.phase='open';e.t=0;if(hasDoors(v))doorFor(v,e.side,e.opts.rear).tgt=1;C.tone&&C.tone(260,.04,'square',.025)}}
  if(e.phase==='open'||e.phase==='pull'){player.yaw=angLerp(player.yaw,v.yaw-e.side*Math.PI/2,Math.min(1,dt*12));C.animate(ch,0,dt,'');const tp=wpt(v,e.lx,e.lz);player.x=lerp(player.x,tp.x,Math.min(1,dt*8));player.z=lerp(player.z,tp.z,Math.min(1,dt*8));
    if(e.phase==='open'){const k=Math.min(1,e.t/.3);aim(ch,'RightArm',-.45,-.05,.9,k);aim(ch,'RightForeArm',-.2,.15,1,k);
      if(e.t>(hasDoors(v)?.34:.12)){if(e.victim){e.phase='pull';e.t=0;startVictim(e)}else{e.phase='in';e.t=0;e.from={x:player.x,y:C.ground(player.x,player.z),z:player.z}}}}
    else{const k=Math.sin(Math.min(1,e.t/.6)*Math.PI);aim(ch,'LeftArm',.15,-.1,1,.9);aim(ch,'RightArm',-.15,-.1,1,.9);aim(ch,'LeftForeArm',-.1,-.3,1,k);aim(ch,'RightForeArm',.1,-.3,1,k);aim(ch,'Spine',0,1,-.35*k,.6);
      if(e.t>.7){e.phase='in';e.t=0;e.from={x:player.x,y:C.ground(player.x,player.z),z:player.z}}}}
  if(e.phase==='in'){const dur=v.rig.moto?.4:.55;const k=Math.min(1,e.t/dur),s=k*k*(3-2*k);const sw=seatWorld(v,ch,e.opts.rear);
    player.x=lerp(e.from.x,sw.x,s);player.z=lerp(e.from.z,sw.z,s);const y=lerp(e.from.y,sw.y,s)+(v.rig.moto?Math.sin(k*Math.PI)*.25:0);
    player.yaw=angLerp(player.yaw,v.yaw,Math.min(1,dt*(k>.35?14:4)));C.animate(ch,0,dt,'');sitBlend(ch,s);player.mesh.position.set(player.x,y,player.z);player.mesh.rotation.set(0,player.yaw,0);
    if(k>=1){ENT=null;if(hasDoors(v))closeDoorLater(doorFor(v,e.side,e.opts.rear),120);e.done()}return true}
  player.mesh.position.set(player.x,C.ground(player.x,player.z),player.z);player.mesh.rotation.y=player.yaw;return true}
/* fundido a negro (entrar a locales, saltar un viaje) */
const fadeEl=document.createElement('div');fadeEl.id='fade';fadeEl.innerHTML='<span></span>';document.body.appendChild(fadeEl);
{const s2=document.createElement('style');s2.textContent='#fade{position:fixed;inset:0;background:#0d0a07;opacity:0;pointer-events:none;transition:opacity .28s ease;z-index:25;display:flex;align-items:center;justify-content:center}#fade span{font:400 clamp(22px,4.5vw,36px) var(--display,Georgia);color:#f0b429;text-align:center;padding:0 16px}';document.head.appendChild(s2)}
const FADE={busy:false};
function fade(label,mid){if(FADE.busy)return false;FADE.busy=true;fadeEl.firstChild.textContent=label||'';fadeEl.style.opacity='1';
  setTimeout(()=>{try{mid()}catch(err){console.error(err)}setTimeout(()=>{fadeEl.style.opacity='0';setTimeout(()=>{FADE.busy=false},300)},label?420:120)},300);return true}

/* =========================================================================================
   7. GRUPOS DE GENTE EN LA CALLE: dominó, terraza con sillas plásticas, conversación
   ========================================================================================= */
const GROUPS=[];let gPool=null;
const EGRID=new Map();C.GRAPH.edges.forEach((e,i)=>{if(e.ty<2||e.ty>5)return;const A=C.GRAPH.nodes[e.a],B=C.GRAPH.nodes[e.b];const k=Math.floor((A.x+B.x)/2/60)+','+Math.floor((A.z+B.z)/2/60);let l=EGRID.get(k);if(!l){l=[];EGRID.set(k,l)}l.push(i)});
function edgesNear(x,z,r){const out=[];const n=Math.ceil(r/60);const ci=Math.floor(x/60),cj=Math.floor(z/60);for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const l=EGRID.get((ci+i)+','+(cj+j));if(l)out.push(...l)}return out}
function makeGroups(){gPool=[];const n=C.LOWEND?10:18;for(let i=0;i<n;i++)gPool.push(C.buildCharacter(C.archetype(i%6===0?'vendor':'local')));
  const kinds=C.LOWEND?['domino','porch','chat']:['domino','porch','chat','porch','chat','domino'];let k=0;
  for(const kind of kinds){const need=kind==='domino'?4:kind==='porch'?3:3;if(k+need>gPool.length)break;const g={kind,grp:new THREE.Group(),people:[],x:0,z:0,placed:false};
    for(let i=0;i<need;i++)g.people.push({ch:gPool[k++],x:0,z:0,yaw:0,pose:'',down:0});
    if(kind==='domino'){const t=new THREE.Mesh(new THREE.BoxGeometry(.9,.05,.9),lm('#2e7d32'));t.position.y=.74;g.grp.add(t);const leg=new THREE.Mesh(new THREE.BoxGeometry(.06,.72,.06),lm('#6b4a2b'));leg.position.y=.36;g.grp.add(leg);
      for(let q=0;q<10;q++){const d=new THREE.Mesh(new THREE.BoxGeometry(.05,.012,.1),lm('#fafafa'));d.position.set(rr(-.3,.3),.77,rr(-.3,.3));d.rotation.y=rr(0,TAU);g.grp.add(d)}}
    for(let i=0;i<need;i++)if(kind!=='chat'){const c=plasticChair();g.grp.add(c);g.people[i].chair=c}
    C.scene.add(g.grp);for(const p of g.people)C.scene.add(p.ch.mesh);GROUPS.push(g)}}
const grpD=()=>(C.Q&&C.Q.grp)||95;
function placeGroup(g){const gD=grpD();const cand=edgesNear(player.x,player.z,gD+15);if(!cand.length)return false;for(let t=0;t<40;t++){const ei=pick(cand),e=C.GRAPH.edges[ei],A=C.GRAPH.nodes[e.a],B=C.GRAPH.nodes[e.b];const s=rand();const x0=lerp(A.x,B.x,s),z0=lerp(A.z,B.z,s);
    const d=dist2(x0,z0,player.x,player.z);if(d<Math.min(35,gD*.45)||d>gD+15)continue;const L=Math.hypot(B.x-A.x,B.z-A.z)||1;const dx=(B.x-A.x)/L,dz=(B.z-A.z)/L;const side=rand()<.5?1:-1;const o=side*(C.RW[e.ty]/2+rr(2.4,3.6));
    const x=x0-dz*o,z=z0+dx*o;if(!C.onLand(x,z)||C.solidAt(x,z)||GROUPS.some(q=>q!==g&&q.placed&&dist2(q.x,q.z,x,z)<12))continue;
    const face=Math.atan2(-dz*-side,dx*-side);// facing the street
    const pts=[];if(g.kind==='domino')for(let i=0;i<4;i++){const a=i/4*TAU+.4;pts.push([x+Math.sin(a)*.75,z+Math.cos(a)*.75,a+Math.PI,'domino'])}
    else if(g.kind==='porch'){const tx=dx,tz=dz;for(let i=0;i<3;i++){const off=(i-1)*.85;const px=x+tx*off,pz=z+tz*off;const yaw=Math.atan2(dz*side,-dx*side)+(i-1)*.35;pts.push([px,pz,i===2?yaw+.5:yaw,'chair'])}}
    else for(let i=0;i<3;i++){const a=i/3*TAU;pts.push([x+Math.sin(a)*.7,z+Math.cos(a)*.7,a+Math.PI,'talk'])}
    if(pts.some(q=>C.solidAt(q[0],q[1])||!C.onLand(q[0],q[1])||C.nearestRoad(q[0],q[1],1.4,s=>!s.walk)))continue;if(g.kind==='porch'&&!C.solidAt(x+(-dz*side)*4.5,z+(dx*side)*4.5))continue;
    const gy=C.ground(x,z);g.x=x;g.z=z;g.placed=true;g.grp.position.set(0,0,0);if(g.kind==='domino'){g.grp.children.forEach((c,i)=>{if(!c.userData.off)c.userData.off=c.position.clone()});g.grp.position.set(x,gy,z)}
    g.people.forEach((p,i)=>{const q=pts[i];p.x=q[0];p.z=q[1];p.yaw=q[2];p.pose=q[3];p.down=0;p.ch.mesh.rotation.set(0,p.yaw,0);
      if(p.chair){if(g.kind==='domino'){p.chair.position.set(q[0]-x,0,q[1]-z)}else{g.grp.position.set(0,gy,0);p.chair.position.set(q[0],0,q[1])}p.chair.rotation.y=p.yaw}
      p.ch.mesh.position.set(p.x,gy+(p.pose==='talk'?0:seatY(p.ch)),p.z)});return true}g.placed=false;return false}
let gT=0;
function updateGroups(dt){if(!gPool)return;gT-=dt;if(gT<=0){gT=.7;for(const g of GROUPS){if(!g.placed||dist2(g.x,g.z,player.x,player.z)>grpD()+55)placeGroup(g)}}
  for(const g of GROUPS){const d=dist2(g.x,g.z,player.x,player.z);const gD=grpD();const vis=g.placed&&d<gD;g.grp.visible=vis;for(const p of g.people)p.ch.mesh.visible=vis;if(!vis)continue;const far=d>gD*.63;if(far&&(g.fr=(g.fr||0)+1)%4)continue;const gdt=far?dt*4:dt;
    for(const p of g.people){if(p.down>0){p.down-=dt;const k=p.down>1?Math.min(1,(5-p.down)*5):Math.max(0,p.down);p.ch.mesh.rotation.x=-Math.PI/2*k;if(p.down<=0)p.ch.mesh.rotation.x=0;continue}
      anim(p.ch,0,gdt,p.pose)}
    // keep the player out of the furniture
    const r=g.kind==='domino'?1.25:0;if(r&&dist2(g.x,g.z,player.x,player.z)<r){const a=Math.atan2(player.x-g.x,player.z-g.z);player.x=g.x+Math.sin(a)*r;player.z=g.z+Math.cos(a)*r}}}

/* =========================================================================================
   8. POSTES DE LUZ CON CABLES Y SEMÁFOROS
   ========================================================================================= */
(function poles(){const items=[],wires=new Map();const pg=(function(){const parts=[new THREE.CylinderGeometry(.11,.16,9,6).translate(0,4.5,0),new THREE.BoxGeometry(1.8,.1,.1).translate(0,8.5,0),new THREE.CylinderGeometry(.22,.22,.6,8).translate(.5,7.7,0)];
    const P=[];parts.forEach(g=>P.push(...g.toNonIndexed().attributes.position.array));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g})();
  C.MAP.roads.forEach((r,ri)=>{const [ty,,,,name,p]=r;if(ty<3||ty>5)return;let acc=hash(ri,3)*30,prev=null;
    for(let i=0;i<p.length-2;i+=2){const ax=p[i],az=p[i+1],bx=p[i+2],bz=p[i+3],L=Math.hypot(bx-ax,bz-az);if(L<1)continue;const dx=(bx-ax)/L,dz=(bz-az)/L;
      for(let s=acc;s<L;s+=32){const off=C.RW[ty]/2+.5;const x=ax+dx*s-dz*off,z=az+dz*s+dx*off;if(C.inCentro(x,z)||!C.onLand(x,z)||C.solidAt(x,z)){prev=null;continue}
        const y=C.ground(x,z),yaw=Math.atan2(dx,dz)+Math.PI/2;items.push({x,z,m:C.place(x,y,z,0,yaw,0)});
        const cur={x,y,z,yaw};if(prev&&Math.hypot(prev.x-x,prev.z-z)<45){const k=Math.floor(x/C.TILE)+'|'+Math.floor(z/C.TILE);let a=wires.get(k);if(!a){a=[];wires.set(k,a)}
          for(const o of [-.8,0,.8]){const ox=Math.sin(yaw)*o,oz=Math.cos(yaw)*o;const ox0=Math.sin(prev.yaw)*o,oz0=Math.cos(prev.yaw)*o;let lx=prev.x+ox0,ly=prev.y+8.58,lz=prev.z+oz0;
            for(let q=1;q<=6;q++){const t=q/6;const nx=lerp(prev.x+ox0,x+ox,t),nz=lerp(prev.z+oz0,z+oz,t),ny=lerp(prev.y,y,t)+8.58-Math.sin(t*Math.PI)*.55;a.push(lx,ly,lz,nx,ny,nz);lx=nx;ly=ny;lz=nz}}}
        prev=cur}acc=(acc-L)%32;if(acc<0)acc+=32}});
  C.instChunks(pg,lm('#8d8a84'),items,'lamp',false);
  const wm=new THREE.LineBasicMaterial({color:'#1b1b1b'});
  for(const [k,a] of wires){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));const l=new THREE.LineSegments(g,wm);l.frustumCulled=true;g.computeBoundingSphere();C.scene.add(l);const [tx,tz]=k.split('|').map(Number);C.tiles.push({m:l,x:(tx+.5)*C.TILE,z:(tz+.5)*C.TILE,cat:'lamp'})}})();

const TL={mats:[],t:0};
(function trafficLights(){const G=C.GRAPH;const deg=new Map();G.edges.forEach((e,i)=>{for(const n of [e.a,e.b]){let l=deg.get(n);if(!l){l=[];deg.set(n,l)}l.push(i)}});
  const groups=[[],[]];const housing=[],poles=[];let count=0;TL.nodes=new Map();
  for(const [n,list] of deg){if(count>220)break;const main=list.filter(i=>G.edges[i].ty<=2);if(list.length<3||main.length<2)continue;const N=G.nodes[n];
    let wInt=0;for(const i of list)wInt=Math.max(wInt,C.RW[G.edges[i].ty]/2);
    for(const i of list){const e=G.edges[i];const o=e.a===n?G.nodes[e.b]:G.nodes[e.a];let dx=o.x-N.x,dz=o.z-N.z;const L=Math.hypot(dx,dz);if(L<wInt+6)continue;dx/=L;dz/=L;
      const mx=-dx,mz=-dz;const rx=-mz,rz=mx;const w=C.RW[e.ty]/2;const x=N.x+dx*(wInt+1.5)+rx*(w+1.1),z=N.z+dz*(wInt+1.5)+rz*(w+1.1);if(!C.onLand(x,z)||C.solidAt(x,z))continue;
      const y=C.ground(x,z),yaw=Math.atan2(dx,dz);const grp=Math.abs(dx)>Math.abs(dz)?0:1;
      poles.push({x,z,m:C.place(x,y,z,0,yaw,0)});groups[grp].push({x,z,y,yaw});count++;TL.nodes.set(n,{off:wInt+1.5})}}
  const pg=(function(){const parts=[new THREE.CylinderGeometry(.08,.1,4.2,6).translate(0,2.1,0),new THREE.BoxGeometry(.38,1.1,.3).translate(0,4.1,0)];const P=[];parts.forEach(g=>P.push(...g.toNonIndexed().attributes.position.array));
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g})();
  C.instChunks(pg,lm('#2a2c2e'),poles,'lamp',false);
  const bulb=new THREE.SphereGeometry(.11,10,6);const cols=[0xff2a1a,0xffb300,0x2bff6a];
  groups.forEach((list,gi)=>cols.forEach((c,ci)=>{const m=new THREE.MeshBasicMaterial({color:0x222222});TL.mats.push({m,gi,ci,c:new THREE.Color(c)});
    C.instChunks(bulb,m,list.map(q=>{const ox=Math.sin(q.yaw)*.17,oz=Math.cos(q.yaw)*.17;return{x:q.x,z:q.z,m:C.place(q.x+ox,q.y+4.45-ci*.33,q.z+oz)}}),'lamp',false)}))})();
// the light a car approaching along edge e sees (same grouping as the poles: by the axis of the street)
function tlAt(n){return TL.nodes.get(n)||null}
function tlColor(e){const g=Math.abs(e.dx)>Math.abs(e.dz)?0:1;const t=(TL.t+g*12)%24;return t<10?'G':t<12?'Y':'R'}
function updateTL(dt){TL.t=(TL.t+dt)%24;const ph=g=>{const t=(TL.t+g*12)%24;return t<10?2:t<12?1:0};const dark=new THREE.Color(0x2a2a2a);
  for(const q of TL.mats){const on=ph(q.gi)===q.ci;q.m.color.copy(on?q.c:dark)}}

/* =========================================================================================
   9. RADIO DEL CARRO: música generada en vivo (champeta, vallenato, salsa, dembow)
   ========================================================================================= */
const ST=[{name:'Radio apagada'},{name:'Champeta Caliente 98.3',bpm:104,style:'champeta'},{name:'Vallenato Stereo 101.5',bpm:118,style:'vallenato'},{name:'Salsa del Corralito 93.7',bpm:96,style:'salsa'},{name:'Dembow Caribe 89.1',bpm:94,style:'dembow'}];
const RAD={i:1,out:null,next:0,step:0,bar:0,noise:null,lastCar:null,shown:0};
const N=n=>440*Math.pow(2,(n-69)/12);
function radioInit(){const AC=C.getAC();if(!AC||RAD.out)return!!RAD.out;const g=AC.createGain();g.gain.value=0;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=5200;g.connect(f);f.connect(AC.destination);RAD.out=g;
  const len=AC.sampleRate;const b=AC.createBuffer(1,len,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;RAD.noise=b;return true}
function osc(type,freq,t,dur,vol,opt){const AC=C.getAC();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(opt&&opt.to)o.frequency.exponentialRampToValueAtTime(opt.to,t+(opt.tt||dur));
  if(opt&&opt.detune)o.detune.value=opt.detune;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(opt&&opt.a||.005));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  let last=g;if(opt&&opt.lp){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=opt.lp;g.connect(f);last=f}o.connect(g);last.connect(RAD.out);o.start(t);o.stop(t+dur+.05)}
function noise(t,dur,vol,hp,bp){const AC=C.getAC();const s=AC.createBufferSource();s.buffer=RAD.noise;const g=AC.createGain();const f=AC.createBiquadFilter();f.type=bp?'bandpass':'highpass';f.frequency.value=hp;if(bp)f.Q.value=bp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(RAD.out);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
const kick=(t,v)=>osc('sine',130,t,.32,v||.9,{to:42,tt:.12});
const snare=(t,v)=>{noise(t,.16,(v||.5),1800);osc('triangle',190,t,.08,.25)};
const hat=(t,v)=>noise(t,.04,v||.18,8000);
const clave=t=>osc('sine',2400,t,.06,.35);
const bell=t=>{osc('square',560,t,.12,.08,{lp:3000});osc('square',845,t,.12,.06,{lp:3000})};
const conga=(t,f,v)=>osc('sine',f,t,.22,v||.5,{to:f*.85,tt:.1});
const pluck=(t,f,v,d)=>{osc('triangle',f,t,d||.22,v||.18,{lp:4200});osc('square',f*2,t,(d||.22)*.5,(v||.18)*.25,{lp:2600})};
const bass=(t,f,d,v)=>osc('triangle',f,t,d,v||.5,{lp:600,a:.01});
const accordion=(t,f,d,v)=>{osc('sawtooth',f,t,d,v||.07,{lp:2400,a:.02,detune:-8});osc('square',f,t,d,(v||.07)*.6,{lp:1800,a:.02,detune:7})};
const piano=(t,f,v)=>{osc('triangle',f,t,.35,v||.14,{lp:3500});osc('sine',f*2,t,.25,(v||.14)*.4)};
const pad=(t,fs,d)=>fs.forEach(f=>osc('sawtooth',f,t,d,.025,{lp:900,a:.25}));
// chord progressions (midi roots + chord tones)
const PROG={champeta:[[60,64,67],[65,69,72],[67,71,74],[65,69,72]],vallenato:[[62,66,69],[67,71,74],[69,73,76],[62,66,69]],salsa:[[57,60,64],[62,65,69],[64,68,71],[57,60,64]],dembow:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]]};
function scheduleStep(st,t,s,bar){const ch=PROG[st.style][bar%4];const root=ch[0];const sx=60/st.bpm/4;
  if(st.style==='dembow'){if(s%4===0)kick(t);if([3,6,11,14].includes(s))snare(t,.45);if(s%2===0)hat(t,.1);if(s===0)pad(t,ch.map(N),sx*16);if([0,3,8,11].includes(s))bass(t,N(root-24),sx*2.5,.6);if(s%4===2&&bar%2)pluck(t,N(ch[(s/4|0)%3]+12),.09,.3)}
  if(st.style==='champeta'){if(s%4===0)kick(t,.8);if(s===4||s===12)snare(t,.35);if(s%2===1)hat(t,.12);if([0,3,6,8,11,14].includes(s))bass(t,N(root-24+(s===6||s===14?7:0)),sx*1.6,.55);
    const arp=[0,1,2,1,2,0,2,1];pluck(t,N(ch[arp[s%8]]+12+(s>=8?12:0)),s%4===0?.2:.12,.18);if(s===0)pad(t,ch.map(N),sx*16)}
  if(st.style==='vallenato'){if(s===0||s===8)conga(t,110,.6);if(s===6||s===14)conga(t,150,.45);noise(t,s%2?.05:.09,s%4===0?.16:.09,3200,2.5);
    if(s===0||s===8)bass(t,N(root-24),sx*3,.55);if(s===4||s===12)bass(t,N(ch[2]-24),sx*2,.45);
    if(s%2===0){const mel=[2,1,0,1,2,2,1,0];const nn=ch[mel[(s/2)%8]]+12+((bar+s)%5===0?2:0);accordion(t,N(nn),sx*2.1,.06)}}
  if(st.style==='salsa'){if([0,3,6,10,12].includes(s))clave(t);if(s%4===0)bell(t);if(s===7||s===8)conga(t,s===7?330:260,.45);if(s===14)conga(t,200,.4);
    if(s===6||s===12)bass(t,N(root-24+(s===12?7:0)),sx*3,.55);if([0,3,6,8,10,13].includes(s)){const o=s%2?12:0;for(const n of ch)piano(t,N(n+o),.09)}}}
function radioUpdate(dt){const AC=C.getAC();const inCar=!!player.car&&!inside;
  if(!AC||!radioInit())return;const st=ST[RAD.i];const want=inCar&&!C.isMuted()&&RAD.i>0?.42:0;RAD.out.gain.setTargetAtTime(want,AC.currentTime,.25);
  if(player.car!==RAD.lastCar){RAD.lastCar=player.car;if(player.car){if(player.car.type==='chiva')RAD.i=1;showStation()}}
  if(!want){RAD.next=AC.currentTime+.05;return}
  const sx=60/st.bpm/4;if(RAD.next<AC.currentTime)RAD.next=AC.currentTime+.05;
  while(RAD.next<AC.currentTime+.25){scheduleStep(st,RAD.next,RAD.step,RAD.bar);RAD.next+=sx*(RAD.step%2?.92:1.08);RAD.step=(RAD.step+1)%16;if(RAD.step===0)RAD.bar++}}
function radioNext(){if(!player.car)return;RAD.i=(RAD.i+1)%ST.length;RAD.step=0;showStation()}
const radioEl=document.createElement('div');radioEl.id='radio';document.body.appendChild(radioEl);let radT=0;
function showStation(){radioEl.textContent='📻 '+ST[RAD.i].name;radioEl.classList.add('on');clearTimeout(radT);radT=setTimeout(()=>radioEl.classList.remove('on'),2600)}

/* =========================================================================================
   10. HUD: barra de energía, botones táctiles, mapa
   ========================================================================================= */
function setPrompt(msg){const e=$('prompt');if(e.textContent!==msg){e.textContent=msg;e.classList.toggle('on',!!msg)}}
{const r=$('topR');const l=document.createElement('div');l.id='energyL';l.textContent='ENERGÍA';const b=document.createElement('div');b.id='energy';b.innerHTML='<i></i>';r.insertBefore(b,$('stars'));r.insertBefore(l,b)}
const btns=$('btns');const mkBtn=(id,t,fn)=>{const b=document.createElement('button');b.id=id;b.textContent=t;b.addEventListener('pointerdown',e=>{e.preventDefault();fn()});btns.insertBefore(b,btns.firstChild);return b};
const bJump=mkBtn('bJump','Saltar',jump),bPunch=mkBtn('bPunch','Golpe',punch),bRadio=mkBtn('bRadio','Radio',radioNext),bEat=mkBtn('bEat','Tomar',()=>consume());bEat.style.display='none';
const cartEl=document.createElement('div');cartEl.id='cartHud';cartEl.style.cssText='display:none;font:700 15px var(--body,system-ui);color:#f5ead7;background:rgba(23,19,15,.76);border:1px solid rgba(243,230,196,.24);border-radius:6px;padding:5px 10px;text-align:right';$('topR').appendChild(cartEl);
let hudMode='';
function hud(){const en=$('energy').firstChild;const w=Math.round(P.en/P.max*100)+'%';if(en.style.width!==w)en.style.width=w;$('energy').style.width=Math.round(150*P.max/100)+'px';
  const mode=inside?'in':player.car?'car':'foot';if(mode!==hudMode){hudMode=mode;bJump.style.display=bPunch.style.display=mode==='foot'?'':'none';bRadio.style.display=mode==='car'?'':'none';$('bHorn').style.display=mode==='car'?'':'none';$('bRun').style.display=mode==='in'?'none':''}
  if(inside){const pk=nearPick(),m=nearMenu(),cj=nearCaja()&&P.cart.length;$('bAct').textContent=pk?'Tomar':cj?'Pagar':m?'Comprar':'Entrar';$('bAct').style.visibility=pk||cj||m?'visible':'hidden'}else $('bAct').style.visibility='visible';
  const txt=(inside&&P.cart.length?'🛒 '+P.cart.length+' · '+C.fmt(cartTotal()):'')+(P.inv.length?(inside&&P.cart.length?'   ':'')+'🎒 '+P.inv.length+(C.isTouch()?'':' · B para tomar'):'');
  if(cartEl.textContent!==txt){cartEl.textContent=txt;cartEl.style.display=txt?'block':'none'}bEat.style.display=P.inv.length?'':'none'}
function outPrompt(){if(nearShop)return(C.isTouch()?'Toca Entrar':'F')+' · entrar: '+nearShop.name;return ''}
function mini(mg,s){mg.font=`bold ${14/s}px sans-serif`;mg.textAlign='center';mg.textBaseline='middle';
  for(const sh of SHOPS){if(Math.abs(sh.x-player.x)>320||Math.abs(sh.z-player.z)>320)continue;const r=(sh.mall?8:4.5)/s;mg.fillStyle=sh.mall?'#f0b429':TYPES[sh.type].bg;mg.strokeStyle='#17130f';mg.lineWidth=2/s;mg.beginPath();mg.arc(sh.x,sh.z,r,0,TAU);mg.fill();mg.stroke()}}
function act(){if(menuOpen){closeMenu();return true}
  if(inside){const pk=nearPick();if(pk){take(pk);return true}if(nearCaja()&&P.cart.length){pay();return true}const m=nearMenu();if(m)openMenu(m);return true}
  if(!player.car&&!player.ride&&nearShop&&!FADE.busy){const s=nearShop;ENT={kind:'shop',shop:s,t:0};fade(s.name,()=>{ENT=null;enter(s)});return true}return false}

return{
  get inside(){return inside},get shopDef(){return CUR.def},IS,SHOPS,
  init(){makeGroups()},
  act,jump,punch,radioNext,canSprint,footPost,enterCar,exitCar,tween,get entering(){return !!ENT},get busy(){return FADE.busy},fade,tlAt,tlColor,
  updateInside,outPrompt,mini,
  update(dt,now){const nv=C.NIGHT.value;C.nightMats[0].emissive.setRGB(nv*.75,nv*.75,nv*.75);C.nightMats[1].emissive.setRGB(nv*.55,nv*.38,nv*.2);updateMarkers(dt,now);updateGroups(dt);updateTL(dt);updateDoors(dt);updateVictims(dt);radioUpdate(dt);hud()},
  get menu(){return !!menuOpen},
  GROUPS,
  addMoney(n){C.setMoney(C.getMoney()+n)},
  P,
};};
