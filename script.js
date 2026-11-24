const topics=[['Selbstbild & Selbstwert','Selbstzweifel, Scham, Selbstkritik, Identitätsfragen sowie eigene Bedürfnisse und Grenzen.'],['Bindungs- & Beziehungsthemen','Nähe und Distanz, Verlustangst, wiederkehrende Beziehungsmuster, Trennungen und belastende Beziehungserfahrungen.'],['Persönlichkeitsstörungen','Schwerpunkt auf der Borderline-Persönlichkeitsstörung und emotional instabilen Mustern.'],['Ängste',''],['Lebenskrisen und Neuorientierung',''],['Psychosen & psychotische Erfahrungen',''],['Gewalterfahrungen & Gewaltbewältigung',''],['Und alles, was keinen Namen hat.','Raum für alles, was gerade da ist und Begleitung sucht. Auch das kann ein Anlass für Psychotherapie sein.']];
const list=document.querySelector('#focus-list');topics.forEach(([title,body],i)=>{const row=document.createElement(body?'details':'div');row.className='reveal';row.innerHTML=body?`<summary><div class="topic-head"><b class="number">0${i+1}</b><span class="topic-title">${title}</span></div><span>+</span></summary><p>${body}</p>`:`<div class="plain-topic topic-head"><b class="number">0${i+1}</b><span class="topic-title">${title}</span></div>`;list.append(row)});
const style=document.createElement('style');style.textContent='.plain-topic{border-top:1px solid;padding:20px 0;font:normal clamp(22px,2.4vw,34px)/1.25 Georgia}.plain-topic .number{font:10px Arial;margin-right:20px;opacity:.6}';document.head.append(style);
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('nav');let menuCloseTimer;function setMenu(open){clearTimeout(menuCloseTimer);menu.setAttribute('aria-expanded',open);document.body.classList.toggle('menu-open',open);menu.innerHTML=open?'<span class="menu-close" aria-hidden="true">×</span>':'<span class="menu-bars" aria-hidden="true"><i></i><i></i><i></i></span>';menu.setAttribute('aria-label',open?'Menü schließen':'Menü');if(open){nav.classList.remove('is-closing');nav.hidden=false}else{nav.classList.add('is-closing');menuCloseTimer=setTimeout(()=>{nav.hidden=true;nav.classList.remove('is-closing')},matchMedia('(prefers-reduced-motion: reduce)').matches?0:650)}}menu.addEventListener('click',()=>setMenu(nav.hidden));nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
const legal=document.querySelector('#legal');const legalCopy={imprint:'<h2>Impressum</h2><p>Melissa Özyurt<br>Psychotherapeutin in Fachausbildung unter Lehrsupervision<br>Humanistische Therapie – Personzentrierte Psychotherapie</p><p>Hippgasse 26/5, 1160 Wien<br>+43 664 5345172<br>info@psychotherapie-özyurt.at</p><p><em>Entwurfsstand: Die vollständigen berufsrechtlichen Angaben und der rechtliche Pflichttext sind vor einer öffentlichen Freigabe zu ergänzen.</em></p>',privacy:'<h2>Datenschutz</h2><p>Kontakt: Melissa Özyurt, Hippgasse 26/5, 1160 Wien, info@psychotherapie-özyurt.at</p><p>Diese Website enthält kein Kontaktformular und setzt selbst keine Analyse- oder Marketing-Cookies ein. E-Mail- und Telefonlinks öffnen die entsprechende Anwendung. Der Kartenlink führt erst nach einem Klick zu Google Maps.</p><p><em>Entwurfsstand: Eine vollständige, auf den tatsächlichen Hostingbetrieb und die Kontaktverarbeitung abgestimmte Datenschutzerklärung ist vor der öffentlichen Freigabe zu ergänzen.</em></p>'};document.querySelectorAll('[data-dialog]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#legal-content').innerHTML=legalCopy[b.dataset.dialog];legal.showModal()}));document.querySelector('.close-dialog').addEventListener('click',()=>legal.close());legal.addEventListener('click',e=>{if(e.target===legal)legal.close()});

// The cursor's difference blend keeps the brand knot visible across backgrounds.
(()=>{
 if(!CSS.supports('mix-blend-mode','difference'))return;
 const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
 const root=document.documentElement,source=document.querySelector('.brand svg');
 const cursor=source.cloneNode(true);cursor.classList.add('brand-contrast-cursor');cursor.setAttribute('aria-hidden','true');cursor.setAttribute('focusable','false');document.body.append(cursor);
 let x=0,y=0,frame=0;
 const hide=()=>{root.classList.remove('brand-cursor-active');if(frame){cancelAnimationFrame(frame);frame=0}};
 function syncLayer(){const modal=document.querySelector('dialog[open]');const parent=modal||document.body;if(cursor.parentNode!==parent)parent.append(cursor)}
 function paint(){frame=0;cursor.style.transform=`translate3d(${x-16}px,${y-16}px,0)`;root.classList.add('brand-cursor-active')}
 document.addEventListener('pointermove',event=>{if(!finePointer.matches||event.pointerType!=='mouse'){hide();return}x=event.clientX;y=event.clientY;syncLayer();if(!frame)frame=requestAnimationFrame(paint)},{passive:true});
 document.documentElement.addEventListener('pointerleave',hide);document.addEventListener('pointercancel',hide);document.addEventListener('keydown',event=>{if(event.key==='Tab')hide()});window.addEventListener('blur',hide);document.addEventListener('visibilitychange',()=>{if(document.hidden)hide()});
 finePointer.addEventListener('change',()=>{if(!finePointer.matches)hide()});
 new MutationObserver(syncLayer).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
})();

// Ruhige Bestätigung nach Klick auf einen E-Mail-Link (Kontaktaufnahme).
(function(){
 let box,timer;
 function hide(){if(!box)return;box.classList.remove('show');clearTimeout(timer)}
 function show(){
  if(!box){
   box=document.createElement('div');box.className='contact-note';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
   box.innerHTML='<span class="contact-note-mark" aria-hidden="true"></span><div><strong>Danke für Ihre Nachricht.</strong><p>Ihr E-Mail-Programm öffnet sich gleich. Ich melde mich so bald wie möglich bei Ihnen.</p></div><button type="button" aria-label="Hinweis schließen">×</button>';
   box.querySelector('button').addEventListener('click',hide);
   document.body.appendChild(box);
  }
  void box.offsetWidth;box.classList.add('show');
  clearTimeout(timer);timer=setTimeout(hide,9000);
 }
 document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="mailto:"]');if(a)setTimeout(show,350)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
})();

// Copyright-Jahr aktuell halten.
document.querySelectorAll('[data-year]').forEach(e=>{e.textContent=new Date().getFullYear()});
