/* Feinschliff: Kapitelanzeige im Seitenkopf.
   Läuft vor motion.js,
   damit die Kapitel-Links dessen Sprungnavigation mitbenutzen. */
(()=>{
 const root=document.documentElement;
 const header=document.querySelector('header');

 // Kapitelanzeige (nur Desktop, per CSS gesteuert).
 const chapters=[
  ['therapie','Psychotherapie',['therapie']],
  ['schwerpunkte','Schwerpunkte',['schwerpunkte']],
  ['person','Zu meiner Person',['person']],
  ['rahmen','Rahmen & Kosten',['rahmen']],
  ['kontakt','Kontakt',['kontakt']]
 ].filter(([id])=>document.getElementById(id));
 // Bewusst kein <nav>: die bestehenden nav-Regeln gelten dem Vollbildmenü.
 const bar=document.createElement('div');
 bar.className='chapter-bar';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','Kapitel');
 chapters.forEach(([id,label],i)=>{
  const a=document.createElement('a');a.href='#'+id;
  a.innerHTML=`<span class="chapter-num">0${i+1}</span><span class="chapter-label"></span>`;
  a.querySelector('.chapter-label').textContent=label;
  bar.append(a);
 });
 header.querySelector('.menu-toggle').before(bar);
 const links=[...bar.querySelectorAll('a')];
 const starts=chapters.map(([id])=>document.getElementById(id));

 // Startseite (Desktop): gemeinsame Linien. Unterkante der Qualifikation = Unterkante „Ein Stück weiter“,
 // „Raum für Sie“ beginnt auf Höhe von „Mein Name …“, die Zeichnung füllt den Platz darüber mit Abstand.
 const textBox=el=>{const r=document.createRange();r.selectNodeContents(el);const rs=[...r.getClientRects()].filter(x=>x.width>1&&x.height>1);return rs.length?{top:Math.min(...rs.map(x=>x.top)),bottom:Math.max(...rs.map(x=>x.bottom))}:el.getBoundingClientRect();};
 let aligning=false;
 function alignHero(comp){
  // Desktop-Komposition: Überschrift oben links; darunter drei Spalten –
  // links Unterzeile + Schaltfläche, in der Mitte die gezeichnete Melissa, rechts die Vorstellung.
  if(aligning)return;aligning=true;
  try{
   const vars=['--intro-top','--portrait-h','--portrait-w','--portrait-top','--portrait-left','--txt-left','--txt-w','--txt-top','--cred-top','--h1-top','--btn-left'];
   if(!document.body.classList.contains('horizontal-story')){vars.forEach(p=>comp.style.removeProperty(p));comp.querySelector('h1')?.style.removeProperty('margin-left');comp.closest('.hero')?.querySelector('.scroll-cue')?.style.removeProperty('translate');const kk=comp.querySelector('.portrait-kicker');if(kk)kk.removeAttribute('style');comp.querySelector('h1')?.style.removeProperty('font-size');const c=comp.closest('.hero')?.querySelector('.scroll-cue');if(c)c.style.removeProperty('--cue-left');return;}
   const hero=comp.closest('.hero'),cue=hero.querySelector('.scroll-cue'),pc=comp.querySelector('.portrait-credential'),pi=comp.querySelector('.portrait-introduction'),intro=comp.querySelector('.intro'),cta=intro&&intro.querySelector('.cta-introduction'),oval=intro&&intro.querySelector('.oval'),kicker=pi&&pi.querySelector('.portrait-kicker'),h1=comp.querySelector('h1');
   if(!cue||!pc||!pi||!oval||!kicker||!h1)return;
   const anchor=cta||oval;
   const cr=comp.getBoundingClientRect(),W=cr.width;
   // Bündig mit dem Logo: Überschrift, Oberzeile und „Ein Stück weiter“ beginnen an der linken Kante des Logo-Knotens.
   {const logo=document.querySelector('.brand svg');if(logo){const LX=logo.getBoundingClientRect().left;
    const firstLeft=el=>{const rg=document.createRange();rg.selectNodeContents(el);const rs=[...rg.getClientRects()].filter(q=>q.width>1);return rs.length?Math.min(...rs.map(q=>q.left)):el.getBoundingClientRect().left;};
    const cur=parseFloat(getComputedStyle(h1).marginLeft)||0;h1.style.setProperty('margin-left',(cur+LX-firstLeft(h1.firstElementChild||h1)).toFixed(1)+'px','important');
    const cueEl=hero.querySelector('.scroll-cue');if(cueEl){cueEl.style.removeProperty('translate');cueEl.style.setProperty('translate',(LX-firstLeft(cueEl)).toFixed(1)+'px 0');}}}
   const cueText=cue.querySelector('.u')||[...cue.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
   const cueBox=cueText?(()=>{const r=document.createRange();r.selectNodeContents(cueText);return r.getBoundingClientRect()})():cue.getBoundingClientRect();
   const cueTop=cueBox.top-cr.top,cueBottom=cueBox.bottom-cr.top;
   // Die Überschrift bleibt an ihrer Stelle und darf in die Zeichnung hineinlaufen.
   let h1Bottom=0;{const tw=document.createTreeWalker(h1,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){if(!n.textContent.trim())continue;const rg=document.createRange();rg.selectNodeContents(n);for(const q of rg.getClientRects())h1Bottom=Math.max(h1Bottom,q.bottom-cr.top);}}
   // Links unten: „Ein Stück weiter“. Mitte: Melissa. Rechts: Vorstellung, vertikal mittig zur Zeichnung, darunter die Schaltfläche.
   const txtW=Math.min(310,W*.26),txtLeft=W-txtW;
   comp.style.setProperty('--txt-left',Math.round(txtLeft)+'px');comp.style.setProperty('--txt-w',Math.round(txtW)+'px');
   const ovalR=oval.getBoundingClientRect(),ovalW=ovalR.width,ovalH=ovalR.height;
   comp.style.setProperty('--btn-left',Math.round(Math.min(txtLeft,W-ovalW))+'px');
   // Zeichnung so groß wie vorher: fast die ganze Höhe, von knapp unter dem Seitenkopf bis „Ein Stück weiter“, mittig zwischen beiden Spalten.
   const pTop=-38,pBottom=cueBottom;
   // Volle Höhe vom Seitenkopf bis „Ein Stück weiter“ (Kopf beim Hereinlaufen bleibt unter der Navigation).
   // Größer: der leere untere Bildrand (ca. 11 %) darf unter die Linie von „Ein Stück weiter“ reichen;
   // die Linien enden weiter auf dieser Linie, oben bleibt Platz für den Kopf beim Hereinlaufen.
   // So groß wie möglich: Linien enden knapp über dem Fensterrand (statt auf der Linie von „Ein Stück weiter“),
   // der Kopf beim Hereinlaufen (2,4 % der Bildhöhe) bleibt 8 px unter dem Seitenkopf.
   const hdrB=header.getBoundingClientRect().bottom-cr.top+8,inkB=Math.max(pBottom-60,innerHeight-cr.top-80);
   const HEAD=0.037; // höchster Kopfpunkt beim Hereinlaufen (im Video gemessen)
   const topLim=(hdrB-HEAD/0.887*inkB)/(1-HEAD/0.887);
   // So groß, wie es geht, ohne dass der Kopf beim Hereinlaufen unter den Seitenkopf gerät.
   let h=Math.max(200,(inkB-topLim)/0.887),w=h*1024/1536;
   const maxW=(txtLeft-24)-W*.30; // links bleibt mind. 30 % der Breite für die Überschriftif(w>maxW){w=Math.max(160,maxW);h=w*1536/1024;}
   // Kicker („Humanistische Therapie · …“) einzeilig oben links unter der Navigation, aus dem Textblock gelöst.
   Object.assign(kicker.style,{position:'absolute',margin:'0',whiteSpace:'nowrap',width:'max-content',maxWidth:'none'});
   const first=pi.querySelector('.portrait-more')||pi;
   const kickInner=textBox(first).top-pi.getBoundingClientRect().top,piH=pi.offsetHeight,pcH=pc.offsetHeight,gapC=18;
   const blockH=(piH-kickInner)+gapC+pcH,top0=inkB-h*.887,mid=top0+h/2;
   // Gezeichnete Linien in einem Höhenband um die Mitte: linkester bzw. rechtester Punkt (Anteil der Bildbreite).
   const band=(half,arr,pick,init)=>{if(!arr)return null;const r0=Math.max(0,Math.floor((mid-half-top0)/h*arr.length)),r1=Math.min(arr.length-1,Math.ceil((mid+half-top0)/h*arr.length));let m=init;for(let y=r0;y<=r1;y++)m=pick(m,arr[y]);return m/256;};
   // Melissa gleichmäßig zwischen Überschrift (links) und Textblock (rechts): gleicher Abstand zu den gezeichneten Linien.
   h1.style.removeProperty('font-size');const base=parseFloat(getComputedStyle(h1).fontSize)||94;
   let l=1e9,rt=0,tt=1e9,tb=0;{const tw=document.createTreeWalker(h1,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){if(!n.textContent.trim())continue;const rg=document.createRange();rg.selectNodeContents(n);for(const q of rg.getClientRects()){l=Math.min(l,q.left);rt=Math.max(rt,q.right);tt=Math.min(tt,q.top);tb=Math.max(tb,q.bottom);}}}
   const lC=l-cr.left,used=Math.max(1,rt-l),hh=(()=>{const ls=[...h1.children].map(e=>e.getBoundingClientRect()).filter(b=>b.height>0);return ls.length?Math.max(...ls.map(b=>b.bottom))-Math.min(...ls.map(b=>b.top)):tb-tt;})(),Gmin=Math.max(56,W*.05);
   const bR=band(blockH/2,inkR,Math.max,0),b=(bR==null?1:bR)*w;
   const fit=a=>Math.max(28,Math.min(base,base*((txtLeft-(b-a)-2*Gmin)-lC)/used));
   let fs=base;
   for(let k=0;k<8;k++){const aL=band(hh*fs/base/2,ink,Math.min,256),a=(aL==null?0:aL)*w;fs=k<4?fit(a):(fs+fit(a))/2;}
   const aF=(band(hh*fs/base/2,ink,Math.min,256)??0)*w,gap=(txtLeft-(lC+used*fs/base)-(b-aF))/2,boxL=txtLeft-gap-b;
   if(fs<base-.5)h1.style.setProperty('font-size',Math.floor(fs)+'px','important');
   comp.style.setProperty('--portrait-w',Math.round(w)+'px');comp.style.setProperty('--portrait-h',Math.round(h)+'px');
   comp.style.setProperty('--portrait-top',Math.round(top0)+'px');comp.style.setProperty('--portrait-left',Math.round(boxL)+'px');
   // Schaltfläche mit großem Abstand unter dem Textblock; reicht der Platz nicht, rückt alles gemeinsam nach oben.
   const gapB=64;
   const T=Math.max(16,Math.min(cueBottom-blockH-gapB-ovalH,mid-blockH/2));
   comp.style.setProperty('--intro-top',(T+blockH+gapB-oval.offsetTop).toFixed(1)+'px');
   // Hauptüberschrift vertikal mittig, auf gleicher Höhe wie der Textblock rechts.
   // Gemessen an den drei Zeilen-Spans – die Buchstaben selbst sind während der Einblendung noch nach unten verschoben.
   {const lines=[...h1.children].filter(e=>e.getBoundingClientRect().height>0),hr=h1.getBoundingClientRect();
    if(lines.length){const lt=Math.min(...lines.map(e=>e.getBoundingClientRect().top)),lb=Math.max(...lines.map(e=>e.getBoundingClientRect().bottom));
     const inner=lt-hr.top,hH=lb-lt,c=T+blockH/2;comp.style.setProperty('--h1-top',Math.max(0,c-hH/2-inner).toFixed(1)+'px');}}
   comp.style.setProperty('--txt-top',(T-kickInner).toFixed(1)+'px');
   {const hb=header.getBoundingClientRect().bottom-cr.top,yK=hb+64,xK=h1.getBoundingClientRect().left-cr.left;
    const kb=textBox(kicker),kInner=kb.top-kicker.getBoundingClientRect().top;
    kicker.style.left=(xK-txtLeft).toFixed(1)+'px';kicker.style.top=(yK-kInner-(T-kickInner)).toFixed(1)+'px';}
   comp.style.setProperty('--cred-top',(T-kickInner+piH+gapC).toFixed(1)+'px');
  }finally{aligning=false;}
 }

 // Die gezeichnete Melissa blinzelt: zwei Lider, genau über die Augen der Zeichnung gelegt.
 const sketch=document.querySelector('.hero-portrait .portrait-sketch'),sketchImg=sketch&&sketch.querySelector('img');
 if(sketchImg){
  const ns='http://www.w3.org/2000/svg',lids=document.createElementNS(ns,'svg');
  lids.setAttribute('class','sketch-blink');lids.setAttribute('viewBox','0 0 1024 1536');lids.setAttribute('aria-hidden','true');
  lids.innerHTML='<ellipse cx="456" cy="261" rx="31" ry="20" transform="rotate(-7 456 261)"/><ellipse cx="560" cy="221" rx="39" ry="20" transform="rotate(-20 560 221)"/>'+
   // Geschlossene Lider entlang der Augenachse (Augenwinkel aus der Zeichnung vermessen).
   '<path d="M430 260 Q459 275 483 253"/><path d="M527 232 Q567 239 593 208"/>';
  sketch.append(lids);
  // Wo beginnen die Linien der Zeichnung je Bildzeile? (Hintergrundfarbe der Ecke gilt als leer.)
  var ink=null,inkR=null;
  const scanInk=()=>{try{const c=document.createElement('canvas');c.width=256;c.height=384;const x=c.getContext('2d');x.drawImage(sketchImg,0,0,256,384);const d=x.getImageData(0,0,256,384).data,b=[d[0],d[1],d[2]],a=new Int16Array(384),ar=new Int16Array(384);
   for(let y=0;y<384;y++){let f=256;for(let i=0;i<256;i++){const k=(y*256+i)*4;if(Math.abs(d[k]-b[0])+Math.abs(d[k+1]-b[1])+Math.abs(d[k+2]-b[2])>90){f=i;break}}a[y]=f;let g=-1;for(let i=255;i>=0;i--){const k=(y*256+i)*4;if(Math.abs(d[k]-b[0])+Math.abs(d[k+1]-b[1])+Math.abs(d[k+2]-b[2])>90){g=i+1;break}}ar[y]=g;}ink=a;inkR=ar;}catch(e){ink=inkR=null}};
  // Für den Seitenstart: Bild dekodiert und Linien vermessen → erst dann hebt sich der Vorhang (motion.js).
  window.__heroAssets=(sketchImg.decode?sketchImg.decode():new Promise(res=>{if(sketchImg.complete)res();else sketchImg.addEventListener('load',res,{once:true});})).catch(()=>{}).then(()=>{if(!ink)scanInk();});
  if(sketchImg.complete&&sketchImg.naturalWidth)scanInk();else sketchImg.addEventListener('load',scanInk,{once:true});
  // Foto für das Überfahren erst nachladen, wenn die Startseite steht (oder beim ersten Überfahren).
  {const ph=document.querySelector('img.portrait-photo[data-src]');if(ph){const load=()=>{if(ph.dataset.src){ph.src=ph.dataset.src;ph.removeAttribute('data-src');}};
   const fig0=ph.closest('.hero-portrait');if(fig0){fig0.addEventListener('pointerenter',load,{once:true});fig0.addEventListener('focusin',load,{once:true});}
   // Nur auf Geräten mit Maus vorab laden; auf Handys erst beim Antippen (spart Daten).
   if(matchMedia('(hover: hover) and (pointer: fine)').matches)addEventListener('load',()=>setTimeout(()=>(window.requestIdleCallback||setTimeout)(load),6000),{once:true});
   else if(fig0)fig0.addEventListener('touchstart',load,{once:true,passive:true});}}
  // Video: Melissa läuft von rechts herein und setzt sich – einmal, dann bleibt das gleiche Schlussbild stehen.
  const vid=sketch.querySelector('.sketch-video'),fig=sketch.closest('.hero-portrait');
  if(vid&&fig){
   const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const stop=()=>{fig.classList.remove('video-playing','video-pending');};
   // Vorstellung, Qualifikation und Schaltfläche erscheinen erst, wenn Melissa sitzt.
   const comp=fig.closest('.hero-composition');
   const reveal=()=>{if(!comp||!comp.classList.contains('await-video'))return;comp.classList.remove('await-video');comp.classList.add('video-revealed');
    // Sicherheitsnetz: nach der Einblendung die Animation entfernen, damit der Text auch bei angehaltenen Animationen sichtbar ist.
    setTimeout(()=>comp.classList.remove('video-revealed'),1600);};
   if(still){vid.remove();}
   else{
    if(comp){comp.classList.add('await-video');setTimeout(reveal,12000);}
    vid.addEventListener('ended',()=>{stop();reveal();setTimeout(()=>vid.remove(),1000);}); // danach entfernen: kein Video-Filter mehr im Hintergrund
    // Schon einblenden, während Melissa sich setzt (ab Sekunde 6 von 8 im Video, bei 1,5-facher Geschwindigkeit ≈ 1,3 s vor Schluss).
    vid.addEventListener('timeupdate',()=>{if(vid.currentTime>=6-(/\.webm/.test(vid.currentSrc||'')?3.0:0))reveal();});vid.addEventListener('error',()=>{stop();vid.remove();reveal();});
    // 1,5-fache Geschwindigkeit: rund 5,4 statt 8 Sekunden.
    vid.defaultPlaybackRate=1.5;vid.playbackRate=1.5;
    // Ablauf: Überschrift → kurz danach Sessel und Pflanze einblenden (erstes Videobild) → Melissa läuft herein.
    fig.classList.add('video-pending');
    const WALK_AFTER=250;
    // Die transparente WebM-Fassung beginnt erst bei Sekunde 3,0 des Originals (leerer Anfang schon abgeschnitten).
    const skipTo=()=>/\.webm/.test(vid.currentSrc||'')?0.1:3.1; // Melissa erscheint im Ausschnitt erst bei Sekunde 3,5 – den leeren Anfang überspringen.
    // Sessel und Pflanze erst, wenn die Überschrift steht: der letzte Buchstabe ist weitgehend angekommen.
    const afterHeadline=cb=>{const last=[...document.querySelectorAll('.hero h1 .motion-letter')].pop();
     // Die Buchstaben-Animation entsteht erst, wenn sich der Vorhang hebt – so lange warten (höchstens 4 s).
     const a=last&&last.getAnimations()[0];
     if(!a){if(!afterHeadline.tries)afterHeadline.tries=0;if(last&&afterHeadline.tries++<50)return setTimeout(()=>afterHeadline(cb),80);return setTimeout(cb,300);}
     const target=(a.effect.getTiming().delay||0)+600; // wenn die Überschrift größtenteils sichtbar ist
     // Zeitgesteuert statt an der Animationszeit zu kleben (die steht still, wenn der Browser keine Bilder zeichnet).
     setTimeout(cb,Math.max(0,target-(a.currentTime||0)));};
    const seekTo=(t,cb)=>{if(Math.abs(vid.currentTime-t)<.05)return cb();let ok=false;const f=()=>{if(!ok){ok=true;cb();}};vid.addEventListener('seeked',f,{once:true});try{vid.currentTime=t;}catch(e){f();}setTimeout(f,700);};
    const start=()=>{if(start.done)return;start.done=true;
     afterHeadline(()=>seekTo(skipTo(),()=>{fig.classList.add('video-playing');fig.classList.remove('video-pending');
      setTimeout(()=>{if(vid.currentTime<skipTo()-.05){try{vid.currentTime=skipTo();}catch(e){}}vid.playbackRate=1.5;const p=vid.play();if(p&&p.catch)p.catch(()=>{stop();vid.remove();reveal();});},WALK_AFTER);}));};
    const go=()=>start();
    if(vid.readyState>=2)go();else{vid.addEventListener('loadeddata',go,{once:true});addEventListener('load',()=>{if(vid.readyState>=1)go();else vid.addEventListener('loadedmetadata',go,{once:true});},{once:true});}
   }
  }
  // Lage an die tatsächlich gezeichnete Bildfläche anpassen (object-fit: contain, oben ausgerichtet).
  const placeLids=()=>{const iw=sketchImg.naturalWidth||1024,ih=sketchImg.naturalHeight||1536,bw=sketchImg.clientWidth,bh=sketchImg.clientHeight;if(!bw||!bh)return;
   const s=Math.min(bw/iw,bh/ih),w=iw*s,h=ih*s;
   Object.assign(lids.style,{left:sketchImg.offsetLeft+(bw-w)/2+'px',top:sketchImg.offsetTop+'px',width:w+'px',height:h+'px'});
   // Vorstellungstext bündig mit der linken Kante der Zeichnung ausrichten.
   const comp=sketch.closest('.hero-composition');
   if(comp)alignHero(comp);
   if(comp){const ir=sketchImg.getBoundingClientRect(),cr=comp.getBoundingClientRect();comp.style.setProperty('--sketch-left',Math.round(ir.left-cr.left+(bw-w)/2)+'px');}};
  window.__alignHero=placeLids;
  // Beim Größe-Ändern höchstens eine Neuberechnung pro Bild (sonst stockt die Seite).
  const placeSoon=()=>{if(placeSoon.p)return;placeSoon.p=requestAnimationFrame(()=>{placeSoon.p=0;placeLids();});};
  placeLids();sketchImg.addEventListener('load',placeLids);addEventListener('resize',()=>{placeSoon();clearTimeout(placeLids.t);placeLids.t=setTimeout(placeLids,350)});addEventListener('load',placeLids);
  // motion.js ordnet die Startseite erst nach diesem Skript an – danach erneut messen.
  const ro=new ResizeObserver(placeSoon);ro.observe(sketchImg);ro.observe(sketch.closest('.hero-composition')||sketchImg);ro.observe(document.body);setTimeout(placeLids,0);setTimeout(placeLids,600);
 }

 // Während der Größenänderung: Schnur ausblenden, Dauer-Animationen anhalten (Klasse is-resizing).
 {const rootEl=document.documentElement;let t=0;addEventListener('resize',()=>{rootEl.classList.add('is-resizing');clearTimeout(t);t=setTimeout(()=>rootEl.classList.remove('is-resizing'),320);},{passive:true});}
 let ticking=0,until=0;
 function update(){
  const horizontal=document.body.classList.contains('horizontal-story');
  let active=-1;
  starts.forEach((section,i)=>{
   const r=section.getBoundingClientRect();
   if((horizontal?r.left:r.top)<=(horizontal?innerWidth:innerHeight)*.5)active=i;
  });
  links.forEach((a,i)=>{
   if(i===active)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
   a.classList.toggle('passed',i<active);
  });
 }
 // motion.js glättet die horizontale Bewegung nach; daher kurz weiter mitlesen.
 function loop(t){update();if(t<until)ticking=requestAnimationFrame(loop);else ticking=0}
 function kick(){until=performance.now()+1400;if(!ticking)ticking=requestAnimationFrame(loop)}
 addEventListener('scroll',kick,{passive:true});
 addEventListener('resize',kick);
 addEventListener('load',kick);
 kick();
})();

// Mobil: Kicker-Zeile ganz oben im Hero (vor der Hauptüberschrift), Desktop: zurück in den Textblock.
(function(){
 const mq=matchMedia('(max-width:999px)');
 function place(){
  const hero=document.querySelector('.hero'),k=hero&&hero.querySelector('.portrait-kicker'),pi=hero&&hero.querySelector('.portrait-introduction'),comp=hero&&hero.querySelector('.hero-composition');
  if(!k||!pi||!comp)return;
  if(mq.matches){if(k.parentNode!==hero){k.removeAttribute('style');hero.insertBefore(k,comp);k.classList.add('kicker-top')}}
  else if(k.parentNode!==pi){k.classList.remove('kicker-top');pi.insertBefore(k,pi.firstChild);window.__alignHero&&window.__alignHero()}
 }
 place();
 mq.addEventListener('change',place);
})();

// Nach dem Laden der Schriften Hero neu ausmessen (Inter/Editorial New haben andere Laufweiten).
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{window.__alignHero&&window.__alignHero()});
