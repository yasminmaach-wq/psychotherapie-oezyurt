/* Motion reconstructed for this site: 600 ms curtain, 2 s quartic text
   entrances, 40 ms letter / 60 ms word staggering, scroll-driven chapter track. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const desktop=matchMedia('(min-width: 1000px) and (min-height: 600px)');
 const main=document.querySelector('main');
 const track=document.createElement('div');track.className='scroll-track';main.before(track);track.append(main);
 const curtain=document.querySelector('.page-curtain')||(()=>{const c=document.createElement('div');c.className='page-curtain';c.setAttribute('aria-hidden','true');document.body.append(c);return c;})();
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 let horizontal=false, distance=0, current=0, target=0, raf=0, last=0, panels=[];
 const easeQuart='cubic-bezier(.165,.84,.44,1)';
 // Eine Kurve und eine Dauer für alle Einblendungen (siehe --ease/--dur-in in style.css).
 const MOTION_EASE='cubic-bezier(.22,.61,.36,1)',MOTION_DUR=900;
 function splitText(element,mode){
  const original=element.innerText.replace(/\s+/g,' ').trim();element.setAttribute('aria-label',original);
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  let index=0;for(const node of nodes){const frag=document.createDocumentFragment();for(const part of node.textContent.split(/(\s+)/)){
   if(!part)continue;if(/^\s+$/.test(part)){frag.append(document.createTextNode(part));continue}
   const word=document.createElement('span');word.className='motion-word';word.setAttribute('aria-hidden','true');
   if(mode==='words'){word.textContent=part;word.dataset.order=index++;}
   else for(const ch of Array.from(part)){const letter=document.createElement('span');letter.className='motion-letter';letter.textContent=ch;letter.dataset.order=index++;word.append(letter)}
   frag.append(word);
  }node.replaceWith(frag)}
  element.classList.add('split-heading');element.dataset.motionType=mode;
 }
 const heroTitle=document.querySelector('h1');splitText(heroTitle,'letters');
 document.querySelectorAll('.focus h2,.confidential-panel h2,.statement h2,.contact h2').forEach(e=>splitText(e,'words'));
 const openingTitle=document.querySelector('.opening h2');openingTitle.innerHTML='<span class="story-line">Manchmal wissen wir,</span><span class="story-line">was uns belastet.</span><em><span class="story-line">Manchmal spüren</span><span class="story-line">wir es nur.</span></em>';openingTitle.classList.remove('reveal');
 const reveals=Array.from(document.querySelectorAll('.reveal')).filter(e=>!e.matches('.split-heading'));reveals.forEach(e=>e.classList.add('motion-reveal'));
 const headings=Array.from(document.querySelectorAll('.split-heading'));
 const played=new WeakSet();
 function animateHeading(e){if(played.has(e)||reduced.matches)return;played.add(e);const letters=e.dataset.motionType==='letters';e.querySelectorAll(letters?'.motion-letter':'.motion-word').forEach((part,i)=>part.animate([{opacity:0},{opacity:1}],{duration:MOTION_DUR,delay:80,easing:MOTION_EASE,fill:'both'}));}
 const observer=new IntersectionObserver(entries=>entries.forEach(({target:e,isIntersecting})=>{if(!isIntersecting)return;if(e.matches('.split-heading'))animateHeading(e);else e.classList.add('visible')}),{threshold:.06});
 const startObserving=()=>[...headings,...reveals].forEach(e=>observer.observe(e));
 const lines=Array.from(document.querySelectorAll('.story-line'));
 const portrait=document.querySelector('.hero-portrait');const portraitImage=portrait.querySelector('img');
 const artPaths=Array.from(document.querySelectorAll('.thread-art path'));artPaths.forEach(p=>{const len=p.getTotalLength();p.style.strokeDasharray=len;p.dataset.length=len});
 // A connected pair of threads follows all chapters through to contact.
 const journeySections=Array.from(main.querySelectorAll('section')).slice(1);
 const journeySegments=journeySections.map((section,index)=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('journey-line');svg.setAttribute('aria-hidden','true');
  const paths=[0,1].map(()=>{const path=document.createElementNS(svg.namespaceURI,'path');svg.append(path);return path});section.append(svg);return {section,svg,paths,index,key:''};
 });
 function illustrationTip(){
  const figure=document.querySelector('.opening-illustration'),image=figure.querySelector('img');
  const bw=image.clientWidth,bh=image.clientHeight,iw=image.naturalWidth||1111,ih=image.naturalHeight||1416;
  const scale=Math.min(bw/iw,bh/ih),rw=iw*scale,rh=ih*scale;
  // Start mitten im Knäuel, das die Figur vor der Brust hält (Bildkoordinaten 1111 × 1416).
  // Anteile statt Pixel: je nach Bildschirm lädt eine kleinere Bildfassung (srcset), deren Pixelmaße anders sind.
  return {x:figure.offsetLeft+(bw-rw)/2+610/1111*rw,y:figure.offsetTop+(bh-rh)/2+760/1416*rh,inkWidth:7/1111*rw};
 }
 // Schnelles Abtasten eines Pfads (M/L/C, auch relativ, Z): flacht Kurven ab und verteilt Punkte im festen Abstand.
 // Ersetzt getPointAtLength, das bei langen Pfaden jede Abfrage von vorn beginnt (vorher ~2 s beim Seitenstart).
 function samplePath(d,step){
  const tok=d.match(/[MmLlCcZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[];const poly=[];let i=0,cmd='',x=0,y=0,sx=0,sy=0;
  const num=()=>+tok[i++];
  while(i<tok.length){if(/[A-Za-z]/.test(tok[i]))cmd=tok[i++];
   if(cmd==='Z'||cmd==='z'){x=sx;y=sy;poly.push([x,y]);continue;}
   if(cmd==='M'||cmd==='m'){const a=num(),b=num();x=cmd==='m'?x+a:a;y=cmd==='m'?y+b:b;sx=x;sy=y;poly.push([x,y]);cmd=cmd==='m'?'l':'L';continue;}
   if(cmd==='L'||cmd==='l'){const a=num(),b=num();x=cmd==='l'?x+a:a;y=cmd==='l'?y+b:b;poly.push([x,y]);continue;}
   if(cmd==='C'||cmd==='c'){const r=cmd==='c';const x1=num()+(r?x:0),y1=num()+(r?y:0),x2=num()+(r?x:0),y2=num()+(r?y:0),x3=num()+(r?x:0),y3=num()+(r?y:0);
    const est=Math.hypot(x1-x,y1-y)+Math.hypot(x2-x1,y2-y1)+Math.hypot(x3-x2,y3-y2),n=Math.max(4,Math.min(60,Math.ceil(est/4)));
    for(let k=1;k<=n;k++){const t=k/n,u=1-t;poly.push([u*u*u*x+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,u*u*u*y+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3]);}
    x=x3;y=y3;continue;}
   i++;}
  // gleichmäßig neu verteilen
  const out=[];if(!poly.length)return {pts:out,length:0};out.push(poly[0].slice());let carry=0,total=0;
  for(let k=1;k<poly.length;k++){const ax=poly[k-1][0],ay=poly[k-1][1],bx=poly[k][0],by=poly[k][1],len=Math.hypot(bx-ax,by-ay);if(!len)continue;let pos=0;
   while(carry+len-pos>=step){pos+=step-carry;carry=0;const t=pos/len;out.push([ax+(bx-ax)*t,ay+(by-ay)*t]);}
   carry+=len-pos;total+=len;}
  const last=poly[poly.length-1];if(carry>.01)out.push(last.slice());return {pts:out,length:total};
 }
 window.__samplePath=samplePath;
 function taperCord(path,startWidth,endWidth=2.8){
  const {pts,length}=samplePath(path.getAttribute('d')||'',2),left=[],right=[];
  for(let i=0;i<pts.length;i++){
   const point=pts[i],before=pts[Math.max(0,i-1)],after=pts[Math.min(pts.length-1,i+1)],distance=Math.min(length,i*2);
   const dx=after[0]-before[0],dy=after[1]-before[1],norm=Math.hypot(dx,dy)||1;
   const t=Math.min(1,distance/85),ease=t*t*(3-2*t),radius=(startWidth+(endWidth-startWidth)*ease)/2;
   left.push(`${(point[0]-dy/norm*radius).toFixed(2)} ${(point[1]+dx/norm*radius).toFixed(2)}`);
   right.push(`${(point[0]+dy/norm*radius).toFixed(2)} ${(point[1]-dx/norm*radius).toFixed(2)}`);
  }
  path.setAttribute('d','M'+left.join('L')+'L'+right.reverse().join('L')+'Z');
  path.classList.add('cord-ribbon');path.style.strokeDasharray='none';
 }
 function heartLoop(cx,tip,size){
  // One continuous cord retraces an imperfect heart with loose, offset loops.
  const strokes=[
   [-.55,-.97,-.21,-1.11,-.02,-.67],
   [.18,-1.03,.58,-1.01,.50,-.57],
   [.47,-.34,.14,-.09,-.02,.02],
   [-.17,-.10,-.51,-.35,-.50,-.55],
   [-.65,-1.02,-.04,-1.28,.06,-.53],
   [.24,-.97,.73,-1.13,.43,-.48],
   [.32,-.26,.09,-.04,-.06,-.03],
   [-.19,-.20,-.37,-.43,-.30,-.65],
   [-.28,-.96,-.02,-.88,.02,-.40],
   [.22,-.75,.63,-.86,.38,-.48],
   [.41,-.32,.10,-.16,-.04,.04],
   [-.08,.09,-.12,.13,-.10,.17]
  ];
  return strokes.map(points=>' C '+points.map((value,i)=>(i%2?tip:cx)+value*size).join(' ')).join('');
 }

 // Individual, open-ended scribbles; each chapter gets a different gesture.
 const mobileKnotShapes=[
  [[.85,-.8,-.5,-1,-.9,-.25],[-1.1,.5,-.4,1,.4,.55],[1.05,.1,.5,-.8,-.2,-.55],[-.85,-.2,-.1,.9,.7,.5]],
  [[1,-1,-.1,-.9,0,0],[.1,.9,-1,1,-1,0],[-1,-.8,.1,-.6,.2,.15],[.35,1,.95,.9,.9,.4]],
  [[.85,.65,-.45,.95,-.9,.35],[-1.2,-.15,-.3,-.85,.55,-.6],[1,-.45,.7,.7,-.1,.65],[-.8,.6,-.65,-.5,.1,-.45],[.55,-.4,.9,.2,.7,.6]],
  [[.35,-.5,-.8,-.8,-1,-.15],[-1.1,.55,-.1,1,.4,.5],[.85,0,.45,-.65,-.15,-.5],[-.8,-.3,-.4,.5,.1,.6],[.55,.8,1,.6,1,.3]],
  [[.9,-.4,.1,-1,-.5,-.65],[-1.05,-.25,-.85,.65,-.2,.8],[.6,1,.95,.15,.45,-.25],[.05,-.7,-.5,-.2,-.25,.3],[0,.8,.8,.75,.9,.4]]
 ];
 function mobilePlan(section,index){
  // Wie am Desktop: viele Knoten am Anfang, die sich Kapitel für Kapitel lösen.
  section.style.paddingBottom='';
  const loops=index<4?4-index:0,small=section.id==='rahmen';
  if(!loops&&!small)return null;
  const W=section.clientWidth,band=loops?Math.round(Math.min(200,Math.max(150,W*.44))):120;
  let bottom=0;
  for(const child of section.children){
   if(child.matches('svg.journey-line'))continue;
   // Der Spruch liegt wie am Desktop auf den Knoten – er zählt nicht zum Text, unter dem das Knotenband beginnt.
   if(child.classList.contains('thread-art'))continue;
   const el=child;
   let b=el.offsetHeight,node=el;while(node&&node!==section){b+=node.offsetTop;node=node.offsetParent;}
   bottom=Math.max(bottom,b);
  }
  const need=band+30-(section.offsetHeight-bottom);
  if(need>0)section.style.paddingBottom=(parseFloat(getComputedStyle(section).paddingBottom)||0)+need+'px';
  const bandTop=section.offsetHeight-band-16;
  // Spruch mittig auf das Knotenband legen (Knoten werden zu seinem Hintergrund).
  const art=section.querySelector('.thread-art'),quote=art&&art.querySelector('span');
  if(quote&&loops){let at=0,node=art;while(node&&node!==section){at+=node.offsetTop;node=node.offsetParent;}
   quote.style.top=Math.round(bandTop+band*.6-quote.offsetHeight/2-at)+'px';}
  return {loops,small,band,bandTop};
 }
 function mobileBends(edge,start,end,index){
  const profiles=[[-5,7,-8,3],[6,-8,4,-5],[-7,3,-4,7],[4,-6,8,-3],[-3,8,-7,2],[7,-4,3,-8],[-6,5,-2,6],[3,-7,6,-4]];
  const offsets=profiles[index%profiles.length],span=Math.max(1,end-start);
  const fractions=[0,.16+(index%3)*.025,.39+(index%2)*.045,.65-(index%3)*.02,.86,1];
  const pts=fractions.map((t,i)=>({x:edge+(i===0||i===5?0:offsets[i-1]),y:start+span*t}));
  const slopes=pts.map((p,i)=>i===0||i===pts.length-1?0:(pts[i+1].x-pts[i-1].x)/(pts[i+1].y-pts[i-1].y));
  return pts.slice(1).map((q,i)=>{const p=pts[i],step=(q.y-p.y)/3;return ` C ${p.x+slopes[i]*step} ${p.y+step} ${q.x-slopes[i+1]*step} ${q.y-step} ${q.x} ${q.y}`;}).join('');
 }
 // Abstand zu Texten: Die Schnur weicht Textzeilen in einem weichen Bogen aus.
 // Ausgenommen ist nur der Spruch in .thread-art, den die Schnur bewusst umspielt.
 const textSelector='h1,h2,h3,p,li,summary,a,.eyebrow,.plain-topic,figcaption,small,footer button,.fact span';
 function textObstacles(section,svg){
  const box=svg.getBoundingClientRect(),out=[];
  section.querySelectorAll(textSelector).forEach(e=>{
   if(e.closest('.thread-art')||e.closest('svg'))return;
   if(e.checkVisibility&&!e.checkVisibility({visibilityProperty:true}))return;
   const range=document.createRange();range.selectNodeContents(e);
   for(const r of range.getClientRects())if(r.width>1&&r.height>1)out.push({l:r.left-box.left,r:r.right-box.left,t:r.top-box.top,b:r.bottom-box.top});
  });
  // Schaltflächen und Plus-Zeichen der Akkordeons als ganze Fläche freihalten.
  section.querySelectorAll('.oval,summary>span:last-child,.statement-hands,footer,.fact').forEach(e=>{if(e.checkVisibility&&!e.checkVisibility({visibilityProperty:true}))return;const r=e.getBoundingClientRect();if(r.width>1&&r.height>1)out.push({l:r.left-box.left,r:r.right-box.left,t:r.top-box.top,b:r.bottom-box.top,up:e.tagName==='FOOTER'});});
  return out;
 }
 function avoidText(path,obstacles,w,h){
  if(!obstacles.length)return false;
  const M=horizontal?34:18,step=3,pts=samplePath(path.getAttribute('d')||'',step).pts;
  const need=pts.map(([x,y])=>{let off=0;
   for(const o of obstacles){
    if(x<o.l-M||x>o.r+M||y<o.t-M||y>o.b+M)continue;
    let v;
    if(horizontal){v=!o.up&&o.b+M<=h-4?o.b+M-y:o.t-M-y; // Fußzeile: Schnur immer darüber führen
     // Würde das Ausweichen nach unten in die Fußzeile führen, lieber über das Hindernis.
     if(v>0&&obstacles.some(p=>p.up&&x>=p.l-M&&x<=p.r+M&&y+v>=p.t-M)){const u=o.t-M-y;if(-u<64)v=u;}}
    else v=Math.min(w-3,o.r+M)-x;
    // Mobil im Inhaltsbereich (Bögen, Knoten): nach unten statt zur Seite ausweichen.
    if(!horizontal&&x<0)v=o.b+M<=h-4?o.b+M-y:o.t-M-y;
    if(Math.abs(v)>Math.abs(off))off=v;
   }
   return off;});
  if(!need.some(v=>Math.abs(v)>.5))return false;
  const R=Math.round((horizontal?110:70)/step),shift=need.map(()=>0);
  need.forEach((v,i)=>{if(!v)return;for(let k=-R;k<=R;k++){const j=i+k;if(j<0||j>=shift.length)continue;const t=1-Math.abs(k)/R,f=v*t*t*(3-2*t);if(Math.abs(f)>Math.abs(shift[j]))shift[j]=f;}});
  // Ausweichbogen glätten: Übergänge zwischen benachbarten Hindernissen ohne Knicke oder Stufen.
  {const K=Math.round((horizontal?40:24)/step);for(let pass=0;pass<3;pass++){const src=shift.slice(),N=src.length;let acc=0;const pre=[0];for(let i=0;i<N;i++){acc+=src[i];pre.push(acc);}for(let i=0;i<N;i++){const a=Math.max(0,i-K),b=Math.min(N,i+K+1);shift[i]=(pre[b]-pre[a])/(b-a);}}}
  // Anfang und Ende bleiben fest, damit die Schnur an den Kapitelgrenzen nahtlos weiterläuft (sanft über 160 px).
  const N=pts.length,F=160/step;for(let i=0;i<N;i++){const t=Math.min(1,i/F,(N-1-i)/F),e=t*t*(3-2*t);shift[i]*=e;}
  let d='';
  pts.forEach((p,i)=>{p[horizontal||p[0]<0?1:0]+=shift[i];d+=(i?' L ':'M ')+p[0].toFixed(1)+' '+p[1].toFixed(1);});
  path.setAttribute('d',d);
  return true;
 }
 function layoutJourney(){
  // Nur neu berechnen, wenn sich Fenster oder Abschnittsgrößen wirklich geändert haben (die Schnur ist sehr aufwendig).
  {const ill=document.querySelector('.opening-illustration img');const key=[innerWidth,innerHeight,horizontal,(document.querySelector('.hero-composition')||{}).style?.cssText||'',ill?ill.clientWidth+'x'+ill.clientHeight+'@'+ill.offsetLeft+','+ill.offsetTop+':'+(ill.naturalWidth||0):'',...journeySegments.map(s=>s.section.offsetWidth+'x'+s.section.offsetHeight)].join();if(key===layoutJourney.key)return;layoutJourney.key=key;}
  // Textpositionen ohne die laufenden Einblend-Verschiebungen messen.
  const rootEl=document.documentElement;rootEl.classList.add('measure-layout');
  const obstacleMap=new Map(journeySegments.map(seg=>[seg,textObstacles(seg.section,seg.svg)]));
  rootEl.classList.remove('measure-layout');rootEl.classList.add('measure-settle');void rootEl.offsetWidth;
  requestAnimationFrame(()=>rootEl.classList.remove('measure-settle'));
  journeySegments.forEach(segment=>{
  const {section,svg,paths,index}=segment;const plan=horizontal?(section.style.paddingBottom='',section.querySelector('.thread-art span')?.style.removeProperty('top'),null):mobilePlan(section,index);const w=horizontal?section.clientWidth:36;const h=horizontal?Math.min(380,Math.max(250,innerHeight*.4)):section.offsetHeight;const tip=index===0?illustrationTip():null;const key=[horizontal,w,h,section.clientWidth,tip?.x,tip?.y,plan?.bandTop,plan?.band,obstacleMap.get(segment).map(o=>Math.round(o.l)+','+Math.round(o.t)).join(';')].join(':');if(key===segment.key)return;segment.key=key;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  paths.forEach((path,j)=>{let d;
   // Closely tangled at the start, gradually opening into a calm cord.
   const knotCount=Math.max(0,4-index);
   const offset=j*5;
   if(horizontal){
    const base=h*.70+offset,startX=index===0?tip.x+120:0;
    d=index===0?`M ${tip.x} ${tip.y-(section.offsetHeight-h)} C ${tip.x-4} ${tip.y-(section.offsetHeight-h)+42} ${tip.x+35} ${base} ${startX} ${base}`:`M 0 ${base}`;
    const available=w-startX;
    for(let k=0;k<knotCount;k++){
     const center=startX+available*(.14+k*.175+(k%2)*.025),span=Math.min(85,available*.11),radius=92-index*8+(k%3)*15,amplitude=(39-index*4+(k%2)*9)*(h/170),localBase=base-h*(.18+.10*Math.sin(k*1.7+index));
     // Reflect the adjoining curve's final handle for a smooth chapter boundary.
     const smoothEntry=k===0&&journeySections[index-1]?.id==='schwerpunkte';
     const levelEntry=k===0&&(section.classList.contains('approach')||section.id==='schwerpunkte');
     const entryX=smoothEntry||levelEntry?journeySections[index-1].clientWidth*.1:center-125;
     const entryY=smoothEntry?2*base-h*.86:levelEntry?base:base-h*.35;
     d+=` C ${entryX} ${entryY} ${center-65} ${localBase} ${center-span/2} ${localBase}`;
     const turns=index<2?3-(k%2):2;
     for(let n=1;n<=240;n++){const t=n/240,angle=t*Math.PI*2*turns,envelope=Math.sin(Math.PI*t);
      const x=center-span/2+span*t+radius*Math.sin(angle)+19*Math.sin(angle*2+.4)*envelope;
      const y=localBase-amplitude*(1-Math.cos(angle))*(.78+.22*Math.sin(angle*.5+k))+17*Math.sin(angle+Math.PI*k)*envelope;
      d+=` L ${x} ${y}`;
     }
    }
    if(knotCount===0){
     const lowerArc=section.id==='rahmen';
     const textClearance=section.id==='kontakt'?Math.max(0,740-innerHeight)*.3:0;
     const precedingSection=journeySections[index-1];
     // Continue both slope and curvature across the conditions/contact boundary.
     const contactEntry=section.id==='kontakt'&&precedingSection?.id==='rahmen';
     const entryScale=contactEntry?w*.08/(precedingSection.clientWidth*.22):0;
     const entryY=contactEntry?base-h*.13*entryScale:base;
     if(contactEntry){
      const bendX=w*.16+entryScale**2*precedingSection.clientWidth*.12;
      const bendY=base-h*.26*entryScale-h*.36*entryScale**2;
      const joinX=w*.20,joinY=base-h*.10;
      const nextY=joinY+(joinY-bendY)*(w*.08/(joinX-bendX));
      d+=` C ${w*.08} ${entryY} ${bendX} ${bendY} ${joinX} ${joinY}`;
      d+=` C ${w*.28} ${nextY} ${w*.33} ${h*.218+textClearance} ${w*.43} ${h*.27+textClearance}`;
     }else{
      d+=` C ${w*.16} ${entryY} ${w*.18} ${h*(lowerArc?.50:.14)+textClearance} ${w*.43} ${h*(lowerArc?.57:.27)+textClearance}`;
     }
     if(lowerArc){
      // A small, connected knot below the conditions text.
      d+=' c 26 8 50 46 15 52 c -35 6 -31 -54 4 -57 c 38 -3 68 32 42 43 c -29 12 -48 -21 -20 -35';
     }
     if(section.id==='kontakt'){
      const size=Math.min(64,Math.max(44,w*.04));
      const cx=w-size*.75-Math.min(64,Math.max(32,w*.04));
      const heartTip=base-Math.min(48,Math.max(28,innerHeight*.05)),left=cx-size*.5;
      d+=` C ${w*.68} ${h*.40+textClearance} ${left} ${heartTip+size*.2} ${left} ${heartTip-size*.55}`;
      d+=heartLoop(cx,heartTip,size);
     }else{
      const exitY=section.classList.contains('statement')?base:h*.83;
      d+=` C ${w*.68} ${h*(lowerArc?.60:.40)+textClearance} ${w*.78} ${exitY} ${w} ${base}`;
     }
    }else{
     const tailHeight=section.id==='schwerpunkte'?h*.94:section.classList.contains('confidential-panel')?h*.62:h*.32;
     const tailExit=section.id==='schwerpunkte'?h*.86:base;
     d+=` C ${w*.82} ${tailHeight} ${w*.9} ${tailExit} ${w} ${base}`;
    }
   }else{
    // Mobile: dieselbe Schnur wie am Desktop, nur senkrecht. Sie läuft am rechten Rand
    // und schlingt sich in einem freien Band unter dem Text zu Knoten wie am Desktop.
    const edge=18+j*3,W=section.clientWidth,X=x=>x-(W-w);
    let startY=index===0?Math.min(h-120,tip.y+70):0;
    const footer=section.querySelector('footer');
    const heartTip=section.id==='kontakt'?Math.min(h-34,(footer?.offsetTop||h)-26):null;
    const endY=heartTip===null?h:Math.max(startY+90,heartTip-86);
    if(index===0){
     const startX=tip.x-(section.clientWidth-w);
     d=`M ${startX} ${tip.y} C ${startX} ${tip.y+22} ${edge} ${tip.y+22} ${edge} ${startY}`;
    }else d=`M ${edge} 0`;
    if(plan){
     const B=plan.band,top=Math.max(plan.bandTop,startY+40);
     d+=mobileBends(edge,startY,top,index);
     if(plan.loops){
      const n=plan.loops,s=Math.min(1,W/560);
      const left=X(W*.12),right=X(W*.84),avail=right-left;
      const base=top+B*.8+j*3;
      // Weit nach links ausschwingen, dann die Knoten von links nach rechts.
      d+=` C ${edge} ${top+B*.3} ${left+avail*.35} ${top+B*.02} ${left-avail*.04} ${base-B*.22}`;
      for(let k=0;k<n;k++){
       const center=left+avail*(k+.5)/n,span=Math.min(34,avail*.08);
       const radius=Math.min(avail/n*.78,(64-index*6+(k%3)*10)*s+10);
       const amp=Math.min(B*.36,(34-index*3+(k%2)*8)*(.6+.4*s)+10);
       const localBase=base-B*(.05+.05*Math.sin(k*1.7+index));
       d+=` C ${center-radius*1.25} ${localBase-B*.12} ${center-span*1.6} ${localBase} ${center-span/2} ${localBase}`;
       const turns=index<2?3-(k%2):2;
       for(let m=1;m<=180;m++){const t=m/180,angle=t*Math.PI*2*turns,envelope=Math.sin(Math.PI*t);
        const x=center-span/2+span*t+radius*Math.sin(angle)+10*s*Math.sin(angle*2+.4)*envelope;
        const y=localBase-amp*(1-Math.cos(angle))*(.78+.22*Math.sin(angle*.5+k))+9*s*Math.sin(angle+Math.PI*k)*envelope;
        d+=` L ${x.toFixed(2)} ${y.toFixed(2)}`;
       }
      }
      // Zurück an den rechten Rand und weiter nach unten.
      d+=` C ${right+(edge-right)*.55} ${base+4} ${edge} ${base+(h-base)*.25} ${edge} ${base+(h-base)*.7}`;
      d+=` C ${edge} ${h-3} ${edge} ${h-1} ${edge} ${h}`;
     }else if(plan.small){
      // Der kleine verbundene Knoten wie am Desktop unter „Rahmen & Kosten“.
      const sx=X(W*.6),sy=top+B*.32;
      d+=` C ${edge} ${top+B*.12} ${sx+46} ${sy-22} ${sx} ${sy}`;
      d+=' c 26 8 50 46 15 52 c -35 6 -31 -54 4 -57 c 38 -3 68 32 42 43 c -29 12 -48 -21 -20 -35';
      d+=` C ${sx+62} ${sy+18} ${edge} ${sy+34} ${edge} ${Math.min(h-6,sy+B*.62)}`;
      d+=` C ${edge} ${h-3} ${edge} ${h-1} ${edge} ${h}`;
     }
    }else d+=mobileBends(edge,startY,endY,index);
    if(heartTip!==null){
     const size=34,cx=10,left=cx-size*.5; // größeres Herz zum Schluss (Handy)
     d+=` C ${edge} ${endY+18} ${left} ${heartTip-size*1.6} ${left} ${heartTip-size*.55}`;
     d+=heartLoop(cx,heartTip,size);
    }
   }
   path.setAttribute('d',d);if(j===0)for(let pass=0;pass<3;pass++)if(!avoidText(path,obstacleMap.get(segment),w,h))break;const length=samplePath(path.getAttribute('d')||'',6).length;path.style.strokeDasharray=String(length);path.dataset.length=String(length);path.style.opacity=j===0?'1':'0';if(index===0&&j===0)taperCord(path,tip.inkWidth,horizontal?2.8:2);
  });
 });}
 function drawJourney(){journeySegments.forEach(({section,paths})=>{const rect=section.getBoundingClientRect();const progress=reduced.matches||section.id==='therapie'?1:horizontal?clamp((innerWidth-rect.left)/(rect.width)):clamp((innerHeight-rect.top)/rect.height);paths.forEach(path=>path.style.strokeDashoffset=String((1-progress)*Number(path.dataset.length)));});}
 function measure(){horizontal=desktop.matches&&!reduced.matches;document.body.classList.toggle('horizontal-story',horizontal);panels=Array.from(main.children).filter(e=>e.tagName==='SECTION');
  if(horizontal){distance=Math.max(0,main.scrollWidth-innerWidth);track.style.height=distance+innerHeight+'px';target=clamp(scrollY,0,distance);current=target;}
  else{track.style.height='';main.style.transform='';current=target=0;}
  if(horizontal){
   const composition=document.querySelector('.hero-composition');
   const upper=document.querySelector('.hero-top');
   const lower=document.querySelector('.intro');
   const imageScale=Math.min(portraitImage.clientWidth/(portraitImage.naturalWidth||1024),portraitImage.clientHeight/(portraitImage.naturalHeight||1536));
   const imageBottom=portrait.offsetTop+imageScale*(portraitImage.naturalHeight||1536);
   lower.style.top=`${imageBottom-(lower.querySelector('.cta-introduction')?.offsetHeight||0)}px`;

   const upperBottom=upper.getBoundingClientRect().bottom-composition.getBoundingClientRect().top;
   heroTitle.style.top=`${(upperBottom+lower.offsetTop-heroTitle.offsetHeight)/2}px`;
  }else{heroTitle.style.top='';document.querySelector('.intro').style.top='';}
  const brand=document.querySelector('.brand'),wordmark=brand.querySelector('.brand-wordmark'),menu=document.querySelector('.menu-toggle');
  menu.style.height=brand.getBoundingClientRect().height+'px';
  menu.style.setProperty('--menu-label-inset',Math.max(0,(brand.getBoundingClientRect().height-wordmark.getBoundingClientRect().height)/2)+'px');

  const realPhoto=portrait.querySelector('.portrait-photo');
  const photoWidth=realPhoto.naturalWidth||1200,photoHeight=realPhoto.naturalHeight||1800;
  const photoScale=Math.min(realPhoto.clientWidth/photoWidth,realPhoto.clientHeight/photoHeight);
  portrait.style.setProperty('--portrait-photo-width',photoWidth*photoScale+'px');
  portrait.style.setProperty('--portrait-photo-height',photoHeight*photoScale+'px');
  layoutJourney();render();
 }
 function render(){
  drawJourney();

  if(horizontal){main.style.transform=`translate3d(${-current}px,0,0)`;document.documentElement.style.setProperty('--chapter-progress',distance?current/distance:0);}
  else{document.documentElement.style.setProperty('--chapter-progress',scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));}
  const heroAmount=horizontal?clamp(current/innerWidth):clamp(scrollY/innerHeight);
  if(!reduced.matches){heroTitle.style.translate=horizontal?`${-heroAmount*innerWidth*.12}px 0`:`0 ${heroAmount*65}px`;
   const opening=document.querySelector('.opening');const rect=opening.getBoundingClientRect();
   const progress=horizontal?clamp((innerWidth-rect.left)/(rect.width+innerWidth)):clamp((innerHeight-rect.top)/(rect.height+innerHeight));
   lines.forEach((line,i)=>{const phase=clamp((progress-i*.065)/.32);line.style.opacity=String(phase);line.style.translate=`${(1-phase)*(horizontal?(i%2?-90:130):(i%2?-18:22))}px 0`;});
   artPaths.forEach(path=>{path.style.strokeDashoffset=(1-clamp((progress-.1)/.65))*Number(path.dataset.length)});
  }
 }
 function frame(time){const dt=last?Math.min(time-last,64):16;last=time;const diff=target-current;current+=diff*(1-Math.exp(-dt/100));if(Math.abs(diff)<.15)current=target;render();if(Math.abs(target-current)>.1)raf=requestAnimationFrame(frame);else{raf=0;last=0}}
 function onScroll(){if(horizontal){target=clamp(scrollY,0,distance);if(!raf)raf=requestAnimationFrame(frame)}else render()}
 addEventListener('scroll',onScroll,{passive:true});
 function goToSection(section,behavior='smooth'){if(horizontal){const x=clamp(section.offsetLeft,0,distance);window.scrollTo({top:x,behavior});}else section.scrollIntoView({behavior,block:'start'})}
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{const id=a.getAttribute('href').slice(1);const section=document.getElementById(id);if(!section)return;event.preventDefault();goToSection(section,reduced.matches?'instant':'smooth');history.replaceState(null,'','#'+id);if(a.classList.contains('skip')){section.tabIndex=-1;section.focus({preventScroll:true})}}));
 // Keyboard focus follows the same chapter coordinates as mouse/touch scrolling.
 main.addEventListener('focusin',event=>{if(!horizontal)return;const section=event.target.closest('section');if(!section)return;const box=event.target.getBoundingClientRect();if(box.left<0||box.right>innerWidth){const x=clamp(section.offsetLeft+Math.max(0,event.target.offsetLeft-innerWidth*.2),0,distance);window.scrollTo({top:x,behavior:'instant'});current=target=x;render()}});
 window.__measure=()=>measure();let measureFrame=0;const measureSoon=()=>{if(measureFrame)return;measureFrame=requestAnimationFrame(()=>{measureFrame=0;measure();});};
 const resizeObserver=new ResizeObserver(measureSoon);resizeObserver.observe(document.documentElement);desktop.addEventListener('change',measure);reduced.addEventListener('change',()=>location.reload());
 document.querySelector('.opening-illustration img').addEventListener('load',measure);document.fonts.ready.then(measure);addEventListener('resize',measureSoon);let settleTimer=0;addEventListener('resize',()=>{clearTimeout(settleTimer);settleTimer=setTimeout(measure,400)});document.addEventListener('toggle',()=>{clearTimeout(settleTimer);settleTimer=setTimeout(measure,80)},true);addEventListener('load',()=>{measure();const id=location.hash.slice(1);if(id){const section=document.getElementById(id);if(section)goToSection(section,'instant')}});
 // Start erst, wenn die Startseite fertig ausgerichtet ist (Bild geladen, Layout gemessen) – der Vorhang deckt bis dahin alles ab.
 const begin=()=>{
  startObserving();
  // Hauptüberschrift sofort mit dem Vorhang starten, nicht erst auf die Sichtbarkeitsmeldung warten.
  if(!reduced.matches&&heroTitle.classList.contains('split-heading'))animateHeading(heroTitle);
  if(reduced.matches){curtain.remove();reveals.forEach(e=>e.classList.add('visible'));lines.forEach(e=>{e.style.opacity=1;e.style.translate='none'});artPaths.forEach(e=>e.style.strokeDashoffset=0);}
  else{document.body.classList.add('motion-ready');curtain.animate([{transform:'translateY(0)'},{transform:'translateY(-100%)'}],{duration:600,easing:'cubic-bezier(.87,0,.13,1)',fill:'forwards'}).finished.then(()=>curtain.remove());setTimeout(()=>curtain.remove(),1500);portraitImage.animate([{opacity:0},{opacity:1}],{duration:MOTION_DUR,delay:300,easing:MOTION_EASE,fill:'both'});}
 };
 measure();
 const assetsReady=Promise.race([window.__heroAssets||Promise.resolve(),new Promise(r=>setTimeout(r,300))]);
 // Nächstes Bild abwarten; Ersatz-Timer, falls requestAnimationFrame (z. B. im Hintergrund) ruht.
 const nextFrame=()=>new Promise(r=>{requestAnimationFrame(()=>r());setTimeout(r,120);});
 let begun=false;
 assetsReady.then(()=>{measure();if(window.__alignHero)window.__alignHero();return nextFrame();}).then(()=>{if(begun)return;begun=true;if(window.__alignHero)window.__alignHero();begin();});
 setTimeout(()=>{if(!begun){begun=true;begin();}},700);
})();
