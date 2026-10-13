(()=>{const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const hash=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return'x'+btoa(unescape(encodeURIComponent(s)))}};
const mb=$('#mb');if(mb)mb.onclick=()=>{const o=$('#n2').classList.toggle('open');mb.setAttribute('aria-expanded',o)};
document.querySelectorAll('[data-theme-btn]').forEach(b=>b.onclick=()=>tampTheme());
document.querySelectorAll('form[data-demo]').forEach(f=>f.onsubmit=ev=>{ev.preventDefault();f.innerHTML='<h3>Form temporarily unavailable</h3><p>This form is not connected to TAMP support services yet. Your message has not been sent.</p>'});
const q=$('#cq');if(q)q.oninput=()=>document.querySelectorAll('[data-c]').forEach(c=>c.style.display=c.dataset.c.includes(q.value.toLowerCase())?'':'none');
const vf=$('#vf');
if(vf)vf.onsubmit=ev=>{ev.preventDefault();const result=$('#vr');result.textContent='The official certificate registry is not connected yet. Please do not rely on local browser records for certificate verification.';result.setAttribute('role','status')};
const tokH=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join(''),okPw=a=>a.length>=8&&/\d/.test(a)&&/[a-z]/i.test(a);
const apiBase=()=>String(window.TAMP_CONFIG?.apiBase||'').replace(/\/$/,'');
async function apiRequest(path,body){
  const base=apiBase();
  if(!base)throw new Error('Account services are not connected yet. Please try again later.');
  let response;
  try{response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(sessionStorage.getItem('tamp_access_token')?{Authorization:'Bearer '+sessionStorage.getItem('tamp_access_token')}:{})},body:JSON.stringify(body)})}
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
const df=$('#df');
if(df)df.onsubmit=async ev=>{
 ev.preventDefault();const session=get('tamp_session',null),token=sessionStorage.getItem('tamp_access_token'),m=$('#dm');
 if(!session||!token){m.textContent='Please sign in again before deleting your account.';return}
 if(df.c.value!=='DELETE'){m.textContent='Type DELETE to confirm.';return}
 const button=df.querySelector('button');button.disabled=true;m.textContent='';
 try{const result=await apiRequest('/me/delete',{password:df.p.value});
  try{localStorage.removeItem('tamp_session');localStorage.removeItem('tamp_users');localStorage.removeItem('tamp_dash_'+session.email);sessionStorage.removeItem('tamp_access_token')}catch{}
  df.innerHTML='<h3>Account deleted</h3><p>'+esc(result.message||'Your account has been deleted.')+'</p><a class="btn" href="index.html">Back to home</a>';
 }catch(error){m.textContent=error.message;button.disabled=false}
};

})();

(()=>{const box=document.getElementById('vd');if(!box)return;box.innerHTML='<div class="card"><h2>Vendor portal not available yet</h2><p>Vendor enrollment keys, sales and payouts are not connected to the secure TAMP backend. This page is disabled to prevent fake keys or sales records from being mistaken for real transactions.</p><a class="btn" href="contact.html">Contact TAMP</a></div>'})();

(()=>{try{if(localStorage.getItem('ck')||document.getElementById('ck'))return;const d=document.createElement('div');d.id='ck';d.setAttribute('role','dialog');d.setAttribute('aria-label','Cookie notice');d.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:40;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;max-width:620px;box-shadow:0 6px 20px rgba(0,0,0,.2)';d.innerHTML='<span>We use cookies and browser storage to make this site work. <a href="cookies.html">Learn more</a></span><button class="btn s" id="cko">Accept</button>';document.body.append(d);document.getElementById('cko').onclick=()=>{d.remove();localStorage.setItem('ck','1')}}catch(e){}})();
