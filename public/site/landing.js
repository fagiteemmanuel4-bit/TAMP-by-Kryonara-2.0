
const $=s=>document.querySelector(s);
function cd(){const t=new Date('2026-10-26T00:00:00')-new Date();$('#cd').textContent=t>0?Math.floor(t/864e5)+' days to go.':'Enrollment is open.'}cd();
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-pressed',x===b));
document.querySelectorAll('[data-c]').forEach(c=>c.style.display=(b.dataset.f==='all'||c.dataset.c===b.dataset.f)?'':'none')});
function vf(e){e.preventDefault();const v=$('#vi').value.trim().toUpperCase(),r=$('#vr');
if(!v){r.textContent='Enter a certificate ID.';r.style.color='var(--bad)'}
else if(v==='TAMP-DEMO'){r.textContent='Valid. Emmanuel Fagite completed Data Analysis (sample certificate).';r.style.color='var(--ok)'}
else{r.textContent='No certificate found with that ID.';r.style.color='var(--bad)'}return false}
try{if(!localStorage.getItem('ck'))$('#ck').style.display='flex'}catch(e){$('#ck').style.display='flex'}
$('#ok').onclick=()=>{$('#ck').style.display='none';try{localStorage.setItem('ck','1')}catch(e){}};

// To add your video, put its path here, e.g. 'video/intro.mp4'
const VIDEO_SRC='';
const vd=$('#vd'),vv=$('#vid');
$('#vbtn').onclick=()=>{if(VIDEO_SRC&&!vv.getAttribute('src')){vv.src=VIDEO_SRC;vd.classList.add('has')}vd.showModal()};
$('#vx').onclick=()=>vd.close();vd.addEventListener('close',()=>vv.pause());vd.addEventListener('click',e=>{if(e.target===vd)vd.close()});
