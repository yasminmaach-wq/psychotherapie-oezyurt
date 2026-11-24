/* Lebendige Schnur:
   1. Die Knoten lösen sich beim Scrollen: Je weiter ein Knoten durch das Bild wandert,
      desto mehr zieht sich die Schnur glatt (sie bleibt aber eine lockere Schlinge).
   3. Knoten zum Anfassen: Mit Maus oder Finger lässt sich ein Knoten ziehen; er entwirrt sich dabei dauerhaft ein Stück.
   2. Die Schnur gibt nach: Am Desktop weicht sie dem Mauszeiger wie ein Faden aus,
      auf dem Handy schwingt sie beim Scrollen leicht nach.
   motion.js zeichnet die Grundform; dieses Skript verformt sie nur vorübergehend.
   Bei „Bewegung reduzieren“ bleibt alles still. */
(()=>{
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const smoothstep=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
 const segs=[...document.querySelectorAll('main>section>svg.journey-line')].map(svg=>({svg,path:svg.querySelector('path'),dirty:true}));
 if(!segs.length)return;
 const mouse={x:-1e4,y:-1e4,active:false};
 const drag={active:false,seg:null,g:0,sx:0,sy:0,x:0,y:0,lx:0,ly:0};
 let raf=0,lastScroll=scrollY,scrollVel=0,activeUntil=0;

 function parsePoints(path){
  const d=path.getAttribute('d')||'';
  if(/^M[\d\s.,L-]+$/i.test(d.replace(/Z$/,''))){
   const n=d.match(/-?\d*\.?\d+(?:e-?\d+)?/g).map(Number),pts=[];
   for(let i=0;i+1<n.length;i+=2)pts.push([n[i],n[i+1]]);
   return pts;
  }
  if(window.__samplePath)return window.__samplePath(d,4).pts;
  const L=path.getTotalLength(),pts=[];
  for(let s=0;s<=L;s+=4){const p=path.getPointAtLength(s);pts.push([p.x,p.y]);}
  return pts;
 }
 function capture(seg){
  const p=seg.path;if(!p||!p.getAttribute('d'))return;
  let pts=parsePoints(p),half=null;
  seg.ribbon=p.classList.contains('cord-ribbon');
  if(seg.ribbon){
   // Umriss = linke Kante + rechte Kante rückwärts → Mittellinie und Breite zurückgewinnen.
   const n=Math.floor(pts.length/2),mid=[];half=[];
   for(let i=0;i<n;i++){const a=pts[i],b=pts[pts.length-1-i];mid.push([(a[0]+b[0])/2,(a[1]+b[1])/2]);half.push(Math.hypot(a[0]-b[0],a[1]-b[1])/2);}
   pts=mid;
  }
  // Auf etwa 5 px Abstand ausdünnen.
  const thin=[pts[0]],thinHalf=half?[half[0]]:null;let acc=0;
  for(let i=1;i<pts.length;i++){acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(acc>=5||i===pts.length-1){thin.push(pts[i]);if(thinHalf)thinHalf.push(half[i]);acc=0;}}
  const n=thin.length,W=Math.max(6,Math.round(150/5));
  // Enden bleiben fest, damit die Schnur an den Kapitelgrenzen verbunden bleibt.
  let run=0;const pin=new Float32Array(n),dist=[0];
  for(let i=1;i<n;i++){run+=Math.hypot(thin[i][0]-thin[i-1][0],thin[i][1]-thin[i-1][1]);dist.push(run);}
  for(let i=0;i<n;i++)pin[i]=smoothstep(0,60,dist[i])*smoothstep(0,60,run-dist[i]);
  // Nur echte Knoten lösen sich: dort ist der Weg entlang der Schnur viel länger als die Luftlinie.
  const tangle=new Float32Array(n);
  for(let i=0;i<n;i++){const a=Math.max(0,i-W),b=Math.min(n-1,i+W),arc=dist[b]-dist[a],chord=Math.hypot(thin[b][0]-thin[a][0],thin[b][1]-thin[a][1])||1;tangle[i]=smoothstep(1.6,3.2,arc/chord);}
  // Jeder Knoten wird zu einem Abschnitt: Beim Entwirren ziehen sich seine Schlaufen
  // zur geraden Verbindung zwischen Anfang und Ende auf – wie eine Schnur, an der man zieht.
  // Manche Knoten lösen sich dabei ganz, andere nur zum Teil (reach).
  const target=thin.map(p=>[p[0],p[1]]),weight=new Float32Array(n),reach=new Float32Array(n);
  const targets=[1,.5,1,.6],segIndex=segs.indexOf(seg),E=15;let knot=0;
  for(let i=0;i<n;){
   if(tangle[i]<=.35){i++;continue;}
   let j=i;while(j<n-1&&tangle[j+1]>.35)j++;
   const a=Math.max(0,i-E),b=Math.min(n-1,j+E),span=(dist[b]-dist[a])||1,r=targets[(knot+segIndex)%targets.length];
   for(let k=a;k<=b;k++){const t=(dist[k]-dist[a])/span;target[k]=[thin[a][0]+(thin[b][0]-thin[a][0])*t,thin[a][1]+(thin[b][1]-thin[a][1])*t];
    const w=smoothstep(0,E,k-a)*smoothstep(0,E,b-k);if(w>weight[k]){weight[k]=w;reach[k]=r;}}
   knot++;i=j+1;
  }
  Object.assign(seg,{base:thin,smooth:target,half:thinHalf,pin,tangle:weight,reach,dist,extra:new Float32Array(n),screen:null,ox:new Float32Array(n),oy:new Float32Array(n),vx:new Float32Array(n),vy:new Float32Array(n),dirty:false});
 }
 const observer=new MutationObserver(records=>{records.forEach(r=>{const seg=segs.find(s=>s.path===r.target);if(seg)seg.dirty=true});kick(600)});
 segs.forEach(seg=>seg.path&&observer.observe(seg.path,{attributes:true,attributeFilter:['data-length']}));

 function frame(now){
  raf=0;
  const horizontal=document.body.classList.contains('horizontal-story');
  const dy=scrollY-lastScroll;lastScroll=scrollY;
  scrollVel=scrollVel*.8+dy*.2;
  let moving=false;
  for(const seg of segs){
   if(seg.dirty)capture(seg);
   if(!seg.base)continue;
   const box=seg.svg.getBoundingClientRect();
   const visible=horizontal?box.right>-200&&box.left<innerWidth+200:box.bottom>-200&&box.top<innerHeight+200;
   if(!visible)continue;
   const m=seg.svg.getScreenCTM();if(!m)continue;
   const {base,smooth,pin,tangle,reach,dist,extra,ox,oy,vx,vy}=seg,n=base.length,pts=new Array(n),screen=new Array(n),looseArr=new Float32Array(n);
   const dragging=drag.active&&drag.seg===seg;
   let gdx=0,gdy=0;
   if(dragging){gdx=drag.x-drag.sx;gdy=drag.y-drag.sy;const g=Math.hypot(gdx,gdy),cap=150;if(g>cap){gdx*=cap/g;gdy*=cap/g;}}
   const wobble=!horizontal?Math.max(-9,Math.min(9,scrollVel*.5)):0;
   for(let i=0;i<n;i++){
    const bx=base[i][0],by=base[i][1];
    // Bildschirmlage dieses Punktes entscheidet, wie weit sich der Knoten schon gelöst hat.
    const sx=m.a*bx+m.c*by+m.e,sy=m.b*bx+m.d*by+m.f;
    const u=horizontal?sx/innerWidth:sy/innerHeight;
    // Gezogene Knoten bleiben dauerhaft ein Stück entwirrt (extra).
    // Langsam über den ganzen Bildschirm hinweg; ganz links ist das Ziel des Knotens erreicht.
    const loose=looseArr[i]=Math.min(1,(1-smoothstep(.05,1.05,u))*reach[i]+extra[i]*1.1)*pin[i]*tangle[i];
    let x=bx+(smooth[i][0]-bx)*loose,y=by+(smooth[i][1]-by)*loose;
    // Federnde Auslenkung: Maus (Desktop) bzw. Nachschwingen beim Scrollen (Handy).
    let tx=0,ty=0;
    if(mouse.active){
     const px=m.a*x+m.c*y+m.e,py=m.b*x+m.d*y+m.f,ddx=px-mouse.x,ddy=py-mouse.y,dd=Math.hypot(ddx,ddy),R=120;
     if(dd<R&&dd>.01){const f=(1-dd/R)**2*28*pin[i];tx=ddx/dd*f;ty=ddy/dd*f;}
    }
    if(wobble)tx+=wobble*Math.sin(sy/95)*pin[i];
    if(dragging){const w=Math.exp(-(((dist[i]-dist[drag.g])/110)**2))*pin[i];tx+=gdx*w;ty+=gdy*w;}
    vx[i]=(vx[i]+(tx-ox[i])*.14)*.8;vy[i]=(vy[i]+(ty-oy[i])*.14)*.8;
    ox[i]+=vx[i];oy[i]+=vy[i];
    if(Math.abs(vx[i])+Math.abs(vy[i])>.02)moving=true;
    pts[i]=[x+ox[i],y+oy[i]];screen[i]=[m.a*pts[i][0]+m.c*pts[i][1]+m.e,m.b*pts[i][0]+m.d*pts[i][1]+m.f];
   }
   // Beim Entwirren die letzten kleinen Zacken glätten, damit eine ruhige Linie entsteht.
   for(let pass=0;pass<2;pass++){const prev=pts.map(p=>p.slice());for(let i=2;i<n-2;i++){const k=looseArr[i];if(k<.05)continue;const ax=(prev[i-2][0]+prev[i-1][0]+prev[i][0]+prev[i+1][0]+prev[i+2][0])/5,ay=(prev[i-2][1]+prev[i-1][1]+prev[i][1]+prev[i+1][1]+prev[i+2][1])/5;pts[i]=[prev[i][0]+(ax-prev[i][0])*k,prev[i][1]+(ay-prev[i][1])*k];}}
   let d;
   if(seg.ribbon){
    // Band neu aufbauen: gleiche Breiten, Normale aus der verformten Mittellinie.
    const left=[],right=[];
    for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],dx=b[0]-a[0],dy2=b[1]-a[1],len=Math.hypot(dx,dy2)||1,h=seg.half[i];
     left.push((pts[i][0]-dy2/len*h).toFixed(1)+' '+(pts[i][1]+dx/len*h).toFixed(1));right.push((pts[i][0]+dy2/len*h).toFixed(1)+' '+(pts[i][1]-dx/len*h).toFixed(1));}
    d='M'+left.join('L')+'L'+right.reverse().join('L')+'Z';
   }else d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
   seg.path.setAttribute('d',d);seg.screen=screen;
  }
  if(drag.active)moving=true;
  if(moving||now<activeUntil)raf=requestAnimationFrame(frame);
 }
 function kick(ms=900){activeUntil=Math.max(activeUntil,performance.now()+ms);if(!raf)raf=requestAnimationFrame(frame);}
 addEventListener('scroll',()=>kick(1200),{passive:true});
 // Beim Größe-Ändern keine Schnur-Physik pro Bild – erst wenn das Ziehen vorbei ist, einmal neu aufbauen.
 addEventListener('resize',()=>{segs.forEach(s=>s.dirty=true);clearTimeout(kick.t);kick.t=setTimeout(()=>kick(500),320)});
 if(fine.matches){
  addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true;kick(500)},{passive:true});
  document.addEventListener('pointerleave',()=>{mouse.active=false;kick(800)});
 }
 // Ein Knoten zum Anfassen: greifen, ziehen – er entwirrt sich dabei ein Stück.
 function knotAt(x,y,radius){
  let best=null,bd=radius;
  for(const seg of segs){if(!seg.screen||!seg.tangle)continue;
   for(let i=0;i<seg.screen.length;i+=2){if(seg.tangle[i]<.45||seg.pin[i]<.5)continue;const p=seg.screen[i],d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best={seg,g:i};}}}
  return best;
 }
 const interactive=t=>t&&t.closest&&t.closest('a,button,summary,input,textarea,label,select,dialog,.menu-toggle');
 function startDrag(hit,x,y){Object.assign(drag,{active:true,seg:hit.seg,g:hit.g,sx:x,sy:y,x,y,lx:x,ly:y});document.documentElement.classList.add('cord-dragging');kick(400);}
 function moveDrag(x,y){if(!drag.active)return;const mv=Math.hypot(x-drag.lx,y-drag.ly);drag.x=x;drag.y=y;drag.lx=x;drag.ly=y;
  const seg=drag.seg;for(let i=0;i<seg.extra.length;i++){const w=Math.exp(-(((seg.dist[i]-seg.dist[drag.g])/170)**2));if(w>.02)seg.extra[i]=Math.min(1,seg.extra[i]+mv*.009*w);}kick(400);}
 function endDrag(){if(!drag.active)return;drag.active=false;document.documentElement.classList.remove('cord-dragging','cord-grab');kick(1200);}
 addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0||interactive(e.target))return;const hit=knotAt(e.clientX,e.clientY,22);if(!hit)return;e.preventDefault();startDrag(hit,e.clientX,e.clientY);});
 addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;if(drag.active){moveDrag(e.clientX,e.clientY);return;}
  document.documentElement.classList.toggle('cord-grab',!interactive(e.target)&&!!knotAt(e.clientX,e.clientY,22));},{passive:true});
 addEventListener('pointerup',endDrag);addEventListener('pointercancel',endDrag);addEventListener('blur',endDrag);
 addEventListener('touchstart',e=>{if(e.touches.length!==1||interactive(e.target))return;const t=e.touches[0],hit=knotAt(t.clientX,t.clientY,30);if(!hit)return;e.preventDefault();startDrag(hit,t.clientX,t.clientY);},{passive:false});
 addEventListener('touchmove',e=>{if(!drag.active)return;e.preventDefault();const t=e.touches[0];moveDrag(t.clientX,t.clientY);},{passive:false});
 addEventListener('touchend',endDrag);addEventListener('touchcancel',endDrag);
 addEventListener('load',()=>kick(1500));
 kick(1500);
})();
