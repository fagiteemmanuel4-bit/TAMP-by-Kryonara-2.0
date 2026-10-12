const $=s=>document.querySelector(s),pg=document.body.dataset.p,K='tamp_users',S='tamp_pending',SES='tamp_session';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const hash=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return'x'+btoa(unescape(encodeURIComponent(s)))}};
const R={name:v=>/^\S{2,}(\s+\S{2,})+$/.test(v.trim())||'Enter your first and last name.',
email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||'Enter a valid email, like name@example.com.',
phone:v=>/^\+?\d{10,15}$/.test(v.replace(/[\s-]/g,''))||'Enter a valid phone number with country code.',
nin:v=>/^\d{11}$/.test(v)||'Your NIN is exactly 11 digits.',
pw:v=>(v.length>=8&&/\d/.test(v)&&/[a-z]/i.test(v))||'Use at least 8 characters, with letters and a number.',
pwl:v=>!!v||'Enter your password.',code:v=>/^\d{6}$/.test(v)||'Enter the 6-digit code.',ok:(v,e)=>e.checked||'Please accept to continue.'};
const chk=e=>{const x=R[e.dataset.r](e.value,e),bad=x!==true,fe=e.closest('label').querySelector('.fe');fe.textContent=bad?x:'';e.setAttribute('aria-invalid',bad);return!bad};
const all=f=>{let first=null;f.querySelectorAll('[data-r]').forEach(e=>{if(!chk(e)&&!first)first=e});if(first)first.focus();return!first};
const M=t=>{$('#m').textContent=t||''};
const busy=on=>{const b=$('#go');b.dataset.t=b.dataset.t||b.textContent;b.disabled=on;b.classList.toggle('is-loading',!!on);b.textContent=on?'Please wait...':b.dataset.t};
const f=$('#f');
if(f)f.querySelectorAll('[data-r]').forEach(e=>{e.addEventListener('blur',()=>chk(e));e.addEventListener('input',()=>e.getAttribute('aria-invalid')==='true'&&chk(e))});
document.querySelectorAll('.eye').forEach(b=>b.onclick=()=>{const i=b.previousElementSibling,s=i.type==='password';i.type=s?'text':'password';b.textContent=s?'Hide':'Show';b.setAttribute('aria-label',s?'Hide password':'Show password')});
const done=n=>{document.querySelectorAll('.prog li').forEach(l=>l.className='dn');$('#nm').textContent=n.split(' ')[0]};
if(pg==='signup'){const ses=get(SES,null);
f.onsubmit=async ev=>{ev.preventDefault();M();if(!all(f))return;const d=Object.fromEntries(new FormData(f)),em=d.email.trim().toLowerCase();
if(get(K,[]).some(u=>u.email===em))return M('That email already has an account. Log in instead.');
busy(true);set(S,{name:d.name.trim(),email:em,phone:d.phone.replace(/[\s-]/g,''),country:d.country,nin:'*******'+d.nin.slice(-4),pw:await hash(d.pw),terms:new Date().toISOString()});location.href='verify.html'}}
if(pg==='verify'){const p=get(S,null);let tries=0,t;
if(!p){$('#vw').innerHTML='<h1>Nothing to verify yet</h1><p class="mute">Start by creating your account.</p><a class="btn" href="signup.html">Create account</a>'}
else{$('#sub').textContent='We sent codes to '+p.email.replace(/^(.).*(@.*)$/,'$1***$2')+' and '+p.phone.slice(0,-4).replace(/\d/g,'*')+p.phone.slice(-4)+'.';
const tick=()=>{let n=30;const r=$('#rs');r.disabled=true;clearInterval(t);r.textContent='Resend codes in 30s';t=setInterval(()=>{n--;r.textContent='Resend codes in '+n+'s';if(n<=0){clearInterval(t);r.disabled=false;r.textContent='Resend codes'}},1000)};tick();
$('#rs').onclick=()=>{tries=0;M('New codes sent (demo: 123456).');tick()};
f.onsubmit=ev=>{ev.preventDefault();M();if(!all(f))return;if(tries>=5)return M('Too many wrong attempts. Resend the codes to try again.');
const d=Object.fromEntries(new FormData(f));if(d.a!=='123456'||d.b!=='123456'){tries++;return M('One of the codes is wrong. '+(5-tries)+' attempts left.')}
const us=get(K,[]);us.push({...p,id:Date.now()});set(K,us);set(SES,{email:p.email,name:p.name});try{localStorage.removeItem(S)}catch(e){}
$('#vw').hidden=true;$('#dw').hidden=false;done(p.name);setTimeout(()=>location.href='dashboard.html',1800)}}}
if(pg==='login'){let n=0;
f.onsubmit=async ev=>{ev.preventDefault();M();if(!all(f))return;if(n>=5)return M('Too many attempts. Wait a minute and try again.');
const d=Object.fromEntries(new FormData(f)),u=get(K,[]).find(x=>x.email===d.email.trim().toLowerCase());busy(true);
if(!u||u.pw!==await hash(d.pw)){busy(false);if(++n>=5)setTimeout(()=>n=0,60000);return M('Email or password is incorrect.')}
if(u.suspended){busy(false);return M('This account is suspended. Please contact support.')}set(SES,{email:u.email,name:u.name});f.hidden=true;$('#hd').hidden=true;$('#dw').hidden=false;$('#nm').textContent=u.name.split(' ')[0];setTimeout(()=>location.href='dashboard.html',1200)};}
