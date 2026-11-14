/* Cartagena Libre — logos y colores de los supermercados Ara, D1 y Olímpica, dibujados en canvas a partir de fotos de las tiendas.
   Los usan las fachadas (index.html, construirSitios) y los interiores (extra.js). Ara, D1 y Olímpica son marcas de sus dueños. */
window.MARCAS=(function(){
'use strict';
const C={
  ara:{n:'Ara',bg:'#f26722',fg:'#ffffff',acc:'#e4032e',wall:'#f26722',lema:'Alegría al mejor precio'},
  d1:{n:'D1',bg:'#e30613',fg:'#ffffff',acc:'#ffd400',wall:'#f5f5f3'},
  olimpica:{n:'Olímpica',bg:'#e2231a',fg:'#ffffff',acc:'#1d4fa0',wall:'#6e7073'}};
const font=(w,s,f)=>`${w} ${s}px ${f||'Arial Rounded MT Bold, Arial, Helvetica, sans-serif'}`;
function fit(g,t,maxW,size,w,f){g.font=font(w,size,f);while(g.measureText(t).width>maxW&&size>10){size-=2;g.font=font(w,size,f)}return size}

/* Ara: "ara" en rojo con borde blanco grueso (como letrero de calcomanía), la guacamaya de colores a la derecha y el lema debajo */
function guacamaya(g,x,y,s){g.save();g.translate(x,y);g.scale(s,s);g.lineCap='round';g.lineJoin='round';
  // contorno blanco de todo el pájaro
  const plumas=[['#ffd400',-6,8,26,-58,40,-118],['#1d63c8',2,14,40,-44,62,-96],['#e4032e',-14,4,6,-60,18,-122],['#3aa935',10,20,52,-18,78,-60]];
  g.strokeStyle='#ffffff';g.lineWidth=34;for(const [,ax,ay,bx,by,cx,cy] of plumas){g.beginPath();g.moveTo(ax,ay);g.quadraticCurveTo(bx,by,cx,cy);g.stroke()}
  g.beginPath();g.arc(-22,-6,30,0,6.283);g.fillStyle='#fff';g.fill();
  g.beginPath();g.moveTo(-10,30);g.quadraticCurveTo(6,88,40,120);g.lineWidth=30;g.stroke();
  // plumas de la cola y el ala
  g.lineWidth=17;for(const [c,ax,ay,bx,by,cx,cy] of plumas){g.strokeStyle=c;g.beginPath();g.moveTo(ax,ay);g.quadraticCurveTo(bx,by,cx,cy);g.stroke()}
  g.strokeStyle='#3aa935';g.lineWidth=16;g.beginPath();g.moveTo(-8,30);g.quadraticCurveTo(8,86,40,118);g.stroke();
  g.strokeStyle='#ffd400';g.lineWidth=8;g.beginPath();g.moveTo(-2,30);g.quadraticCurveTo(14,80,40,110);g.stroke();
  // cabeza roja, cara blanca, ojo y pico curvo
  g.fillStyle='#e4032e';g.beginPath();g.arc(-22,-6,22,0,6.283);g.fill();
  g.fillStyle='#ffffff';g.beginPath();g.ellipse(-32,-6,11,13,0,0,6.283);g.fill();
  g.fillStyle='#1b1b1b';g.beginPath();g.arc(-30,-9,4.5,0,6.283);g.fill();
  g.fillStyle='#d9d9d9';g.strokeStyle='#5a5a5a';g.lineWidth=2.5;g.beginPath();g.moveTo(-40,-14);g.quadraticCurveTo(-66,-14,-62,12);g.quadraticCurveTo(-54,2,-42,4);g.closePath();g.fill();g.stroke();
  g.restore()}
function ara(g,w,h,o){o=o||{};g.clearRect(0,0,w,h);const lema=o.lema!==false;
  const s=Math.min(w/700,h/(lema?330:290));g.save();g.translate(w/2-40*s,h*(lema?.5:.6));g.scale(s,s);
  g.textAlign='center';g.textBaseline='middle';g.font=font(900,200);g.lineJoin='round';
  g.strokeStyle='#ffffff';g.lineWidth=44;g.strokeText('ara',-30,0);g.fillStyle='#e4032e';g.fillText('ara',-30,0);
  g.fillStyle='#ffffff';g.beginPath();g.arc(152,52,22,0,6.283);g.fill();g.fillStyle='#e4032e';g.beginPath();g.arc(152,52,13,0,6.283);g.fill();
  guacamaya(g,248,-4,.82);
  if(lema){g.fillStyle='#ffffff';const tw=520;g.beginPath();if(g.roundRect)g.roundRect(-tw/2-34,96,tw,60,26);else g.rect(-tw/2-34,96,tw,60);g.fill();
    g.fillStyle='#e4032e';fit(g,C.ara.lema,tw-30,40,700,'Arial, Helvetica, sans-serif');g.fillText(C.ara.lema,-34,127)}
  g.restore()}

/* D1: cuadro rojo con filo blanco, la "D" blanca grande y el "1" rojo en un círculo amarillo arriba a la derecha */
function d1(g,w,h){g.clearRect(0,0,w,h);const s=Math.min(w,h);g.save();g.translate((w-s)/2,(h-s)/2);
  g.fillStyle='#ffffff';g.fillRect(0,0,s,s);g.fillStyle='#e30613';g.fillRect(s*.05,s*.05,s*.9,s*.9);
  const sh=new Path2D();const x0=s*.22,y0=s*.24,x1=s*.5,yb=s*.82;sh.moveTo(x0,y0);sh.lineTo(x1,y0);sh.bezierCurveTo(s*.86,y0,s*.86,yb,x1,yb);sh.lineTo(x0,yb);sh.closePath();
  const hole=new Path2D();const t=s*.13;hole.moveTo(x0+t,y0+t);hole.lineTo(x1,y0+t);hole.bezierCurveTo(s*.7,y0+t,s*.7,yb-t,x1,yb-t);hole.lineTo(x0+t,yb-t);hole.closePath();
  g.save();g.translate(s*.02,s*.02);g.fillStyle='rgba(0,0,0,.25)';g.fill(sh);g.restore();
  g.fillStyle='#ffffff';g.fill(sh);g.fillStyle='#e30613';g.fill(hole);
  g.fillStyle='#ffd400';g.beginPath();g.arc(s*.68,s*.3,s*.17,0,6.283);g.fill();g.strokeStyle='#ffffff';g.lineWidth=s*.025;g.stroke();
  g.fillStyle='#e30613';g.textAlign='center';g.textBaseline='middle';g.font=font(900,s*.26,'Arial Black, Arial, sans-serif');g.fillText('1',s*.685,s*.315);
  g.restore()}

/* Olímpica: la gota blanca con la llama roja y azul, y OLIMPICA en blanco */
function llama(g,x,y,r){g.save();g.translate(x,y);
  g.fillStyle='#ffffff';g.beginPath();g.ellipse(0,0,r*1.25,r,0,0,6.283);g.fill();
  g.fillStyle='#1d4fa0';g.beginPath();g.moveTo(-r*.72,r*.28);g.bezierCurveTo(-r*.8,-r*.2,-r*.2,-r*.35,0,-r*.05);g.bezierCurveTo(r*.25,-r*.4,r*.9,-r*.15,r*.72,r*.3);
  g.bezierCurveTo(r*.5,r*.78,-r*.5,r*.78,-r*.72,r*.28);g.fill();
  g.fillStyle='#e2231a';g.beginPath();g.moveTo(-r*.5,r*.1);g.bezierCurveTo(-r*.7,-r*.45,-r*.05,-r*.55,r*.05,-r*.88);g.bezierCurveTo(r*.15,-r*.5,r*.75,-r*.4,r*.52,r*.1);
  g.bezierCurveTo(r*.3,-r*.18,r*.08,-r*.05,0,r*.2);g.bezierCurveTo(-r*.1,-r*.05,-r*.3,-r*.15,-r*.5,r*.1);g.fill();
  g.strokeStyle='#ffffff';g.lineWidth=r*.12;g.beginPath();g.moveTo(-r*.55,r*.42);g.quadraticCurveTo(0,r*.1,r*.55,r*.42);g.stroke();
  g.restore()}
function olimpica(g,w,h,o){o=o||{};g.clearRect(0,0,w,h);if(o.fondo){g.fillStyle=C.olimpica.bg;g.fillRect(0,0,w,h)}
  const r=h*.3,lx=r*1.4+h*.12;llama(g,lx,h/2,r);
  g.fillStyle='#ffffff';g.textAlign='left';g.textBaseline='middle';const maxW=w-lx-r*1.4-h*.1;const sz=fit(g,'OLIMPICA',maxW,h*.5,900,'Arial Black, Arial, Helvetica, sans-serif');
  g.save();g.translate(lx+r*1.45,h/2+sz*.04);g.scale(1,1.05);g.fillText('OLIMPICA',0,0);g.restore()}
// el aviso "Siempre PRECIOS BAJOS Siempre" del panel de la esquina
function preciosBajos(g,w,h){g.fillStyle='#e2231a';g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='#ffffff';g.font=font('italic 700',h*.13,'Arial, sans-serif');g.fillText('Siempre',w*.42,h*.2);
  g.fillStyle='#ffc21a';fit(g,'PRECIOS',w*.84,h*.24,900,'Arial Black, Arial, sans-serif');g.fillText('PRECIOS',w*.48,h*.42);g.fillText('BAJOS.',w*.48,h*.65);
  g.fillStyle='#ffffff';g.font=font('italic 700',h*.13,'Arial, sans-serif');g.fillText('Siempre.',w*.55,h*.86);
  llama(g,w*.86,h*.84,h*.07)}
// afiche verde de promoción de las vitrinas (genérico)
function afiche(g,w,h,m){const K=C[m]||C.ara;g.fillStyle=m==='d1'?'#ffffff':'#43b02a';g.fillRect(0,0,w,h);g.fillStyle=m==='d1'?'#e30613':'#ffffff';g.fillRect(w*.06,h*.05,w*.88,h*.16);
  g.fillStyle=m==='d1'?'#ffffff':'#43b02a';g.textAlign='center';g.textBaseline='middle';fit(g,'¡OFERTA!',w*.8,h*.12,900,'Arial Black, Arial, sans-serif');g.fillText('¡OFERTA!',w/2,h*.13);
  g.fillStyle=m==='d1'?'#e30613':'#ffe600';fit(g,'50%',w*.84,h*.26,900,'Arial Black, Arial, sans-serif');g.fillText('50%',w/2,h*.38);
  g.fillStyle=m==='d1'?'#333':'#ffffff';fit(g,'EN TU COMPRA',w*.84,h*.07,800,'Arial, sans-serif');g.fillText('EN TU COMPRA',w/2,h*.53);
  g.fillStyle=m==='d1'?'#e30613':'#ffe600';g.beginPath();g.arc(w*.5,h*.72,w*.26,0,6.283);g.fill();g.fillStyle=m==='d1'?'#fff':'#e4032e';fit(g,'$ 40.000',w*.44,h*.07,900,'Arial, sans-serif');g.fillText('$ 40.000',w*.5,h*.72);
  for(let i=0;i<6;i++){g.fillStyle=['#e4032e','#1d63c8','#ffd400','#ffffff','#f26722','#3aa935'][i];g.fillRect(w*(.08+i*.14),h*.9,w*.11,h*.05)}}
// la palabra SALIDA en el círculo verde de la puerta del D1
function salida(g,w,h){g.clearRect(0,0,w,h);g.fillStyle='#3aa935';g.beginPath();g.arc(w/2,h/2,w*.48,0,6.283);g.fill();g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';
  fit(g,'SALIDA',w*.8,h*.2,900,'Arial Black, Arial, sans-serif');g.fillText('SALIDA',w/2,h*.42);g.fillStyle='#f0e04a';g.beginPath();g.arc(w/2,h*.68,w*.11,0,6.283);g.fill()}

const DRAW={ara,d1,olimpica};
function canvas(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c}
// logo de la marca (canvas con fondo transparente, salvo el cuadro del D1)
function logo(m,w,h,o){return canvas(w||1024,h||(m==='d1'?1024:m==='olimpica'?256:480),(g,W,H)=>DRAW[m](g,W,H,o))}
return{C,logo,canvas,afiche,salida,preciosBajos,llama,draw:DRAW,
  // el nombre de la marca con o sin tilde, para reconocerla en los lugares de OpenStreetMap
  es:n=>/^(tiendas? )?(ara|d1|ol[ií]mpica)([^a-z]|$)/i.test(String(n||'').trim())}
})();
