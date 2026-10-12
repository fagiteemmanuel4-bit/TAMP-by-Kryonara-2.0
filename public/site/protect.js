(()=>{const inp=e=>e.target.closest&&e.target.closest('input,textarea');
['copy','cut','contextmenu','dragstart'].forEach(t=>document.addEventListener(t,e=>e.preventDefault()));
document.addEventListener('selectstart',e=>{if(!inp(e))e.preventDefault()});
document.addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase();if(((e.ctrlKey||e.metaKey)&&['c','x','a','u','s','p'].includes(k)&&!(inp(e)&&k==='a'))||e.key==='F12')e.preventDefault()});})();

(()=>{try{const t=localStorage.getItem('tamp_theme');if(t)document.documentElement.dataset.theme=t}catch(e){}})();
window.tampTheme=()=>{const r=document.documentElement,d=(r.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))==='dark'?'light':'dark';r.dataset.theme=d;try{localStorage.setItem('tamp_theme',d)}catch(e){}};
window.confetti=()=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99';document.body.append(c);const x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const P=Array.from({length:120},()=>({x:Math.random()*c.width,y:-20,v:2+Math.random()*4,s:4+Math.random()*6,h:Math.random()*360}));let f=0;(function a(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.y+=p.v;p.x+=Math.sin(p.y/30);x.fillStyle='hsl('+p.h+',80%,55%)';x.fillRect(p.x,p.y,p.s,p.s)});if(++f<160)requestAnimationFrame(a);else c.remove()})()};
