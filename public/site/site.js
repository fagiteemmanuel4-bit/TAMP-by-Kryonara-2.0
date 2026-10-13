(()=>{const $=s=>document.querySelector(s),get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const hash=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return'x'+btoa(unescape(encodeURIComponent(s)))}};
const mb=$('#mb');if(mb)mb.onclick=()=>{const o=$('#n2').classList.toggle('open');mb.setAttribute('aria-expanded',o)};
document.querySelectorAll('[data-theme-btn]').forEach(b=>b.onclick=()=>tampTheme());
document.querySelectorAll('form[data-demo]').forEach(f=>f.onsubmit=ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(f)),i=get('tamp_inbox',[]);i.push({form:f.dataset.demo,...d,at:new Date().toISOString()});put('tamp_inbox',i);f.innerHTML='<h3>Thank you</h3><p>'+f.dataset.ok+'</p>'});
const q=$('#cq');if(q)q.oninput=()=>document.querySelectorAll('[data-c]').forEach(c=>c.style.display=c.dataset.c.includes(q.value.toLowerCase())?'':'none');
const vf=$('#vf');if(vf)vf.onsubmit=ev=>{ev.preventDefault();const id=$('#vi').value.trim().toUpperCase(),r=$('#vr');let hit=id==='TAMP-DEMO'?{name:'Emmanuel Fagite',course:'Data Analysis (sample)',date:'2026-10-08'}:null;
try{for(const k of Object.keys(localStorage))if(k.startsWith('tamp_dash_'))(JSON.parse(localStorage[k]).certs||[]).forEach(c=>{if(c.id===id)hit=c})}catch(e){}
const rev=hit&&hit.status==='revoked';r.style.color=hit&&!rev?'var(--ok)':'var(--bad)';r.textContent=rev?'This certificate has been revoked and is not valid.':hit?'Valid. '+hit.name+' completed '+hit.course+' on '+hit.date+'.':'No certificate found with that ID.';const VL=get('tamp_verifications',[]);VL.push({id,ok:!!hit&&!rev,at:new Date().toISOString()});put('tamp_verifications',VL)};
const tokH=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join(''),okPw=a=>a.length>=8&&/\d/.test(a)&&/[a-z]/i.test(a);
const apiBase=()=>String(window.TAMP_CONFIG?.apiBase||'').replace(/\/$/,'');
async function apiRequest(path,body){
  const base=apiBase();
  if(!base)throw new Error('Account services are not connected yet. Please try again later.');
  let response;
  try{response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
  catch{throw new Error('TAMP could not reach the account server. Please try again later.')}
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data.message||'The request failed. Please try again.')
  return data
}
const ff=$('#ff');
if(ff)ff.onsubmit=async ev=>{
  ev.preventDefault();const email=String(ff.email.value||'').trim().toLowerCase(),button=ff.querySelector('button');
  if(!email)return;
  button.disabled=true;
  try{
    const result=await apiRequest('/auth/forgot',{email});
    ff.innerHTML='<h3>Check your email</h3><p>'+esc(result.message||'If an account exists, a password reset email will be sent.')+'</p><a href="login.html">Back to log in</a>';
  }catch(error){
    const m=document.createElement('p');m.className='msg';m.setAttribute('role','alert');m.textContent=error.message;ff.append(m);button.disabled=false;
  }
};
const rf=$('#rf');
if(rf){
  const token=new URLSearchParams(location.search).get('t')||new URLSearchParams(location.search).get('token');
  if(!token)rf.innerHTML='<h3>Reset link missing</h3><p>Open the complete link from your email or request a new one.</p><a class="btn" href="forgot-password.html">Request a new link</a>';
  else rf.onsubmit=async ev=>{
    ev.preventDefault();
    const password=rf.a.value,confirm=rf.b.value,m=$('#rm'),button=rf.querySelector('button');
    if(password.length<10||password.length>128)return m.textContent='Use a password between 10 and 128 characters.';
    if(!/[a-z]/i.test(password)||!/[0-9]/.test(password))return m.textContent='Use at least one letter and one number.';
    if(password!==confirm)return m.textContent='The two passwords do not match.';
    button.disabled=true;m.textContent='';
    try{
      const result=await apiRequest('/auth/reset',{token,password});
      try{localStorage.removeItem('tamp_session');sessionStorage.removeItem('tamp_access_token')}catch{}
      rf.innerHTML='<h3>Password updated</h3><p>'+esc(result.message||'Your password was updated. Please log in.')+'</p><a class="btn" href="login.html">Log in</a>';
    }catch(error){m.textContent=error.message;button.disabled=false}
  }
}
const df=$('#df');if(df)df.onsubmit=async ev=>{ev.preventDefault();const s=get('tamp_session',null),m=$('#dm');if(!s)return m.textContent='Log in first to delete your account.';if(df.c.value!=='DELETE')return m.textContent='Type DELETE to confirm.';
const us=get('tamp_users',[]),u=us.find(x=>x.email===s.email);if(!u||u.pw!==await hash(df.p.value))return m.textContent='Password is incorrect.';
put('tamp_users',us.filter(x=>x.email!==s.email));try{localStorage.removeItem('tamp_session');localStorage.removeItem('tamp_dash_'+s.email)}catch(e){}df.innerHTML='<h3>Account deleted</h3><p>Your account and learning data have been removed from this device.</p><a class="btn" href="index.html">Back to home</a>'};
})();

(()=>{const box=document.getElementById('vd');if(!box)return;const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const R=()=>{const V=get('tamp_vendor',null);if(!V){box.innerHTML='<form class="authcard" id="vl"><label>Your email<input name="e" type="email" required></label><button class="btn">Open dashboard</button></form>';document.getElementById('vl').onsubmit=ev=>{ev.preventDefault();put('tamp_vendor',{email:ev.target.e.value.trim(),keys:[]});R()};return}
const sold=V.keys.filter(k=>k.sold).length;box.innerHTML=`<div class="pgc"><div class="card"><b>${V.keys.length}</b><br>keys</div><div class="card"><b>${sold}</b><br>sold</div><div class="card"><b>₦${(sold*2000).toLocaleString()}</b><br>sales value</div></div><button class="btn" id="vk">Request 5 keys (demo)</button><div class="card scroll" style="margin-top:14px"><table><tr><th>Key</th><th>Status</th><th></th></tr>${V.keys.map((k,i)=>`<tr><td>${esc(k.k)}</td><td>${k.sold?'Sold':'In stock'}</td><td>${k.sold?'':`<button class="btn g s" data-i="${i}">Mark sold</button>`}</td></tr>`).join('')||'<tr><td colspan="3">No keys yet.</td></tr>'}</table></div><button class="btn g" id="vo">Sign out</button>`;
document.getElementById('vk').onclick=()=>{for(let i=0;i<5;i++)V.keys.push({k:'TAMP-'+Math.random().toString(36).slice(2,6).toUpperCase()+'-'+Math.floor(1000+Math.random()*9000),sold:0});put('tamp_vendor',V);R()};
document.getElementById('vo').onclick=()=>{localStorage.removeItem('tamp_vendor');R()};box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{V.keys[+b.dataset.i].sold=1;put('tamp_vendor',V);R()})};R()})();

(()=>{try{if(localStorage.getItem('ck')||document.getElementById('ck'))return;const d=document.createElement('div');d.id='ck';d.setAttribute('role','dialog');d.setAttribute('aria-label','Cookie notice');d.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:40;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;max-width:620px;box-shadow:0 6px 20px rgba(0,0,0,.2)';d.innerHTML='<span>We use cookies and browser storage to make this site work. <a href="cookies.html">Learn more</a></span><button class="btn s" id="cko">Accept</button>';document.body.append(d);document.getElementById('cko').onclick=()=>{d.remove();localStorage.setItem('ck','1')}}catch(e){}})();
