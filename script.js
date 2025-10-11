/* ===== 設定 ===== */
const CONTACT_TO = "contact@example.com";
const ADMIN_PASS = "A7B9C3D1";
const FAV_KEY    = "majitsunagu-fav";
const SUBMIT_KEY = "majitsunagu-submits";
const USERS_KEY  = "majitsunagu-users";
const SESSION_KEY= "majitsunagu-session";
const ID_COUNTER = "majitsunagu-id-counter";

/* ===== 起動 ===== */
document.addEventListener('DOMContentLoaded', init);

function init(){
  // メニュー
  (function(){
    const menuBtn = g('menuBtn'), menu = g('menu');
    menuBtn?.addEventListener('click', (e)=>{e.preventDefault();e.stopPropagation();menu.classList.toggle('show');});
    document.addEventListener('click', (e)=>{ if(!menu?.contains(e.target) && e.target!==menuBtn) menu?.classList.remove('show');});
  })();

  // ロゴ→ホーム
  g('brand')?.addEventListener('click', (e)=>{
    e.preventDefault();
    location.hash='#list'; handleRoute(); window.scrollTo({top:0,behavior:'smooth'});
  });

  // ルーター
  setupRouter();
  if(!location.hash) location.hash = '#list';
  handleRoute();

  // 認証UI
  g('btnSignup')?.addEventListener('click', signupFlow);
  g('btnLogin') ?.addEventListener('click', loginFlow);
  g('btnLogout')?.addEventListener('click', ()=>{ setSession(""); alert("ログアウトしました"); });

  // 管理
  g('pwOk')?.addEventListener('click', ()=>{
    if(g('pw').value!==ADMIN_PASS){alert('パスワードが違います');return;}
    g('adminBody').style.display=''; renderAdmin();
  });

  // 投稿
  g('submitForm')?.addEventListener('submit', onSubmitJob);

  // お問い合わせ
  g('contactToLabel') && (g('contactToLabel').textContent = CONTACT_TO);
  g('contactForm')?.addEventListener('submit', onContactSubmit);
  g('contactSaveCSV')?.addEventListener('click', ()=>alert('CSVを保存しました（ダミー）'));

  // 検索ポップ
  setupSearchPop();

  // 年チップ（右上 & 互換）
  renderYearChips();

  // 他タブ同期
  window.addEventListener('storage', (ev)=>{
    if(ev.key===SUBMIT_KEY || ev.key===FAV_KEY){
      window.dispatchEvent(new CustomEvent('jobs-updated'));
    }
  });
  window.addEventListener('jobs-updated', ()=>{
    if(currentView()==='list') applyFilters(1);
  });

  // 初期レンダリング
  applyFilters(1);
  syncAuthUI();
}

/* ===== ルーティング ===== */
function setupRouter(){
  document.querySelectorAll('[data-view]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      const v = el.dataset.view;
      location.hash = '#'+v;
      g('menu')?.classList.remove('show');
      e.preventDefault();
    });
  });
  window.addEventListener('hashchange', handleRoute);
}
function handleRoute(){
  const name=(location.hash||'#list').replace('#','');
  show(name);
  if(name==='list'){ applyFilters(1); }
}
function show(name){
  const views=['list','submit','admin','terms','privacy','about','profile','contact'];
  views.forEach(v=>{
    const el=g(`view-${v}`); if(el) el.classList.toggle('on', v===name);
  });
}
function currentView(){
  const v=(location.hash||'#list').replace('#',''); return v||'list';
}

/* ===== ユーティリティ ===== */
function g(id){return document.getElementById(id);}
function nowISO(){return new Date().toISOString();}
function nextId(){const n=+(localStorage.getItem(ID_COUNTER)||"0")+1; localStorage.setItem(ID_COUNTER,String(n)); return n;}
function toCSV(rows){return rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");}
function downloadCSV(filename, rows){
  const blob=new Blob([toCSV(rows)],{type:"text/csv"});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}

/* ===== データ ===== */
// ダミー案件は無し。→ 投稿→承認で表示される
const baseJobs=[];

function loadSubmits(){ return JSON.parse(localStorage.getItem(SUBMIT_KEY)||"[]"); }
function saveSubmits(a){ localStorage.setItem(SUBMIT_KEY, JSON.stringify(a)); }

/* 承認済みを統合して返す */
function allJobs(){
  const extra = loadSubmits().filter(x=>x.approved).map(x=>({
    id:x.id, title:x.title, company:x.company, year:x.year,
    wage:+(x.wage||0), open:true,
    mode:x.mode||'オンライン', jobType:x.jobType||'',
    dateStart: x.dateStart || x.dateEnd || x.date || '',
    dateEnd:   x.dateEnd   || x.dateStart || x.date || '',
    place:x.place||'', tags:x.tags||'', img:x.image||'',
    applyUrl:x.applyUrl||'', desc:x.desc||''
  }));
  return baseJobs.concat(extra);
}

/* ===== 卒年チップ（右上 & 任意の外部領域も対応） ===== */
let activeYear='all';
const years=['all','2026','2027','2028'];
function renderYearChips(){
  const html = years.map(y =>
    `<button type="button" class="year-chip ${y===activeYear?'is-active':''}" data-year="${y}">
      ${y==='all'?'すべて':`${y}卒`}
     </button>`).join('');

  const hdr = document.getElementById('yearChipsHdr');
  const out = document.getElementById('yearChips'); // 互換（存在しなくてもOK）

  const bind = (wrap)=>{
    if(!wrap) return;
    wrap.innerHTML = html;
    wrap.onclick = (e)=>{
      const b=e.target.closest('[data-year]'); if(!b) return;
      activeYear=b.dataset.year; renderYearChips(); applyFilters(1);
    };
  };
  bind(hdr); bind(out);
}

/* ===== 検索ポップ ===== */
function setupSearchPop(){
  const pop=g('searchPop'), close=g('spClose'), form=g('searchForm');
  const open=()=>{ pop.classList.add('show'); pop.setAttribute('aria-hidden','false'); };
  const hide=()=>{ pop.classList.remove('show'); pop.setAttribute('aria-hidden','true'); };

  // ヘッダーの「検索」ボタン
  g('openSearch')?.addEventListener('click', open);

  // 四角い検索ランチャー
  const launch = g('searchLaunch');
  if(launch){
    const openLaunch = ()=> open();
    launch.addEventListener('click', openLaunch);
    launch.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openLaunch(); }});
  }

  close?.addEventListener('click', hide);
  pop?.addEventListener('click', (e)=>{ if(e.target===pop) hide(); });

  // クリア
  g('spClear')?.addEventListener('click', ()=>{
    g('sp_q').value='';
    g('sp_jobType').value='';
    g('sp_modeOnline').checked=false;
    g('sp_modeOffline').checked=false;
    g('sp_onlyOpen').checked=true;
    g('sp_favOnly').checked=false;
    g('sp_start').value=''; g('sp_end').value='';
  });

  // 送信→絞り込み反映
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    // 値をフィルタ状態に写し込む
    state.q = g('sp_q').value.trim();
    state.jobType = g('sp_jobType').value;
    state.modeOnline = g('sp_modeOnline').checked;
    state.modeOffline = g('sp_modeOffline').checked;
    state.onlyOpen = g('sp_onlyOpen').checked;
    state.favOnly = g('sp_favOnly').checked;
    state.start = g('sp_start').value;
    state.end   = g('sp_end').value;

    hide();
    applyFilters(1);
    // 一覧へ移動
    location.hash='#list'; show('list');
  });
}

/* ===== フィルタ状態 ===== */
const favSet=new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]'));
const state = {
  q:'', jobType:'', modeOnline:false, modeOffline:false, onlyOpen:true, favOnly:false,
  start:'', end:'', sort:'new', pageSize:10
};
function overlaps(js, je){
  const s = state.start || '';
  const e = state.end   || '';
  if(!s && !e) return true;
  const S = s || '0000-01-01';
  const E = e || '9999-12-31';
  const J1= js || ''; const J2= je || js || '';
  return (S<=J2) && (E>=J1);
}

/* ===== 描画 ===== */
const cards=g('cards'), count=g('count'), pager=g('pager'), chips=g('activeChips');
let page=1;

function chipRender(){
  const a=[];
  if(activeYear!=='all') a.push(`${activeYear}卒`);
  if(state.q) a.push(`KW:${state.q}`);
  if(state.jobType) a.push(state.jobType);
  if(state.modeOnline) a.push('オンライン');
  if(state.modeOffline) a.push('対面');
  if(state.favOnly) a.push('★お気に入り');
  if(state.onlyOpen) a.push('募集中のみ');
  if(state.start||state.end) a.push(`${state.start||'...'}〜${state.end||'...'}`);
  chips.innerHTML = a.map(s=>`<span class="chip">${s}</span>`).join('');
}

function cardHTML(item){
  const noImg=!item.img, favOn=favSet.has(item.id)?'is-on':'';
  const dateLabel = item.dateStart ? (item.dateEnd && item.dateEnd!==item.dateStart ? `${item.dateStart}〜${item.dateEnd}` : item.dateStart) : '';
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
          <span class="badge">${dateLabel}</span>
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
  if(!list.length){
    cards.innerHTML = `<div class="card"><strong>投稿・承認された求人が表示されます。</strong><div class="small">「採用担当者様（投稿）」から追加 → 「管理（承認）」で公開してください。</div></div>`;
  }else{
    cards.innerHTML = list.map(cardHTML).join('');
  }
  // イベント
  cards.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const id=+b.dataset.fav;
    if(favSet.has(id)) favSet.delete(id); else favSet.add(id);
    localStorage.setItem(FAV_KEY, JSON.stringify([...favSet]));
    applyFilters(page);
  });
  cards.querySelectorAll('[data-join]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const id=+b.dataset.join; const job=allJobs().find(j=>j.id===id); if(!job) return;
    addParticipation(currentUserEmail(), job.company);
    if(job.applyUrl) window.open(job.applyUrl,'_blank');
  });
  cards.querySelectorAll('.card-item').forEach(card=>{
    card.onclick=()=>{
      const id=+card.dataset.id; const job=allJobs().find(j=>j.id===id); if(job) openJobModal(job);
    };
  });
}

function renderPager(pages){
  if(pages<=1){ pager.innerHTML=''; return; }
  let html=''; for(let i=1;i<=pages;i++) html+=`<button class="${i===page?'is-active':''}" data-page="${i}">${i}</button>`;
  pager.innerHTML=html;
  pager.querySelectorAll('button').forEach(b=>b.onclick=()=>applyFilters(+b.dataset.page));
}

function applyFilters(goPage=page){
  page=goPage;
  let list = allJobs().filter(j=>{
    const text = `${j.title} ${j.company} ${j.tags}`.toLowerCase();
    const kw   = !state.q || text.includes(state.q.toLowerCase());
    const yr   = (activeYear==='all') ? true : j.year===activeYear;
    const jt   = !state.jobType || j.jobType===state.jobType;

    const modeOK = (!state.modeOnline && !state.modeOffline) ||
                   (state.modeOnline  && /オンライン|ﾊｲﾌﾞﾘｯﾄﾞ|ハイブリッド/.test(j.mode)) ||
                   (state.modeOffline && /オフライン|対面|ﾊｲﾌﾞﾘｯﾄﾞ|ハイブリッド/.test(j.mode));

    const openOK = !state.onlyOpen || j.open;
    const favOK  = !state.favOnly  || favSet.has(j.id);
    const rangeOK= overlaps(j.dateStart, j.dateEnd);

    return kw && yr && jt && modeOK && openOK && favOK && rangeOK;
  });

  // 並び替え
  list.sort((a,b)=>{
    const map = {
      new:      (b.dateStart||'').localeCompare(a.dateStart||''),
      old:      (a.dateStart||'').localeCompare(b.dateStart||''),
      wageDesc: (b.wage||0)-(a.wage||0),
      wageAsc:  (a.wage||0)-(b.wage||0),
    };
    return map[state.sort] ?? 0;
  });

  // ページング
  count.textContent=String(list.length);
  chipRender();
  const size=+(state.pageSize||10);
  const pages=Math.max(1, Math.ceil(list.length/size));
  if(page>pages) page=pages;

  render(list.slice((page-1)*size, page*size));
  renderPager(pages);
}

/* ===== 投稿 ===== */
async function onSubmitJob(e){
  e.preventDefault();
  const f=new FormData(e.currentTarget);
  const file=g('imgFile').files[0];
  const image=file?await readAsDataURL(file):"";
  const arr=loadSubmits();

  const dateStart=f.get('dateStart')||f.get('dateEnd')||'';
  const dateEnd  =f.get('dateEnd')  ||f.get('dateStart')||'';

  arr.push({
    id:Date.now(),
    title:f.get('title'), company:f.get('company'), year:f.get('year')||'',
    wage:f.get('wage')||0, jobType:f.get('jobType')||'', mode:f.get('mode')||'',
    place:f.get('place')||'', tags:f.get('tags')||'', desc:f.get('desc')||'',
    dateStart, dateEnd, image, approved:false, applyUrl:f.get('applyUrl')||''
  });
  saveSubmits(arr);
  window.dispatchEvent(new CustomEvent('jobs-updated'));
  alert('送信しました（承認待ち）。管理から承認してください。');
  e.currentTarget.reset();
  location.hash='#admin'; handleRoute();
}
function readAsDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}

/* ===== 管理 ===== */
function renderAdmin(){
  const tbody=document.querySelector('#adminTable tbody'); tbody.innerHTML='';
  const arr=loadSubmits().sort((a,b)=>String(a.dateStart||'').localeCompare(b.dateStart||''));
  arr.forEach(ev=>{
    const range = ev.dateStart ? (ev.dateEnd && ev.dateEnd!==ev.dateStart ? `${ev.dateStart}〜${ev.dateEnd}` : ev.dateStart) : '';
    const tr=document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" data-act="approve" data-id="${ev.id}" ${ev.approved?'checked':''}></td>
      <td><strong>${ev.title}</strong><div class="small">${ev.company} / ${ev.year}卒</div></td>
      <td>${ev.jobType||'-'} / ${ev.mode||'-'} / ${ev.place||'-'} / ${range}</td>
      <td><button class="btn" data-act="delete" data-id="${ev.id}">削除</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.onclick=(e)=>{
    const a=e.target.closest('[data-act]'); if(!a) return;
    const list=loadSubmits(); const id=+a.dataset.id; const item=list.find(x=>x.id===id);
    if(a.dataset.act==='approve'&&item){
      item.approved=e.target.checked; saveSubmits(list);
      window.dispatchEvent(new CustomEvent('jobs-updated'));
      return;
    }
    if(a.dataset.act==='delete'){
      const next=list.filter(x=>x.id!==id); saveSubmits(next);
      window.dispatchEvent(new CustomEvent('jobs-updated'));
      renderAdmin();
    }
  };
}

/* ===== 認証（簡易） ===== */
function users(){ return JSON.parse(localStorage.getItem(USERS_KEY)||"[]"); }
function saveUsers(U){ localStorage.setItem(USERS_KEY, JSON.stringify(U)); }
function currentUserEmail(){ return localStorage.getItem(SESSION_KEY)||""; }
function setSession(email){ if(email){localStorage.setItem(SESSION_KEY,email);} else{localStorage.removeItem(SESSION_KEY);} syncAuthUI(); }
function syncAuthUI(){
  const email=currentUserEmail(), logged=!!email;
  g('btnLogin').hidden=g('btnSignup').hidden=logged;
  g('btnLogout').hidden=!logged;
  const who=g('who');
  if(who){ who.hidden=!logged; who.textContent=logged?email:""; }
  const banner=g('accountBanner');
  if(banner) banner.textContent=logged?`ログイン中: ${email}`:`未ログイン（ゲスト）`;
}
function blankUser(email, uid){
  return { uid, email, pw:"", name:"", university:"", grade:"", major:"", desiredRole:"", location:"", desiredWage:"", possibleDays:"", skills:"", links:"", pr:"", avatar:"", joined:0, joinedCompaniesCount:0, history:[], createdAt:nowISO(), updatedAt:nowISO() };
}
function signupFlow(){
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード（8文字以上推奨）"); if(!pw) return;
  const U=users(); if(U.some(u=>u.email===email)){ alert("既に登録済みです（ログインしてください）"); return; }
  const uid=nextId(); const u=blankUser(email, uid); u.pw=pw;
  U.push(u); saveUsers(U); setSession(email); alert("登録完了。プロフィールを入力してください。"); location.hash='#profile';
}
function loginFlow(){
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード"); if(!pw) return;
  const U=users(); let u=U.find(x=>x.email===email && x.pw===pw);
  if(!u){ alert("メールまたはパスワードが違います"); return; }
  if(!u.uid){ u.uid=nextId(); u.updatedAt=nowISO(); saveUsers(U); }
  setSession(email); alert("ログインしました"); location.hash='#profile';
}

/* 参加 */
function addParticipation(email, companyName){
  if(!email){ alert("ログインしてください"); return; }
  const U=users(); const u=U.find(x=>x.email===email); if(!u) return;
  u.joined=(u.joined||0)+1; u.joinedCompaniesCount=(u.joinedCompaniesCount||0)+1;
  const at=nowISO(); u.history=u.history||[]; u.history.push({company:companyName||"",at}); u.updatedAt=at; saveUsers(U);
}

/* ===== お問い合わせ（簡易） ===== */
function onContactSubmit(e){
  e.preventDefault();
  alert("お問い合わせを送信しました（ダミー）。メール送信は実装先に合わせてください。");
  e.currentTarget.reset();
}

/* ===== 求人モーダル ===== */
const modalHTML = (()=>`
<div id="jobModal" class="modal" aria-hidden="true">
  <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="jobModalTitle">
    <button class="modal__close" id="jobModalClose" aria-label="閉じる">×</button>
    <div class="modal__body" style="padding:0">
      <div class="modal__imgWrap"><img id="jobModalImg" alt=""></div>
      <div class="modal__body" style="padding:16px">
        <h3 id="jobModalTitle"></h3>
        <div id="jobModalMeta" class="meta" style="margin:.5rem 0"></div>
        <p id="jobModalDesc" class="small"></p>
        <div class="actions">
          <button id="jobModalFav" class="btn">★ お気に入り</button>
          <button id="jobModalJoin" class="btn fill">参加する</button>
        </div>
      </div>
    </div>
  </div>
</div>
`)();
document.body.insertAdjacentHTML('beforeend', modalHTML);
const modal=g('jobModal'), mClose=g('jobModalClose'), mImg=g('jobModalImg'), mTitle=g('jobModalTitle'), mMeta=g('jobModalMeta'), mDesc=g('jobModalDesc'), mFav=g('jobModalFav'), mJoin=g('jobModalJoin');
let currentJob=null;

function openJobModal(job){
  currentJob=job;
  mImg.src=job.img||''; mImg.style.display=job.img?'':'none';
  const dateLabel = job.dateStart ? (job.dateEnd && job.dateEnd!==job.dateStart ? `${job.dateStart}〜${job.dateEnd}` : job.dateStart) : '';
  mTitle.textContent=job.title;
  mMeta.innerHTML=`<span class="badge">${job.company}</span><span class="badge">${job.year}卒</span><span class="badge">${job.jobType||'-'}</span><span class="badge">${job.mode||'-'}</span><span class="badge">${job.place||'-'}</span><span class="badge">${dateLabel}</span>`;
  mDesc.textContent=(job.desc||job.tags||'').toString();
  mFav.classList.toggle('is-on', favSet.has(job.id));
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
function closeJobModal(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); currentJob=null; }
mClose.onclick=closeJobModal; modal.addEventListener('click',e=>{if(e.target===modal) closeJobModal();});
mFav.onclick=()=>{ if(!currentJob) return; if(favSet.has(currentJob.id)) favSet.delete(currentJob.id); else favSet.add(currentJob.id); localStorage.setItem(FAV_KEY,JSON.stringify([...favSet])); mFav.classList.toggle('is-on', favSet.has(currentJob.id)); applyFilters(page); };
mJoin.onclick=()=>{ if(!currentJob) return; addParticipation(currentUserEmail(), currentJob.company); if(currentJob.applyUrl) window.open(currentJob.applyUrl,'_blank'); closeJobModal(); };
