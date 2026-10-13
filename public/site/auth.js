const $=s=>document.querySelector(s),pg=document.body.dataset.p,K='tamp_users',S='tamp_pending',SES='tamp_session';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const hash=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return'x'+btoa(unescape(encodeURIComponent(s)))}};
const R={name:v=>/^\S{2,}(\s+\S{2,})+$/.test(v.trim())||'Enter your first and last name.',
email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||'Enter a valid email, like name@example.com.',
phone:v=>!v.trim()||/^\+?\d{10,15}$/.test(v.replace(/[\s-]/g,''))||'Enter a valid phone number with country code.',
nin:v=>/^\d{11}$/.test(v)||'Your NIN is exactly 11 digits.',
pw:v=>(v.length>=10&&v.length<=128&&/\d/.test(v)&&/[a-z]/i.test(v))||'Use 10–128 characters, with at least one letter and one number.',
pwl:v=>!!v||'Enter your password.',code:v=>/^\d{6}$/.test(v)||'Enter the 6-digit code.',ok:(v,e)=>e.checked||'Please accept to continue.'};
const chk=e=>{const x=R[e.dataset.r](e.value,e),bad=x!==true,fe=e.closest('label').querySelector('.fe');fe.textContent=bad?x:'';e.setAttribute('aria-invalid',bad);return!bad};
const all=f=>{let first=null;f.querySelectorAll('[data-r]').forEach(e=>{if(!chk(e)&&!first)first=e});if(first)first.focus();return!first};
const M=t=>{$('#m').textContent=t||''};
const busy=on=>{const b=$('#go');b.dataset.t=b.dataset.t||b.textContent;b.disabled=on;b.classList.toggle('is-loading',!!on);b.textContent=on?'Please wait...':b.dataset.t};
const apiBase=()=>String(window.TAMP_CONFIG?.apiBase||'').replace(/\/$/,'');
async function apiRequest(path,body){
  const base=apiBase();
  if(!base)throw new Error('The authentication API is not connected. Deploy the TAMP backend, then set TAMP_CONFIG.apiBase in /site/config.js to its URL ending in /api.');
  let response;
  try{
    response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }catch(e){
    throw new Error('TAMP could not reach the authentication server. Check the backend deployment URL and CORS settings.');
  }
  let data={};
  try{data=await response.json()}catch(e){}
  if(!response.ok)throw new Error(data.message||'The request failed. Please try again.');
  return data;
}
const rememberUser=(user,token)=>{
  const users=get(K,[]).filter(u=>u.email!==user.email);
  users.push({id:user.id,name:user.name,email:user.email,role:user.role||'student'});
  set(K,users);
  set(SES,{email:user.email,name:user.name});
  try{sessionStorage.setItem('tamp_access_token',token)}catch(e){}
};

const f=$('#f');
if(f)f.querySelectorAll('[data-r]').forEach(e=>{e.addEventListener('blur',()=>chk(e));e.addEventListener('input',()=>e.getAttribute('aria-invalid')==='true'&&chk(e))});
document.querySelectorAll('.eye').forEach(b=>b.onclick=()=>{const i=b.previousElementSibling,s=i.type==='password';i.type=s?'text':'password';b.textContent=s?'Hide':'Show';b.setAttribute('aria-label',s?'Hide password':'Show password')});
const done=n=>{document.querySelectorAll('.prog li').forEach(l=>l.className='dn');$('#nm').textContent=n.split(' ')[0]};
if(pg==='signup'){
f.onsubmit=async ev=>{
  ev.preventDefault();M();if(!all(f))return;
  const d=Object.fromEntries(new FormData(f)),em=d.email.trim().toLowerCase();
  busy(true);
  try{
    const result=await apiRequest('/auth/register',{
      name:d.name.trim(),email:em,phone:d.phone.replace(/[\s-]/g,''),country:d.country,
      password:d.pw,acceptedTerms:d.ok==='on'
    });
    set(S,{name:d.name.trim(),email:em,phone:d.phone.replace(/[\s-]/g,''),country:d.country});
    M(result.message||'Verification email sent. Check your inbox and spam folder.');
    location.href='verify.html';
  }catch(error){M(error.message);busy(false)}
};
}
if(pg==='verify'){
const p=get(S,null);let tries=0;
if(!p){$('#vw').innerHTML='<h1>Nothing to verify yet</h1><p class="mute">Start by creating your account.</p><a class="btn" href="signup.html">Create account</a>'}
else{
  $('#sub').textContent='Enter the 6-digit code sent to '+p.email+'. Phone verification is not enabled yet.';
  const resend=$('#rs');
  if(resend){
    resend.disabled=false;resend.textContent='Resend code';
    resend.onclick=async()=>{
      resend.disabled=true;M('Sending a new verification code...');
      try{
        const result=await apiRequest('/auth/resend',{email:p.email});
        M(result.message||'A new code has been sent.');
        let left=30;
        const cooldown=()=>{
          if(left<=0){resend.disabled=false;resend.textContent='Resend code';return}
          resend.textContent='Resend in '+left+'s';left--;setTimeout(cooldown,1000);
        };
        cooldown();
      }catch(error){M(error.message);resend.disabled=false;resend.textContent='Resend code'}
    };
  }
  f.onsubmit=async ev=>{
    ev.preventDefault();M();if(!all(f))return;
    if(tries>=5)return M('Too many attempts. Please restart registration.');
    const d=Object.fromEntries(new FormData(f));busy(true);
    try{
      const result=await apiRequest('/auth/verify',{email:p.email,emailCode:d.a});
      rememberUser(result.user,result.token);
      try{localStorage.removeItem(S)}catch(e){}
      $('#vw').hidden=true;$('#dw').hidden=false;done(result.user.name);
      setTimeout(()=>location.href='dashboard.html',900);
    }catch(error){tries++;M(error.message);busy(false)}
  };
}
}
if(pg==='login'){
let n=0;
f.onsubmit=async ev=>{
  ev.preventDefault();M();if(!all(f))return;
  if(n>=5)return M('Too many attempts. Wait a minute and try again.');
  const d=Object.fromEntries(new FormData(f));busy(true);
  try{
    const result=await apiRequest('/auth/login',{email:d.email.trim().toLowerCase(),password:d.pw});
    rememberUser(result.user,result.token);
    f.hidden=true;$('#hd').hidden=true;$('#dw').hidden=false;$('#nm').textContent=result.user.name.split(' ')[0];
    setTimeout(()=>location.href='dashboard.html',900);
  }catch(error){busy(false);if(++n>=5)setTimeout(()=>n=0,60000);M(error.message)}
};
}
