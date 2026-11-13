/* Cartagena Libre — el celular del jugador (tecla P): Nequi, app del banco, Uber, DiDi, Lugares, Mapa y Teléfono;
   cuentas de banco, cajeros automáticos en su ubicación real (OpenStreetMap) y el truco de la plata. */
window.CELULAR=function(C){
'use strict';
const THREE=C.THREE,EX=C.EX,player=C.player,fmt=C.fmt,TAU=Math.PI*2;
const LUG=(window.LUGARES&&LUGARES.lugares)||[];
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cash=()=>C.getMoney(),setCash=n=>C.setMoney(n);
const hhmm=()=>{const g=C.getH();const h=Math.floor(g),m=Math.floor((g-h)*60);return(h<10?'0':'')+h+':'+(m<10?'0':'')+m};
const km=d=>d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km';
const distTo=(x,z)=>C.dist2(x,z,player.x,player.z);

/* =========================================================================================
   1. PLATA: cuenta de banco, Nequi y movimientos
   ========================================================================================= */
const FIN={cuenta:null,nequi:null,mov:[],pago:{uber:'efectivo',didi:'efectivo'}};
function mov(where,txt,n){FIN.mov.unshift({h:hhmm(),w:where,t:txt,n});if(FIN.mov.length>30)FIN.mov.length=30}
const AVAL=new Set(['Banco de Bogotá','Banco de Occidente','Banco Popular','Banco AV Villas','Grupo Aval (ATH)']);
// en las tiendas, si no alcanza el efectivo se paga con Nequi o con la tarjeta débito
if(!EX.HOOK)throw new Error("El navegador mezcló archivos viejos y nuevos del juego: recarga con Ctrl+F5");
EX.HOOK.altPay=n=>{const N=FIN.nequi,A=FIN.cuenta;const where=EX.inside&&EX.shop?EX.shop.name:'Pago';
  if(N&&N.saldo>=n){N.saldo-=n;mov('Nequi',where,-n);return'Nequi'}
  if(A&&A.saldo>=n){A.saldo-=n;mov(A.banco,'Compra con tarjeta · '+where,-n);return'tu tarjeta '+A.banco}return null};
EX.HOOK.altFunds=()=>Math.max(FIN.nequi?FIN.nequi.saldo:0,FIN.cuenta?FIN.cuenta.saldo:0);
EX.HOOK.balText=()=>(FIN.nequi?' · Nequi '+fmt(FIN.nequi.saldo):'')+(FIN.cuenta?' · '+FIN.cuenta.banco+' '+fmt(FIN.cuenta.saldo):'');
const AMTS=[20000,50000,100000,200000,500000];
function amountMenu(title,max,fn,extra){const items=AMTS.filter(v=>v<=max).map(v=>({n:fmt(v),tag:'',run:()=>fn(v)}));if(max>0&&!AMTS.includes(max))items.push({n:'Todo: '+fmt(max),tag:'',run:()=>fn(max)});
  if(!items.length)items.push({n:'No te alcanza',d:extra||'',tag:'',run:()=>C.toast('No te alcanza',1200)});return{title,items}}
function deposit(v){const A=FIN.cuenta;v=Math.min(v,cash());if(v<=0)return;setCash(cash()-v);A.saldo+=v;mov(A.banco,'Consignación en efectivo',v);C.chime();C.toast('Consignaste '+fmt(v)+' · saldo '+fmt(A.saldo),1800)}
function withdraw(v,fee){const A=FIN.cuenta;fee=fee||0;if(A.saldo<v+fee){C.toast('Saldo insuficiente',1300);return}A.saldo-=v+fee;setCash(cash()+v);mov(A.banco,'Retiro'+(fee?' (cuota '+fmt(fee)+')':''),-(v+fee));C.chime();
  C.toast('Retiraste '+fmt(v)+(fee?' · cuota '+fmt(fee):'')+' · saldo '+fmt(A.saldo),2000)}

/* ---------- trámites en la sucursal: asesor y caja ---------- */
const bankHere=()=>EX.brandOf(EX.shop?EX.shop.name:'').name;
EX.setMenu('banco_asesor',()=>{const b=bankHere(),A=FIN.cuenta;
  if(!A)return[{n:'Abrir cuenta de ahorros',d:'Sin costo · incluye tarjeta débito para los cajeros',tag:'Gratis',run:()=>{FIN.cuenta={banco:b,saldo:0,prestamo:0};mov(b,'Apertura de cuenta de ahorros',0);C.chime();
      C.toast('¡Bienvenido a '+b+'! Ya tienes cuenta de ahorros y tarjeta débito',2600)}},
    {n:'¿Y Nequi?',d:'Nequi se crea desde el celular (tecla P)',run:()=>C.toast('Abre el celular con P y entra a Nequi',1800)}];
  if(A.banco!==b)return[{n:'Tu cuenta es de '+A.banco,d:'Aquí solo atienden clientes de '+b,run:()=>C.toast('Para trámites ve a una sucursal de '+A.banco,1800)},
    {n:'Pasarte a '+b,d:A.prestamo?'Primero paga tu préstamo en '+A.banco:'Cierran tu cuenta en '+A.banco+' y te pasan el saldo ('+fmt(A.saldo)+')',run:()=>{if(A.prestamo){C.toast('Primero paga tu préstamo en '+A.banco,1800);return}
      mov(b,'Traslado desde '+A.banco,A.saldo);A.banco=b;C.chime();C.toast('Listo: ahora tu cuenta es de '+b,2000)}}];
  const items=[{n:'Consultar saldo',d:'Ahorros '+fmt(A.saldo)+(A.prestamo?' · debes '+fmt(A.prestamo):''),run:()=>C.toast('Tu saldo es '+fmt(A.saldo),1700)}];
  if(A.prestamo)items.push({n:'Pagar el préstamo',d:'Debes '+fmt(A.prestamo)+' · se descuenta de tu cuenta y, si falta, del efectivo',run:payLoan});
  else items.push({n:'Pedir un préstamo',d:'Libre inversión · 10% de interés',go:()=>({title:'¿Cuánto necesitas?',items:[300000,1000000,3000000].map(v=>({n:fmt(v),d:'Pagas '+fmt(Math.round(v*1.1)),tag:'',
    run:()=>{A.prestamo=Math.round(v*1.1);A.saldo+=v;mov(b,'Desembolso de préstamo',v);C.chime();C.toast('Aprobado: te consignaron '+fmt(v)+' en tu cuenta',2200)}}))})});
  items.push({n:'Certificado bancario',p:12000,run:it=>{if(EX.charge(it.p))C.toast('Aquí está tu certificado bancario de '+b,1800)}});
  items.push({n:'Cerrar la cuenta',d:'Te entregan el saldo en efectivo',run:()=>{if(A.prestamo){C.toast('Primero paga el préstamo',1500);return}setCash(cash()+A.saldo);FIN.cuenta=null;C.toast('Cerraste tu cuenta. Te entregaron '+fmt(A.saldo),2000)}});
  return items});
function payLoan(){const A=FIN.cuenta;let left=A.prestamo;const fromAcc=Math.min(left,A.saldo);A.saldo-=fromAcc;left-=fromAcc;const fromCash=Math.min(left,cash());setCash(cash()-fromCash);left-=fromCash;
  const paid=A.prestamo-left;A.prestamo=left;if(paid)mov(A.banco,'Abono al préstamo',-paid);C.chime();C.toast(left?'Abonaste '+fmt(paid)+'. Aún debes '+fmt(left):'¡Pagaste todo el préstamo!',2000)}
EX.setMenu('banco_caja',()=>{const b=bankHere(),A=FIN.cuenta;
  if(!A||A.banco!==b)return[{n:A?'Tu cuenta es de '+A.banco:'No tienes cuenta en '+b,d:'Para abrirla habla con el asesor (a la derecha)',run:()=>C.toast(A?'Esta caja solo atiende clientes de '+b:'Abre tu cuenta con el asesor, a la derecha',1800)}];
  return[{n:'Consignar efectivo',d:'Tienes '+fmt(cash())+' en efectivo',go:()=>amountMenu('Consignar en tu cuenta',cash(),deposit,'No tienes efectivo')},
    {n:'Retirar de tu cuenta',d:'Saldo '+fmt(A.saldo),go:()=>amountMenu('Retirar de tu cuenta',A.saldo,v=>withdraw(v,0))},
    {n:'Consultar saldo',d:fmt(A.saldo),run:()=>C.toast('Tu saldo es '+fmt(A.saldo),1700)}]});

/* =========================================================================================
   2. CAJEROS AUTOMÁTICOS en su ubicación real, sobre el andén
   ========================================================================================= */
const ATMS=[];
for(const [cat,name,px,pz] of LUG){if(cat!=='cajero')continue;let ok=null;
  for(let r=0;r<=18&&!ok;r+=1.5)for(let a=0;a<TAU&&!ok;a+=TAU/(r?16:1)){const x=px+Math.sin(a)*r,z=pz+Math.cos(a)*r;if(!C.onLand(x,z)||C.solidAt(x,z))continue;
    const rd=C.nearestRoad(x,z,9,s=>!s.walk);if(rd&&rd.d>2.4&&rd.d<6.5&&!ATMS.some(q=>Math.abs(q.x-x)<1.4&&Math.abs(q.z-z)<1.4))ok={x,z,rd}}
  if(!ok)continue;const yaw=Math.atan2(ok.rd.x-ok.x,ok.rd.z-ok.z);ATMS.push({x:ok.x,z:ok.z,yaw,brand:EX.brandOf(name)})}
(function(){if(!ATMS.length)return;const n=ATMS.length,o=new THREE.Object3D();
  const body=new THREE.InstancedMesh(new THREE.BoxGeometry(.8,1.75,.6).translate(0,.875,0),new THREE.MeshLambertMaterial({color:'#5f6b73'}),n);
  const top=new THREE.InstancedMesh(new THREE.BoxGeometry(.86,.34,.66).translate(0,1.92,0),new THREE.MeshLambertMaterial({color:'#ffffff'}),n);
  const scr=new THREE.InstancedMesh(new THREE.PlaneGeometry(.44,.32).translate(0,1.28,.305),new THREE.MeshBasicMaterial({color:'#7fd4ff'}),n);
  const pad=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.06,.22).translate(0,.98,.38),new THREE.MeshLambertMaterial({color:'#2b2f33'}),n);
  ATMS.forEach((a,i)=>{o.position.set(a.x,C.ground(a.x,a.z),a.z);o.rotation.set(0,a.yaw,0);o.updateMatrix();for(const m of [body,top,scr,pad])m.setMatrixAt(i,o.matrix);top.setColorAt(i,new THREE.Color(a.brand.bg))});
  for(const m of [body,top,scr,pad]){m.castShadow=m!==scr;C.scene.add(m)}})();
let ATM_CUR=null;
for(const a of ATMS){const fx=a.x+Math.sin(a.yaw)*.9,fz=a.z+Math.cos(a.yaw)*.9;
  EX.SPOTS.push({x:fx,z:fz,r:1.5,prompt:()=>(C.isTouch()?'Toca Entrar':'F')+' · usar el cajero '+a.brand.name,act:()=>{ATM_CUR=a;EX.openMenuAt({label:'Cajero '+a.brand.name,menu:'cajero'})}})}
function atmFee(a,banco){if(a.brand.name===banco)return 0;if(AVAL.has(a.brand.name)&&AVAL.has(banco))return 0;return 7300}
EX.setMenu('cajero',()=>{const a=ATM_CUR,A=FIN.cuenta,N=FIN.nequi,items=[];if(!a)return items;const bc=a.brand.name==='Bancolombia';
  if(A){const fee=atmFee(a,A.banco);
    items.push({n:'Retirar con tu tarjeta '+A.banco,d:(fee?'Cuota por cajero de otro banco: '+fmt(fee):'Sin costo: es de tu red')+' · saldo '+fmt(A.saldo),go:()=>amountMenu('¿Cuánto vas a retirar?',Math.max(0,A.saldo-fee),v=>withdraw(v,fee),'Saldo insuficiente')});
    items.push({n:'Consultar saldo',d:fmt(A.saldo),run:()=>C.toast('Saldo '+A.banco+': '+fmt(A.saldo),1700)});
    if(a.brand.name===A.banco)items.push({n:'Depositar efectivo',d:'Tienes '+fmt(cash()),go:()=>amountMenu('Depositar en tu cuenta',cash(),deposit,'No tienes efectivo')})}
  if(N&&bc){items.push({n:'Retiro Nequi',d:'Saldo Nequi '+fmt(N.saldo)+' · sin tarjeta',go:()=>amountMenu('Retiro Nequi',N.saldo,v=>{N.saldo-=v;setCash(cash()+v);mov('Nequi','Retiro en cajero',-v);C.chime();C.toast('Sacaste '+fmt(v)+' de Nequi',1800)})});
    items.push({n:'Depositar en Nequi',d:'Tienes '+fmt(cash())+' en efectivo',go:()=>amountMenu('Depositar en Nequi',cash(),v=>{setCash(cash()-v);N.saldo+=v;mov('Nequi','Depósito en cajero',v);C.chime();C.toast('Metiste '+fmt(v)+' a tu Nequi',1800)},'No tienes efectivo')})}
  if(!items.length)items.push({n:'No tienes cómo usar este cajero',d:N?'Nequi se usa en cajeros Bancolombia. O abre una cuenta en un banco':'Abre una cuenta en un banco o crea tu Nequi en el celular (P)',run:()=>C.toast(N?'Busca un cajero Bancolombia en el celular → Lugares':'Abre una cuenta en un banco o crea tu Nequi (P)',2000)});
  return items});

/* =========================================================================================
   3. GPS: punto marcado, columna de luz y línea en el minimapa
   ========================================================================================= */
let WP=null;
const beacon=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,140,16,1,true),new THREE.MeshBasicMaterial({color:0x4fc3f7,transparent:true,opacity:.28,depthWrite:false,fog:false,side:THREE.DoubleSide}));beacon.visible=false;C.scene.add(beacon);
function setWP(p){WP=p?{name:p.name,x:p.x,z:p.z}:null;beacon.visible=!!WP;if(WP){beacon.position.set(WP.x,C.ground(WP.x,WP.z)+70,WP.z);C.toast('GPS: '+WP.name+' · '+km(distTo(WP.x,WP.z)),1800)}}
EX.HOOK.mini=(mg,s)=>{if(!WP)return;mg.strokeStyle='#4fc3f7';mg.lineWidth=3/s;mg.setLineDash([8/s,6/s]);mg.beginPath();mg.moveTo(player.x,player.z);mg.lineTo(WP.x,WP.z);mg.stroke();mg.setLineDash([]);
  mg.fillStyle='#4fc3f7';mg.strokeStyle='#0b2533';mg.lineWidth=2/s;mg.beginPath();mg.arc(WP.x,WP.z,7/s,0,TAU);mg.fill();mg.stroke()};

/* ---------- mapa ampliado (M): todos los lugares con su icono, leyenda para filtrar y clic para marcar en el GPS ---------- */
const ICON={banco:['🏦','#0d47a1','Bancos'],cajero:['🏧','#1565c0','Cajeros'],bar:['🍺','#6d4c41','Bares'],discoteca:['💃','#7b1fa2','Discotecas'],restaurante:['🍽️','#2e7d32','Restaurantes'],
  comidas:['🍔','#d84315','Comidas rápidas'],fritos:['🥟','#e4572e','Fritos'],cafe:['☕','#4e2c14','Cafés'],panaderia:['🥖','#a0522d','Panaderías'],heladeria:['🍦','#f48fb1','Heladerías'],
  drogueria:['💊','#00897b','Farmacias'],clinica:['🏥','#00838f','Clínicas'],supermercado:['🛒','#c62828','Supermercados'],tienda:['🏪','#f0b429','Tiendas'],mall:['🛍️','#f0b429','Centros comerciales'],
  ropa:['👕','#7b1fa2','Ropa'],joyeria:['💍','#0b5d3b','Joyerías'],recuerdos:['🎁','#1f9aa6','Artesanías'],hotel:['🏨','#5d1a1a','Hoteles'],universidad:['🎓','#1b5e20','Universidades'],
  taller:['🔧','#37474f','Talleres'],gimnasio:['🏋️','#212121','Gimnasios']};
const OFF=new Set();
const mapPlaces=()=>EX.SHOPS.map(s=>({name:s.name,x:s.x,z:s.z,cat:s.mall?'mall':s.type,type:s.type,mall:s.mall,real:s.real})).concat(ATMS.map(a=>({name:'Cajero '+a.brand.name,x:a.x,z:a.z,cat:'cajero',type:'cajero'})));
let MP=null;const EMOJI='"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
function drawBig(g,u,sc){if(WP){g.fillStyle='#4fc3f7';g.strokeStyle='#0b2533';g.lineWidth=3*u;g.beginPath();g.arc(WP.x,WP.z,12*u,0,TAU);g.fill();g.stroke()}}
if(C.bigEl){
  // clic (sin arrastrar) sobre un lugar: marcarlo en el GPS
  const cv=C.bigEl.querySelector('canvas');let down=null;
  cv.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
  cv.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return}down=null;if(!MP)MP=mapPlaces();const w=C.bigToWorld(e.clientX,e.clientY),sc=C.BIGSC,rad=(sc>=.5?12:7)/sc;
    let best=null,bd=rad;for(const p of MP){if(!ICON[p.cat]||OFF.has(p.cat))continue;const d=Math.hypot(p.x-w.x,p.z-w.z);if(d<bd){bd=d;best=p}}
    if(best){setWP(best);C.toast(ICON[best.cat][0]+' '+best.name+' · '+C.zoneName(best.x,best.z)+' · marcado en el GPS',2200);C.redrawBig()}})}

/* =========================================================================================
   4. EL CELULAR
   ========================================================================================= */
const st=document.createElement('style');st.textContent=`
#phone{position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:31;display:none}
#phone.on{display:block}
#phone .ph{width:300px;height:min(600px,calc(100vh - 36px));background:#0d0d0f;border-radius:38px;padding:12px;box-shadow:0 18px 50px rgba(0,0,0,.6),inset 0 0 0 2px #2a2a2e;display:flex;flex-direction:column}
#phone .scr{flex:1;border-radius:28px;overflow:hidden;background:#f4f2ee;color:#17130f;display:flex;flex-direction:column;font:14px var(--body,system-ui)}
#phone .sb{display:flex;justify-content:space-between;padding:8px 18px 4px;font:700 12px var(--body,system-ui);color:inherit}
#phone .app{flex:1;overflow:auto;padding:6px 14px 14px;display:flex;flex-direction:column;gap:8px}
#phone .home{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 8px;padding:18px 12px;align-content:start}
#phone .ic{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:#fff;font:600 11px var(--body,system-ui);cursor:pointer}
#phone .ic i{width:56px;height:56px;border-radius:15px;display:flex;align-items:center;justify-content:center;font:800 17px var(--body,system-ui);font-style:normal;box-shadow:0 3px 8px rgba(0,0,0,.3)}
#phone .wall{background:linear-gradient(160deg,#1f9aa6 0%,#0b5d6b 45%,#e4572e 120%);color:#fff}
#phone h4{margin:4px 0 2px;font:800 20px var(--display,Georgia)}#phone .muted{opacity:.65;font-size:12px}
#phone .big{font:800 30px var(--body,system-ui);font-variant-numeric:tabular-nums;margin:2px 0}
#phone .btn{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;text-align:left;padding:11px 12px;border-radius:12px;border:0;background:rgba(0,0,0,.06);color:inherit;font:600 14px var(--body,system-ui);cursor:pointer}
#phone .btn:hover,#phone .btn:focus{background:rgba(0,0,0,.12);outline:none}#phone .btn small{display:block;font-weight:400;opacity:.7;font-size:12px}#phone .btn b{white-space:nowrap;font-variant-numeric:tabular-nums}
#phone .pri{background:var(--acc,#200020);color:#fff;justify-content:center}#phone .pri:hover{background:var(--acc,#200020);filter:brightness(1.15)}
#phone .row{display:flex;gap:6px}#phone .row .btn{justify-content:center;padding:9px 6px;font-size:12px}#phone .row .sel{background:var(--acc,#200020);color:#fff}
#phone .bar{display:flex;align-items:center;gap:8px;padding:2px 0 4px}#phone .back{border:0;background:none;font:700 22px var(--body,system-ui);color:inherit;cursor:pointer;padding:0 6px 0 0}
#phone .hb{height:5px;width:110px;border-radius:3px;background:#5a5a5e;margin:9px auto 1px;cursor:pointer}
#phone .mv{display:flex;justify-content:space-between;font-size:13px;padding:6px 2px;border-bottom:1px solid rgba(0,0,0,.08)}#phone .mv b.in{color:#2e7d32}#phone .mv b.out{color:#c62828}
#phone .pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}#phone .pad button{padding:12px 0;border-radius:50%;aspect-ratio:1;border:0;background:rgba(0,0,0,.07);font:600 22px var(--body,system-ui);cursor:pointer;color:inherit}
#phone .dial{font:600 28px var(--body,system-ui);text-align:center;min-height:38px;letter-spacing:2px}
@media (max-width:600px){#phone{left:50%;right:auto;transform:translateX(-50%);bottom:10px}#phone .ph{width:min(300px,calc(100vw - 24px))}}`;document.head.appendChild(st);
const el=document.createElement('div');el.id='phone';el.innerHTML='<div class="ph"><div class="scr"><div class="sb"><span class="t"></span><span>4G ▮▮▮ 92%</span></div><div class="app"></div></div><div class="hb" title="Inicio"></div></div>';document.body.appendChild(el);
const scrEl=el.querySelector('.scr'),appEl=el.querySelector('.app'),tEl=el.querySelector('.t');
let open=false,screen='home',arg=null;const hist=[];
EX.addUI(()=>open);
function openPhone(){if(!C.started)return;if(EX.inside&&EX.menu&&!open)EX.closeMenu();open=true;el.classList.add('on');go('home');}
function closePhone(){open=false;el.classList.remove('on')}
function go(s,a,noPush){if(!noPush&&screen!==s)hist.push([screen,arg]);if(s==='home')hist.length=0;screen=s;arg=a;render()}
function back(){const h=hist.pop();if(h){screen=h[0];arg=h[1];render()}else go('home')}
el.querySelector('.hb').addEventListener('click',()=>go('home'));
window.addEventListener('keydown',e=>{if(!C.started)return;const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA')return;
  if(open){if(e.code==='Escape'){e.preventDefault();if(screen==='home')closePhone();else back()}else if(e.code==='KeyP'&&!e.repeat)closePhone();return}
  if(e.code==='KeyP'&&!e.repeat&&!EX.menu)openPhone()});
// botón táctil
{const b=document.createElement('button');b.id='bCel';b.textContent='Celular';b.addEventListener('click',()=>open?closePhone():openPhone());const btns=document.getElementById('btns');if(btns)btns.appendChild(b)}

/* ---------- pantallas ---------- */
const APPS=[['nequi','Nequi','N','#200020','#ff2d8a'],['banco','Banco','$','#0d47a1','#ffd54f'],['uber','Uber','Uber','#000000','#ffffff'],['didi','DiDi','DiDi','#fc4c02','#ffffff'],
  ['lugares','Lugares','◉','#2e7d32','#ffffff'],['mapa','Mapa','⌖','#1f9aa6','#ffffff'],['tel','Teléfono','✆','#43a047','#ffffff']];
const CATS=[['banco','Bancos'],['cajero','Cajeros'],['bar','Bares'],['discoteca','Discotecas'],['restaurante','Restaurantes'],['comidas','Comidas rápidas'],['cafe','Cafés'],['drogueria','Farmacias'],
  ['supermercado','Supermercados'],['mall','Centros comerciales'],['hotel','Hoteles'],['universidad','Universidades'],['taller','Talleres'],['clinica','Clínicas'],['gimnasio','Gimnasios'],['heladeria','Heladerías']];
const H={};let ACT={};
function B(id,txt,sub,right,cls){return`<button class="btn ${cls||''}" data-a="${id}"><span>${esc(txt)}${sub?'<small>'+esc(sub)+'</small>':''}</span>${right!==undefined?'<b>'+esc(right)+'</b>':''}</button>`}
function head(title,acc){return`<div class="bar"><button class="back" data-a="__back">‹</button><h4 style="color:${acc||'inherit'}">${esc(title)}</h4></div>`}
function render(){ACT={};let html='';const fn=H[screen]||H.home;scrEl.classList.toggle('wall',screen==='home');scrEl.style.removeProperty('--acc');html=fn(arg);appEl.className='app'+(screen==='home'?' home':'');appEl.innerHTML=html;tEl.textContent=hhmm()}
let aid=0;const act=f=>{const id='a'+(aid++);ACT[id]=f;return id};
appEl.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a==='__back'){back();return}const f=ACT[a];if(f){C.tone&&C.tone(880,.03,'sine',.02);f()}});

H.home=()=>APPS.map(([k,n,ic,bg,fg])=>`<button class="ic" data-a="${act(()=>k==='mapa'?(closePhone(),C.openBig()):go(k))}"><i style="background:${bg};color:${fg}">${ic}</i>${esc(n==='Banco'&&FIN.cuenta?FIN.cuenta.banco.replace(/^Banco (de )?/,''):n)}</button>`).join('');

/* Nequi */
H.nequi=s=>{scrEl.style.setProperty('--acc','#200020');const N=FIN.nequi,A=FIN.cuenta;let h=head('Nequi','#200020');
  if(!N)return h+'<p>Plata en el celular, sin cuota de manejo. Envía, paga y saca plata en cajeros Bancolombia.</p>'+B(act(()=>{FIN.nequi={saldo:0};mov('Nequi','Abriste tu Nequi',0);C.chime();C.toast('¡Tu Nequi está listo!',1600);render()}),'Crear mi Nequi','Solo con tu número de celular',undefined,'pri');
  if(s==='meter')return h+'<b>Meter plata</b>'+(A?B(act(()=>go('nequiAmt','meter')),'Desde tu cuenta '+A.banco,'Saldo '+fmt(A.saldo)):'<p class="muted">Abre una cuenta en un banco para pasar plata desde allá.</p>')+
    B(act(()=>{const a=nearestATM('Bancolombia');if(a){setWP({name:'Cajero Bancolombia',x:a.x,z:a.z});closePhone()}}),'En efectivo','En cualquier cajero Bancolombia · marcar el más cercano en el GPS');
  if(s==='sacar')return h+'<b>Sacar plata</b>'+B(act(()=>{const a=nearestATM('Bancolombia');if(a){setWP({name:'Cajero Bancolombia',x:a.x,z:a.z});closePhone()}}),'Retiro en cajero','En cajeros Bancolombia, sin tarjeta · marcar el más cercano')+
    (A?B(act(()=>go('nequiAmt','sacar')),'Pasar a tu cuenta '+A.banco,'Sin costo'):'');
  if(s==='mov')return h+'<b>Movimientos</b>'+movList('Nequi');
  return h+'<div class="muted">Disponible</div><div class="big">'+fmt(N.saldo)+'</div>'+B(act(()=>go('nequi','meter')),'Meter plata')+B(act(()=>go('nequi','sacar')),'Sacar plata')+B(act(()=>go('nequi','mov')),'Movimientos')+
    '<p class="muted">Cuando no te alcanza el efectivo, en las tiendas se paga solo con Nequi.</p>'};
H.nequiAmt=k=>{scrEl.style.setProperty('--acc','#200020');const N=FIN.nequi,A=FIN.cuenta;const max=k==='meter'?A.saldo:N.saldo;
  return head(k==='meter'?'Meter desde '+A.banco:'Pasar a '+A.banco,'#200020')+AMTS.concat(max>0&&!AMTS.includes(max)?[max]:[]).filter(v=>v<=max).map(v=>B(act(()=>{
    if(k==='meter'){A.saldo-=v;N.saldo+=v;mov(A.banco,'Envío a Nequi',-v);mov('Nequi','Desde '+A.banco,v)}else{N.saldo-=v;A.saldo+=v;mov('Nequi','Envío a '+A.banco,-v);mov(A.banco,'Desde Nequi',v)}
    C.chime();C.toast('Listo: '+fmt(v)+(k==='meter'?' a tu Nequi':' a tu cuenta'),1500);go('nequi',null,true);hist.pop()}),fmt(v===max&&!AMTS.includes(v)?v:v),v===max&&!AMTS.includes(v)?'Todo':'')).join('')||'<p>No tienes saldo.</p>'};
function movList(w){const l=FIN.mov.filter(m=>w==='*'||m.w===w);if(!l.length)return'<p class="muted">Todavía no hay movimientos.</p>';
  return l.map(m=>`<div class="mv"><span>${esc(m.t)}<br><span class="muted">${m.h}</span></span><b class="${m.n>=0?'in':'out'}">${m.n?(m.n>0?'+':'−')+fmt(Math.abs(m.n)):''}</b></div>`).join('')}

/* app del banco */
H.banco=s=>{const A=FIN.cuenta;const br=A?EX.brandOf(A.banco):{bg:'#0d47a1'};scrEl.style.setProperty('--acc',br.bg);let h=head(A?A.banco:'Mi banco',br.bg);
  if(!A)return h+'<p>Todavía no tienes cuenta. Ábrela gratis con el asesor de cualquier banco (de 8:00 a.m. a 4:00 p.m.).</p>'+B(act(()=>go('lista','banco')),'Ver bancos cercanos',undefined,undefined,'pri');
  if(s==='mov')return h+'<b>Movimientos</b>'+movList(A.banco);
  if(s==='nequi')return h+'<b>Enviar a Nequi</b>'+(FIN.nequi?'':'<p class="muted">Primero crea tu Nequi.</p>')+(FIN.nequi?AMTS.filter(v=>v<=A.saldo).map(v=>B(act(()=>{A.saldo-=v;FIN.nequi.saldo+=v;mov(A.banco,'Envío a Nequi',-v);mov('Nequi','Desde '+A.banco,v);C.chime();C.toast('Enviaste '+fmt(v)+' a Nequi',1500);go('banco',null,true);hist.pop()}),fmt(v))).join('')||'<p>No tienes saldo suficiente.</p>':'');
  return h+'<div class="muted">Cuenta de ahorros</div><div class="big">'+fmt(A.saldo)+'</div>'+(A.prestamo?'<p class="muted">Préstamo pendiente: '+fmt(A.prestamo)+'</p>':'')+
    B(act(()=>go('banco','nequi')),'Enviar a Nequi')+(A.prestamo?B(act(()=>{payLoan();render()}),'Pagar el préstamo','De tu cuenta y, si falta, del efectivo'):'')+B(act(()=>go('banco','mov')),'Movimientos')+
    B(act(()=>{const a=nearestATM(A.banco)||nearestATM();if(a){setWP({name:'Cajero '+a.brand.name,x:a.x,z:a.z});closePhone()}}),'Cajero más cercano','Marcarlo en el GPS')};

/* Uber y DiDi */
const APPC={uber:{n:'Uber',bg:'#000000'},didi:{n:'DiDi',bg:'#fc4c02'}};
function payOpts(){const o=[['efectivo','Efectivo']];if(FIN.nequi)o.push(['nequi','Nequi']);if(FIN.cuenta)o.push(['tarjeta','Tarjeta']);return o}
function payFnFor(m){return n=>{if(m==='nequi'&&FIN.nequi&&FIN.nequi.saldo>=n){FIN.nequi.saldo-=n;mov('Nequi','Viaje en '+APPC[SVapp].n,-n);return'Nequi'}
  if(m==='tarjeta'&&FIN.cuenta&&FIN.cuenta.saldo>=n){FIN.cuenta.saldo-=n;mov(FIN.cuenta.banco,'Viaje en '+APPC[SVapp].n,-n);return'tarjeta'}return null}}
let SVapp='uber';
function dests(){const out=[];if(WP)out.push({name:WP.name,x:WP.x,z:WP.z,tag:'Marcado en el GPS'});
  const lm=C.LM.filter(l=>l.mx!==undefined).map(l=>({name:l.name,x:l.mx,z:l.mz}));const malls=EX.SHOPS.filter(s=>s.mall).map(s=>({name:s.name,x:s.x,z:s.z,tag:'Centro comercial'}));
  lm.concat(malls).filter(d=>distTo(d.x,d.z)>150).sort((a,b)=>distTo(a.x,a.z)-distTo(b.x,b.z)).slice(0,16).forEach(d=>out.push(d));return out}
function rideApp(app){return s=>{SVapp=app;const K=APPC[app];scrEl.style.setProperty('--acc',K.bg);let h=head(K.n,K.bg);const S=C.appState();
  if(S&&S.app===app){const st=S.state==='coming'?'Tu conductor viene en camino · está a '+km(S.dist):S.state==='waiting'?'¡Llegó! Súbete atrás (F): te espera junto a la marca amarilla':S.state==='riding'||S.state==='menu'||S.state==='boarding'?'En viaje hacia '+S.dest.name:'Terminando el viaje';
    return h+'<div class="muted">Viaje a</div><h4>'+esc(S.dest.name)+'</h4><div class="big">'+fmt(S.fare)+'</div><p>'+esc(st)+'</p><p class="muted">Pago: '+esc((payOpts().find(o=>o[0]===FIN.pago[app])||['','Efectivo'])[1])+'</p>'+
      (S.state==='coming'||S.state==='waiting'?B(act(()=>{if(C.cancelAppRide()){C.toast('Cancelaste el viaje',1300);render()}}),'Cancelar viaje'):'')}
  if(S)return h+'<p>Ya tienes otro servicio pedido. Espera a que termine.</p>';
  if(s&&s.dest){const d=s.dest,fare=estFare(app,d);const po=payOpts();if(!po.some(o=>o[0]===FIN.pago[app]))FIN.pago[app]='efectivo';
    return h+'<div class="muted">Destino</div><h4>'+esc(d.name)+'</h4><div class="muted">'+km(distTo(d.x,d.z))+' · tarifa fija</div><div class="big">'+fmt(fare)+'</div><div class="muted">Pagar con</div><div class="row">'+
      po.map(o=>`<button class="btn ${FIN.pago[app]===o[0]?'sel':''}" data-a="${act(()=>{FIN.pago[app]=o[0];render()})}">${o[1]}</button>`).join('')+'</div>'+
      B(act(()=>{const r=C.appRide(app,d,payFnFor(FIN.pago[app]));if(typeof r==='string'){C.toast(r,1900);return}C.chime();C.toast(K.n+': tu conductor llega en unos '+r.eta+' min',2000);hist.length=0;screen=app;arg=null;render()}),'Pedir '+K.n,undefined,undefined,'pri')}
  return h+'<div class="muted">¿A dónde vas?</div>'+dests().map(d=>B(act(()=>go(app,{dest:d})),d.name,(d.tag?d.tag+' · ':'')+km(distTo(d.x,d.z)),fmt(estFare(app,d)))).join('')+
    '<p class="muted">También puedes pedirlo desde Lugares.</p>'}}
function estFare(app,d){const k=distTo(d.x,d.z)*1.35/1000;return app==='uber'?Math.max(7000,Math.round((5200+k*2900)/100)*100):Math.max(6200,Math.round((4600+k*2500)/100)*100)}
H.uber=rideApp('uber');H.didi=rideApp('didi');

/* Lugares: los lugares reales más cercanos por categoría */
function placesOf(cat){if(cat==='cajero')return ATMS.map(a=>({name:'Cajero '+a.brand.name,x:a.x,z:a.z,type:'cajero'}));return EX.SHOPS.filter(s=>s.real&&(cat==='mall'?s.mall:s.type===cat&&!s.mall))}
function nearestATM(brand){let best=null,bd=1e18;for(const a of ATMS){if(brand&&a.brand.name!==brand)continue;const d=distTo(a.x,a.z);if(d<bd){bd=d;best=a}}if(!best)C.toast('No hay cajeros '+(brand||'')+' en el mapa',1500);return best}
function hoursTxt(s){const ty=s.mall?'mall':s.type;const h=EX.HOURS[ty];if(!h)return'Abierto 24 horas';return(EX.isOpen(ty)?'Abierto':'Cerrado')+' · '+EX.fmtH(h[0])+' a '+EX.fmtH(h[1])}
H.lugares=()=>{scrEl.style.setProperty('--acc','#2e7d32');return head('Lugares','#2e7d32')+'<div class="muted">Lugares reales de Cartagena</div>'+CATS.map(([k,n])=>{const c=placesOf(k).length;return c?B(act(()=>go('lista',k)),n,undefined,c):''}).join('')};
H.lista=cat=>{scrEl.style.setProperty('--acc','#2e7d32');const n=(CATS.find(c=>c[0]===cat)||['',''])[1];const l=placesOf(cat).slice().sort((a,b)=>distTo(a.x,a.z)-distTo(b.x,b.z)).slice(0,25);
  return head(n,'#2e7d32')+l.map(p=>B(act(()=>go('lugar',p)),p.name,(p.type==='cajero'?'Cajero 24 horas':hoursTxt(p))+' · '+C.zoneName(p.x,p.z),km(distTo(p.x,p.z)))).join('')};
H.lugar=p=>{scrEl.style.setProperty('--acc','#2e7d32');const T=EX.TYPES[p.type];
  return head(p.type==='cajero'?'Cajero':p.mall?'Centro comercial':T?T.label:'Lugar','#2e7d32')+'<h4>'+esc(p.name)+'</h4><div class="muted">'+esc(C.zoneName(p.x,p.z))+' · a '+km(distTo(p.x,p.z))+'</div><p>'+esc(p.type==='cajero'?'Abierto 24 horas':hoursTxt(p))+(T&&T.cover?' · cover '+fmt(T.cover):'')+'</p>'+
    B(act(()=>{setWP(p);closePhone()}),'Marcar en el GPS',undefined,undefined,'pri')+B(act(()=>go('uber',{dest:{name:p.name,x:p.x,z:p.z}})),'Ir en Uber',undefined,fmt(estFare('uber',p)))+B(act(()=>go('didi',{dest:{name:p.name,x:p.x,z:p.z}})),'Ir en DiDi',undefined,fmt(estFare('didi',p)))+
    (WP?B(act(()=>{setWP(null);render()}),'Quitar el punto del GPS'):'')};

/* Teléfono: marcar códigos (75282 = P-L-A-T-A es el truco de la plata) */
let dial='';
H.tel=()=>{scrEl.style.setProperty('--acc','#43a047');return head('Teléfono','#43a047')+'<div class="dial">'+esc(dial||' ')+'</div><div class="pad">'+['1','2','3','4','5','6','7','8','9','*','0','#'].map(k=>`<button data-a="${act(()=>{if(dial.length<14)dial+=k;render()})}">${k}</button>`).join('')+'</div>'+
  '<div class="row">'+B(act(()=>{dial=dial.slice(0,-1);render()}),'Borrar')+B(act(()=>call()),'Llamar',undefined,undefined,'pri')+'</div>'};
function call(){const n=dial;dial='';if(n==='75282'){cheatMoney();closePhone();return}if(n==='123'){C.toast('Línea 123: la policía va en camino… mejor pórtate bien',2000)}else if(n)C.toast('El número '+n+' no contesta',1500);render()}

/* =========================================================================================
   5. TRUCO DE LA PLATA: +$1.000.000 que se van sumando hasta el último peso
   ========================================================================================= */
// el contador arranca de a pesos, se acelera y frena al final hasta el último peso (12 segundos por millón)
const CHEATS=[],CHEAT_T=12,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function cheatMoney(){CHEATS.push({t:0,added:0});C.toast('Truco activado: +'+fmt(1000000),1800)}
// escribir DINERO (en index.html) también llama a cheatMoney

/* ---------- bucle propio: reloj del celular, llegada al GPS y conteo del truco ---------- */
let last=performance.now(),uiT=0,tickT=0;
function loop(now){const dt=Math.min(.5,(now-last)/1000);last=now;
  if(CHEATS.length){let add=0;for(const c of CHEATS){c.t=Math.min(CHEAT_T,c.t+dt);const want=Math.round(1000000*ease(c.t/CHEAT_T));add+=want-c.added;c.added=want}
    if(add>0)setCash(cash()+add);tickT-=dt;if(tickT<=0&&add>0){tickT=.07;C.tone&&C.tone(1200+Math.random()*300,.02,'square',.012)}
    for(let i=CHEATS.length-1;i>=0;i--)if(CHEATS[i].added>=1000000){CHEATS.splice(i,1);C.chime()}}
  uiT-=dt;if(uiT<=0){uiT=.5;if(open){tEl.textContent=hhmm();if(screen==='uber'||screen==='didi')render()}
    if(WP&&distTo(WP.x,WP.z)<14&&!EX.inside){C.toast('Llegaste a '+WP.name,1800);setWP(null)}}
  if(WP)beacon.material.opacity=.2+.1*Math.sin(now/300);
  requestAnimationFrame(loop)}
requestAnimationFrame(loop);

return{
  save(){return{cuenta:FIN.cuenta,nequi:FIN.nequi,mov:FIN.mov,pago:FIN.pago}},
  load(d){d=d||{};FIN.cuenta=d.cuenta||null;FIN.nequi=d.nequi||null;FIN.mov=Array.isArray(d.mov)?d.mov:[];FIN.pago=Object.assign({uber:'efectivo',didi:'efectivo'},d.pago||{})},
  get open(){return open},openPhone,closePhone,FIN,ATMS,setWP,cheatMoney,drawBig,get WP(){return WP},bigToWorld:(x,y)=>C.bigToWorld(x,y),
};};
