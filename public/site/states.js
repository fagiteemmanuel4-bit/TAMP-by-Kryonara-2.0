// Shared states: network banner, loading skeletons, error screens, retry/timeout handling, network simulator.
(function(){
const ADMIN=/\/admin\//.test(location.pathname),g=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},sleep=ms=>new Promise(r=>setTimeout(r,ms)),esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const path=location.pathname.split('/').pop();
// 1. unsupported browser and maintenance (student site only)
if(!ADMIN){let ok=!!(window.Promise&&window.fetch&&window.URLSearchParams);try{ok=ok&&!!window.localStorage}catch(e){}
if(!ok&&!/unsupported-browser/.test(path)){location.replace('unsupported-browser.html');return}
if(g('tamp_settings',{}).maintenance==='on'&&!/maintenance|offline|unsupported/.test(path)){location.replace('maintenance.html');return}}
class NetErr extends Error{constructor(kind,status){super(kind);this.kind=kind;this.status=status||0}}
const sim=()=>{const q=new URLSearchParams(location.search).get('sim');return q||(()=>{try{return localStorage.getItem('tamp_sim')||'normal'}catch(e){return'normal'}})()};
const TO=()=>+(()=>{try{return localStorage.getItem('tamp_sim_to')}catch(e){return 0}})()||10000;
const HOME={href:ADMIN?'#/overview':'index.html',label:ADMIN?'Back to overview':'Go to home'};
// 2. icons and presets
const IC={wifi:'<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M3 3l18 18"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',server:'<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'};
const icon=n=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>';
const E={offline:()=>({icon:'wifi',title:"You're offline",text:'Check your internet connection. Your progress is saved on this device. This page reloads when you reconnect.',code:'OFFLINE',retry:1}),
timeout:()=>({icon:'clock',title:'This is taking too long',text:'The connection is slow or the server is busy. Please try again.',code:'408',retry:1}),
server:()=>({icon:'server',title:"We couldn't load this",text:'Something went wrong on our side. Your data is safe. Please try again in a moment.',code:'500',retry:1}),
notfound:()=>({icon:'search',title:'Page not found',text:"We couldn't find what you were looking for. It may have moved or the link may be wrong.",code:'404'}),
forbidden:()=>({icon:'lock',title:"You don't have access",text:'Your account cannot open this page. If you think this is a mistake, contact support.',code:'403'}),
ratelimit:e=>({icon:'clock',title:'Too many requests',text:'Please wait '+((e&&e.retryAfter)||30)+' seconds, then try again.',code:'429',retry:1}),
unauthorized:()=>({icon:'lock',title:'Please log in again',text:'Your session has ended for your security.',code:'401',act:ADMIN?null:{label:'Log in',href:'login.html'}}),
generic:()=>({icon:'alert',title:'Something went wrong',text:'Please try again. If it keeps happening, contact support.',code:'ERROR',retry:1})};
const describe=e=>(E[e&&e.kind]||E.generic)(e);
function stateHTML(c,home){const h=home||UI.home,act=c.act||(c.noHome?null:h);return '<div class="state" role="alert"><div class="sico">'+icon(c.icon)+'</div><h2 tabindex="-1" id="stt">'+esc(c.title)+'</h2><p class="mute">'+esc(c.text)+'</p><p class="code">'+esc(c.code||'')+'</p><p>'+(c.retry?'<button class="btn" id="retry">Try again</button> ':'')+(act?'<a class="btn g" href="'+esc(act.href)+'">'+esc(act.label)+'</a>':'')+'</p>'+(sim()!=='normal'?'<p class="note">Demo: the network is set to "'+esc(sim())+'". <button class="btn g s" id="simreset">Set to normal</button></p>':'')+'</div>'}
// 3. skeletons, spinner, overlay, progress, toasts, busy buttons
const sk=(c,s)=>'<div class="sk '+c+'" '+(s?'style="'+s+'"':'')+'></div>';
const skeleton=k=>'<div aria-busy="true" aria-label="Loading">'+(k==='table'?sk('t')+[1,2,3,4,5].map(()=>sk('l','height:38px')).join(''):sk('t')+[1,2,3].map(()=>'<div class="card">'+sk('l','width:40%')+sk('l')+sk('l','width:80%')+'</div>').join(''))+'<span class="sr">Loading</span></div>';
function overlay(msg){let o=document.getElementById('ov');if(!msg){if(o)o.remove();return}if(!o){o=document.createElement('div');o.id='ov';o.setAttribute('role','status');document.body.append(o)}o.innerHTML='<div class="card"><span class="spin"></span> '+esc(msg)+'</div>'}
let pgb;function progress(on){if(!pgb){pgb=document.createElement('div');pgb.className='pbar';document.body.append(pgb)}pgb.style.opacity=on?1:0;pgb.style.width=on?'70%':'100%';if(!on)setTimeout(()=>{pgb.style.width='0'},300)}
function toast(type,msg){let c=document.getElementById('tt');if(!c){c=document.createElement('div');c.id='tt';c.setAttribute('aria-live','polite');document.body.append(c)}const t=document.createElement('div');t.className='tt '+type;t.textContent=msg;c.append(t);setTimeout(()=>t.remove(),4200)}
function busy(b,on,label){if(!b)return;b.disabled=!!on;b.classList.toggle('is-loading',!!on);if(label){b.dataset.t=b.dataset.t||b.textContent;b.textContent=on?label:b.dataset.t}}
// 4. network simulator and request wrapper
const active=()=>sim()!=='normal';
function gate(){const m=sim();if(m==='offline')return Promise.reject(new NetErr('offline'));if(m==='error')return sleep(400).then(()=>{throw new NetErr('server',500)});if(m==='timeout')return sleep(TO()).then(()=>{throw new NetErr('timeout',408)});if(m==='slow')return sleep(1500);if(m==='flaky')return Math.random()<.5?sleep(300).then(()=>{throw new NetErr('server',503)}):sleep(300);return Promise.resolve()}
function unauthorized(){if(ADMIN){try{sessionStorage.removeItem('ta_me')}catch(e){}location.hash='';location.reload()}else{try{localStorage.removeItem('tamp_session')}catch(e){}location.href='session-expired.html'}}
async function request(url,opts,o){opts=opts||{};o=o||{};const retries=o.retries==null?2:o.retries,timeout=o.timeout||10000;let att=0;
for(;;){try{await gate();if(!navigator.onLine)throw new NetErr('offline');const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),timeout);let r;
try{r=await fetch(url,Object.assign({},opts,{signal:ac.signal,credentials:'include'}))}catch(e){throw new NetErr(e.name==='AbortError'?'timeout':navigator.onLine?'server':'offline',e.name==='AbortError'?408:0)}finally{clearTimeout(tm)}
if(r.ok){const ct=r.headers.get('content-type')||'';return ct.includes('json')?r.json():r.text()}
if(r.status===401){unauthorized();throw new NetErr('unauthorized',401)}if(r.status===403)throw new NetErr('forbidden',403);if(r.status===404)throw new NetErr('notfound',404);
if(r.status===429){const ra=+r.headers.get('retry-after')||5;if(att<retries){att++;await sleep(ra*1000);continue}const e=new NetErr('ratelimit',429);e.retryAfter=ra;throw e}
if(r.status>=500&&att<retries){att++;await sleep(500*Math.pow(2,att));continue}throw new NetErr(r.status>=500?'server':'generic',r.status)}
catch(e){if(e.kind==='timeout'&&att<retries){att++;await sleep(500*Math.pow(2,att));continue}throw e}}}
// 5. connection banner
let bar,bannerMsg='';
function banner(kind,msg,retry){if(!bar){bar=document.createElement('div');bar.className='netbar';bar.setAttribute('role','status');bar.hidden=true;document.body.prepend(bar)}if(!kind){bar.hidden=true;return}bar.className='netbar '+kind;bar.innerHTML='<span>'+esc(msg)+'</span>'+(retry?'<button class="btn s" id="netretry">Try again</button>':'')+(kind==='slow'?'<button class="btn g s" id="netx" aria-label="Dismiss">Dismiss</button>':'');bar.hidden=false}
function refresh(){const off=!navigator.onLine||sim()==='offline';if(off){banner('off','You are offline. Some things will not work until you reconnect.',1)}else{const c=navigator.connection;if(c&&(c.saveData||/2g/.test(c.effectiveType||''))&&!sessionStorage.getItem('slowx'))banner('slow','Slow connection detected. Videos may be slow. Reading still works.');else banner(null)}}
let wasOff=false;function onNet(){const off=!navigator.onLine||sim()==='offline';if(wasOff&&!off){toast('ok','You are back online');if(document.getElementById('retry'))document.getElementById('retry').click()}wasOff=off;refresh()}
addEventListener('online',onNet);addEventListener('offline',onNet);if(navigator.connection&&navigator.connection.addEventListener)navigator.connection.addEventListener('change',refresh);
document.addEventListener('click',async e=>{const id=e.target&&e.target.id;if(id==='simreset'){try{localStorage.setItem('tamp_sim','normal')}catch(x){}location.reload()}
if(id==='netretry'){try{await fetch(location.href.split('#')[0],{method:'HEAD',cache:'no-store'});if(navigator.onLine){wasOff=true;onNet()}else toast('warn','Still offline')}catch(x){toast('warn','Still offline')}}
if(id==='netx'){try{sessionStorage.setItem('slowx','1')}catch(x){}banner(null)}});
// 6. storage blocked, global errors
try{localStorage.setItem('_t','1');localStorage.removeItem('_t')}catch(e){setTimeout(()=>banner('slow','Your browser is blocking storage, so you cannot stay logged in. Turn off private mode or allow storage.'),0)}
let shown=0;function fatal(err){if(shown++)return;const id='E-'+Math.random().toString(36).slice(2,8).toUpperCase();try{const L=g('tamp_errors',[]);L.push({id,msg:String(err&&err.message||err).slice(0,200),at:new Date().toISOString(),page:location.pathname});localStorage.setItem('tamp_errors',JSON.stringify(L.slice(-20)))}catch(e){}
const o=document.createElement('div');o.id='ov';o.innerHTML='<div class="card state" role="alertdialog" aria-labelledby="fh"><div class="sico">'+icon('alert')+'</div><h2 id="fh">Something went wrong</h2><p class="mute">The page hit a problem. Your progress is saved. Reload to continue. If it keeps happening, tell support this code.</p><p class="code">'+id+'</p><p><button class="btn" id="fr">Reload</button> <a class="btn g" href="'+esc(UI.home.href)+'">'+esc(UI.home.label)+'</a></p></div>';document.body.append(o);document.getElementById('fr').onclick=()=>location.reload()}
addEventListener('error',e=>{if(!e.error||/ResizeObserver/.test(e.message||''))return;fatal(e.error)});
addEventListener('unhandledrejection',e=>{const r=e.reason;if(r instanceof NetErr){toast('err',describe(r).title+'. '+describe(r).text);return}if(r&&r.name==='AbortError')return;fatal(r)});
const UI={home:HOME,E,icon,stateHTML,skeleton,overlay,progress,toast,busy,describe,page404:h=>stateHTML(E.notfound(),h)};
const Net={NetErr,sim,setSim:v=>{try{localStorage.setItem('tamp_sim',v)}catch(e){}onNet()},active,gate,fetch:request,describe};
window.TampUI=UI;window.TampNet=Net;
document.addEventListener('DOMContentLoaded',()=>{wasOff=!navigator.onLine||sim()==='offline';refresh()});
if(!ADMIN&&'serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
