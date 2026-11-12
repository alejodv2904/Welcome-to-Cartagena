/* decodes the embedded GLB models (base64) and hands them to a callback */
window.cargarModelos=function(done,fail){const L=new THREE.GLTFLoader();const out={};const keys=Object.keys(window.MODELOS);let n=0;
  keys.forEach(k=>{const b64=window.MODELOS[k];const bin=atob(b64),buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);
    L.parse(buf.buffer,'',g=>{out[k]=g;if(++n===keys.length)done(out)},e=>{console.error(k,e);fail&&fail(e)})})};
