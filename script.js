/* ========= 設定 ========= */
const SYNC_URL   = "";      // GASを使うならURLを入れる
const SYNC_TOKEN = "";
const CONTACT_TO = "contact@example.com";

const ADMIN_PASS  = "A7B9C3D1";
const FAV_KEY     = "majitsunagu-fav";
const SUBMIT_KEY  = "majitsunagu-submits";
const USERS_KEY   = "majitsunagu-users";
const SESSION_KEY = "majitsunagu-session";
const ID_COUNTER  = "majitsunagu-id-counter";

/* ========= 起動 ========= */
document.addEventListener('DOMContentLoaded', init);

function init(){
  // POP
  document.getElementById('popClose').onclick=()=>{ document.getElementById('pop').style.display='none'; };

  // メニュー開閉
  (function(){
    const menuBtn = document.getElementById('menuBtn');
    const menu    = document.getElementById('menu');
    if(!menuBtn || !menu) return;
    menuBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();menu.classList.toggle('show');});
    document.addEventListener('click',(e)=>{ if(!menu.contains(e.target) && e.target!==menuBtn) menu.classList.remove('show'); });
  })();

  // ロゴ→ホーム
  const brand = document.getElementById('brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      const menu = document.getElementById('menu'); if (menu) menu.classList.remove('show');
      location.hash = '#list';
      handleRoute(); window.scrollTo({ top: 0, behavior: 'smooth' });
      const pop = document.getElementById('pop'); if (pop) pop.style.display = 'none';
    });
  }

  // ルーター
  setupRouter();
  if(!location.hash) location.hash = '#list';
  handleRoute();

  // 認証UI
  btnSignup.onclick=signupFlow;
  btnLogin.onclick=loginFlow;
  btnLogout.onclick=()=>{ setSession(""); alert("ログアウトしました"); };

  // 管理ログイン
  document.getElementById('pwOk').onclick=()=>{ if(g('pw').value!==ADMIN_PASS){alert('パスワードが違います');return;} g('adminBody').style.display=''; renderAdmin(); };

  // 投稿フォーム
  document.getElementById('submitForm').addEventListener('submit', onSubmitJob);

  // お問い合わせ
  g('contactToLabel') && (g('contactToLabel').textContent = CONTACT_TO);
  const cf = g('contactForm');
  if(cf){
    cf.addEventListener('submit', onContactSubmit);
    g('contactSaveCSV')?.addEventListener('click', onContactSaveCSV);
  }

  // フィルタ
  document.getElementById('filters').addEventListener('submit', e=>{ e.preventDefault(); applyFilters(1); });
  document.getElementById('resetBtn').onclick=resetFilters;
  pageSizeEl.onchange=()=>applyFilters(1);

  // 他タブで変更されたときも拾う
  window.addEventListener('storage', (ev)=>{
    if(ev.key===SUBMIT_KEY || ev.key===FAV_KEY){
      window.dispatchEvent(new CustomEvent('jobs-updated'));
    }
  });

  // グローバルイベント：承認/投稿/削除のたびに飛ぶ
  window.addEventListener('jobs-updated', ()=>{
    // listページなら即更新、それ以外は戻ったときに初期化＆再描画
    if(currentView()==='list'){
      clearAndRenderList();
    }
  });

  // 初期表示
  renderYearChips();
  clearAndRenderList();   // ← 初回は必ずフィルタ初期化して描画
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
  // 画面切替
  show(name);
  // 切替時のふるまい：listに来たら毎回フィルタ初期化＋最新描画
  if(name==='list'){
    clearAndRenderList();
  }
}
function show(name){
  const views = ['list','submit','admin','terms','privacy','about','profile','contact'];
  views.forEach(v=>{
    const el = document.getElementById(`view-${v}`);
    if(el) el.classList.toggle('on', v===name);
  });
}
function currentView(){
  const views = ['list','submit','admin','terms','privacy','about','profile','contact'];
  const v = (location.hash||'#list').replace('#','');
  return views.includes(v) ? v : 'list';
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

/* ========= ダミー求人（既存） ========= */
const baseJobs=[
  {id:1,title:'Webエンジニア長期',company:'TechA',year:'2027',wage:1500,open:true, mode:'オンライン', jobType:'エンジニア', tags:'React TypeScript', img:'https://picsum.photos/seed/a/1200/800', applyUrl:'https://example.com/apply/techa', desc:'Web開発の実務支援。', dateStart:'2025-10-28', dateEnd:'2025-10-28', place:'渋谷'},
  {id:2,title:'グロースマーケ',   company:'GrowthX',year:'2026',wage:1300,open:true, mode:'ハイブリッド', jobType:'マーケ', tags:'SNS 広告',       img:'https://picsum.photos/seed/b/1200/800', applyUrl:'https://example.com/apply/growthx', desc:'広告運用/分析。',      dateStart:'2025-11-05', dateEnd:'2025-11-05', place:'オンライン'},
  {id:3,title:'UI/UXデザイン補佐',company:'DesignQ',year:'2028',wage:1200,open:false,mode:'オフライン', jobType:'デザイナー', tags:'Figma',           img:'',                                               applyUrl:'https://example.com/apply/designq', desc:'プロトタイプ作成。',   dateStart:'2025-10-10', dateEnd:'2025-10-10', place:'新宿'},
];

/* ========= 卒年チップ & フィルタ ========= */
let activeYear = 'all';
const years = ['all', '2026', '2027', '2028'];
const yearChips = document.getElementById('yearChips');
function renderYearChips(){
  yearChips.innerHTML = years.map(y =>
    `<button type="button" class="year-chip ${y===activeYear?'is-active':''}" data-year="${y}">
       ${y==='all'?'すべて':`${y}卒`}
     </button>`).join('');
}
yearChips?.addEventListener('click',(e)=>{
  const b=e.target.closest('[data-year]'); if(!b) return;
  activeYear=b.dataset.year; renderYearChips(); applyFilters(1);
});

const qEl      = g('q');
const sortEl   = g('sort');
const jobTypeEl= g('jobType');
const modeOnlineEl  = g('modeOnline');
const modeOfflineEl = g('modeOffline');
const favOnlyEl= g('favOnly');
const onlyOpenEl= g('onlyOpen');
const pageSizeEl= g('pageSize');
const startEl  = g('startDate');
const endEl    = g('endDate');
const cards = g('cards'), count = g('count'), pager = g('pager'), chips = g('activeChips'); let page = 1;

/* ====== フィルタ初期化（←ココが重要：Listに来るたび毎回クリア） ====== */
function resetFilters(){
  const form = document.getElementById('filters');
  if(form) form.reset();
  startEl.value=''; endEl.value='';
  activeYear='all'; renderYearChips();
  chips.innerHTML='';
}

/* Listへ来たら「初期化→最新データで再描画」 */
function clearAndRenderList(){
  resetFilters();
  applyFilters(1);
}

/* 日付ユーティリティ */
function normRange(){
  if(startEl.value && endEl.value && endEl.value < startEl.value){
    const t = startEl.value; startEl.value = endEl.value; endEl.value = t;
  }
}
function overlaps(jobStart, jobEnd){
  const s = startEl.value || '';
  const e = endEl.value   || '';
  if(!s && !e) return true;
  const js = jobStart || '';
  const je = jobEnd   || jobStart || '';
  const S = s || '0000-01-01';
  const E = e || '9999-12-31';
  return (S <= je) && (E >= js);
}

/* 保存領域 */
function loadSubmits(){ return JSON.parse(localStorage.getItem(SUBMIT_KEY)||"[]"); }
function saveSubmits(a){ localStorage.setItem(SUBMIT_KEY, JSON.stringify(a)); }

/* 全求人（承認済みのみ追加） */
function allJobs(){
  const extra = loadSubmits().filter(x=>x.approved).map(x=>({
    id:x.id, title:x.title, company:x.company, year:x.year,
    wage:+(x.wage||0), open:true,
    mode:x.mode||'オンライン',
    jobType:x.jobType||'',
    dateStart: x.dateStart || x.dateEnd || x.date || '',
    dateEnd:   x.dateEnd   || x.dateStart || x.date || '',
    place:x.place||'', tags:x.tags||'', img:x.image||'',
    applyUrl:x.applyUrl||'', desc:x.desc||''
  }));
  return baseJobs.concat(extra);
}

/* カード描画 */
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
  cards.innerHTML = list.length ? list.map(cardHTML).join('')
                                : `<div class="card"><strong>該当する求人がありません。</strong></div>`;
  cards.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const id=+b.dataset.fav;
    if(favSet.has(id)) favSet.delete(id); else favSet.add(id);
    localStorage.setItem(FAV_KEY, JSON.stringify([...favSet]));
    applyFilters(page);
  });
  cards.querySelectorAll('[data-join]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const id=+b.dataset.join;
    const job=allJobs().find(j=>j.id===id); if(!job) return;
    addParticipation(currentUserEmail(), job.company);
    if(job.applyUrl) window.open(job.applyUrl,'_blank');
  });
  cards.querySelectorAll('.card-item').forEach(card=>{
    card.onclick=()=>{
      const id=+card.dataset.id;
      const job=allJobs().find(j=>j.id===id);
      if(job) openJobModal(job);
    };
  });
}
function renderPager(pages){
  if(pages<=1){ pager.innerHTML=''; return; }
  let html='';
  for(let i=1;i<=pages;i++) html += `<button class="${i===page?'is-active':''}" data-page="${i}">${i}</button>`;
  pager.innerHTML = html;
  pager.querySelectorAll('button').forEach(b=>b.onclick=()=>applyFilters(+b.dataset.page));
}
function renderChips(){
  const a=[];
  if(activeYear!=='all') a.push(`${activeYear}卒`);
  if(qEl.value.trim())  a.push(`KW:${qEl.value.trim()}`);
  if(jobTypeEl.value)   a.push(jobTypeEl.value);
  if(modeOnlineEl.checked)  a.push('オンライン');
  if(modeOfflineEl.checked) a.push('対面');
  if(favOnlyEl.checked) a.push('★お気に入りのみ');
  if(onlyOpenEl.checked)a.push('募集中のみ');
  if(startEl.value||endEl.value) a.push(`${startEl.value||'...'}〜${endEl.value||'...'}`);
  chips.innerHTML = a.map(s=>`<span class="chip">${s}</span>`).join('');
}
function applyFilters(goPage=page){
  page = goPage; normRange();

  const q = qEl.value.trim().toLowerCase();
  const jt = jobTypeEl.value;
  const wantOnline  = modeOnlineEl.checked;
  const wantOffline = modeOfflineEl.checked;
  const favOnly = favOnlyEl.checked;
  const onlyOpen = onlyOpenEl.checked;
  const sort = sortEl.value;

  let list = allJobs().filter(j=>{
    const text = `${j.title} ${j.company} ${j.tags}`.toLowerCase();
    const kw   = !q || text.includes(q);
    const yr   = (activeYear==='all') ? true : j.year===activeYear;
    const jtype= !jt || j.jobType===jt;

    // 特徴（オンライン/対面）
    const modeOK = (!wantOnline && !wantOffline) ||
                   (wantOnline  && /オンライン|ﾊｲﾌﾞﾘｯﾄﾞ|ハイブリッド/.test(j.mode)) ||
                   (wantOffline && /オフライン|対面|ﾊｲﾌﾞﾘｯﾄﾞ|ハイブリッド/.test(j.mode));

    const openOK= !onlyOpen || j.open;
    const favOK = !favOnly || favSet.has(j.id);

    // 期間オーバーラップ（1日でも重なればOK）
    const rangeOK = overlaps(j.dateStart, j.dateEnd);

    return kw && yr && jtype && modeOK && openOK && favOK && rangeOK;
  });

  list.sort((a,b)=>{
    const map = {
      new:      (b.dateStart||'').localeCompare(a.dateStart||''),
      old:      (a.dateStart||'').localeCompare(b.dateStart||''),
      wageDesc: (b.wage||0) - (a.wage||0),
      wageAsc:  (a.wage||0) - (b.wage||0),
    };
    return map[sort] ?? 0;
  });

  count.textContent = `${list.length}件`;
  renderChips();

  const size = +(pageSizeEl.value||10);
  const pages = Math.max(1, Math.ceil(list.length/size));
  if(page>pages) page=pages;

  render(list.slice((page-1)*size, page*size));
  renderPager(pages);
}

/* ========= 投稿（採用担当） ========= */
async function onSubmitJob(e){
  e.preventDefault();
  const f=new FormData(e.currentTarget); const file=document.getElementById('imgFile').files[0];
  const image=file?await readAsDataURL(file):"";
  const arr=loadSubmits();

  const dateStart = f.get('dateStart') || f.get('dateEnd') || '';
  const dateEnd   = f.get('dateEnd')   || f.get('dateStart') || '';

  arr.push({
    id:Date.now(),
    title:f.get('title'), company:f.get('company'), year:f.get('year')||'',
    wage:f.get('wage')||0,
    jobType:f.get('jobType')||'', mode:f.get('mode')||'', place:f.get('place')||'',
    tags:f.get('tags')||'', desc:f.get('desc')||'',
    dateStart, dateEnd,
    image, approved:false, applyUrl:f.get('applyUrl')||''
  });
  saveSubmits(arr);

  // ほか画面にも通知
  window.dispatchEvent(new CustomEvent('jobs-updated'));

  alert('送信しました（承認待ち）。管理から承認してください。');
  e.currentTarget.reset();

  // 自動で管理画面へ誘導
  location.hash = '#admin';
  handleRoute();
}
function readAsDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}

/* ========= 管理 ========= */
function renderAdmin(){
  const tbody=document.querySelector('#adminTable tbody'); tbody.innerHTML='';
  const arr=loadSubmits().sort((a,b)=>String(a.dateStart||'').localeCompare(b.dateStart||''));
  arr.forEach(ev=>{
    const range = ev.dateStart ? (ev.dateEnd && ev.dateEnd!==ev.dateStart ? `${ev.dateStart}〜${ev.dateEnd}` : ev.dateStart) : '';
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><input type="checkbox" data-act="approve" data-id="${ev.id}" ${ev.approved?'checked':''}></td>
      <td><strong>${ev.title}</strong><div class="small">${ev.company} / ${ev.year}卒</div></td>
      <td>${ev.jobType||'-'} / ${ev.mode||'-'} / ${ev.place||'-'} / ${range}</td>
      <td><button class="btn" data-act="delete" data-id="${ev.id}">削除</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.onclick=(e)=>{
    const a=e.target.closest('[data-act]'); if(!a) return;
    const list=loadSubmits(); const id=+a.dataset.id; const item=list.find(x=>x.id===id);
    if(a.dataset.act==='approve'&&item){
      item.approved=e.target.checked; saveSubmits(list);
      // 変更を全体に通知（一覧が開いていれば即反映）
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

/* ========= お気に入り & 参加 ========= */
const favSet=new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]'));
function addParticipation(email, companyName){
  if(!email){ alert("ログインしてください"); return; }
  const U=users(); const u=U.find(x=>x.email===email); if(!u) return;
  u.joined=(u.joined||0)+1; u.joinedCompaniesCount=(u.joinedCompaniesCount||0)+1;
  const at=nowISO(); u.history=u.history||[]; u.history.push({company:companyName||"",at}); u.updatedAt=at; saveUsers(U);
  // CSV省略／必要なら復活可
  syncToServer({type:"user_upsert", data:u, reason:"participation"});
}

/* ========= ユーザー & 認証（簡易） ========= */
const btnLogin=g('btnLogin'), btnSignup=g('btnSignup'), btnLogout=g('btnLogout'), whoEl=g('who'), accountBanner=g('accountBanner');
function users(){ return JSON.parse(localStorage.getItem(USERS_KEY)||"[]"); }
function saveUsers(U){ localStorage.setItem(USERS_KEY, JSON.stringify(U)); }
function currentUserEmail(){ return localStorage.getItem(SESSION_KEY)||""; }
function setSession(email){ if(email){localStorage.setItem(SESSION_KEY,email);} else{localStorage.removeItem(SESSION_KEY);} syncAuthUI(); }
function syncAuthUI(){ const email=currentUserEmail(),logged=!!email; btnLogin.hidden=btnSignup.hidden=logged; btnLogout.hidden=!logged; whoEl.hidden=!logged; whoEl.textContent=logged?email:""; if(accountBanner) accountBanner.textContent=logged?`ログイン中: ${email}`:`未ログイン（ゲスト）`; }
function blankUser(email, uid){
  return { uid, email, pw:"", name:"", university:"", grade:"", major:"", desiredRole:"", location:"", desiredWage:"", possibleDays:"", skills:"", links:"", pr:"", avatar:"", joined:0, joinedCompaniesCount:0, history:[], phone:"", createdAt:nowISO(), updatedAt:nowISO() };
}
function signupFlow(){
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード（8文字以上推奨）"); if(!pw) return;
  const U=users(); if(U.some(u=>u.email===email)){ alert("既に登録済みです（ログインしてください）"); return; }
  const uid=nextId();
  const u=blankUser(email, uid); u.pw=pw; U.push(u); saveUsers(U); setSession(email); alert("登録完了。プロフィールを入力してください。"); location.hash='#profile';
}
function loginFlow(){
  const email=prompt("メールアドレス"); if(!email) return;
  const pw=prompt("パスワード"); if(!pw) return;
  const U=users(); let u=U.find(x=>x.email===email && x.pw===pw);
  if(!u){ alert("メールまたはパスワードが違います"); return; }
  if(!u.uid){ u.uid=nextId(); u.updatedAt=nowISO(); saveUsers(U); }
  setSession(email); alert("ログインしました"); location.hash='#profile';
}

/* ========= お問い合わせ（省略版） ========= */
function onContactSubmit(e){
  e.preventDefault();
  // 必要ならGAS連携・CSV保存をここで
  alert("お問い合わせを送信しました。");
  e.currentTarget.reset();
}
function onContactSaveCSV(){ alert("CSVを保存しました（送信はしていません）"); }

/* ========= モーダル ========= */
const modal=g('jobModal'), mClose=g('jobModalClose'), mImg=g('jobModalImg'), mTitle=g('jobModalTitle'), mMeta=g('jobModalMeta'), mDesc=g('jobModalDesc'), mFav=g('jobModalFav'), mJoin=g('jobModalJoin'); let currentJob=null;
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
