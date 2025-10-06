/* ========= 設定 ========= */
// GAS連携を使う場合はURLを入れる。空でもフロント単体で動作。
const SYNC_URL   = "";
const SYNC_TOKEN = "";
const CONTACT_TO = "contact@example.com";

const ADMIN_PASS  = "A7B9C3D1";
const FAV_KEY     = "majitsunagu-fav";
const SUBMIT_KEY  = "majitsunagu-submits";
const USERS_KEY   = "majitsunagu-users";
const SESSION_KEY = "majitsunagu-session";
const ID_COUNTER  = "majitsunagu-id-counter";

/* ========= 起動（超重要） ========= */
document.addEventListener('DOMContentLoaded', init);

function init(){
  // POP
  document.getElementById('popClose').onclick=()=>{ document.getElementById('pop').style.display='none'; };

  // メニュー開閉（確実版）
  (function(){
    const menuBtn = document.getElementById('menuBtn');
    const menu    = document.getElementById('menu');
    if(!menuBtn || !menu) return;
    menuBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();menu.classList.toggle('show');});
    document.addEventListener('click',(e)=>{ if(!menu.contains(e.target) && e.target!==menuBtn) menu.classList.remove('show'); });
  })();

  // ルーター設定
  setupRouter();
  if(!location.hash) location.hash = '#list';
  handleRoute();

  // フィルタ events
  document.getElementById('filters').addEventListener('submit', e=>{ e.preventDefault(); applyFilters(1); });
  document.getElementById('resetBtn').onclick=()=>{ document.getElementById('filters').reset(); startEl.value=''; endEl.value=''; activeYear='all'; renderYearChips(); applyFilters(1); };
  pageSizeEl.onchange=()=>applyFilters(1);

  // 管理ログイン
  document.getElementById('pwOk').onclick=()=>{ if(g('pw').value!==ADMIN_PASS){alert('パスワードが違います');return;} g('adminBody').style.display=''; renderAdmin(); };

  // 認証UI
  btnSignup.onclick=signupFlow;
  btnLogin.onclick=loginFlow;
  btnLogout.onclick=()=>{ setSession(""); alert("ログアウトしました"); };

  // お問い合わせ
  g('contactToLabel').textContent = CONTACT_TO;
  contactForm.addEventListener('submit', onContactSubmit);
  g('contactSaveCSV').onclick=onContactSaveCSV;

  // プロフィール
  pf.avatar.onchange=onAvatarChange;
  g('pfSave').onclick=onProfileSave;

  // 初期描画
  renderYearChips();
  applyFilters(1);
  syncAuthUI();
}

/* ========= ルーティング ========= */
function setupRouter(){
  document.querySelectorAll('[data-view]').forEach(el=>{
    el.addEventListener('click',(e)=>{
      const v=el.dataset.view;
      location.hash = '#' + v;
      const menu=document.getElementById('menu'); if(menu) menu.classList.remove('show');
      e.preventDefault();
    });
  });
  window.addEventListener('hashchange', handleRoute);
}
function handleRoute(){
  const name = (location.hash || '#list').replace('#','');
  show(name);
}
function show(name){
  const views = ['list','submit','admin','terms','privacy','about','profile','contact'];
  views.forEach(v=>{
    const el = document.getElementById(`view-${v}`);
    if(el) el.classList.toggle('on', v===name);
  });
}

/* ========= 共通 & CSV ========= */
function g(id){return document.getElementById(id);}
function nowISO(){ return new Date().toISOString(); }
function nextId(){ const n=Number(localStorage.getItem(ID_COUNTER)||"0")+1; localStorage.setItem(ID_COUNTER,String(n)); return n; }
function toCSV(rows){ return rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n"); }
function downloadCSV(filename, rows){
  const blob = new Blob([toCSV(rows)], {type:"text/csv"});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}
function timestamp(){ const d=new Date(), z=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`; }

/* ========= 同期（POST） ========= */
async function syncToServer(payload){
  if(!SYNC_URL) return;
  const headers={"Content-Type":"application/json"}; if(SYNC_TOKEN) headers.Authorization=`Bearer ${SYNC_TOKEN}`;
  try{
    if(navigator.sendBeacon){ const ok=navigator.sendBeacon(SYNC_URL,new Blob([JSON.stringify(payload)],{type:"application/json"})); if(ok) return; }
    await fetch(SYNC_URL,{method:"POST",headers,body:JSON.stringify(payload)});
  }catch(e){ console.warn("sync failed",e); }
}

/* ========= ダミー求人 ========= */
const baseJobs=[
  {id:1,title:'Webエンジニア長期',company:'TechA',year:'2027',wage:1500,week:3,open:true,interns:8, mode:'オンライン', jobType:'エンジニア',features:['remote'],      date:'2025-10-28', place:'渋谷',      tags:'React TypeScript', img:'https://picsum.photos/seed/a/1200/800', applyUrl:'https://example.com/apply/techa', desc:'Web開発の実務支援。React/TS使用。'},
  {id:2,title:'グロースマーケ',   company:'GrowthX',year:'2026',wage:1300,week:2,open:true,interns:12,mode:'ハイブリッド', jobType:'マーケ',   features:['remote','flex'],date:'2025-11-05', place:'オンライン', tags:'SNS 広告',       img:'https://picsum.photos/seed/b/1200/800', applyUrl:'https://example.com/apply/growthx', desc:'広告運用/分析/LP改善など。'},
  {id:3,title:'UI/UXデザイン補佐',company:'DesignQ',year:'2028',wage:1200,week:2,open:false,interns:3,mode:'オフライン', jobType:'デザイナー',features:[],            date:'2025-10-10', place:'新宿',      tags:'Figma',           img:'',                                               applyUrl:'https://example.com/apply/designq', desc:'画面設計/プロトタイプ作成。'},
  {id:4,title:'事業企画アシスタント',company:'BizLab',year:'2027',wage:1000,week:1,open:true,interns:5,mode:'オフライン', jobType:'コンサル', features:['flex'],       date:'2025-09-30', place:'丸の内',    tags:'戦略',            img:'https://picsum.photos/seed/d/1200/800', applyUrl:'https://example.com/apply/bizlab', desc:'市場調査・資料作成など。'},
  {id:5,title:'セールス/CS',      company:'SaaS One',year:'2026',wage:1400,week:4,open:true,interns:15,mode:'ハイブリッド', jobType:'セールス',features:['remote'],   date:'2025-10-20', place:'五反田/Zoom',tags:'SaaS',           img:'https://picsum.photos/seed/e/1200/800', applyUrl:'https://example.com/apply/saasone', desc:'B2B SaaSの提案/CS。'},
  {id:6,title:'MLエンジニア補助', company:'AI Studio',year:'2027',wage:2000,week:3,open:true,interns:2,mode:'オンライン', jobType:'エンジニア',features:['remote','flex'],date:'2025-11-12', place:'オンライン', tags:'Python ML',       img:'https://picsum.photos/seed/f/1200/800', applyUrl:'https://example.com/apply/aistudio', desc:'モデル学習/評価/データ整備。'},
];
const favSet=new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]')); baseJobs.forEach(j=>j.fav=favSet.has(j.id));

/* ========= 卒年チップ & フィルタ ========= */
let activeYear='all'; const years=['all','2026','2027','2028']; const yearChips=document.getElementById('yearChips');
function renderYearChips(){ yearChips.innerHTML=years.map(y=>`<button type="button" class="year-chip ${y===activeYear?'is-active':''}" data-year="${y}">${y==='all'?'すべて':`${y}卒`}</button>`).join(''); }
yearChips?.addEventListener('click',(e)=>{const b=e.target.closest('[data-year]'); if(!b) return; activeYear=b.dataset.year; renderYearChips(); applyFilters(1);});

const qEl=g('q'), sortEl=g('sort'), wageMinEl=g('wageMin'), weekMinEl=g('weekMin'), jobTypeEl=g('jobType'),
remoteEl=g('remote'), flexEl=g('flex'), favOnlyEl=g('favOnly'), onlyOpenEl=g('onlyOpen'), minInternsEl=g('minInterns'),
pageSizeEl=g('pageSize'), startEl=g('startDate'), endEl=g('endDate');
const cards=g('cards'), count=g('count'), pager=g('pager'), chips=g('activeChips'); let page=1;

function normRange(){ if(startEl.value&&endEl.value&&endEl.value<startEl.value){const t=startEl.value;startEl.value=endEl.value;endEl.value=t;} }
const inRange=d=>{const st=startEl.value,en=endEl.value;if(!st&&!en)return true;if(st&&!en)return d>=st;if(!st&&en)return d<=en;return st<=d&&d<=en;};
function loadSubmits(){ return JSON.parse(localStorage.getItem(SUBMIT_KEY)||"[]"); }
function saveSubmits(a){ localStorage.setItem(SUBMIT_KEY, JSON.stringify(a)); }
function allJobs(){ const extra=loadSubmits().filter(x=>x.approved).map(x=>({id:x.id,title:x.title,company:x.company,year:x.year,wage:+(x.wage||0),week:+(x.week||0),open:true,interns:0,mode:x.mode||'オンライン',jobType:x.jobType||'',features:[],date:x.date||'',place:x.place||'',tags:x.tags||'',img:x.image||'',applyUrl:x.applyUrl||'',desc:x.desc||''})); return baseJobs.concat(extra); }

function cardHTML(item){
  const noImg=!item.img,favOn=favSet.has(item.id)?'is-on':'';
  return `
  <article class="card-item" data-id="${item.id}">
    <figure class="card-photo ${noImg?'noimg':''}">
      ${item.img?`<img src="${item.img}" alt="">`:''}
      <figcaption class="overlay">
        <div style="font-weight:800;margin:0 0 4px">${item.title}</div>
        <div class="meta">
          <span class="badge">${item.company}</span>
          <span class="badge">${item.year}卒</span>
          <span class="badge">${item.jobType||'-'}</span>
          <span class="badge">${item.mode||'-'}</span>
          <span class="badge">${item.place||'-'}</span>
          <span class="badge">${item.date||''}</span>
        </div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ${favOn}" data-fav="${item.id}">★ お気に入り</button>
          <button class="btn fill" data-join="${item.id}" data-company="${item.company}">参加</button>
        </div>
      </figcaption>
    </figure>
  </article>`;
}
function render(list){
  cards.innerHTML=list.length?list.map(cardHTML).join(''):`<div class="card"><strong>該当する求人がありません。</strong></div>`;
  cards.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=+b.dataset.fav;if(favSet.has(id))favSet.delete(id);else favSet.add(id);localStorage.setItem(FAV_KEY,JSON.stringify([...favSet]));applyFilters(page);});
  cards.querySelectorAll('[data-join]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=+b.dataset.join;const job=allJobs().find(j=>j.id===id);if(!job)return;addParticipation(currentUserEmail(),job.company);if(job.applyUrl)window.open(job.applyUrl,'_blank');});
  cards.querySelectorAll('.card-item').forEach(card=>card.onclick=()=>{const id=+card.dataset.id;const job=allJobs().find(j=>j.id===id);if(job)openJobModal(job);});
}
function renderPager(pages){ if(pages<=1){pager.innerHTML='';return;} let html='';for(let i=1;i<=pages;i++) html+=`<button class="${i===page?'is-active':''}" data-page="${i}">${i}</button>`; pager.innerHTML=html; pager.querySelectorAll('button').forEach(b=>b.onclick=()=>applyFilters(+b.dataset.page)); }
function renderChips(){const a=[];if(activeYear!=='all')a.push(`${activeYear}卒`);if(qEl.value.trim())a.push(`KW:${qEl.value.trim()}`);if(wageMinEl.value)a.push(`時給${wageMinEl.value}円〜`);if(weekMinEl.value)a.push(`週${weekMinEl.value}〜`);if(jobTypeEl.value)a.push(jobTypeEl.value);if(remoteEl.checked)a.push('リモート可');if(flexEl.checked)a.push('フレックス');if(favOnlyEl.checked)a.push('★お気に入りのみ');if(onlyOpenEl.checked)a.push('募集中のみ');if(minInternsEl.value)a.push(`在籍${minInternsEl.value}+`);if(startEl.value||endEl.value)a.push(`${startEl.value||'...'}〜${endEl.value||'...'}`);chips.innerHTML=a.map(s=>`<span class="chip">${s}</span>`).join('');}
function applyFilters(goPage=page){
  page=goPage; normRange();
  const q=qEl.value.trim().toLowerCase(),wMin=+(wageMinEl.value||0),wkMin=+(weekMinEl.value||0); const jt=jobTypeEl.value,needR=remoteEl.checked,needF=flexEl.checked,fav=favOnlyEl.checked,only=onlyOpenEl.checked,mi=+(minInternsEl.value||0),sort=sortEl.value;
  let list=allJobs().filter(j=>{const t=`${j.title} ${j.company} ${j.tags}`.toLowerCase();const kw=!q||t.includes(q),yr=(activeYear==='all')?true:j.year===activeYear,wj=j.wage>=wMin,wk=j.week>=wkMin,jtype=!jt||j.jobType===jt,rt=!needR||j.features.includes('remote'),fx=!needF||j.features.includes('flex'),op=!only||j.open,ic=j.interns>=mi,dr=inRange(j.date),fv=!fav||favSet.has(j.id);return kw&&yr&&wj&&wk&&jtype&&rt&&fx&&op&&ic&&dr&&fv;});
  list.sort((a,b)=>({new:b.date.localeCompare(a.date),old:a.date.localeCompare(b.date),wageDesc:b.wage-a.wage,wageAsc:a.wage-b.wage}[sort]||0));
  count.textContent=`${list.length}件`; renderChips();
  const size=+(pageSizeEl.value||10), pages=Math.max(1,Math.ceil(list.length/size)); if(page>pages) page=pages;
  render(list.slice((page-1)*size, page*size)); renderPager(pages);
}

/* ========= 投稿（採用担当） ========= */
document.getElementById('submitForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f=new FormData(e.currentTarget); const file=document.getElementById('imgFile').files[0];
  const image=file?await readAsDataURL(file):"";
  const arr=loadSubmits();
  arr.push({id:Date.now(), title:f.get('title'), company:f.get('company'), year:f.get('year')||'', wage:f.get('wage')||0, week:f.get('week')||0, jobType:f.get('jobType')||'', mode:f.get('mode')||'', place:f.get('place')||'', date:f.get('date')||'', tags:f.get('tags')||'', desc:f.get('desc')||'', image, approved:false, applyUrl:f.get('applyUrl')||''});
  saveSubmits(arr); alert('送信しました（承認待ち）。管理から承認してください。'); e.currentTarget.reset();
});
function readAsDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}

/* ========= 管理 ========= */
function openAdmin(){ show('admin'); document.getElementById('adminBody').style.display='none'; }
function renderAdmin(){
  const tbody=document.querySelector('#adminTable tbody'); tbody.innerHTML=''; const arr=loadSubmits().sort((a,b)=>String(a.date).localeCompare(b.date));
  arr.forEach(ev=>{const tr=document.createElement('tr'); tr.innerHTML=`<td><input type="checkbox" data-act="approve" data-id="${ev.id}" ${ev.approved?'checked':''}></td><td><strong>${ev.title}</strong><div class="small">${ev.company} / ${ev.year}卒</div></td><td>${ev.jobType||'-'} / ${ev.mode||'-'} / ${ev.place||'-'} / ${ev.date||''}</td><td><button class="btn" data-act="delete" data-id="${ev.id}">削除</button></td>`; tbody.appendChild(tr); });
  tbody.onclick=(e)=>{const a=e.target.closest('[data-act]'); if(!a) return; const list=loadSubmits(); const id=+a.dataset.id; const item=list.find(x=>x.id===id); if(a.dataset.act==='approve'&&item){item.approved=e.target.checked; saveSubmits(list); applyFilters();} if(a.dataset.act==='delete'){const next=list.filter(x=>x.id!==id); saveSubmits(next); renderAdmin(); applyFilters();}};
}

/* ========= 認証 / ユーザー保存 ========= */
const btnLogin=g('btnLogin'), btnSignup=g('btnSignup'), btnLogout=g('btnLogout'), whoEl=g('who'), accountBanner=g('accountBanner');
function users(){ return JSON.parse(localStorage.getItem(USERS_KEY)||"[]"); }
function saveUsers(U){ localStorage.setItem(USERS_KEY, JSON.stringify(U)); }
function currentUserEmail(){ return localStorage.getItem(SESSION_KEY)||""; }
function setSession(email){ if(email){localStorage.setItem(SESSION_KEY,email);} else{localStorage.removeItem(SESSION_KEY);} syncAuthUI(); }
function syncAuthUI(){ const email=currentUserEmail(),logged=!!email; btnLogin.hidden=btnSignup.hidden=logged; btnLogout.hidden=!logged; whoEl.hidden=!logged; whoEl.textContent=logged?email:""; accountBanner.textContent=logged?`ログイン中: ${email}`:`未ログイン（ゲストID: guest_${Math.random().toString(36).slice(2,12)})`; }

function blankUser(email, uid){
  return { uid, email, pw:"", name:"", university:"", grade:"", major:"", desiredRole:"", location:"", desiredWage:"", possibleDays:"", skills:"", links:"", pr:"", avatar:"", joined:0, joinedCompaniesCount:0, history:[], phone:"", createdAt:nowISO(), updatedAt:nowISO() };
}
function signupFlow(){
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード（8文字以上推奨）"); if(!pw) return;
  const U=users(); if(U.some(u=>u.email===email)){ alert("既に登録済みです（ログインしてください）"); return; }
  const uid=nextId();
  const u=blankUser(email, uid); u.pw=pw; U.push(u); saveUsers(U); setSession(email); alert("登録完了。プロフィールを入力してください。"); location.hash='#profile'; hydrateProfile(u); exportUserCSV(u); syncToServer({type:"user_upsert",data:u});
}
function loginFlow(){
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード"); if(!pw) return;
  const U=users(); let u=U.find(x=>x.email===email && x.pw===pw);
  if(!u){ alert("メールまたはパスワードが違います"); return; }
  if(!u.uid){ u.uid=nextId(); u.updatedAt=nowISO(); saveUsers(U); syncToServer({type:"user_upsert", data,u}); }
  setSession(email); alert("ログインしました"); location.hash='#profile'; hydrateProfile(u);
}

/* ========= プロフィール ========= */
const pf={name:g('pfName'),univ:g('pfUniv'),grade:g('pfGrade'),major:g('pfMajor'),desiredRole:g('pfDesiredRole'),location:g('pfLocation'),desiredWage:g('pfDesiredWage'),possibleDays:g('pfPossibleDays'),skills:g('pfSkills'),links:g('pfLinks'),pr:g('pfPR'),avatar:g('pfAvatar'),avatarPreview:g('pfAvatarPreview'),level:g('pfLevel'),joined:g('pfJoined'),joinedCompanies:g('pfJoinedCompanies'),levelBar:g('pfLevelBar'),history:g('pfHistory')};
function hydrateProfile(u){
  pf.name.value=u.name||""; pf.univ.value=u.university||""; pf.grade.value=u.grade||""; pf.major.value=u.major||""; pf.desiredRole.value=u.desiredRole||""; pf.location.value=u.location||""; pf.desiredWage.value=u.desiredWage||""; pf.possibleDays.value=u.possibleDays||""; pf.skills.value=u.skills||""; pf.links.value=u.links||""; pf.pr.value=u.pr||""; pf.avatarPreview.src=u.avatar||""; renderLevel(u); renderHistory(u);
}
function renderLevel(u){ const n=u.joined||0; const lv=Math.floor(Math.sqrt(n))+1; const pct=Math.min(100, Math.round((n/((lv)*(lv)))*100)); pf.level.textContent=lv; pf.joined.textContent=n; pf.joinedCompanies.textContent=u.joinedCompaniesCount||0; pf.levelBar.style.width=pct+"%"; }
function renderHistory(u){ const list=(u.history||[]).slice().reverse().map(h=>`<li>${h.company||'---'} <span class="small">${new Date(h.at).toLocaleString()}</span></li>`).join(''); pf.history.innerHTML=list||'<li>応募（参加）履歴はまだありません。</li>'; }
async function onAvatarChange(e){ const f=e.target.files?.[0]; if(!f) return; pf.avatarPreview.src=await readAsDataURL(f); }
function onProfileSave(){
  const email=currentUserEmail(); if(!email){ alert("ログインしてください"); return; }
  const U=users(); const i=U.findIndex(x=>x.email===email); if(i<0) return;
  const u=U[i];
  u.name=pf.name.value.trim(); u.university=pf.univ.value.trim(); u.grade=pf.grade.value; u.major=pf.major.value.trim(); u.desiredRole=pf.desiredRole.value.trim(); u.location=pf.location.value.trim(); u.desiredWage=pf.desiredWage.value.trim(); u.possibleDays=pf.possibleDays.value; u.skills=pf.skills.value.trim(); u.links=pf.links.value.trim(); u.pr=pf.pr.value.trim(); u.avatar=pf.avatarPreview.src||u.avatar; u.updatedAt=nowISO();
  saveUsers(U); alert("保存しました"); renderLevel(u); exportUserCSV(u); syncToServer({type:"user_upsert",data:u,reason:"profile_update"});
}
function exportUserCSV(u){
  const rows=[["email","uid","name","university","grade","major","desiredRole","location","desiredWage","possibleDays","skills","links","pr","joined","joinedCompaniesCount","updatedAt"],[u.email,u.uid,u.name,u.university,u.grade,u.major,u.desiredRole,u.location,u.desiredWage,u.possibleDays,u.skills,u.links,u.pr,String(u.joined||0),String(u.joinedCompaniesCount||0),u.updatedAt]];
  downloadCSV(`user_${u.email}_${timestamp()}.csv`, rows);
}
function addParticipation(email, companyName){
  if(!email){ alert("ログインしてください"); return; }
  const U=users(); const u=U.find(x=>x.email===email); if(!u) return;
  u.joined=(u.joined||0)+1; u.joinedCompaniesCount=(u.joinedCompaniesCount||0)+1; const at=nowISO(); u.history=u.history||[]; u.history.push({company:companyName||"",at}); u.updatedAt=at; saveUsers(U); hydrateProfile(u);
  exportUserCSV(u);
  syncToServer({type:"user_upsert", data:u, reason:"participation"});
}

/* ========= お問い合わせ ========= */
const contactForm=g('contactForm');
function onContactSubmit(e){
  e.preventDefault();
  const from=g('cEmail').value.trim() || currentUserEmail();
  const category=g('cCategory').value;
  const subject=g('cSubject').value.trim();
  const body=g('cBody').value.trim();
  saveContactCSV({from,category,subject,body});
  syncToServer({type:"contact_submit", to:CONTACT_TO, data:{from,subject:`[${category}] ${subject}`,body,at:nowISO()}});
  location.href=`mailto:${CONTACT_TO}?subject=${encodeURIComponent(`[${category}] ${subject}`)}&body=${encodeURIComponent(`From: ${from}\n\n${body}`)}`;
  contactForm.reset();
  alert("お問い合わせを送信しました。");
}
function onContactSaveCSV(){
  const from=g('cEmail').value.trim() || currentUserEmail();
  const category=g('cCategory').value;
  const subject=g('cSubject').value.trim();
  const body=g('cBody').value.trim();
  saveContactCSV({from,category,subject,body});
  alert("CSVを保存しました（送信はしていません）");
}
function saveContactCSV(d){
  const rows=[["from","category","subject","body","at"],[d.from||"",d.category||"",d.subject||"",d.body||"",nowISO()]];
  downloadCSV(`contact_${timestamp()}.csv`, rows);
}

/* ========= モーダル ========= */
const modal=g('jobModal'), mClose=g('jobModalClose'), mImg=g('jobModalImg'), mTitle=g('jobModalTitle'), mMeta=g('jobModalMeta'), mDesc=g('jobModalDesc'), mFav=g('jobModalFav'), mJoin=g('jobModalJoin'); let currentJob=null;
function openJobModal(job){ currentJob=job; mImg.src=job.img||''; mImg.style.display=job.img?'':'none'; mTitle.textContent=job.title; mMeta.innerHTML=`<span class="badge">${job.company}</span><span class="badge">${job.year}卒</span><span class="badge">${job.jobType||'-'}</span><span class="badge">${job.mode||'-'}</span><span class="badge">${job.place||'-'}</span><span class="badge">${job.date||''}</span>`; mDesc.textContent=(job.desc||job.tags||'').toString(); mFav.classList.toggle('is-on', favSet.has(job.id)); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); }
function closeJobModal(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); currentJob=null; }
mClose.onclick=closeJobModal; modal.addEventListener('click',e=>{if(e.target===modal) closeJobModal();});
mFav.onclick=()=>{ if(!currentJob) return; if(favSet.has(currentJob.id)) favSet.delete(currentJob.id); else favSet.add(currentJob.id); localStorage.setItem(FAV_KEY,JSON.stringify([...favSet])); mFav.classList.toggle('is-on', favSet.has(currentJob.id)); applyFilters(page); };
mJoin.onclick=()=>{ if(!currentJob) return; addParticipation(currentUserEmail(), currentJob.company); if(currentJob.applyUrl) window.open(currentJob.applyUrl,'_blank'); closeJobModal(); };
