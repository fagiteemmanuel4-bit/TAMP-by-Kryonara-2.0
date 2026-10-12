// Optional link between the student site and this admin app.
// It only works when both are served from the SAME address (see README). Replace with real API calls later.
const Bridge=(()=>{
const g=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},s=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const LV=['Beginner','Intermediate','Advanced'],dash=em=>g('tamp_dash_'+em,null),nid=(DB,k)=>Math.max(0,...DB[k].map(x=>x.id))+1;
function pull(DB){const us=g('tamp_users',[]);
us.forEach(u=>{const S=dash(u.email)||{},e=(S.enr||[])[0];let r=DB.students.find(x=>x.email===u.email);
if(!r){r={id:nid(DB,'students'),name:u.name,email:u.email,phone:u.phone,country:u.country,course:'',progress:0,status:'active',src:'student site'};DB.students.push(r)}
r.name=u.name;r.phone=u.phone;r.status=u.suspended?'suspended':'active';if(e){r.course='Data Analysis';r.progress=Math.round((e.day||0)/63*100)}
(S.enr||[]).forEach(en=>(en.asg||[]).forEach(a=>{const ref=u.email+':'+en.cid+':'+a.lvl;if(!DB.submissions.some(x=>x.ref===ref))DB.submissions.push({id:nid(DB,'submissions'),ref,student:u.name,email:u.email,course:'Data Analysis',type:a.lvl===2?'Final project':LV[a.lvl]+' assignment',submitted:a.at,status:'pending',feedback:'',answers:a.text,link:a.link,file:a.file?a.file.name+' ('+Math.max(1,Math.round(a.file.size/1024))+' KB)':'none'})}));
(S.pay||[]).forEach(p=>{if(!DB.payments.some(x=>x.ref===p.r))DB.payments.push({id:nid(DB,'payments'),ref:p.r,student:u.name,course:p.c,method:p.m,amount:p.a,status:'paid',date:p.d})});
(S.tickets||[]).forEach(t=>{if(!DB.support.some(x=>x.ref===t.id))DB.support.push({id:nid(DB,'support'),ref:t.id,subject:t.s,from:u.email,status:'open',created:t.at,message:t.m,reply:''})});
(S.certs||[]).forEach(c=>{if(!DB.certificates.some(x=>x.cid===c.id))DB.certificates.push({id:nid(DB,'certificates'),cid:c.id,student:c.name,course:c.course,issued:c.date,status:c.status||'valid'})})});
g('tamp_inbox',[]).forEach(m=>{const ref='form:'+m.at;if(m.form==='contact'&&!DB.support.some(x=>x.ref===ref))DB.support.push({id:nid(DB,'support'),ref,subject:'Contact form: '+m.name,from:m.email,status:'open',created:(m.at||'').slice(0,10),message:m.message,reply:''})});
g('tamp_verifications',[]).forEach(v=>{if(!DB.verifications.some(x=>x.ref===v.at))DB.verifications.push({id:nid(DB,'verifications'),ref:v.at,time:v.at.slice(0,16).replace('T',' '),cid:v.id,result:v.ok?'found':'not found',source:'public page'})})}
function note(email,t,h,b){const S=dash(email);if(!S)return;S.notes=S.notes||[];S.notes.unshift({id:Date.now()+Math.floor(Math.random()*1e3),t,h,b,at:Date.now(),r:false});s('tamp_dash_'+email,S)}
function setStatus(email,sus){const us=g('tamp_users',[]),u=us.find(x=>x.email===email);if(u){u.suspended=!!sus;s('tamp_users',us)}}
function certify(email,c){const S=dash(email);if(!S)return;S.certs=S.certs||[];S.certs.push({id:c.cid,name:c.student,course:c.course,date:c.issued,status:'valid'});(S.enr||[]).forEach(e=>{if(e.status==='review')e.status='done'});s('tamp_dash_'+email,S);note(email,'ok','Certificate issued','Your '+c.course+' certificate is ready.')}
function certStatus(cid,st){Object.keys(localStorage).filter(k=>k.startsWith('tamp_dash_')).forEach(k=>{const S=g(k,null);if(S&&(S.certs||[]).some(c=>c.id===cid)){S.certs.forEach(c=>{if(c.id===cid)c.status=st});s(k,S)}})}
function reply(email,ref,text){const S=dash(email);if(!S)return;(S.tickets||[]).forEach(t=>{if(t.id===ref)t.reply=text});s('tamp_dash_'+email,S);note(email,'','Reply from support',text)}
function makeReset(email){const L=g('tamp_resets',[]),t=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');L.push({t,email,exp:Date.now()+30*60*1000,used:0});s('tamp_resets',L);return location.origin+location.pathname.replace(/admin\/[^/]*$/,'site/')+'reset-password.html?t='+t}
function publish(pkg){const L=g('tamp_courses',[]).filter(x=>x.id!==pkg.id);L.push(pkg);s('tamp_courses',L)}
function unpublish(id){s('tamp_courses',g('tamp_courses',[]).filter(x=>x.id!==id))}
return{publish,unpublish,makeReset,pull,note,setStatus,certify,certStatus,reply,settings:st=>s('tamp_settings',st)}})();
