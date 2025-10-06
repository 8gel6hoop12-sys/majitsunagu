/* ========= 設定 ========= */
// ★ あなたの受け口URL（Google Apps Script / Webhook 等）に差し替え
const SYNC_URL   = "";              // 例: "https://script.google.com/macros/s/AKfycb.../exec"
const SYNC_TOKEN = "";              // 認証が必要なら使う

const ADMIN_PASS  = "A7B9C3D1";     // 管理パス
const FAV_KEY     = "majitsunagu-fav";
const SUBMIT_KEY  = "majitsunagu-submits";
const USERS_KEY   = "majitsunagu-users";
const SESSION_KEY = "majitsunagu-session";
const ID_COUNTER  = "majitsunagu-id-counter";  // 連番カウンタ
const CONTACT_TO  = "contact@example.com";

/* ========= 同期（URLへPOST） ========= */
async function syncToServer(payload){
  if(!SYNC_URL){ return; } // URL未設定なら何もしない
  const headers = { "Content-Type":"application/json" };
  if(SYNC_TOKEN) headers["Authorization"] = `Bearer ${SYNC_TOKEN}`;
  try{
    if(navigator.sendBeacon){
      const blob = new Blob([JSON.stringify(payload)], {type:"application/json"});
      const ok   = navigator.sendBeacon(SYNC_URL, blob);
      if(ok) return;
    }
    await fetch(SYNC_URL, { method:"POST", headers, body: JSON.stringify(payload) });
  }catch(e){ console.warn("sync failed:", e); }
}

/* ========= 共通 ========= */
function nowISO(){ return new Date().toISOString(); }
function nextId(){ const n=Number(localStorage.getItem(ID_COUNTER)||"0")+1; localStorage.setItem(ID_COUNTER,String(n)); return n; }

/* ========= POP ========= */
document.getElementById('popClose').onclick=()=>{ document.getElementById('pop').style.display='none'; };

/* ========= メニュー ========= */
const menuBtn=document.getElementById('menuBtn'), menu=document.getElementById('menu');
menuBtn.onclick=(e)=>{e.stopPropagation(); menu.classList.toggle('show');};
document.addEventListener('click',(e)=>{ if(!menu.contains(e.target)&&e.target!==menuBtn) menu.classList.remove('show'); });
menu.addEventListener('click',(e)=>{ const b=e.target.closest('[data-view]'); if(!b) return; const n=b.dataset.view; if(n==='admin') openAdmin(); else show(n); menu.classList.remove('show');});

/* ========= 画面切替 ========= */
const views=["list","submit","admin","terms","privacy","about","profile","contact"];
function show(name){ views.forEach(v=>document.getElementById(`view-${v}`).classList.toggle('on', v===name)); }

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

/* ========= 卒年チップ ========= */
let activeYear='all'; const years=['all','2026','2027','2028']; const yearChips=document.getElementById('yearChips');
function renderYearChips(){ yearChips.innerHTML=years.map(y=>`<button type="button" class="year-chip ${y===activeYear?'is-active':''}" data-year="${y}">${y==='all'?'すべて':`${y}卒`}</button>`).join(''); }
renderYearChips();
yearChips.addEventListener('click',(e)=>{const b=e.target.closest('[data-year]'); if(!b) return; activeYear=b.dataset.year; renderYearChips(); applyFilters(1);});

/* ========= フィルター参照 ========= */
const qEl=document.getElementById('q'), sortEl=document.getElementById('sort'),
wageMinEl=document.getElementById('wageMin'), weekMinEl=document.getElementById('weekMin'),
jobTypeEl=document.getElementById('jobType'), remoteEl=document.getElementById('remote'),
flexEl=document.getElementById('flex'), favOnlyEl=document.getElementById('favOnly'),
onlyOpenEl=document.getElementById('onlyOpen'), minInternsEl=document.getElementById('minInterns'),
pageSizeEl=document.getElementById('pageSize'), startEl=document.getElementById('startDate'), endEl=document.getElementById('endDate');
const cards=document.getElementById('cards'), count=document.getElementById('count'), pager=document.getElementById('pager'), chips=document.getElementById('activeChips');
let page=1;
function normRange(){ if(startEl.value && endEl.value && endEl.value<startEl.value){ const t=startEl.value; startEl.value=endEl.value; endEl.value=t; } }
const inRange=(d)=>{ const st=startEl.value,en=endEl.value; if(!st&&!en) return true; if(st&&!en) return d>=st; if(!st&&en) return d<=en; return st<=d && d<=en; };

function loadSubmits(){ return JSON.parse(localStorage.getItem(SUBMIT_KEY)||"[]"); }
function saveSubmits(a){ localStorage.setItem(SUBMIT_KEY, JSON.stringify(a)); }
function allJobs(){
  const extra=loadSubmits().filter(x=>x.approved).map(x=>({
    id:x.id,title:x.title,company:x.company,year:x.year,wage:Number(x.wage||0),week:Number(x.week||0),open:true,interns:0,
    mode:x.mode||'オンライン',jobType:x.jobType||'',features:[],date:x.date||'',place:x.place||'',tags:x.tags||'',
    img:x.image||'', applyUrl:x.applyUrl||'', desc:x.desc||''
  }));
  return baseJobs.concat(extra);
}

/* ========= カード描画 & クリックでモーダル ========= */
function cardHTML(item){
  const noImg=!item.img, favOn=favSet.has(item.id)?'is-on':'';
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

  // お気に入り / 参加（カード上）
  cards.querySelectorAll('[data-fav]').forEach(b=>{
    b.onclick=(e)=>{ e.stopPropagation(); const id=Number(b.dataset.fav);
      if(favSet.has(id)) favSet.delete(id); else favSet.add(id);
      localStorage.setItem(FAV_KEY, JSON.stringify([...favSet])); applyFilters(page);
    };
  });
  cards.querySelectorAll('[data-join]').forEach(b=>{
    b.onclick=(e)=>{ e.stopPropagation(); const id=Number(b.dataset.join);
      const job=allJobs().find(j=>j.id===id); if(!job) return;
      addParticipation(currentUserEmail(), job.company);
      if(job.applyUrl) window.open(job.applyUrl,'_blank');
    };
  });

  // クリックでモーダル
  cards.querySelectorAll('.card-item').forEach(card=>{
    card.onclick=()=>{
      const id=Number(card.dataset.id);
      const job=allJobs().find(j=>j.id===id);
      if(job) openJobModal(job);
    };
  });
}
function renderPager(pages){
  if(pages<=1){ pager.innerHTML=''; return; }
  let html=''; for(let i=1;i<=pages;i++) html+=`<button class="${i===page?'is-active':''}" data-page="${i}">${i}</button>`;
  pager.innerHTML=html; pager.querySelectorAll('button').forEach(b=>b.onclick=()=>applyFilters(Number(b.dataset.page)));
}
function renderChips(){
  const arr=[]; if(activeYear!=='all') arr.push(`${activeYear}卒`);
  if(qEl.value.trim()) arr.push(`KW:${qEl.value.trim()}`);
  if(wageMinEl.value) arr.push(`時給${wageMinEl.value}円〜`);
  if(weekMinEl.value) arr.push(`週${weekMinEl.value}〜`);
  if(jobTypeEl.value) arr.push(jobTypeEl.value);
  if(remoteEl.checked) arr.push('リモート可'); if(flexEl.checked) arr.push('フレックス');
  if(favOnlyEl.checked) arr.push('★お気に入りのみ'); if(onlyOpenEl.checked) arr.push('募集中のみ');
  if(minInternsEl.value) arr.push(`在籍${minInternsEl.value}+`);
  if(startEl.value||endEl.value) arr.push(`${startEl.value||'...'}〜${endEl.value||'...'}`);
  chips.innerHTML=arr.map(s=>`<span class="chip">${s}</span>`).join('');
}
function applyFilters(goPage=page){
  page=goPage; normRange();
  const q=qEl.value.trim().toLowerCase(), wageMin=Number(wageMinEl.value||0), weekMin=Number(weekMinEl.value||0);
  const jobType=jobTypeEl.value, needRemote=remoteEl.checked, needFlex=flexEl.checked, favOnly=favOnlyEl.checked;
  const onlyOpen=onlyOpenEl.checked, minInterns=Number(minInternsEl.value||0), sort=sortEl.value;
  let list=allJobs().filter(j=>{
    const text=`${j.title} ${j.company} ${j.tags}`.toLowerCase();
    const kw=!q||text.includes(q), yr=(activeYear==='all')?true:j.year===activeYear;
    const wj=j.wage>=wageMin, wk=j.week>=weekMin, jt=!jobType||j.jobType===jobType;
    const rt=!needRemote||j.features.includes('remote'), fx=!needFlex||j.features.includes('flex');
    const op=!onlyOpen||j.open, ic=j.interns>=minInterns, dr=inRange(j.date), fv=!favOnly||favSet.has(j.id);
    return kw&&yr&&wj&&wk&&jt&&rt&&fx&&op&&ic&&dr&&fv;
  });
  list.sort((a,b)=>({new:b.date.localeCompare(a.date),old:a.date.localeCompare(b.date),wageDesc:b.wage-a.wage,wageAsc:a.wage-b.wage}[sort]||0));
  count.textContent=`${list.length}件`; renderChips();
  const size=Number(pageSizeEl.value||10), pages=Math.max(1,Math.ceil(list.length/size)); if(page>pages) page=pages;
  render(list.slice((page-1)*size, page*size)); renderPager(pages);
}

/* ========= 投稿（採用担当者様） ========= */
document.getElementById('submitForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f=new FormData(e.currentTarget); const file=document.getElementById('imgFile').files[0];
  const image=file?await new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }):"";
  const arr=loadSubmits();
  arr.push({
    id:Date.now(), title:f.get('title'), company:f.get('company'), year:f.get('year')||'',
    wage:f.get('wage')||0, week:f.get('week')||0, jobType:f.get('jobType')||'',
    mode:f.get('mode')||'', place:f.get('place')||'', date:f.get('date')||'',
    tags:f.get('tags')||'', desc:f.get('desc')||'', image, approved:false,
    applyUrl: f.get('applyUrl') || ''
  });
  saveSubmits(arr);
  alert('送信しました（承認待ちに保存）。管理メニューから承認してください。');
  e.currentTarget.reset();
});

/* ========= 管理（承認） ========= */
function openAdmin(){ show('admin'); document.getElementById('adminBody').style.display='none'; }
document.getElementById('pwOk').onclick=()=>{
  if(document.getElementById('pw').value!==ADMIN_PASS){ alert('パスワードが違います'); return; }
  document.getElementById('adminBody').style.display=''; renderAdmin();
};
function renderAdmin(){
  const tbody=document.querySelector('#adminTable tbody'); tbody.innerHTML='';
  const arr=loadSubmits().sort((a,b)=>String(a.date).localeCompare(b.date));
  arr.forEach(ev=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><input type="checkbox" data-act="approve" data-id="${ev.id}" ${ev.approved?'checked':''}></td>
      <td><strong>${ev.title}</strong><div class="small">${ev.company} / ${ev.year}卒</div></td>
      <td>${ev.jobType||'-'} / ${ev.mode||'-'} / ${ev.place||'-'} / ${ev.date||''}</td>
      <td><button class="btn" data-act="delete" data-id="${ev.id}">削除</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.onclick=(e)=>{
    const a=e.target.closest('[data-act]'); if(!a) return;
    const list=loadSubmits(); const id=Number(a.dataset.id); const item=list.find(x=>x.id===id);
    if(a.dataset.act==='approve' && item){ item.approved=e.target.checked; saveSubmits(list); applyFilters(); }
    if(a.dataset.act==='delete'){ const next=list.filter(x=>x.id!==id); saveSubmits(next); renderAdmin(); applyFilters(); }
  };
}

/* ========= 認証 / ユーザー管理（連番ID・更新・参加履歴） ========= */
const btnLogin=document.getElementById('btnLogin'), btnSignup=document.getElementById('btnSignup'), btnLogout=document.getElementById('btnLogout'), whoEl=document.getElementById('who');

function users(){ return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function currentUserEmail(){ return localStorage.getItem(SESSION_KEY) || ""; }
function setSession(email){ if(email){ localStorage.setItem(SESSION_KEY,email);} else{ localStorage.removeItem(SESSION_KEY);} syncAuthUI(); }
function syncAuthUI(){ const email=currentUserEmail(), logged=!!email; btnLogin.hidden=btnSignup.hidden=logged; btnLogout.hidden=!logged; whoEl.hidden=!logged; whoEl.textContent=logged?email:""; }

btnSignup.onclick=()=>{
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード（8文字以上推奨）"); if(!pw) return;
  const U=users(); if(U.some(u=>u.email===email)){ alert("既に登録済みです（ログインしてください）"); return; }
  const uid = nextId();
  const u = { uid, email, pw, joined:0, joinedCompaniesCount:0, history:[], name:"", university:"", grade:"", phone:"", createdAt:nowISO(), updatedAt:nowISO() };
  U.push(u); saveUsers(U); setSession(email); alert("登録完了しました"); show('profile'); renderProfile();
  syncToServer({type:"user_upsert", data:u});
};

btnLogin.onclick=()=>{
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード"); if(!pw) return;
  const U=users(); let u=U.find(x=>x.email===email && x.pw===pw);
  if(!u){ alert("メールまたはパスワードが違います"); return; }
  if(!u.uid){ u.uid=nextId(); u.updatedAt=nowISO(); saveUsers(U); syncToServer({type:"user_upsert", data:u}); }
  setSession(email); alert("ログインしました"); show('profile'); renderProfile();
};

btnLogout.onclick=()=>{ setSession(""); alert("ログアウトしました"); };

/* 参加：企業名付きで履歴に積む＆加算＆URL同期 */
function addParticipation(email, companyName){
  if(!email){ alert("ログインしてください"); return; }
  const U=users(); const u=U.find(x=>x.email===email); if(!u) return;
  u.joined = (u.joined||0) + 1;
  const at=nowISO();
  u.history = u.history || [];
  u.history.push({ company: companyName||"", at });
  u.joinedCompaniesCount = (u.joinedCompaniesCount||0) + 1;
  u.updatedAt = at;
  saveUsers(U); renderProfile();
  syncToServer({type:"user_upsert", data:u, reason:"participation"});
}

/* ========= プロフィール ========= */
const profileBox=document.getElementById('profileBox');
function levelFromJoined(n){ const lv=Math.floor(Math.sqrt(n))+1; const next=(lv*lv)-n; const pct=Math.min(100, Math.round((n/((lv)*(lv)))*100)); return {lv,next,pct}; }
function renderProfile(){
  const email=currentUserEmail(); const u=users().find(x=>x.email===email);
  if(!u){ profileBox.innerHTML='<p>未ログインです。</p>'; return; }
  const {lv,next,pct}=levelFromJoined(u.joined||0);
  const recent=(u.history||[]).slice(-5).reverse().map(h=>`<li>${h.company||'---'} <span class="small">${new Date(h.at).toLocaleString()}</span></li>`).join('');
  profileBox.innerHTML=`
    <div><strong>${u.uid ? `#${u.uid}` : ''} ${email}</strong></div>
    <div class="grid-2">
      <label>名前<input id="pfName" class="ipt" value="${u.name||''}"></label>
      <label>大学・学部<input id="pfUniv" class="ipt" value="${u.university||''}"></label>
      <label>学年<input id="pfGrade" class="ipt" value="${u.grade||''}"></label>
      <label>電話番号<input id="pfPhone" class="ipt" value="${u.phone||''}"></label>
    </div>
    <div class="level-wrap">
      <div>レベル <strong>${lv}</strong>（参加 ${u.joined||0} 回 / 参加企業 合計 ${u.joinedCompaniesCount||0} / 次まで ${next} ）</div>
      <div class="level-bar"><span style="width:${pct}%"></span></div>
    </div>
    <div class="small">直近参加（最新5件）</div>
    <ul class="small" style="margin:0;padding-left:1rem">${recent || '<li>まだありません</li>'}</ul>
    <div class="actions"><button id="pfSave" class="btn fill">保存（更新）</button></div>`;
  document.getElementById('pfSave').onclick=()=>{
    const U=users(); const i=U.findIndex(x=>x.email===email); if(i<0) return;
    U[i].name=document.getElementById('pfName').value;
    U[i].university=document.getElementById('pfUniv').value;
    U[i].grade=document.getElementById('pfGrade').value;
    U[i].phone=document.getElementById('pfPhone').value;
    if(!U[i].uid) U[i].uid=nextId();
    U[i].updatedAt=nowISO();
    saveUsers(U); alert('保存しました');
    syncToServer({type:"user_upsert", data:U[i], reason:"profile_update"});
  };
}
renderProfile();

/* ========= お問い合わせ ========= */
document.getElementById('contactForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const from=document.getElementById('cEmail').value;
  const subject=encodeURIComponent(document.getElementById('cSubject').value.trim());
  const body=encodeURIComponent(`From: ${from}\n\n${document.getElementById('cBody').value.trim()}`);
  location.href=`mailto:${CONTACT_TO}?subject=${subject}&body=${body}`;
});

/* ========= モーダル ========= */
const modal=document.getElementById('jobModal');
const mClose=document.getElementById('jobModalClose');
const mImg=document.getElementById('jobModalImg');
const mTitle=document.getElementById('jobModalTitle');
const mMeta=document.getElementById('jobModalMeta');
const mDesc=document.getElementById('jobModalDesc');
const mFav=document.getElementById('jobModalFav');
const mJoin=document.getElementById('jobModalJoin');
let currentJob=null;

function openJobModal(job){
  currentJob=job;
  mImg.src=job.img||''; mImg.style.display=job.img?'':'none';
  mTitle.textContent=job.title;
  mMeta.innerHTML=`
    <span class="badge">${job.company}</span>
    <span class="badge">${job.year}卒</span>
    <span class="badge">${job.jobType||'-'}</span>
    <span class="badge">${job.mode||'-'}</span>
    <span class="badge">${job.place||'-'}</span>
    <span class="badge">${job.date||''}</span>`;
  mDesc.textContent=(job.desc||job.tags||'').toString();
  mFav.classList.toggle('is-on', favSet.has(job.id));
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
function closeJobModal(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); currentJob=null; }
mClose.onclick=closeJobModal;
modal.addEventListener('click',(e)=>{ if(e.target===modal) closeJobModal(); });

mFav.onclick=()=>{
  if(!currentJob) return;
  if(favSet.has(currentJob.id)) favSet.delete(currentJob.id); else favSet.add(currentJob.id);
  localStorage.setItem(FAV_KEY, JSON.stringify([...favSet]));
  mFav.classList.toggle('is-on', favSet.has(currentJob.id));
  applyFilters(page);
};
mJoin.onclick=()=>{
  if(!currentJob) return;
  addParticipation(currentUserEmail(), currentJob.company);
  if(currentJob.applyUrl) window.open(currentJob.applyUrl,'_blank');
  closeJobModal();
};

/* ========= 検索イベント ========= */
document.getElementById('filters').addEventListener('submit', e=>{ e.preventDefault(); applyFilters(1); });
document.getElementById('resetBtn').onclick=()=>{ document.getElementById('filters').reset(); startEl.value=''; endEl.value=''; activeYear='all'; renderYearChips(); applyFilters(1); };
pageSizeEl.onchange=()=>applyFilters(1);

/* ========= 初期描画 ========= */
applyFilters(1);
show('list');
