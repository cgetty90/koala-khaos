// Approved whole-character artwork. Articulation is deliberately pending matching layers.
(()=>{
 const root=new URL('./',document.currentScript.src);
 const image=new Image();
 image.decoding='async';
 image.src=new URL('mochi-approved.png',root).href;
 const ready=image.decode().then(()=>{
  for(const id of ['mascot','cinematic-mochi','win-mochi','welcome-mochi']){
   const original=document.getElementById(id);
   if(!original)continue;
   const canvas=document.createElement('canvas');
   canvas.width=640;canvas.height=748;
   canvas.setAttribute('aria-hidden','true');
   canvas.dataset.mochiArtwork='approved-arm-repair';
   const ctx=canvas.getContext('2d');
   const scale=Math.min(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);
   const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
   ctx.drawImage(image,(canvas.width-w)/2,canvas.height-h,w,h);
   original.parentElement.append(canvas);
   original.style.visibility='hidden';
  }
  window.premiumMochiArtwork={status:'ready',articulated:false};
 });
 window.premiumCharacterLoads=[ready];
})();